'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, Volume2, VolumeX, Maximize, Minimize, Settings, Shield, Lock, X } from 'lucide-react';

interface PreviewProps {
  lessonId: string;
  token?: string;
  userName?: string;
  userId?: string;
  onClose: () => void;
}

export default function VideoPreviewModal({ lessonId, token, userName, userId, onClose }: PreviewProps) {
  const [videoSrc, setVideoSrc] = useState<string | null>(null);
  const [videoState, setVideoState] = useState<'idle' | 'loading' | 'ready' | 'error' | 'locked'>('idle');
  const [videoMsg, setVideoMsg] = useState('');
  const [previewToken, setPreviewToken] = useState<string | undefined>();
  const [watermarkEnabled, setWatermarkEnabled] = useState(true);
  const [quality, setQuality] = useState('auto');
  const videoRef = useRef<HTMLVideoElement>(null);

  // Fetch video preview with token
  useEffect(() => {
    if (!lessonId) return;
    fetch(`/api/videos/play?lessonId=${lessonId}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then(async (r) => {
        if (r.status === 403 || r.status === 401) {
          setVideoState('locked');
          setVideoMsg('هذا الدرس requires active enrollment');
          return;
        }
        if (!r.ok) throw new Error('unavailable');
        const data = await r.json();
        setVideoSrc(data.url || null);
        setPreviewToken(data.videoToken || undefined);
        setVideoState('ready');
      })
      .catch(() => {
        setVideoState('error');
        setVideoMsg('الفيديو غير متاح حالياً');
      });
  }, [lessonId, token]);

  // Token expiry timer - 15 minutes default
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    const updateTimer = () => {
      if (!previewToken) return;
      const issuedAt = parseInt(previewToken.split('-')[1] || '0');
      const now = Date.now();
      const ttl = 15 * 60 * 1000; // 15 minutes
      const remaining = Math.max(0, ttl - (now - issuedAt));
      if (remaining <= 0) {
        setVideoState('locked');
        setVideoMsg('انتهى وقت المعاينة');
      }
    };
    updateTimer();
    timeoutId = setInterval(updateTimer, 60000);
    return () => clearInterval(timeoutId);
  }, [previewToken]);

  if (videoState === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-16 h-16 border-2 border-white/20 border-t-brand-orange rounded-full animate-spin" />
        <p className="mt-4 text-white/50 text-sm">جارٍ تحميل الفيديو…</p>
      </div>
    );
  }

  if (videoState === 'error') {
    return (
      <div className="p-6 text-center">
        <Shield className="w-12 h-12 text-red-400 mb-4" />
        <p className="text-red-400 text-lg">{videoMsg}</p>
        <button onClick={onClose} className="mt-4 px-4 py-2 bg-brand-orange text-white rounded">إغلاق</button>
      </div>
    );
  }

  if (videoState === 'locked') {
    return (
      <div className="p-6 text-center">
        <Lock className="w-12 h-12 text-red-400 mb-4" />
        <p className="text-red-400 text-lg">{videoMsg}</p>
        <button onClick={onClose} className="mt-4 px-4 py-2 bg-brand-orange text-white rounded">إغلاق</button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xl flex items-center justify-center p-4">
      <div className="relative w-full max-w-2xl aspect-[16/9] bg-black rounded-lg shadow-2xl overflow-hidden">
        {/* Watermark toggle */}
        <div className="absolute top-3 left-3 flex items-center gap-2 p-2 bg-black/50 rounded">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={watermarkEnabled}
              onChange={() => setWatermarkEnabled(!watermarkEnabled)}
              className="w-4 h-4 rounded border accent-brand-orange"
            />
            <span className="text-[10px] text-muted-foreground">إخفاء watermark</span>
          </label>
        </div>

        <video
          ref={videoRef}
          src={videoSrc || undefined}
          className="w-full h-full object-cover"
          playsInline
          preload="metadata"
          onContextMenu={e => e.preventDefault()}
          disablePictureInPicture
          disableRemotePlayback
          autoPlay
        />

        {/* Controls overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/90 via-black/40 to-transparent">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button onClick={() => videoRef.current?.pause()} className="p-2 text-white hover:text-brand-orange transition-colors" aria-label="Pause">
                <Pause className="w-4 h-4" />
              </button>
              <button onClick={() => videoRef.current?.play()} className="p-2 text-white hover:text-brand-orange transition-colors" aria-label="Play">
                <Play className="w-4 h-4" />
              </button>
              <select
                value={quality}
                onChange={(e) => setQuality(e.target.value)}
                className="bg-white/10 border border-white/20 text-white text-[11px] px-2 py-1 rounded-lg ml-2"
              >
                <option value="auto">Auto</option>
                <option value="1080p">1080p</option>
                <option value="720p">720p</option>
                <option value="480p">480p</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-white/70">{videoState === 'ready' ? 'Live' : 'Loading'}</span>
            </div>
          </div>
          <div className="mt-3">
            <div className="w-full h-1.5 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-brand-orange rounded-full transition-all duration-100"
                style={{ width: videoRef.current && videoRef.current.duration > 0 ? (videoRef.current.currentTime / videoRef.current.duration) * 100 : 0 }}
              />
              <div className="absolute top-0 right-0 h-full w-1.5 bg-white/20">
                <div className="h-full bg-brand-orange rounded-full transition-all duration-100" style={{ width: 100 }} />
              </div>
            </div>
            <div className="flex items-center justify-between text-[11px] text-white/70">
              <span>{videoRef.current && videoRef.current.currentTime > 0 ? `${Math.floor(videoRef.current.currentTime / 60)}:${String(videoRef.current.currentTime % 60).padStart(2, '0')}` : '0:00'}</span>
              <span>{videoRef.current && videoRef.current.duration > 0 ? `${Math.floor(videoRef.current.duration / 60)}:${String(videoRef.current.duration % 60).padStart(2, '0')}` : '0:00'}</span>
            </div>
          </div>
        </div>

        {/* Watermark text when enabled */}
        {watermarkEnabled && userId && userName && (
          <div className="absolute bottom-4 right-4 p-2 bg-black/60 text-white text-xs rounded">
            🛡️ Protected for {userName}
          </div>
        )}
      </div>

      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-3 rounded-full bg-white/20 backdrop-blur border border-white/10 text-white hover:bg-white/10 transition-colors"
        aria-label="Close preview"
      >
        <X className="w-5 h-5" />
      </button>
    </div>
  );
}