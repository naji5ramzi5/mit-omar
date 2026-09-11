'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play, Pause, Volume2, VolumeX, Maximize, Minimize, Shield, ShieldAlert,
  RotateCcw, EyeOff, Lock, CheckCircle2, MessageCircle
} from 'lucide-react';

interface SecureVideoPlayerProps {
  src: string;
  lessonId: string;
  videoToken?: string;
  watermarkToken?: string;
  userId?: string;
  userName?: string;
  userEmail?: string;
  isExternal?: boolean;
  poster?: string;
  onEnded?: () => void;
}

export default function SecureVideoPlayer({
  src,
  lessonId,
  videoToken,
  watermarkToken,
  userId,
  userName,
  userEmail,
  isExternal = false,
  poster,
  onEnded,
}: SecureVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Playback state
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [fullscreen, setFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [quality, setQuality] = useState('auto');
  const [buffered, setBuffered] = useState(0);
  const [resumeNotice, setResumeNotice] = useState<string | null>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // -------------------------------------------------------------
  // Anti-Recording / Black Screen Shield States
  // -------------------------------------------------------------
  const [isBlackout, setIsBlackout] = useState(false);
  const [blackoutReason, setBlackoutReason] = useState<'recording' | 'screenshot' | 'blur' | null>(null);

  // Watermark dynamic bouncing coordinates
  const [wmCoords, setWmCoords] = useState({ x: 15, y: 20 });

  // -------------------------------------------------------------
  // Blackout Trigger & Clipboard Clearance
  // -------------------------------------------------------------
  const triggerBlackout = useCallback((reason: 'recording' | 'screenshot' | 'blur') => {
    // 1. Instantly pause video
    if (videoRef.current && !videoRef.current.paused) {
      videoRef.current.pause();
    }
    setPlaying(false);

    // 2. Wipe clipboard if screenshot was attempted
    if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
      navigator.clipboard.writeText('').catch(() => {});
    }

    // 3. Engage black screen
    setIsBlackout(true);
    setBlackoutReason(reason);
  }, []);

  const clearBlackout = () => {
    setIsBlackout(false);
    setBlackoutReason(null);
  };

  // -------------------------------------------------------------
  // Keyboard Shortcuts Interception & Anti-Capture
  // -------------------------------------------------------------
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 1. PrintScreen key
      if (e.key === 'PrintScreen' || e.keyCode === 44) {
        e.preventDefault();
        e.stopPropagation();
        triggerBlackout('screenshot');
        return;
      }

      // 2. Windows Snipping Tool: Meta + Shift + S
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && (e.key === 'S' || e.key === 's')) {
        e.preventDefault();
        e.stopPropagation();
        triggerBlackout('screenshot');
        return;
      }

      // 3. DevTools / Inspection: F12, Ctrl+Shift+I/J/C, Ctrl+U
      if (
        e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && ['I', 'J', 'C'].includes(e.key.toUpperCase())) ||
        (e.ctrlKey && ['U', 'S', 'P'].includes(e.key.toUpperCase()))
      ) {
        e.preventDefault();
        e.stopPropagation();
        triggerBlackout('recording');
        return;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'PrintScreen' || e.keyCode === 44) {
        e.preventDefault();
        e.stopPropagation();
        triggerBlackout('screenshot');
      }
    };

    // -------------------------------------------------------------
    // Window Blur & Visibility Switch (Anti-OBS / Background Recorder)
    // -------------------------------------------------------------
    const handleWindowBlur = () => {
      // When student switches window to an OBS / Recording software window, black out!
      triggerBlackout('blur');
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        triggerBlackout('blur');
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    window.addEventListener('keyup', handleKeyUp, true);
    window.addEventListener('blur', handleWindowBlur);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
      window.removeEventListener('keyup', handleKeyUp, true);
      window.removeEventListener('blur', handleWindowBlur);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [triggerBlackout]);

  // -------------------------------------------------------------
  // Dynamic Bouncing Watermark Animation
  // -------------------------------------------------------------
  useEffect(() => {
    const wmInterval = setInterval(() => {
      // Change watermark coordinates randomly every 4 seconds to prevent blurring/cropping
      const newX = Math.floor(Math.random() * 65) + 5; // 5% to 70%
      const newY = Math.floor(Math.random() * 65) + 10; // 10% to 75%
      setWmCoords({ x: newX, y: newY });
    }, 4000);

    return () => clearInterval(wmInterval);
  }, []);

  // -------------------------------------------------------------
  // Auto-Resume Playback from LocalStorage
  // -------------------------------------------------------------
  const handleLoadedMetadata = () => {
    const video = videoRef.current;
    if (!video) return;
    setDuration(video.duration);

    // Check for saved progress
    if (lessonId) {
      try {
        const saved = localStorage.getItem(`dmo_resume_${lessonId}`);
        if (saved) {
          const savedTime = parseFloat(saved);
          if (savedTime > 8 && savedTime < video.duration - 15) {
            video.currentTime = savedTime;
            setCurrentTime(savedTime);
            setResumeNotice(`تمت متابعة المشاهدة من ${formatTime(savedTime)}`);
            setTimeout(() => setResumeNotice(null), 4000);
          }
        }
      } catch {}
    }
  };

  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (!video) return;
    const time = video.currentTime;
    setCurrentTime(time);

    // Throttle-save progress every ~3 seconds
    if (lessonId && Math.floor(time) % 3 === 0) {
      try {
        localStorage.setItem(`dmo_resume_${lessonId}`, time.toString());
      } catch {}
    }
  };

  const handleProgress = () => {
    const video = videoRef.current;
    if (video && video.buffered.length > 0) {
      setBuffered((video.buffered.end(video.buffered.length - 1) / video.duration) * 100);
    }
  };

  const handleEnded = () => {
    setPlaying(false);
    if (lessonId) {
      try {
        localStorage.removeItem(`dmo_resume_${lessonId}`);
      } catch {}
    }
    onEnded?.();
  };

  // Playback Controls
  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (playing) {
      video.pause();
      setPlaying(false);
    } else {
      video.play().then(() => setPlaying(true)).catch(() => {});
    }
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !muted;
    setMuted(!muted);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;
    const vol = parseFloat(e.target.value);
    video.volume = vol;
    setVolume(vol);
    setMuted(vol === 0);
  };

  const toggleFullscreen = async () => {
    const container = containerRef.current;
    if (!container) return;
    try {
      if (!fullscreen) {
        await container.requestFullscreen();
        setFullscreen(true);
      } else {
        await document.exitFullscreen();
        setFullscreen(false);
      }
    } catch {}
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setFullscreen(document.fullscreenElement === containerRef.current);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => setShowControls(false), 3000);
  };

  const formatTime = (time: number) => {
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!src) return null;

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setShowControls(false)}
      onContextMenu={(e) => e.preventDefault()}
      className="relative w-full aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl select-none group border-2 border-border/80"
      style={{ WebkitUserSelect: 'none', userSelect: 'none' }}
    >
      {/* ------------------------------------------------------------- */}
      {/* 1. BLACKOUT SCREEN SHIELD (الشاشة السوداء لحماية الفيديو) */}
      {/* ------------------------------------------------------------- */}
      <AnimatePresence>
        {isBlackout && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 bg-black flex flex-col items-center justify-center p-6 text-center select-none"
            style={{ backgroundColor: '#000000' }}
          >
            <div className="w-16 h-16 rounded-2xl bg-red-500/20 border-2 border-red-500/40 flex items-center justify-center text-red-500 mb-4 shadow-xl animate-pulse">
              <ShieldAlert className="w-9 h-9" />
            </div>

            <h3 className="text-xl font-black text-white mb-2 tracking-wide">
              ⚠️ تم حجب الشاشة بالكامل (حماية المحتوى)
            </h3>

            <p className="text-xs sm:text-sm text-white/70 max-w-md leading-relaxed mb-6">
              {blackoutReason === 'screenshot' && 'رصد النظام محاولة التقاط لقطة شاشة (Screenshot). تم حجب الفيديو ومسح الحافظة فوراً.'}
              {blackoutReason === 'recording' && 'رصد النظام محاولة تسجيل شاشة أو تشغيل أدوات فحص غير مصرح بها.'}
              {blackoutReason === 'blur' && 'تم إيقاف وحجب الفيديو تلقائياً نظراً للتبديل إلى نافذة أخرى أو برنامج خارجي.'}
              <br />
              <span className="text-white/50 text-[11px] block mt-2">
                محتوى دروس الأستاذ عمر محمي بحقوق الملكية الفكرية، ويحظر تسجيله أو إعادة نشره نهائياً.
              </span>
            </p>

            {/* Student traceability tag */}
            <div className="text-[11px] font-mono text-white/40 bg-white/5 px-4 py-1.5 rounded-lg border border-white/10 mb-6">
              المشترك: {userName || userEmail || 'طالب معتمد'} · كود الجلسة: {userId ? userId.slice(0, 8) : 'ACTIVE'}
            </div>

            <button
              onClick={clearBlackout}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-brand-orange to-brand-red hover:from-brand-orange-dark hover:to-brand-red-dark text-white font-bold text-xs shadow-lg transition-transform hover:scale-105"
            >
              متابعة المشاهدة (أقر بعدم التسجيل)
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ------------------------------------------------------------- */}
      {/* 2. AUTO-RESUME BADGE */}
      {/* ------------------------------------------------------------- */}
      <AnimatePresence>
        {resumeNotice && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-4 left-4 z-40 px-3.5 py-1.5 rounded-xl bg-brand-orange/90 backdrop-blur-md text-white text-xs font-bold shadow-lg flex items-center gap-2"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{resumeNotice}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ------------------------------------------------------------- */}
      {/* 3. DYNAMIC BOUNCING WATERMARK (علامة مائية متحركة لمنع التصوير) */}
      {/* ------------------------------------------------------------- */}
      <motion.div
        className="absolute z-30 pointer-events-none text-[11px] font-mono font-bold text-white/20 select-none tracking-wider flex items-center gap-1.5 bg-black/30 px-2.5 py-1 rounded-md border border-white/5 backdrop-blur-[1px]"
        animate={{
          left: `${wmCoords.x}%`,
          top: `${wmCoords.y}%`,
          opacity: [0.15, 0.28, 0.15],
        }}
        transition={{ duration: 3.5, ease: 'easeInOut' }}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
        <span>🇩🇪 Deutsch mit Omar</span>
        <span>·</span>
        <span>{userName || userEmail || 'الطالب'}</span>
        {userId && <span className="opacity-70">({userId.slice(0, 6)})</span>}
      </motion.div>

      {/* ------------------------------------------------------------- */}
      {/* 4. PROTECTED VIDEO ELEMENT */}
      {/* ------------------------------------------------------------- */}
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        playsInline
        crossOrigin="anonymous"
        preload="metadata"
        onLoadedMetadata={handleLoadedMetadata}
        onTimeUpdate={handleTimeUpdate}
        onProgress={handleProgress}
        onEnded={handleEnded}
        onContextMenu={(e) => e.preventDefault()}
        disablePictureInPicture
        disableRemotePlayback
        controls={false}
        className={`w-full h-full object-contain transition-opacity duration-200 ${
          isBlackout ? 'opacity-0 pointer-events-none' : 'opacity-100'
        }`}
        style={isBlackout ? { display: 'none' } : undefined}
      />

      {/* ------------------------------------------------------------- */}
      {/* 5. CUSTOM CONTROLS OVERLAY */}
      {/* ------------------------------------------------------------- */}
      <motion.div
        className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/95 via-black/50 to-transparent z-20"
        initial={{ opacity: 0 }}
        animate={{ opacity: showControls && !isBlackout ? 1 : 0 }}
        transition={{ duration: 0.2 }}
      >
        {/* Progress Bar */}
        <div
          className="relative mb-3.5 group/progress cursor-pointer py-1"
          onClick={(e) => {
            const video = videoRef.current;
            if (!video || !duration) return;
            const rect = e.currentTarget.getBoundingClientRect();
            const percent = (e.clientX - rect.left) / rect.width;
            video.currentTime = percent * duration;
          }}
        >
          <div className="w-full h-1.5 group-hover/progress:h-2 bg-white/20 rounded-full overflow-hidden transition-all">
            {/* Buffered */}
            <div
              className="absolute top-1 left-0 h-1.5 bg-white/30 rounded-full"
              style={{ width: `${buffered}%` }}
            />
            {/* Played */}
            <div
              className="h-full bg-gradient-to-r from-brand-orange to-brand-red rounded-full transition-all duration-100"
              style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
            />
          </div>
          <div
            className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-white shadow-lg border-2 border-brand-orange scale-0 group-hover/progress:scale-100 transition-transform"
            style={{ left: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
          />
        </div>

        {/* Controls Row */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={togglePlay}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-brand-orange text-white flex items-center justify-center transition-colors"
              aria-label={playing ? 'إيقاف' : 'تشغيل'}
            >
              {playing ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ms-0.5" />}
            </button>

            <div className="flex items-center gap-1.5 text-xs font-mono text-white/80">
              <span>{formatTime(currentTime)}</span>
              <span className="text-white/40">/</span>
              <span>{formatTime(duration)}</span>
            </div>

            <div className="flex items-center gap-2 ms-2">
              <button
                onClick={toggleMute}
                className="text-white/80 hover:text-white transition-colors"
                aria-label={muted ? 'إلغاء كتم الصوت' : 'كتم الصوت'}
              >
                {muted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={muted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-16 h-1 accent-brand-orange cursor-pointer"
                aria-label="التحكم بالصوت"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Quality badge */}
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white/10 text-white/70">
              1080p HD
            </span>

            {/* Security indicator */}
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold">
              <Shield className="w-3 h-3" />
              <span>محمي</span>
            </div>

            <button
              onClick={toggleFullscreen}
              className="text-white/80 hover:text-brand-orange transition-colors"
              aria-label={fullscreen ? 'تصغير' : 'ملء الشاشة'}
            >
              {fullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}