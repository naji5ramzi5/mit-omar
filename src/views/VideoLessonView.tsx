'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight, ArrowLeft, CheckCircle, Clock, List, X, Loader2, AlertTriangle,
  Lock, KeyRound, Play, AlertCircle, CheckCircle2, MessageCircle, BookOpen
} from 'lucide-react';
import { useAppStore } from '@/stores/app-store';
import { useAuthStore } from '@/stores/auth-store';
import { t } from '@/lib/i18n';
import SecureVideoPlayer from '@/components/SecureVideoPlayer';
import LessonFlashcardsPlayer, { LessonCard } from '@/components/LessonFlashcardsPlayer';

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
  const [videoToken, setVideoToken] = useState<string | undefined>();
  const [watermarkToken, setWatermarkToken] = useState<string | undefined>();
  const [videoState, setVideoState] = useState<'idle' | 'loading' | 'ready' | 'error' | 'locked'>('idle');
  const [videoMsg, setVideoMsg] = useState('');

  // Activation modal state inside video player
  const [activationModalOpen, setActivationModalOpen] = useState(false);
  const [activationCode, setActivationCode] = useState('');
  const [activating, setActivating] = useState(false);
  const [activationError, setActivationError] = useState<string | null>(null);
  const [activationSuccess, setActivationSuccess] = useState<any | null>(null);
  const [courseTitle, setCourseTitle] = useState<string>('');

  // Lesson Flashcards state
  const [lessonFlashcards, setLessonFlashcards] = useState<LessonCard[]>([]);
  const [flashcardsLoading, setFlashcardsLoading] = useState(false);
  const [showFlashcardsPlayer, setShowFlashcardsPlayer] = useState(false);
  const [completionPrompt, setCompletionPrompt] = useState(false);
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
          const errData = await r.json().catch(() => ({}));
          setVideoState('locked');
          setVideoMsg(errData.message || ui.locked);
          return;
        }
        if (!r.ok) throw new Error('unavailable');
        const data = await r.json();
        setVideoSrc(data.url || null);
        setVideoToken(data.videoToken || undefined);
        setWatermarkToken(data.watermarkToken || undefined);
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
        if (data.course?.titleAr) {
          setCourseTitle(data.course.titleAr);
        }
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

  useEffect(() => {
    if (!currentLesson?.id) {
      setLessonFlashcards([]);
      return;
    }
    setFlashcardsLoading(true);
    fetch(`/api/flashcards?lessonId=${currentLesson.id}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((r) => r.json())
      .then((data) => {
        setLessonFlashcards(data.words || []);
      })
      .catch(() => setLessonFlashcards([]))
      .finally(() => setFlashcardsLoading(false));
  }, [currentLesson?.id, token]);

  const getField = (obj: Record<string, unknown>, field: string) => {
    const localeKey = locale.charAt(0).toUpperCase() + locale.slice(1);
    return (obj[`${field}${localeKey}`] as string) || '';
  };

  const selectLesson = (lesson: Lesson) => {
    setCurrentLesson(lesson);
    setShowSidebar(false);
    setCompletionPrompt(false);
    setShowFlashcardsPlayer(false);
    loadVideo(lesson);
  };

  const handleActivationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activationCode.trim() || !courseId) return;

    if (!isAuthenticated()) {
      navigate('login');
      return;
    }

    setActivating(true);
    setActivationError(null);
    setActivationSuccess(null);

    try {
      const res = await fetch('/api/courses/activate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          code: activationCode.trim(),
          courseId,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'فشل تفعيل الكورس');
      }

      setActivationSuccess(data.enrollment);
      // Reload current video with new active enrollment
      if (currentLesson) {
        loadVideo(currentLesson);
      }
      setTimeout(() => setActivationModalOpen(false), 2000);
    } catch (err: any) {
      setActivationError(err.message || 'حدث خطأ أثناء التفعيل');
    } finally {
      setActivating(false);
    }
  };

  const currentIdx = lessons.findIndex(l => l.id === currentLesson?.id);
  const prevLesson = currentIdx > 0 ? lessons[currentIdx - 1] : null;
  const nextLesson = currentIdx < lessons.length - 1 ? lessons[currentIdx + 1] : null;

  const handleComplete = async () => {
    if (!currentLesson) return;
    if (token) {
      try {
        await fetch('/api/progress', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ lessonId: currentLesson.id, completed: true }),
        });
      } catch { /* ignore */ }
    }
    setLessons(prev => prev.map(l => l.id === currentLesson.id ? { ...l, completed: true } : l));
    setCurrentLesson(prev => prev ? { ...prev, completed: true } : null);

    if (lessonFlashcards.length > 0) {
      setCompletionPrompt(true);
    } else if (nextLesson) {
      selectLesson(nextLesson);
    }
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
                <div className="text-center max-w-sm mx-auto p-6 space-y-4">
                  <div className="w-16 h-16 mx-auto rounded-2xl bg-white/10 flex items-center justify-center text-amber-400">
                    <Lock className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white mb-1">
                      {videoMsg || 'هذا الدرس مدفوع'}
                    </h3>
                    <p className="text-xs text-white/60 leading-relaxed">
                      هذا المحتوى محمي ويتطلب كود تفعيل نشطاً لمشاهدته.
                    </p>
                  </div>

                  <div className="space-y-2 pt-2">
                    <button
                      onClick={() => {
                        setActivationCode('');
                        setActivationError(null);
                        setActivationSuccess(null);
                        setActivationModalOpen(true);
                      }}
                      className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-brand-orange to-brand-red hover:from-brand-orange-dark hover:to-brand-red-dark text-white font-bold text-sm shadow-lg flex items-center justify-center gap-2 transition-all"
                    >
                      <KeyRound className="w-4 h-4" />
                      تفعيل الكورس بالكود
                    </button>

                    {/* Direct WhatsApp Purchase */}
                    <a
                      href={`https://wa.me/4915753063510?text=${encodeURIComponent(`مرحباً أستاذ عمر، أرغب في شراء كود تفعيل دورة "${courseTitle || 'الألمانية'}" لمشاهدة الدروس.`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md flex items-center justify-center gap-2 transition-all"
                    >
                      <MessageCircle className="w-4 h-4" />
                      شراء كود تفعيل عبر WhatsApp
                    </a>

                    {lessons.some(l => l.isFree && l.id !== currentLesson?.id) && (
                      <button
                        onClick={() => {
                          const fl = lessons.find(l => l.isFree);
                          if (fl) selectLesson(fl);
                        }}
                        className="w-full py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/20 text-white/90 text-xs font-semibold flex items-center justify-center gap-2 transition-all"
                      >
                        <Play className="w-3.5 h-3.5 fill-current text-emerald-400" />
                        مشاهدة الدرس المجاني المتاح
                      </button>
                    )}
                  </div>
                </div>
              )}

              {videoState === 'ready' && videoSrc && (
                <SecureVideoPlayer
                  key={currentLesson?.id}
                  src={videoSrc}
                  lessonId={currentLesson?.id || ''}
                  videoToken={videoToken}
                  watermarkToken={watermarkToken}
                  userId={user?.id}
                  userName={user?.name}
                  userEmail={user?.email}
                  onEnded={handleComplete}
                />
              )}
            </div>
          </div>

          {/* Bottom Controls */}
          <div className="border-t border-white/10 px-4 py-3 flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-3">
              <button onClick={() => prevLesson && selectLesson(prevLesson)} disabled={!prevLesson} className="text-white/40 hover:text-white disabled:opacity-30 transition-colors cursor-pointer">
                {isRtl ? <ArrowRight className="w-5 h-5" /> : <ArrowLeft className="w-5 h-5" />}
              </button>
              <button onClick={() => nextLesson && selectLesson(nextLesson)} disabled={!nextLesson} className="text-white/40 hover:text-white disabled:opacity-30 transition-colors cursor-pointer">
                {isRtl ? <ArrowLeft className="w-5 h-5" /> : <ArrowRight className="w-5 h-5" />}
              </button>
            </div>

            <div className="flex items-center gap-2">
              {lessonFlashcards.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowFlashcardsPlayer(true)}
                  className="flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-xl bg-brand-orange/20 hover:bg-brand-orange/30 text-brand-orange border border-brand-orange/40 transition-all cursor-pointer shadow-xs active:scale-95"
                  title="مراجعة بطاقات حفظ مفردات هذا الدرس"
                >
                  <BookOpen className="w-4 h-4" />
                  <span>بطاقات حفظ الدرس ({lessonFlashcards.length})</span>
                </button>
              )}

              <button
                onClick={handleComplete}
                disabled={currentLesson?.completed}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-xl transition-all cursor-pointer ${
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

      {/* In-Player Course Activation Modal */}
      <AnimatePresence>
        {activationModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md bg-[#141414] border-2 border-white/10 rounded-3xl p-6 shadow-2xl space-y-5"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-brand-orange to-brand-red flex items-center justify-center text-white shadow-md">
                    <KeyRound className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">تفعيل كود الدورة</h3>
                    <p className="text-xs text-white/50">افتح هذا الدرس وكافة دروس الدورة فوراً</p>
                  </div>
                </div>
                <button
                  onClick={() => setActivationModalOpen(false)}
                  className="p-1.5 rounded-xl text-white/50 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {activationSuccess ? (
                <div className="p-5 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-emerald-500 text-white flex items-center justify-center mx-auto shadow-lg">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h4 className="text-base font-bold text-emerald-300">
                    تم التفعيل بنجاح 🎉
                  </h4>
                  <p className="text-xs text-emerald-400 leading-relaxed">
                    تم تفعيل الدورة لمدة {activationSuccess.durationDays} يوماً. جارٍ تشغيل الدرس تلقائياً…
                  </p>
                </div>
              ) : (
                <form onSubmit={handleActivationSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-white/80 block">
                      كود التفعيل الخاص بالدورة
                    </label>
                    <input
                      type="text"
                      dir="ltr"
                      value={activationCode}
                      onChange={(e) => setActivationCode(e.target.value.toUpperCase())}
                      placeholder="OMAR-A1-XXXX"
                      required
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/20 focus:border-brand-orange text-white font-mono text-center tracking-widest text-base font-bold outline-none transition-all"
                    />
                  </div>

                  {activationError && (
                    <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{activationError}</span>
                    </div>
                  )}

                  <div className="pt-2 space-y-2">
                    <button
                      type="submit"
                      disabled={activating || !activationCode.trim()}
                      className="w-full py-3 rounded-xl bg-gradient-to-r from-brand-orange to-brand-red hover:from-brand-orange-dark hover:to-brand-red-dark text-white font-bold text-sm shadow-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                    >
                      {activating ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          جارٍ التحقق والتفعيل…
                        </>
                      ) : (
                        'تفعيل ومشاهدة الآن'
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => setActivationModalOpen(false)}
                      className="w-full py-2 text-xs text-white/50 hover:text-white text-center font-semibold"
                    >
                      إلغاء
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        )}

        {/* Video Lesson Completion Prompt with Flashcards */}
        {completionPrompt && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#0f172a] border border-white/15 rounded-3xl p-6 sm:p-8 max-w-md w-full text-center space-y-5 shadow-2xl"
            >
              <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <CheckCircle2 className="w-8 h-8 text-white" />
              </div>

              <div>
                <h3 className="text-xl font-black text-white mb-2">أحسنت! أكملت الدرس 👏</h3>
                <p className="text-xs sm:text-sm text-white/70 leading-relaxed">
                  يوجد في هذا الدرس <strong className="text-brand-orange font-black">{lessonFlashcards.length} بطاقات حفظ</strong> للمفردات التابعة له. هل ترغب في مراجعتها الآن لترسيخها في الذاكرة؟
                </p>
              </div>

              <div className="space-y-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setCompletionPrompt(false);
                    setShowFlashcardsPlayer(true);
                  }}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-brand-orange to-brand-red hover:from-brand-orange-dark hover:to-brand-red-dark text-white font-bold text-sm shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <BookOpen className="w-4 h-4" />
                  مراجعة بطاقات الحفظ ({lessonFlashcards.length})
                </button>

                {nextLesson && (
                  <button
                    type="button"
                    onClick={() => {
                      setCompletionPrompt(false);
                      selectLesson(nextLesson);
                    }}
                    className="w-full py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    الانتقال مباشرة للدرس التالي
                    {isRtl ? <ArrowLeft className="w-3.5 h-3.5" /> : <ArrowRight className="w-3.5 h-3.5" />}
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setCompletionPrompt(false)}
                  className="w-full py-2 text-xs text-white/40 hover:text-white/80 transition-all cursor-pointer"
                >
                  إغلاق ومتابعة الفيديو
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Interactive Lesson Flashcards Player */}
      {showFlashcardsPlayer && (
        <LessonFlashcardsPlayer
          lessonTitle={currentLesson ? getField(currentLesson as unknown as Record<string, unknown>, 'title') : ''}
          cards={lessonFlashcards}
          locale={locale}
          token={token}
          onClose={() => setShowFlashcardsPlayer(false)}
          hasNextLesson={!!nextLesson}
          onNextLesson={() => {
            setShowFlashcardsPlayer(false);
            if (nextLesson) selectLesson(nextLesson);
          }}
        />
      )}
    </div>
  );
}
