'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Clock, CheckCircle, Lock, KeyRound, ArrowRight, ArrowLeft, Trophy, Award } from 'lucide-react';
import { useAppStore } from '@/stores/app-store';
import { useAuthStore } from '@/stores/auth-store';
import { t } from '@/lib/i18n';

interface Enrollment {
  id: string;
  course: {
    id: string;
    titleAr: string; titleDe: string; titleEn: string;
    level: string;
    imageUrl?: string;
  };
  activatedAt: string;
  expiresAt: string | null;
  isActive: boolean;
  _count: { lessons: number };
  completedLessons: number;
  nextLessonId: string | null;
}

export default function StudentView() {
  const { locale, navigate } = useAppStore();
  const { token, isAuthenticated } = useAuthStore();
  const [active, setActive] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const isRtl = locale === 'ar';
  const BackArrow = isRtl ? ArrowRight : ArrowLeft;
  const certLabel = locale === 'ar' ? 'احصل على شهادتك' : locale === 'de' ? 'Dein Zertifikat ansehen' : 'Get your certificate';

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('login');
      return;
    }
    fetch('/api/courses?enrolled=true&withProgress=true', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(data => {
        const enrollments = data.enrollments || [];
        setActive(enrollments.filter((e: Enrollment) => e.isActive));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const getField = (obj: Record<string, unknown>, field: string) => {
    const localeKey = locale.charAt(0).toUpperCase() + locale.slice(1);
    return (obj[`${field}${localeKey}`] as string) || '';
  };

  const handleContinue = (enrollment: Enrollment) => {
    if (enrollment.nextLessonId) {
      navigate('video-lesson', { courseId: enrollment.course.id, lessonId: enrollment.nextLessonId });
    } else {
      navigate('course-detail', { id: enrollment.course.id });
    }
  };

  if (loading) {
    return (
      <div className="pt-8 pb-20 container-bold">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 skeleton-bold rounded-lg" />
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => <div key={i} className="h-52 skeleton-bold rounded-2xl" />)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-8 pb-20">
      <div className="container-bold">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <h1 className="font-display text-2xl sm:text-3xl font-black text-foreground">{t(locale, 'student_title')}</h1>
          <button onClick={() => navigate('activate')} className="btn-bold-primary text-xs flex items-center gap-2">
            <KeyRound className="w-3.5 h-3.5" />
            {t(locale, 'student_activate_new')}
          </button>
        </div>

        {/* Active Enrollments */}
        <section className="mb-12">
          <h2 className="font-display text-lg font-bold text-foreground mb-5 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-brand-orange" />
            {t(locale, 'student_active')}
          </h2>
          {active.length === 0 ? (
            <div className="card-bold p-8 sm:p-12 text-center">
              <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-brand-orange/10 flex items-center justify-center">
                <BookOpen className="w-8 h-8 text-brand-orange" />
              </div>
              <p className="text-muted-foreground text-lg">{t(locale, 'student_no_active')}</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {active.map((enrollment, i) => {
                const progress = enrollment._count.lessons > 0
                  ? Math.round((enrollment.completedLessons / enrollment._count.lessons) * 100)
                  : 0;
                return (
                  <motion.div
                    key={enrollment.id}
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="card-bold overflow-hidden"
                  >
                    <div className="relative h-40 overflow-hidden">
                      <img src={enrollment.course.imageUrl || '/images/berlin/brandenburg-gate.png'} alt="" className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                      <div className="absolute top-3 start-3"><span className="level-badge">{enrollment.course.level}</span></div>
                    </div>
                    <div className="p-6">
                      <h3 className="font-bold text-foreground mb-3 line-clamp-1 text-lg">{getField(enrollment.course as unknown as Record<string, unknown>, 'title')}</h3>
                      <div className="mb-4">
                        <div className="flex justify-between text-xs text-muted-foreground mb-2">
                          <span className="font-medium">{enrollment.completedLessons}/{enrollment._count.lessons}</span>
                          <span className="font-bold text-brand-orange">{progress}%</span>
                        </div>
                        <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-brand-orange to-brand-red rounded-full transition-all duration-700" style={{ width: `${progress}%` }} />
                        </div>
                      </div>
                      {progress >= 100 && (
                        <button
                          onClick={() => navigate('certificate', { courseId: enrollment.course.id })}
                          className="btn-bold-secondary text-xs w-full mb-2.5 flex items-center justify-center gap-2"
                        >
                          <Award className="w-3.5 h-3.5 text-brand-orange" />
                          {certLabel}
                        </button>
                      )}
                      <button onClick={() => handleContinue(enrollment)} className="btn-bold-primary text-xs w-full">
                        {progress > 0 ? t(locale, 'student_continue_watching') : t(locale, 'course_start_watching')}
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
