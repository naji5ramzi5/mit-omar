'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight, BookOpen, Clock, Lock, CheckCircle, Play, ChevronDown, ChevronUp,
  ArrowLeft, Users, Star, Video, Sparkles, KeyRound, AlertCircle, X, ShieldCheck,
  CheckCircle2, Loader2, MessageCircle, HelpCircle, Award, ExternalLink, Layers
} from 'lucide-react';
import { useAppStore } from '@/stores/app-store';
import { useAuthStore } from '@/stores/auth-store';
import { t } from '@/lib/i18n';
import { resolveMediaUrl } from '@/lib/media';

interface Lesson {
  id: string;
  courseId?: string;
  levelId?: string;
  titleAr: string; titleDe: string; titleEn: string;
  descriptionAr?: string; descriptionDe?: string; descriptionEn?: string;
  duration: number;
  order: number;
  isFree: boolean;
  progress?: { completed: boolean };
}

interface CourseLevel {
  id: string;
  courseId?: string;
  name: string;
  titleAr: string; titleDe: string; titleEn: string;
  descriptionAr?: string; descriptionDe?: string; descriptionEn?: string;
  imageUrl?: string;
  introVideoUrl?: string;
  order: number;
  isActive: boolean;
  lessons: Lesson[];
  _count?: { lessons: number };
}

interface Course {
  id: string;
  titleAr: string; titleDe: string; titleEn: string;
  descriptionAr: string; descriptionDe: string; descriptionEn: string;
  level?: string;
  imageUrl?: string;
  introVideo?: { videoUrl: string | null; duration: number; isPublished: boolean; resolvedUrl?: string | null } | null;
  lessons: Lesson[];
  levels?: CourseLevel[];
  enrollment?: { isActive: boolean; expiresAt: string | null; activatedAt: string | null; isExpired?: boolean };
}

