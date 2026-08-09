'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, BookOpen, Clock, Lock, CheckCircle, Play, ChevronDown, ChevronUp, ArrowLeft, Users, Star } from 'lucide-react';
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
  progress?: { completed: boolean };
}

interface Course {
  id: string;
  titleAr: string; titleDe: string; titleEn: string;
  descriptionAr: string; descriptionDe: string; descriptionEn: string;
  level: string;
  imageUrl?: string;
  lessons: Lesson[];
  enrollment?: { isActive: boolean; expiresAt: string | null };
}

export default function CourseDetailView() {
  const { locale, navigate, viewParams } = useAppStore();
  const { isAuthenticated, token } = useAuthStore();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  const courseId = viewParams.id;
  const isRtl = locale === 'ar';
  const BackArrow = isRtl ? ArrowRight : ArrowLeft;

  useEffect(() => {
    if (!courseId) return;
    const params = new URLSearchParams();
    params.set('includeLessons', 'true');
    if (isAuthenticated()) params.set('withProgress', 'true');
    fetch(`/api/courses/${courseId}?${params}`)
      .then(r => r.json())
      .then(data => {
        setCourse(data.course || null);
        if (data.course?.lessons) {
          setExpandedSections({ content: true });
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [courseId, isAuthenticated]);

  const getField = (obj: Record<string, unknown> | null, field: string) => {
    if (!obj) return '';
    const localeKey = locale.charAt(0).toUpperCase() + locale.slice(1);
    return (obj[`${field}${localeKey}`] as string) || '';
  };

  const toggleSection = (key: string) => {
    setExpandedSections(p => ({ ...p, [key]: !p[key] }));
  };

  const isEnrolled = !!course?.enrollment?.isActive;
  const completedCount = course?.lessons?.filter(l => l.progress?.completed).length || 0;
  const totalLessons = course?.lessons?.length || 0;
  const totalDuration = course?.lessons?.reduce((a, l) => a + l.duration, 0) || 0;

  const handleLessonClick = (lesson: Lesson) => {
    if (lesson.isFree || isEnrolled) {
      navigate('video-lesson', { courseId: courseId!, lessonId: lesson.id });
    }
  };

  if (loading) {
    return (
      <div className="pt-8 pb-20 container-bold">
        <div className="animate-pulse space-y-6">
          <div className="h-6 w-40 skeleton-bold rounded-lg" />
          <div className="h-72 skeleton-bold rounded-3xl" />
          <div className="h-8 w-1/2 skeleton-bold rounded-lg" />
          <div className="h-4 w-full skeleton-bold rounded-lg" />
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="pt-20 pb-20 container-bold text-center text-muted-foreground">
        <p>{t(locale, 'common_no_results')}</p>
      </div>
    );
  }

  const courseObj = course as unknown as Record<string, unknown>;

  return (
    <div className="pt-8 pb-20">
      <div className="container-bold">
        {/* Back Button */}
        <button
          onClick={() => navigate('courses')}
          className="flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-brand-orange transition-colors mb-8 group"
        >
          <BackArrow className="w-4 h-4 group-hover:translate-x-[-4px] transition-transform" />
          {t(locale, 'course_back')}
        </button>

        {/* Hero */}
        <div className="grid lg:grid-cols-5 gap-8 mb-12">
          <div className="lg:col-span-3">
            <span className="level-badge mb-4 block w-fit">{course.level}</span>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-foreground mb-4">
              {getField(courseObj, 'title')}
            </h1>
            <p className="text-muted-foreground leading-relaxed text-lg">
              {getField(courseObj, 'description')}
            </p>
          </div>
          <div className="lg:col-span-2">
            <div className="card-bold p-7 space-y-5 border-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-brand-orange/10 flex items-center justify-center">
                    <BookOpen className="w-4 h-4 text-brand-orange" />
                  </div>
                  {t(locale, 'course_lessons_count')}
                </span>
                <span className="font-bold text-foreground">{totalLessons} {t(locale, 'courses_lessons')}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-brand-red/10 flex items-center justify-center">
                    <Clock className="w-4 h-4 text-brand-red" />
                  </div>
                  {t(locale, 'course_total_duration')}
                </span>
                <span className="font-bold text-foreground">{Math.round(totalDuration / 60)} {t(locale, 'courses_duration')}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                    <Star className="w-4 h-4 text-blue-500" />
                  </div>
                  {t(locale, 'course_level')}
                </span>
                <span className="level-badge">{course.level}</span>
              </div>
              {isEnrolled && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center">
                      <Users className="w-4 h-4 text-green-500" />
                    </div>
                    Progress
                  </span>
                  <span className="font-bold text-foreground">{completedCount}/{totalLessons}</span>
                </div>
              )}
              <div className="pt-2">
                {isEnrolled ? (
                  <button
                    onClick={() => {
                      const next = course.lessons.find(l => !l.progress?.completed) || course.lessons[0];
                      if (next) navigate('video-lesson', { courseId: courseId!, lessonId: next.id });
                    }}
                    className="btn-bold-primary w-full"
                  >
                    {completedCount > 0 ? t(locale, 'course_continue') : t(locale, 'course_start_watching')}
                  </button>
                ) : (
                  <button
                    onClick={() => navigate('activate')}
                    className="btn-bold-primary w-full"
                  >
                    {t(locale, 'course_activate')}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Course Content */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-12"
        >
          <button
            onClick={() => toggleSection('content')}
            className="flex items-center justify-between w-full py-5 border-b-2 border-border group"
          >
            <h2 className="text-lg font-bold text-foreground">{t(locale, 'course_content')}</h2>
            {expandedSections.content ? (
              <ChevronUp className="w-5 h-5 text-brand-orange" />
            ) : (
              <ChevronDown className="w-5 h-5 text-muted-foreground group-hover:text-brand-orange transition-colors" />
            )}
          </button>

          {expandedSections.content && (
            <div className="py-3">
              {course.lessons.map((lesson, i) => {
                const canAccess = lesson.isFree || isEnrolled;
                return (
                  <motion.div
                    key={lesson.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.05 }}
                    onClick={() => canAccess && handleLessonClick(lesson)}
                    className={`flex items-center gap-4 py-4 px-5 rounded-2xl cursor-pointer transition-all duration-300 ${
                      canAccess ? 'hover:bg-brand-orange/5 hover:border-brand-orange/20 border-2 border-transparent' : 'opacity-70'
                    }`}
                  >
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-all duration-300 ${
                      lesson.progress?.completed
                        ? 'bg-green-100 text-green-600'
                        : canAccess
                        ? 'bg-gradient-to-br from-brand-orange/10 to-brand-red/10 text-brand-orange group-hover:from-brand-orange group-hover:to-brand-red group-hover:text-white'
                        : 'bg-muted text-muted-foreground'
                    }`}>
                      {lesson.progress?.completed ? (
                        <CheckCircle className="w-5 h-5" />
                      ) : canAccess ? (
                        <Play className="w-5 h-5" />
                      ) : (
                        <Lock className="w-4 h-4" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">
                        {getField(lesson as unknown as Record<string, unknown>, 'title')}
                      </p>
                      {lesson.isFree && (
                        <span className="text-xs font-bold text-brand-orange">{t(locale, 'course_free')}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground shrink-0">
                      <Clock className="w-4 h-4" />
                      <span className="font-medium">{lesson.duration} {t(locale, 'common_min')}</span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
