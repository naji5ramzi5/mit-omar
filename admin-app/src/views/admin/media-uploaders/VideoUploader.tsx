'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
  UploadCloud, Video as VideoIcon, Play, Pause, CheckCircle2, 
  AlertCircle, X, RefreshCw, Link2, Shield, Loader2, FileCheck, Film
} from 'lucide-react';
import { resolveAdminMediaUrl, formatFileSize, formatVideoDuration } from './media-utils';
import { toast } from '../toast';

interface VideoUploaderProps {
  value?: string | null;
  onChange: (url: string | null, meta?: { duration?: number; size?: number }) => void;
  token?: string;
  label?: string;
  placeholder?: string;
  isReel?: boolean; // If true, uses 9:16 vertical ratio for Reels
  maxSizeMB?: number;
  className?: string;
}

const ALLOWED_VIDEO_TYPES = [
  'video/mp4', 'video/webm', 'video/ogg', 'video/quicktime', 'video/x-matroska', 'video/avi', 'video/x-msvideo', 'video/m4v', ''
];

export function VideoUploader({
  value,
  onChange,
  token,
  label,
  placeholder = 'انقر لرفع فيديو من الكمبيوتر أو اسحبه هنا',
  isReel = false,
  maxSizeMB = 2000, // 2GB
  className = '',
}: VideoUploaderProps) {
  // Stages: 'idle' | 'selected_preview' | 'uploading' | 'ready'
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [localBlobUrl, setLocalBlobUrl] = useState<string | null>(null);
  const [videoDuration, setVideoDuration] = useState<number>(0);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadedBytes, setUploadedBytes] = useState(0);
  const [totalBytes, setTotalBytes] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

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

  // Clean up blob URL
  useEffect(() => {
    return () => {
      if (localBlobUrl && localBlobUrl.startsWith('blob:')) {
        URL.revokeObjectURL(localBlobUrl);
      }
    };
  }, [localBlobUrl]);

  const validateFile = (file: File): string | null => {
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    const validExts = ['mp4', 'webm', 'mov', 'm4v', 'ogv', 'mkv', 'avi', 'ts'];
    if (!validExts.includes(ext) && file.type && !ALLOWED_VIDEO_TYPES.includes(file.type)) {
      return 'نوع الفيديو غير مدعوم. الصيغ المدعومة هي: MP4, WebM, MOV, OGG, MKV';
    }
    const maxBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxBytes) {
      return `حجم الملف (${formatFileSize(file.size)}) يتجاوز الحد الأقصى (${maxSizeMB} ميجابايت)`;
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

    // Clean previous blob if any
    if (localBlobUrl && localBlobUrl.startsWith('blob:')) {
      URL.revokeObjectURL(localBlobUrl);
    }

    const blobUrl = URL.createObjectURL(file);
    setSelectedFile(file);
    setLocalBlobUrl(blobUrl);
    setTotalBytes(file.size);
    setUploadedBytes(0);
    setProgress(0);
  };

  const handleCancelSelection = () => {
    if (localBlobUrl && localBlobUrl.startsWith('blob:')) {
      URL.revokeObjectURL(localBlobUrl);
    }
    setLocalBlobUrl(null);
    setSelectedFile(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleConfirmUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    setProgress(0);
    setError(null);

    const authToken = getAuthToken();

    // 1. Try presigned PUT upload for large files first (streaming directly to R2)
    try {
      const presignRes = await fetch('/api/admin/r2/upload-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        },
        body: JSON.stringify({
          filename: selectedFile.name,
          contentType: selectedFile.type,
        }),
      });

      if (presignRes.ok) {
        const { uploadUrl, key } = await presignRes.json();
        if (uploadUrl && key) {
          // Direct XHR upload to presigned PUT URL
          await new Promise<void>((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.open('PUT', uploadUrl);
            xhr.setRequestHeader('Content-Type', selectedFile.type);

            xhr.upload.onprogress = (e) => {
              if (e.lengthComputable) {
                const pct = Math.round((e.loaded / e.total) * 100);
                setProgress(pct);
                setUploadedBytes(e.loaded);
                setTotalBytes(e.total);
              }
            };

            xhr.onload = () => {
              if (xhr.status >= 200 && xhr.status < 300) {
                resolve();
              } else {
                reject(new Error(`Direct upload status ${xhr.status}`));
              }
            };

            xhr.onerror = () => reject(new Error('Direct upload network error'));
            xhr.send(selectedFile);
          });

          // Upload succeeded!
          onUploadSuccess(key);
          return;
        }
      }
    } catch (directErr) {
      console.warn('Presigned upload failed or CORS blocked, falling back to server upload...', directErr);
    }

    // 2. Fallback to server upload route
    try {
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', '/api/admin/r2/upload');
        if (authToken) {
          xhr.setRequestHeader('Authorization', `Bearer ${authToken}`);
        }

        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            const pct = Math.round((e.loaded / e.total) * 100);
            setProgress(pct);
            setUploadedBytes(e.loaded);
            setTotalBytes(e.total);
          }
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const data = JSON.parse(xhr.responseText);
              if (data.url) {
                onUploadSuccess(data.url);
                resolve();
              } else {
                reject(new Error(data.error || 'استجابة غير صالحة من السيرفر'));
              }
            } catch (err) {
              reject(err);
            }
          } else {
            try {
              const data = JSON.parse(xhr.responseText);
              reject(new Error(data.error || `خطأ ${xhr.status}`));
            } catch {
              reject(new Error(`خطأ أثناء رفع الفيديو (${xhr.status})`));
            }
          }
        };

        xhr.onerror = () => reject(new Error('فشل الاتصال بالخادم'));

        const fd = new FormData();
        fd.append('file', selectedFile);
        fd.append('type', 'video');
        xhr.send(fd);
      });
    } catch (err: any) {
      setUploading(false);
      const msg = err.message || 'فشل رفع الفيديو، يرجى المحاولة مرة أخرى';
      setError(msg);
      toast.error(msg);
    }
  };

  const onUploadSuccess = (finalUrl: string) => {
    setUploading(false);
    setProgress(100);
    toast.success('تم رفع الفيديو وحفظه في السحابة بنجاح');
    
    // Pass final url and detected duration
    onChange(finalUrl, { 
      duration: videoDuration ? Math.round(videoDuration / 60) : undefined, 
      size: selectedFile?.size 
    });

    // Reset local selection state
    if (localBlobUrl && localBlobUrl.startsWith('blob:')) {
      URL.revokeObjectURL(localBlobUrl);
    }
    setLocalBlobUrl(null);
    setSelectedFile(null);
  };

  const handleRemoveExisting = () => {
    onChange(null);
    handleCancelSelection();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = e.dataTransfer.files?.[0];
    if (dropped) {
      handleFileSelect(dropped);
    }
  };

  // Determine what video source to show:
  // 1. localBlobUrl if user just picked a local file to preview
  // 2. value (R2 or external) if already saved
  const activeVideoSrc = localBlobUrl || (value ? resolveAdminMediaUrl(value) : null);
  const isPendingUpload = !!selectedFile && !uploading;
  const isR2Protected = value?.startsWith('r2:');

  return (
    <div className={`space-y-3 ${className}`}>
      {label && (
        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
          {label}
        </label>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={ALLOWED_VIDEO_TYPES.join(',')}
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFileSelect(f);
          e.target.value = '';
        }}
      />

      {/* State 1: No file selected & no existing video */}
      {!activeVideoSrc && !uploading && (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`relative border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all duration-300 group
            ${dragOver 
              ? 'border-brand-orange bg-brand-orange/10 scale-[1.01]' 
              : 'border-border hover:border-brand-orange/60 bg-secondary/30 hover:bg-secondary/60'}`}
        >
          <div className="w-14 h-14 rounded-2xl bg-brand-orange/10 text-brand-orange mx-auto mb-3 flex items-center justify-center group-hover:scale-110 transition-transform">
            <UploadCloud className="w-7 h-7" />
          </div>
          <p className="text-sm font-bold text-foreground mb-1">
            {placeholder}
          </p>
          <p className="text-xs text-muted-foreground">
            الأنواع المدعومة: MP4, WebM, MOV {isReel ? '(فيديو عمودي 9:16)' : '(16:9)'}
          </p>
          <div className="mt-3">
            <button
              type="button"
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl bg-gradient-to-r from-brand-orange to-brand-red text-white shadow-md shadow-brand-orange/20 hover:opacity-95 transition-all"
            >
              <VideoIcon className="w-4 h-4" />
              رفع فيديو من الكمبيوتر
            </button>
          </div>
        </div>
      )}

      {/* State 2 & 3: Local Preview or Existing Video Player */}
      {activeVideoSrc && (
        <div className="rounded-2xl border-2 border-border overflow-hidden bg-card shadow-sm">
          {/* Header banner if local preview before upload */}
          {isPendingUpload && (
            <div className="p-3 bg-brand-orange/10 border-b border-brand-orange/20 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-brand-orange">
                <FileCheck className="w-4 h-4" />
                <span>معاينة الفيديو المحلي قبل اتخاذ قرار الرفع</span>
              </div>
              <span className="text-[11px] font-mono text-muted-foreground">
                {selectedFile?.name} ({formatFileSize(selectedFile?.size)})
              </span>
            </div>
          )}

          {/* Video Player */}
          <div 
            className={`relative w-full bg-black flex items-center justify-center overflow-hidden
              ${isReel ? 'max-w-[280px] mx-auto aspect-[9/16] rounded-xl my-2' : 'aspect-video'}`}
          >
            <video
              ref={videoRef}
              src={activeVideoSrc}
              controls
              playsInline
              onLoadedMetadata={(e) => {
                const dur = (e.target as HTMLVideoElement).duration;
                if (dur && !isNaN(dur)) setVideoDuration(dur);
              }}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              className="w-full h-full object-contain"
            />

            {/* Uploading progress overlay */}
            {uploading && (
              <div className="absolute inset-0 bg-black/75 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-white z-20">
                <Loader2 className="w-10 h-10 animate-spin text-brand-orange mb-3" />
                <p className="text-base font-black mb-1">جارٍ رفع الفيديو إلى السحابة...</p>
                <p className="text-xs text-white/80 mb-3 font-mono">
                  {formatFileSize(uploadedBytes)} / {formatFileSize(totalBytes)} ({progress}%)
                </p>
                <div className="w-full max-w-sm h-2.5 bg-white/20 rounded-full overflow-hidden mb-2">
                  <div 
                    className="h-full bg-gradient-to-r from-brand-orange to-brand-red transition-all duration-200"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="text-[11px] text-white/60">يرجى الانتظار حتى اكتمال المعالجة وتأكيد الحفظ</p>
              </div>
            )}
          </div>

          {/* Controls Bar */}
          <div className="p-3 bg-card border-t border-border flex flex-wrap items-center justify-between gap-3">
            {/* Left status badge */}
            <div className="flex items-center gap-2">
              {isPendingUpload ? (
                <span className="text-xs font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                  <Film className="w-4 h-4" />
                  تحقق من جودة الفيديو، ثم اضغط "رفع الفيديو"
                </span>
              ) : isR2Protected ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  <Shield className="w-3.5 h-3.5" />
                  فيديو محمي على R2
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  فيديو جاهز
                </span>
              )}
            </div>

            {/* Right actions */}
            <div className="flex items-center gap-2">
              {isPendingUpload ? (
                /* Two clear actions required by spec: [إلغاء] and [رفع الفيديو] */
                <>
                  <button
                    type="button"
                    onClick={handleCancelSelection}
                    disabled={uploading}
                    className="px-4 py-2 text-xs font-bold rounded-xl border border-border hover:bg-secondary text-muted-foreground transition-all disabled:opacity-50"
                  >
                    إلغاء
                  </button>

                  <button
                    type="button"
                    onClick={handleConfirmUpload}
                    disabled={uploading}
                    className="inline-flex items-center gap-2 px-5 py-2 text-xs font-bold rounded-xl bg-gradient-to-r from-brand-orange to-brand-red text-white shadow-md shadow-brand-orange/20 hover:opacity-95 transition-all disabled:opacity-50"
                  >
                    <UploadCloud className="w-4 h-4" />
                    رفع الفيديو
                  </button>
                </>
              ) : (
                /* Already uploaded/saved state actions */
                <>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl text-brand-orange hover:bg-brand-orange/10 transition-all disabled:opacity-50"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    استبدال الفيديو
                  </button>

                  <button
                    type="button"
                    onClick={handleRemoveExisting}
                    disabled={uploading}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all disabled:opacity-50"
                  >
                    <X className="w-3.5 h-3.5" />
                    حذف
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="flex items-center justify-between p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs font-bold">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
          {selectedFile && !uploading && (
            <button
              type="button"
              onClick={handleConfirmUpload}
              className="underline text-[11px] hover:text-red-700"
            >
              إعادة المحاولة
            </button>
          )}
        </div>
      )}

      {/* Manual link input fallback */}
      <div className="pt-1">
        <button
          type="button"
          onClick={() => setShowUrlInput(!showUrlInput)}
          className="text-[11px] font-bold text-muted-foreground hover:text-brand-orange transition-colors flex items-center gap-1"
        >
          <Link2 className="w-3 h-3" />
          {showUrlInput ? 'إخفاء الرابط اليدوي' : 'أو أدخل رابط فيديو خارجي (يوتيوب / MP4 مباشر)'}
        </button>

        {showUrlInput && (
          <div className="mt-2">
            <input
              type="text"
              value={value || ''}
              onChange={(e) => {
                handleCancelSelection();
                onChange(e.target.value || null);
              }}
              placeholder="https://… أو r2:videos/…"
              dir="ltr"
              className="w-full px-3.5 py-2 text-xs rounded-xl border-2 border-border bg-background text-foreground focus:border-brand-orange focus:outline-none transition-all font-mono"
            />
          </div>
        )}
      </div>
    </div>
  );
}