export default function CourseDetailView() {
  const { locale, navigate, viewParams } = useAppStore();
  const { isAuthenticated, token, user } = useAuthStore();
  const [course, setCourse] = useState<Course | null>(null);
  const [activeLevelId, setActiveLevelId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({ content: true });

  // Intro video inline state
  const [introVideoUrl, setIntroVideoUrl] = useState<string | null>(null);
  const [loadingIntro, setLoadingIntro] = useState(false);
  const videoPlayerRef = useRef<HTMLVideoElement | null>(null);

  const [activationModalOpen, setActivationModalOpen] = useState(false);
  const [activationCode, setActivationCode] = useState('');
  const [activating, setActivating] = useState(false);
  const [activationError, setActivationError] = useState<string | null>(null);
  const [activationSuccess, setActivationSuccess] = useState<any | null>(null);

  const courseId = viewParams.id;
  const isRtl = locale === 'ar';
  const BackArrow = isRtl ? ArrowRight : ArrowLeft;

  const fetchIntroVideo = async (cId: string) => {
    setLoadingIntro(true);
    try {
      const res = await fetch(`/api/videos/play?courseId=${cId}&intro=true`);
      if (res.ok) {
        const data = await res.json();
        setIntroVideoUrl(data.url);
      } else {
        setIntroVideoUrl(null);
      }
    } catch {
      setIntroVideoUrl(null);
    } finally {
      setLoadingIntro(false);
    }
  };

  const fetchCourseData = async () => {
    if (!courseId) return;
    try {
      const params = new URLSearchParams();
      params.set('includeLessons', 'true');
      if (isAuthenticated()) params.set('withProgress', 'true');
      const res = await fetch(`/api/courses/${courseId}?${params}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error('Course not found');
      const data = await res.json();
      setCourse(data.course);
      if (data.course?.levels?.length) {
        setActiveLevelId((prev) => prev || data.course.levels[0].id);
      }
      if (data.course?.introVideo?.resolvedUrl) {
        setIntroVideoUrl(data.course.introVideo.resolvedUrl);
      } else if (data.course?.introVideo?.videoUrl) {
        fetchIntroVideo(data.course.id);
      }
    } catch {
      setCourse(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourseData();
  }, [courseId, token]);

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const getField = (obj: Record<string, unknown> | undefined, field: string) => {
    if (!obj) return '';
    const localeKey = locale.charAt(0).toUpperCase() + locale.slice(1);
    return (obj[`${field}${localeKey}`] as string) || (obj[`${field}Ar`] as string) || (obj[`${field}De`] as string) || '';
  };

  const playInlineIntroVideo = () => {
    if (videoPlayerRef.current) {
      videoPlayerRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      videoPlayerRef.current.play().catch(() => {});
    }
  };

  const handleActivationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activationCode.trim()) return;

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
      await fetchCourseData();
    } catch (err: any) {
      setActivationError(err.message || 'حدث خطأ أثناء التفعيل');
    } finally {
      setActivating(false);
    }
  };

  const handleLessonClick = (lesson: Lesson) => {
    const isEnrolled = !!course?.enrollment?.isActive;
    const canAccess = lesson.isFree || isEnrolled;

    if (canAccess) {
      navigate('video-lesson', { courseId: courseId!, lessonId: lesson.id });
    } else {
      setActivationModalOpen(true);
    }
  };

  if (loading) {
    return (
      <div className="pt-6 pb-20 container-bold animate-pulse">
        <div className="h-8 w-36 bg-muted/60 rounded-xl mb-6" />
        <div className="grid lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-8 space-y-6">
            <div className="w-full aspect-video max-h-[440px] rounded-2xl sm:rounded-3xl bg-muted/40 border border-border/50 flex items-center justify-center">
              <div className="w-10 h-10 border-4 border-brand-orange/40 border-t-brand-orange rounded-full animate-spin" />
            </div>
            <div className="card-bold p-6 border space-y-3">
              <div className="h-6 w-1/3 bg-muted/60 rounded-lg" />
              <div className="h-4 w-2/3 bg-muted/40 rounded-lg" />
            </div>
            <div className="card-bold p-6 border space-y-3">
              <div className="h-5 w-1/4 bg-muted/60 rounded-lg" />
              <div className="h-12 w-full bg-muted/30 rounded-xl" />
              <div className="h-12 w-full bg-muted/30 rounded-xl" />
            </div>
          </div>
          <div className="lg:col-span-4 space-y-6">
            <div className="card-bold p-6 border space-y-4">
              <div className="h-6 w-1/2 bg-muted/60 rounded-lg" />
              <div className="h-10 w-full bg-muted/40 rounded-xl" />
              <div className="h-10 w-full bg-muted/40 rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="pt-20 pb-20 text-center">
        <h2 className="text-2xl font-bold mb-4">الدورة غير موجودة</h2>
        <button onClick={() => navigate('courses')} className="btn-bold-primary">
          العودة للدورات
        </button>
      </div>
    );
  }

  const courseObj = course as unknown as Record<string, unknown>;
  const levels = course.levels || [];
  const activeLevel = levels.find((lvl) => lvl.id === activeLevelId) || levels[0] || null;
  const currentLessons = activeLevel ? (activeLevel.lessons || []) : (course.lessons || []);
  const totalDuration = course.lessons ? course.lessons.reduce((acc, l) => acc + l.duration, 0) : 0;
  const totalLessons = course.lessons ? course.lessons.length : 0;
  const completedCount = course.lessons ? course.lessons.filter(l => l.progress?.completed).length : 0;
  const isEnrolled = !!course.enrollment?.isActive;
  const isExpired = !!course.enrollment?.isExpired;
  const freeLesson = course.lessons ? course.lessons.find(l => l.isFree) : undefined;
  const hasIntroVideo = !!course.introVideo?.videoUrl;

  const expirationDate = course.enrollment?.expiresAt
    ? new Date(course.enrollment.expiresAt).toLocaleDateString(locale === 'ar' ? 'ar-EG' : 'de-DE', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : null;

  return (
    <div className="pt-6 pb-20">
      <div className="container-bold">
        {/* Back Navigation Bar */}
        <div className="flex items-center justify-between gap-4 mb-6">
          <button
            onClick={() => navigate('courses')}
            className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-brand-orange transition-colors group"
          >
            <BackArrow className="w-4 h-4 group-hover:translate-x-[-3px] transition-transform" />
            {t(locale, 'course_back')}
          </button>

          <div className="flex items-center gap-2">
            <span className="level-badge font-bold">{course.level}</span>
            {isEnrolled && !isExpired && (
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                مشترك بنجاح
              </span>
            )}
          </div>
        </div>

        {/* Expired Subscription Warning */}
        {isExpired && (
          <div className="mb-6 p-4 rounded-2xl bg-amber-500/10 border-2 border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center shrink-0">
                <Clock className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-foreground">انتهت صلاحية وصولك إلى هذا الكورس</h4>
                <p className="text-xs text-muted-foreground mt-0.5">
                  انتهت فترة اشتراكك في {expirationDate}. يمكنك تفعيل كود وصول جديد للمتابعة فوراً.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0 flex-wrap">
              <a
                href={`https://wa.me/4915753063510?text=${encodeURIComponent(`مرحباً أستاذ عمر، انتهت صلاحية اشتراكي في دورة "${getField(courseObj, 'title')}" وأرغب في تجديد الكود.`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 transition-all"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                تجديد الكود عبر WhatsApp
              </a>
              <button
                onClick={() => {
                  setActivationCode('');
                  setActivationError(null);
                  setActivationSuccess(null);
                  setActivationModalOpen(true);
                }}
                className="btn-bold-primary text-xs py-2 px-4 shrink-0 flex items-center gap-2"
              >
                <KeyRound className="w-3.5 h-3.5" />
                تفعيل كود جديد
              </button>
            </div>
          </div>
        )}

        {/* ============================================================
            MAIN THEATER GRID: YOUTUBE-STYLE VIDEO IN MAIN WIDE AREA
        ============================================================ */}
        <div className="grid lg:grid-cols-12 gap-8 items-start">
          {/* LEFT/MAIN WIDE COLUMN: YouTube Video Player + Course Info + Lessons */}
          <div className="lg:col-span-8 space-y-6">
            {/* 1. CINEMATIC YOUTUBE-STYLE VIDEO PLAYER */}
            <div className="w-full rounded-2xl sm:rounded-3xl overflow-hidden bg-neutral-950 border border-border/80 shadow-xl relative group">
              <div className="relative aspect-video w-full max-h-[460px]">
                {hasIntroVideo ? (
                  loadingIntro ? (
                    <div className="w-full h-full flex flex-col items-center justify-center text-white/80 bg-neutral-950">
                      <Loader2 className="w-10 h-10 animate-spin text-brand-orange mb-3" />
                      <p className="text-sm font-bold">جارٍ تجهيز الفيديو التعريفي المجاني…</p>
                      <span className="text-xs text-white/50 mt-1">يُشغّل مباشرة بدون الحاجة لكود أو اشتراك</span>
                    </div>
                  ) : introVideoUrl ? (
                    <>
                      <video
                        ref={videoPlayerRef}
                        src={resolveMediaUrl(introVideoUrl)}
                        poster={course.imageUrl ? resolveMediaUrl(course.imageUrl) : undefined}
                        controls
                        playsInline
                        preload="metadata"
                        className="w-full h-full object-contain bg-black"
                      />
                      {/* YouTube-style Live/Free Badge */}
                      <div className="absolute top-3 end-3 pointer-events-none bg-black/80 backdrop-blur-md px-3 py-1.5 rounded-xl text-xs font-black text-emerald-400 border border-emerald-500/30 flex items-center gap-2 shadow-xl">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                        فيديو تعريفي مجاني بالكامل
                      </div>
                    </>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-white/60 bg-neutral-900 p-6 text-center">
                      <Video className="w-10 h-10 mb-2 opacity-50" />
                      <p className="text-sm font-semibold">تعذر تحميل مشغل الفيديو التعريفي</p>
                    </div>
                  )
                ) : course.imageUrl ? (
                  <div className="relative w-full h-full">
                    <img
                      src={resolveMediaUrl(course.imageUrl)}
                      alt={getField(courseObj, 'title')}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent flex items-end p-6">
                      <div>
                        <span className="level-badge mb-2">{course.level}</span>
                        <h2 className="text-xl font-bold text-white">{getField(courseObj, 'title')}</h2>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-secondary text-muted-foreground text-sm">
                    لا يوجد فيديو تعريفي لهذا الكورس حالياً
                  </div>
                )}
              </div>
            </div>

            {/* 2. VIDEO METADATA & TITLE (Directly beneath the video, YouTube style) */}
            <div className="card-bold p-6 border-2 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="level-badge font-bold">{course.level}</span>
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                      🟢 فيديو تعريفي مفتوح للجميع
                    </span>
                    {freeLesson && (
                      <span className="text-xs font-bold px-2.5 py-0.5 rounded-md bg-brand-orange/10 text-brand-orange border border-brand-orange/20">
                        ⭐ يحتوي على درس كامل مجاني
                      </span>
                    )}
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-black text-foreground pt-1">
                    {getField(courseObj, 'title')}
                  </h1>
                </div>

                {/* Primary Quick Action Button */}
                <div className="flex items-center gap-2 flex-wrap">
                  {freeLesson && !isEnrolled && (
                    <button
                      onClick={() => handleLessonClick(freeLesson)}
                      className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-md hover:shadow-lg flex items-center gap-2 transition-all active:scale-95"
                    >
                      <Play className="w-4 h-4 fill-current" />
                      مشاهدة أول درس مجاني الآن
                    </button>
                  )}
                  {hasIntroVideo && (
                    <button
                      onClick={playInlineIntroVideo}
                      className="px-4 py-2.5 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground font-bold text-xs border border-border flex items-center gap-1.5 transition-all"
                    >
                      <Play className="w-3.5 h-3.5 text-brand-orange fill-current" />
                      إعادة تشغيل الفيديو
                    </button>
                  )}
                </div>
              </div>

              {/* Course Description */}
              <div>
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
                  عن هذه الدورة والمنهاج:
                </h3>
                <p className="text-muted-foreground leading-relaxed text-sm sm:text-base">
                  {getField(courseObj, 'description') || 'دورة تدريبية متخصصة ومصممة وفق الإطار الأوروبي المشترك لتعليم اللغة الألمانية مع الأستاذ عمر.'}
                </p>
              </div>
            </div>

            {/* 3. COURSE CURRICULUM & LEVELS & LESSONS */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="card-bold p-6 border-2 space-y-5"
            >
              <div className="flex items-center justify-between border-b border-border pb-4 flex-wrap gap-2">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-brand-orange/10 flex items-center justify-center text-brand-orange">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="font-display text-lg sm:text-xl font-bold text-foreground">
                      {t(locale, 'course_content')}
                    </h2>
                    <p className="text-xs text-muted-foreground">
                      {levels.length} مستويات • {totalLessons} درس • إجمالي المدة {Math.max(1, Math.round(totalDuration / 60))} ساعة
                    </p>
                  </div>
                </div>

                <span className="text-xs font-bold px-3 py-1 rounded-full bg-secondary text-foreground">
                  المستويات والدروس
                </span>
              </div>

              {/* Levels Selector Tabs */}
              {levels.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                    {levels.map((lvl) => {
                      const isActive = (activeLevel?.id === lvl.id);
                      return (
                        <button
                          key={lvl.id}
                          onClick={() => setActiveLevelId(lvl.id)}
                          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 shrink-0 flex items-center gap-2 border-2 ${
                            isActive
                              ? 'bg-gradient-to-r from-brand-orange to-brand-red text-white border-transparent shadow-md scale-102'
                              : 'bg-secondary/60 hover:bg-secondary border-border text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          <span className="font-black">{lvl.name}</span>
                          <span className={`text-[11px] px-1.5 py-0.5 rounded-md ${isActive ? 'bg-black/20 text-white' : 'bg-background text-muted-foreground'}`}>
                            {lvl.lessons?.length ?? 0} درس
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Active Level Header & Intro Video banner if available */}
                  {activeLevel && (
                    <div className="p-4 rounded-2xl bg-secondary/40 border border-border/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div>
                        <h3 className="text-sm font-bold text-foreground">
                          {getField(activeLevel as unknown as Record<string, unknown>, 'title') || `المستوى ${activeLevel.name}`}
                        </h3>
                        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                          {getField(activeLevel as unknown as Record<string, unknown>, 'description') || 'دروس وتمارين هذا المستوى التعليمي.'}
                        </p>
                      </div>

                      {activeLevel.introVideoUrl && (
                        <button
                          onClick={() => {
                            setIntroVideoUrl(activeLevel.introVideoUrl || null);
                            if (videoPlayerRef.current) {
                              videoPlayerRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
                              videoPlayerRef.current.play().catch(() => {});
                            }
                          }}
                          className="px-3 py-1.5 rounded-xl bg-brand-orange/10 hover:bg-brand-orange/20 text-brand-orange font-bold text-xs border border-brand-orange/30 flex items-center gap-1.5 shrink-0 transition-all"
                        >
                          <Play className="w-3 h-3 fill-current" />
                          فيديو مقدمة المستوى
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Lessons List for the Selected Level */}
              <div className="space-y-3 pt-1">
                {currentLessons.length === 0 ? (
                  <div className="text-center py-10 bg-secondary/20 rounded-2xl border border-dashed border-border">
                    <p className="text-xs text-muted-foreground font-semibold">
                      لا توجد دروس مضافة لهذا المستوى حالياً، سيتم نشرها قريباً.
                    </p>
                  </div>
                ) : (
                  currentLessons.map((lesson, i) => {
                    const canAccess = lesson.isFree || (isEnrolled && !isExpired);
                    return (
                      <motion.div
                        key={lesson.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.03 }}
                        onClick={() => handleLessonClick(lesson)}
                        className={`flex items-center gap-4 py-3.5 px-4 rounded-2xl cursor-pointer transition-all duration-200 border-2 ${
                          lesson.isFree
                            ? 'bg-emerald-500/5 hover:bg-emerald-500/10 border-emerald-500/30 shadow-xs'
                            : canAccess
                            ? 'bg-card hover:bg-brand-orange/5 hover:border-brand-orange/30 border-border'
                            : 'bg-secondary/40 hover:bg-secondary/70 border-border/60'
                        }`}
                      >
                        <div className="shrink-0">
                          {canAccess ? (
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-xs transition-colors ${
                              lesson.isFree 
                                ? 'bg-emerald-500 text-white' 
                                : 'bg-brand-orange text-white'
                            }`}>
                              <Play className="w-4 h-4 fill-current ms-0.5" />
                            </div>
                          ) : (
                            <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center text-muted-foreground">
                              <Lock className="w-4 h-4" />
                            </div>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-mono font-bold text-muted-foreground">
                              #{String(i + 1).padStart(2, '0')}
                            </span>
                            <p className="text-sm font-bold text-foreground truncate">
                              {getField(lesson as unknown as Record<string, unknown>, 'title')}
                            </p>
                            {lesson.isFree && (
                              <span className="text-[11px] font-black px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                الدرس المجاني المتاح للجميع
                              </span>
                            )}
                            {!lesson.isFree && !canAccess && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-secondary text-muted-foreground flex items-center gap-1">
                                <Lock className="w-3 h-3" /> يتطلب كود تفعيل
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground shrink-0 font-bold">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{lesson.duration} دقيقة</span>
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </div>
            </motion.div>
          </div>

          {/* RIGHT/SIDEBAR COLUMN: Course Specs Card & Activation CTAs */}
          <div className="lg:col-span-4 space-y-6">
            {/* Sidebar Card: Course Information & Activation */}
            <div className="card-bold p-6 space-y-5 border-2 shadow-lg">
              <h3 className="font-display text-lg font-black text-foreground border-b border-border pb-3">
                تفاصيل الاشتراك والوصول
              </h3>

              {/* Course Specs */}
              <div className="space-y-3.5 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-brand-orange/10 flex items-center justify-center text-brand-orange">
                      <BookOpen className="w-4 h-4" />
                    </div>
                    عدد الدروس
                  </span>
                  <span className="font-bold text-foreground">{totalLessons} درس</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-brand-red/10 flex items-center justify-center text-brand-red">
                      <Clock className="w-4 h-4" />
                    </div>
                    المدة الإجمالية
                  </span>
                  <span className="font-bold text-foreground">{Math.round(totalDuration / 60)} ساعة</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                      <Layers className="w-4 h-4" />
                    </div>
                    المستويات المتاحة
                  </span>
                  <span className="font-bold text-foreground">{levels.length || 1} مستويات</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500">
                      <Star className="w-4 h-4" />
                    </div>
                    المستوى الحالي
                  </span>
                  <span className="level-badge font-bold">{activeLevel?.name || course.level || 'A1'}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-500">
                      <Award className="w-4 h-4" />
                    </div>
                    طريقة الوصول
                  </span>
                  <span className="font-bold text-foreground text-xs">كود تفعيل مخصص</span>
                </div>

                {isEnrolled && !isExpired && (
                  <div className="flex items-center justify-between pt-2 border-t border-border">
                    <span className="text-muted-foreground flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-green-500/10 flex items-center justify-center text-green-500">
                        <Users className="w-4 h-4" />
                      </div>
                      دروس مكتملة
                    </span>
                    <span className="font-bold text-foreground">{completedCount} / {totalLessons}</span>
                  </div>
                )}
              </div>

              {/* Activation & CTA Buttons */}
              <div className="pt-3 space-y-3">
                {isEnrolled && !isExpired ? (
                  <button
                    onClick={() => {
                      const next = course.lessons.find(l => !l.progress?.completed) || course.lessons[0];
                      if (next) navigate('video-lesson', { courseId: courseId!, lessonId: next.id });
                    }}
                    className="btn-bold-primary w-full py-3.5 flex items-center justify-center gap-2 font-bold shadow-md"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    {completedCount > 0 ? 'متابعة المشاهدة' : 'بدء مشاهدة الدورة الآن'}
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => {
                        setActivationCode('');
                        setActivationError(null);
                        setActivationSuccess(null);
                        setActivationModalOpen(true);
                      }}
                      className="btn-bold-primary w-full py-3.5 flex items-center justify-center gap-2 font-bold shadow-md hover:shadow-brand-orange/30 transition-all"
                    >
                      <KeyRound className="w-4 h-4" />
                      تفعيل هذا الكورس بكود
                    </button>

                    <a
                      href={`https://wa.me/4915753063510?text=${encodeURIComponent(`مرحباً أستاذ عمر، أرغب في شراء كود تفعيل دورة "${getField(courseObj, 'title')}" (${course.level}) عبر المنصة.`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md flex items-center justify-center gap-2 transition-all"
                    >
                      <MessageCircle className="w-4 h-4" />
                      شراء كود التفعيل عبر WhatsApp
                    </a>
                  </>
                )}
              </div>

              {/* Guarantees Box */}
              <div className="pt-2 border-t border-border space-y-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>الفيديو التعريفي والدرس الأول متاحان مجاناً</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>تفعيل فوري لجميع الدروس والملحقات</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>حماية كاملة ودعم تواصل مباشر مع الأستاذ</span>
                </div>
              </div>
            </div>

            {/* Teacher Credibility Widget */}
            <div className="card-bold p-5 border-2 flex items-center gap-4">
              <div className="relative w-12 h-12 rounded-2xl overflow-hidden bg-brand-orange/10 border border-brand-orange/20 shrink-0">
                <img
                  src="/images/teacher/omar-hero.png"
                  alt="Omar"
                  className="w-full h-full object-cover object-top"
                />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-display font-bold text-sm text-foreground">الأستاذ عمر عبده وهاب</h4>
                <p className="text-xs text-muted-foreground truncate">خبير تحضير امتحانات Goethe & Telc في برلين</p>
                <button
                  onClick={() => navigate('about')}
                  className="text-[11px] font-bold text-brand-orange hover:underline mt-0.5 inline-block"
                >
                  عرض الملف التعريفي للمدرّس ←
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ----------------- In-Place Course Activation Modal ----------------- */}
      <AnimatePresence>
        {activationModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md bg-card rounded-3xl p-6 border-2 border-border shadow-2xl space-y-5"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-brand-orange to-brand-red flex items-center justify-center text-white shadow-md">
                    <KeyRound className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-foreground">تفعيل الدورة بالكود</h3>
                    <p className="text-xs text-muted-foreground">{getField(courseObj, 'title')}</p>
                  </div>
                </div>
                <button
                  onClick={() => setActivationModalOpen(false)}
                  className="p-1.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {activationSuccess ? (
                <div className="p-5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border-2 border-emerald-500/30 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-emerald-500 text-white flex items-center justify-center mx-auto shadow-lg">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h4 className="text-base font-black text-emerald-800 dark:text-emerald-200">
                    تم تفعيل الدورة بنجاح 🎉
                  </h4>
                  <p className="text-xs text-emerald-700 dark:text-emerald-300 leading-relaxed">
                    تم فتح جميع دروس الدورة بالكامل لمدة <strong>{activationSuccess.durationDays} يوماً</strong>.
                  </p>
                  <button
                    onClick={() => {
                      setActivationModalOpen(false);
                      const first = course.lessons[0];
                      if (first) navigate('video-lesson', { courseId: courseId!, lessonId: first.id });
                    }}
                    className="btn-bold-primary w-full py-2.5 text-xs font-bold mt-2"
                  >
                    ابدأ مشاهدة الدروس الآن
                  </button>
                </div>
              ) : (
                <form onSubmit={handleActivationSubmit} className="space-y-4">
                  <div className="p-4 rounded-2xl bg-secondary/50 border border-border text-xs text-muted-foreground leading-relaxed">
                    أدخل كود التفعيل الخاص بهذه الدورة (المرسل إليك من الأستاذ عمر) لبدء التعلم فوراً.
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-foreground block">
                      كود التفعيل
                    </label>
                    <input
                      type="text"
                      dir="ltr"
                      value={activationCode}
                      onChange={(e) => setActivationCode(e.target.value.toUpperCase())}
                      placeholder="OMAR-A1-XXXX"
                      required
                      className="w-full px-4 py-3 rounded-xl bg-background border-2 border-border focus:border-brand-orange text-foreground font-mono text-center tracking-widest text-base font-bold outline-none transition-all"
                    />
                  </div>

                  {activationError && (
                    <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-500 text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{activationError}</span>
                    </div>
                  )}

                  <div className="pt-2 space-y-2">
                    <button
                      type="submit"
                      disabled={activating || !activationCode.trim()}
                      className="btn-bold-primary w-full py-3 text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {activating ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          جارٍ التحقق من الكود…
                        </>
                      ) : (
                        'تفعيل الكورس الآن'
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => setActivationModalOpen(false)}
                      className="w-full py-2.5 text-xs text-muted-foreground hover:text-foreground font-semibold text-center"
                    >
                      إلغاء
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
