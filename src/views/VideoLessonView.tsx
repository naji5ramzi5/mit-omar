'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, ArrowLeft, CheckCircle, Clock, List, X, Loader2, AlertTriangle } from 'lucide-react';
import { useAppStore } from '@/stores/app-store';
import { useAuthStore } from '@/stores/auth-store';
import { t } from '@/lib/i18n';

interface Lesson {
  id: string;
  titleAr: string; titleDe: string; titleEn: string;
  descriptionAr?: string; descriptionDe?: string; descriptionEn?: string;
  duration: number;
  order: number;
  isFree: boolean;
  videoUrl?: string;
  completed: boolean;
}

export default function VideoLessonView() {
  const { locale, navigate, viewParams } = useAppStore();
  const { token, user, isAuthenticated } = useAuthStore();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSidebar, setShowSidebar] = useState(false);
  const [videoSrc, setVideoSrc] = useState<string | null>(null);
  const [videoState, setVideoState] = useState<'idle' | 'loading' | 'ready' | 'error' | 'locked'>('idle');
  const [videoMsg, setVideoMsg] = useState('');
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const isRtl = locale === 'ar';
  const BackArrow = isRtl ? ArrowRight : ArrowLeft;
  const courseId = viewParams.courseId;
  const lessonId = viewParams.lessonId;

  const ui =
    locale === 'ar'
      ? { loading: 'جارٍ تحميل الفيديو…', unavailable: 'الفيديو غير متاح حالياً', locked: 'هذا الدرس يتطلب اشتراكاً نشطاً', retry: 'إعادة المحاولة' }
      : locale === 'de'
      ? { loading: 'Video wird geladen…', unavailable: 'Video derzeit nicht verfügbar', locked: 'Diese Lektion erfordert eine aktive Anmeldung', retry: 'Erneut versuchen' }
      : { loading: 'Loading video…', unavailable: 'Video is currently unavailable', locked: 'This lesson requires an active enrollment', retry: 'Try again' };

  const loadVideo = (lesson: Lesson) => {
    setVideoState('loading');
    setVideoSrc(null);
    setVideoMsg('');
    fetch(`/api/videos/play?lessonId=${lesson.id}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then(async (r) => {
        if (r.status === 403 || r.status === 401) {
          setVideoState('locked');
          setVideoMsg(ui.locked);
          return;
        }
        if (!r.ok) throw new Error('unavailable');
        const data = await r.json();
        setVideoSrc(data.url || null);
        setVideoState('ready');
      })
      .catch(() => {
        setVideoState('error');
        setVideoMsg(ui.unavailable);
      });
  };

  useEffect(() => {
    if (!courseId) return;
    const params = new URLSearchParams({ includeLessons: 'true', withProgress: 'true' });
    fetch(`/api/courses/${courseId}?${params}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then(r => r.json())
      .then(data => {
        if (data.course?.lessons) {
          setLessons(data.course.lessons);
          const lesson = data.course.lessons.find((l: Lesson) => l.id === lessonId) || data.course.lessons[0];
          setCurrentLesson(lesson || null);
          if (lesson) loadVideo(lesson);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [courseId, lessonId, token]);

  const getField = (obj: Record<string, unknown>, field: string) => {
    const localeKey = locale.charAt(0).toUpperCase() + locale.slice(1);
    return (obj[`${field}${localeKey}`] as string) || '';
  };

  const selectLesson = (lesson: Lesson) => {
    setCurrentLesson(lesson);
    setShowSidebar(false);
    loadVideo(lesson);
  };

  const currentIdx = lessons.findIndex(l => l.id === currentLesson?.id);
  const prevLesson = currentIdx > 0 ? lessons[currentIdx - 1] : null;
  const nextLesson = currentIdx < lessons.length - 1 ? lessons[currentIdx + 1] : null;

  const handleComplete = async () => {
    if (!currentLesson || !token) return;
    try {
      await fetch('/api/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ lessonId: currentLesson.id, completed: true }),
      });
      setLessons(prev => prev.map(l => l.id === currentLesson.id ? { ...l, completed: true } : l));
      setCurrentLesson(prev => prev ? { ...prev, completed: true } : null);
      if (nextLesson) selectLesson(nextLesson);
    } catch { /* ignore */ }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#0a0a0a]">
        <div className="w-8 h-8 border-2 border-white/20 border-t-brand-orange rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="video-player-dark min-h-screen flex flex-col">
      {/* Top Bar */}
      <div className="h-14 border-b border-white/10 flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('course-detail', { id: courseId! })} className="text-white/60 hover:text-white transition-colors">
            <BackArrow className="w-5 h-5" />
          </button>
          <div className="hidden sm:block">
            <h1 className="text-sm font-medium text-white truncate max-w-md">
              {currentLesson ? getField(currentLesson as unknown as Record<string, unknown>, 'title') : ''}
            </h1>
            <p className="text-xs text-white/40">
              {t(locale, 'video_lesson_info')} {currentIdx + 1}/{lessons.length}
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowSidebar(!showSidebar)}
          className="lg:hidden p-2 text-white/60 hover:text-white transition-colors"
        >
          <List className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 flex">
        {/* Video Area */}
        <div className="flex-1 flex flex-col">
          <div className="flex-1 flex items-center justify-center relative">
            <div className="w-full aspect-video max-w-5xl relative bg-[#111] flex items-center justify-center overflow-hidden">
              {videoState === 'loading' && (
                <div className="text-center">
                  <Loader2 className="w-10 h-10 mx-auto mb-4 text-brand-orange animate-spin" />
                  <p className="text-white/50 text-sm">{ui.loading}</p>
                </div>
              )}

              {videoState === 'error' && (
                <div className="text-center">
                  <AlertTriangle className="w-10 h-10 mx-auto mb-4 text-amber-400" />
                  <p className="text-white/50 text-sm mb-4">{videoMsg || ui.unavailable}</p>
                  {currentLesson && (
                    <button
                      onClick={() => loadVideo(currentLesson)}
                      className="px-5 py-2.5 text-sm font-bold rounded-xl bg-gradient-to-r from-brand-orange to-brand-red text-white"
                    >
                      {ui.retry}
                    </button>
                  )}
                </div>
              )}

              {videoState === 'locked' && (
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-white/5 flex items-center justify-center">
                    <svg className="w-7 h-7 text-white/60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                  </div>
                  <p className="text-white/70 text-sm">{videoMsg || ui.locked}</p>
                </div>
              )}

              {videoState === 'ready' && videoSrc && (
                <video
                  key={currentLesson?.id}
                  ref={videoRef}
                  src={videoSrc}
                  controls
                  playsInline
                  controlsList="nodownload noremoteplayback"
                  className="w-full h-full object-contain bg-black"
                />
              )}

              {user && videoState === 'ready' && (
                <div className="absolute bottom-4 end-4 text-white/10 text-xs pointer-events-none animate-watermark">
                  {t(locale, 'video_watermark')}: {user.name}
                </div>
              )}
            </div>
          </div>

          {/* Bottom Controls */}
          <div className="border-t border-white/10 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={() => prevLesson && selectLesson(prevLesson)} disabled={!prevLesson} className="text-white/40 hover:text-white disabled:opacity-30 transition-colors">
                {isRtl ? <ArrowRight className="w-5 h-5" /> : <ArrowLeft className="w-5 h-5" />}
              </button>
              <button onClick={() => nextLesson && selectLesson(nextLesson)} disabled={!nextLesson} className="text-white/40 hover:text-white disabled:opacity-30 transition-colors">
                {isRtl ? <ArrowLeft className="w-5 h-5" /> : <ArrowRight className="w-5 h-5" />}
              </button>
            </div>
            <button
              onClick={handleComplete}
              disabled={currentLesson?.completed}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-xl transition-all ${
                currentLesson?.completed
                  ? 'bg-green-600/20 text-green-400'
                  : 'bg-gradient-to-r from-brand-orange to-brand-red text-white hover:from-brand-orange-dark hover:to-brand-red-dark'
              }`}
            >
              <CheckCircle className="w-4 h-4" />
              {currentLesson?.completed ? t(locale, 'course_completed') : t(locale, 'course_continue')}
            </button>
          </div>
        </div>

        {/* Sidebar - Lessons List (Desktop) */}
        <div className="hidden lg:block w-80 border-s border-white/10 max-h-[calc(100vh-3.5rem)] overflow-y-auto">
          <div className="p-4 border-b border-white/10">
            <h3 className="text-sm font-bold text-white">{t(locale, 'video_lessons_list')}</h3>
          </div>
          <div>
            {lessons.map(lesson => {
              const isActive = lesson.id === currentLesson?.id;
              return (
                <button
                  key={lesson.id}
                  onClick={() => selectLesson(lesson)}
                  className={`w-full text-start px-4 py-3 border-b border-white/5 transition-colors ${
                    isActive ? 'bg-white/10' : 'hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                      lesson.completed ? 'bg-green-600/20 text-green-400' : isActive ? 'bg-gradient-to-br from-brand-orange to-brand-red text-white' : 'bg-white/10 text-white/40'
                    }`}>
                      {lesson.completed ? <CheckCircle className="w-4 h-4" /> : <span className="text-xs font-bold">{lesson.order}</span>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs truncate ${isActive ? 'text-white font-bold' : 'text-white/60'}`}>
                        {getField(lesson as unknown as Record<string, unknown>, 'title')}
                      </p>
                      <p className="text-[10px] text-white/30 flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3" /> {lesson.duration}{t(locale, 'common_min')}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Mobile Sidebar Drawer */}
      {showSidebar && (
        <>
          <div className="lg:hidden fixed inset-0 z-50 bg-black/60" onClick={() => setShowSidebar(false)} />
          <motion.div
            initial={{ x: isRtl ? -300 : 300 }}
            animate={{ x: 0 }}
            className="lg:hidden fixed top-0 bottom-0 z-50 w-72 bg-[#111] border-e border-white/10 overflow-y-auto"
            style={{ [isRtl ? 'right' : 'left']: 0 }}
          >
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <h3 className="text-sm font-bold text-white">{t(locale, 'video_lessons_list')}</h3>
              <button onClick={() => setShowSidebar(false)} className="text-white/40 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <div>
              {lessons.map(lesson => {
                const isActive = lesson.id === currentLesson?.id;
                return (
                  <button
                    key={lesson.id}
                    onClick={() => selectLesson(lesson)}
                    className={`w-full text-start px-4 py-3 border-b border-white/5 ${isActive ? 'bg-white/10' : 'hover:bg-white/5'}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${lesson.completed ? 'bg-green-600/20 text-green-400' : isActive ? 'bg-gradient-to-br from-brand-orange to-brand-red text-white' : 'bg-white/10 text-white/40'}`}>
                        {lesson.completed ? <CheckCircle className="w-4 h-4" /> : <span className="text-xs font-bold">{lesson.order}</span>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs truncate ${isActive ? 'text-white font-bold' : 'text-white/60'}`}>{getField(lesson as unknown as Record<string, unknown>, 'title')}</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </motion.div>
        </>
      )}
    </div>
  );
}
