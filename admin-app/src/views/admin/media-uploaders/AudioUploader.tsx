'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
  UploadCloud, Volume2, Play, Pause, CheckCircle2, 
  AlertCircle, X, RefreshCw, Loader2, Music, Mic, Square, Radio
} from 'lucide-react';
import { resolveAdminMediaUrl, formatFileSize } from './media-utils';
import { toast } from '../toast';

interface AudioUploaderProps {
  value?: string | null;
  onChange: (url: string | null) => void;
  token?: string;
  label?: string;
  placeholder?: string;
  maxSizeMB?: number;
  className?: string;
}

const ALLOWED_AUDIO_TYPES = [
  'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/x-wav', 
  'audio/ogg', 'audio/webm', 'audio/m4a', 'audio/x-m4a', 
  'audio/mp4', 'audio/aac'
];

export function AudioUploader({
  value,
  onChange,
  token,
  label,
  placeholder = 'انقر لرفع تسجيل صوتي من الكمبيوتر أو اسحبه هنا',
  maxSizeMB = 25,
  className = '',
}: AudioUploaderProps) {
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [localBlobUrl, setLocalBlobUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const getAuthToken = () => {
    if (token) return token;
    if (typeof window !== 'undefined') {
      const ls = localStorage.getItem('dmo-token') || localStorage.getItem('token') || '';
      if (ls) return ls;
      const ss = sessionStorage.getItem('dmo-token') || sessionStorage.getItem('token') || '';
      if (ss) return ss;
      const match = document.cookie.match(/(?:dmo[-_]token|token)=([^;]+)/);
      if (match) return decodeURIComponent(match[1]);
    }
    return '';
  };

  useEffect(() => {
    return () => {
      if (localBlobUrl && localBlobUrl.startsWith('blob:')) {
        URL.revokeObjectURL(localBlobUrl);
      }
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [localBlobUrl]);

  const startRecording = async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const recordedFile = new File([audioBlob], `teacher_voice_${Date.now()}.webm`, { type: 'audio/webm' });
        if (localBlobUrl && localBlobUrl.startsWith('blob:')) {
          URL.revokeObjectURL(localBlobUrl);
        }
        const blobUrl = URL.createObjectURL(recordedFile);
        setLocalBlobUrl(blobUrl);
        performUpload(recordedFile);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingSeconds(0);
      timerRef.current = setInterval(() => {
        setRecordingSeconds((s) => s + 1);
      }, 1000);
    } catch (err: any) {
      console.error('Microphone access denied:', err);
      setError('تعذر الوصول إلى الميكروفون. يرجى التأكد من السماح بالوصول للميكروفون في المتصفح.');
      toast.error('تعذر الوصول إلى الميكروفون');
    }
  };

  const stopRecording = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  };

  const cancelRecording = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      // stop without upload
      mediaRecorderRef.current.onstop = () => {};
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    setRecordingSeconds(0);
  };

  const validateFile = (file: File): string | null => {
    if (!ALLOWED_AUDIO_TYPES.includes(file.type) && !file.name.match(/\.(mp3|wav|m4a|aac|ogg)$/i)) {
      return 'نوع الملف غير مدعوم. الصيغ المسموحة: MP3, WAV, M4A, OGG, AAC';
    }
    const maxBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxBytes) {
      return `حجم الملف (${formatFileSize(file.size)}) يتجاوز الحد المسموح به (${maxSizeMB}MB)`;
    }
    return null;
  };

  const handleFileSelect = (file: File) => {
    setError(null);
    const err = validateFile(file);
    if (err) {
      setError(err);
      toast.error(err);
      return;
    }

    if (localBlobUrl && localBlobUrl.startsWith('blob:')) {
      URL.revokeObjectURL(localBlobUrl);
    }
    const blobUrl = URL.createObjectURL(file);
    setLocalBlobUrl(blobUrl);

    // Upload immediately
    performUpload(file);
  };

  const performUpload = (file: File) => {
    setUploading(true);
    setProgress(0);
    setError(null);

    const authToken = getAuthToken();
    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/admin/r2/upload');
    if (authToken) {
      xhr.setRequestHeader('Authorization', `Bearer ${authToken}`);
    }

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        const pct = Math.round((e.loaded / e.total) * 100);
        setProgress(pct);
      }
    };

    xhr.onload = () => {
      setUploading(false);
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText);
          if (data.url) {
            onChange(data.url);
            toast.success('تم رفع التسجيل الصوتي بنجاح');
          } else {
            throw new Error(data.error || 'استجابة غير صالحة');
          }
        } catch (err: any) {
          setError(err.message);
          toast.error(err.message);
        }
      } else {
        try {
          const data = JSON.parse(xhr.responseText);
          setError(data.error || `خطأ ${xhr.status}`);
          toast.error(data.error || 'فشل رفع الصوت');
        } catch {
          setError(`خطأ أثناء الرفع (${xhr.status})`);
          toast.error('فشل رفع الصوت، يرجى المحاولة ثانية');
        }
      }
    };

    xhr.onerror = () => {
      setUploading(false);
      setError('فشل الاتصال بالخادم');
      toast.error('فشل الاتصال بالخادم');
    };

    const fd = new FormData();
    fd.append('file', file);
    fd.append('type', 'audio');
    xhr.send(fd);
  };

  const handleRemove = () => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setIsPlaying(false);
    if (localBlobUrl && localBlobUrl.startsWith('blob:')) {
      URL.revokeObjectURL(localBlobUrl);
    }
    setLocalBlobUrl(null);
    onChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const activeAudioSrc = localBlobUrl || (value ? resolveAdminMediaUrl(value) : null);

  const formatSec = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {label && (
        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
          {label}
        </label>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept={ALLOWED_AUDIO_TYPES.join(',')}
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFileSelect(f);
          e.target.value = '';
        }}
      />

      {isRecording ? (
        <div className="rounded-2xl border-2 border-red-500/50 bg-red-500/5 p-5 text-center space-y-3 animate-pulse">
          <div className="w-12 h-12 rounded-full bg-red-500/20 text-red-500 mx-auto flex items-center justify-center">
            <Radio className="w-6 h-6 animate-spin" />
          </div>
          <div>
            <p className="text-sm font-black text-red-600 dark:text-red-400">
              🔴 جارٍ تسجيل صوت الأستاذ عمر...
            </p>
            <p className="text-xl font-mono font-black text-foreground mt-1">
              {formatSec(recordingSeconds)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">تحدث بوضوح أمام الميكروفون</p>
          </div>
          <div className="flex items-center justify-center gap-2 pt-2">
            <button
              type="button"
              onClick={stopRecording}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-black rounded-xl bg-red-600 hover:bg-red-700 text-white shadow-md transition-all cursor-pointer"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
              إنهاء وحفظ التسجيل
            </button>
            <button
              type="button"
              onClick={cancelRecording}
              className="inline-flex items-center gap-1 px-3 py-2 text-xs font-bold rounded-xl bg-secondary hover:bg-secondary/80 text-muted-foreground transition-all cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              إلغاء
            </button>
          </div>
        </div>
      ) : !activeAudioSrc ? (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            const f = e.dataTransfer.files?.[0];
            if (f) handleFileSelect(f);
          }}
          className={`border-2 border-dashed rounded-2xl p-5 text-center transition-all duration-300 group
            ${dragOver 
              ? 'border-brand-orange bg-brand-orange/10 scale-[1.01]' 
              : 'border-border hover:border-brand-orange/60 bg-secondary/30 hover:bg-secondary/60'}`}
        >
          <div className="w-12 h-12 rounded-2xl bg-brand-orange/10 text-brand-orange mx-auto mb-2 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Volume2 className="w-6 h-6" />
          </div>
          <p className="text-xs font-bold text-foreground mb-1">{placeholder}</p>
          <p className="text-[11px] text-muted-foreground">صيغ الصوت: MP3, WAV, M4A, OGG (حتى {maxSizeMB}MB) أو تسجيل مباشر بالمايكروفون</p>
          <div className="mt-4 flex items-center justify-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={startRecording}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-black rounded-xl bg-red-600 hover:bg-red-700 text-white shadow-md shadow-red-500/20 hover:scale-105 active:scale-95 transition-all cursor-pointer"
            >
              <Mic className="w-4 h-4" />
              تسجيل صوت الأستاذ بالمايك
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-xl bg-secondary hover:bg-secondary/80 text-foreground border border-border transition-all cursor-pointer"
            >
              <UploadCloud className="w-4 h-4 text-muted-foreground" />
              رفع ملف صوتي
            </button>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border-2 border-border p-4 bg-card shadow-sm space-y-3">
          {/* Audio element */}
          <audio
            ref={audioRef}
            src={activeAudioSrc}
            onTimeUpdate={() => {
              if (audioRef.current) setCurrentTime(audioRef.current.currentTime);
            }}
            onLoadedMetadata={() => {
              if (audioRef.current) setDuration(audioRef.current.duration);
            }}
            onEnded={() => setIsPlaying(false)}
          />

          <div className="flex items-center gap-3">
            {/* Play/Pause round button */}
            <button
              type="button"
              onClick={togglePlay}
              disabled={uploading}
              className="w-11 h-11 rounded-xl bg-gradient-to-r from-brand-orange to-brand-red text-white flex items-center justify-center shadow-md shadow-brand-orange/20 hover:scale-105 active:scale-95 transition-all shrink-0 disabled:opacity-50"
            >
              {isPlaying ? <Pause className="w-5 h-5 fill-white" /> : <Play className="w-5 h-5 fill-white ms-0.5" />}
            </button>

            {/* Scrubber / Progress */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between text-[11px] font-mono text-muted-foreground mb-1">
                <span>{formatSec(currentTime)}</span>
                <span>{formatSec(duration)}</span>
              </div>
              <input
                type="range"
                min={0}
                max={duration || 100}
                step={0.1}
                value={currentTime}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  setCurrentTime(val);
                  if (audioRef.current) audioRef.current.currentTime = val;
                }}
                className="w-full accent-[#E85D26] h-1.5 bg-secondary rounded-lg appearance-none cursor-pointer"
              />
            </div>

            {/* Status & Actions */}
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={startRecording}
                disabled={uploading}
                title="إعادة تسجيل صوت الأستاذ بالمايكروفون"
                className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl transition-all disabled:opacity-50 cursor-pointer"
              >
                <Mic className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                title="استبدال بملف صوتي آخر"
                className="p-2 text-brand-orange hover:bg-brand-orange/10 rounded-xl transition-all disabled:opacity-50 cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleRemove}
                disabled={uploading}
                title="حذف التسجيل"
                className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl transition-all disabled:opacity-50 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Upload progress bar if currently uploading */}
          {uploading && (
            <div className="pt-2 border-t border-border">
              <div className="flex items-center justify-between text-xs font-bold mb-1">
                <span className="flex items-center gap-1 text-brand-orange">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  جارٍ رفع التسجيل إلى السحابة...
                </span>
                <span>{progress}%</span>
              </div>
              <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-brand-orange to-brand-red transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {!uploading && (
            <div className="flex items-center gap-2 pt-1 border-t border-border">
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" />
                التسجيل الصوتي جاهز ومحفوظ
              </span>
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs font-bold">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
