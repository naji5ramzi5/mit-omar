'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Clock, ChevronRight, Filter } from 'lucide-react';
import { useAppStore } from '@/stores/app-store';
import { t } from '@/lib/i18n';
import SectionTitle from '@/components/SectionTitle';

const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1'];

interface Course {
  id: string;
  titleAr: string; titleDe: string; titleEn: string;
  descriptionAr: string; descriptionDe: string; descriptionEn: string;
  level: string;
  imageUrl?: string;
  order: number;
  _count?: { lessons: number };
  lessons?: { duration: number }[];
}

export default function CoursesView() {
  const { locale, navigate } = useAppStore();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeLevel, setActiveLevel] = useState<string>('all');

  useEffect(() => {
    fetch('/api/courses?includeLessons=true')
      .then(r => r.json())
      .then(data => {
        setCourses(data.courses || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const getLocalizedField = (course: Course, field: string) => {
    const localeKey = locale.charAt(0).toUpperCase() + locale.slice(1);
    return (course as unknown as Record<string, unknown>)[`${field}${localeKey}`] as string || '';
  };

  const filtered = activeLevel === 'all' ? courses : courses.filter(c => c.level === activeLevel);

  const getTotalDuration = (course: Course) => {
    if (course.lessons) return course.lessons.reduce((acc, l) => acc + l.duration, 0);
    return 0;
  };

  return (
    <div className="pt-8 pb-20">
      <div className="container-bold">
        {/* Header */}
        <div className="text-center mb-10">
          <SectionTitle badge={t(locale, 'courses_title')} title={t(locale, 'courses_title')} subtitle={t(locale, 'courses_subtitle')} />
        </div>

        {/* Level Filters */}
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          <button
            onClick={() => setActiveLevel('all')}
            className={`px-5 py-2 text-xs font-bold rounded-lg transition-all duration-200 ${
              activeLevel === 'all'
                ? 'bg-gradient-to-r from-brand-orange to-brand-red text-white'
                : 'bg-white dark:bg-card border border-border text-muted-foreground hover:text-foreground hover:border-brand-orange/20'
            }`}
          >
            {t(locale, 'courses_level_all')}
          </button>
          {LEVELS.map(level => (
            <button
              key={level}
              onClick={() => setActiveLevel(level)}
              className={`px-5 py-2 text-xs font-bold rounded-lg transition-all duration-200 ${
                activeLevel === level
                  ? 'bg-gradient-to-r from-brand-orange to-brand-red text-white'
                  : 'bg-white dark:bg-card border border-border text-muted-foreground hover:text-foreground hover:border-brand-orange/20'
              }`}
            >
              {level}
            </button>
          ))}
        </div>

        {/* Courses Grid */}
        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="card-bold overflow-hidden">
                <div className="h-44 skeleton-bold" />
                <div className="p-5 space-y-3">
                  <div className="h-3 w-16 skeleton-bold rounded-lg" />
                  <div className="h-5 w-3/4 skeleton-bold rounded-lg" />
                  <div className="h-3 w-full skeleton-bold rounded-lg" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-14 h-14 mx-auto mb-3 rounded-xl bg-brand-orange/10 flex items-center justify-center">
              <Filter className="w-7 h-7 text-brand-orange" />
            </div>
            <p className="text-muted-foreground text-sm">{t(locale, 'courses_no_courses')}</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((course, i) => (
              <motion.div
                key={course.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
                className="card-bold overflow-hidden group cursor-pointer"
                onClick={() => navigate('course-detail', { id: course.id })}
              >
                <div className="relative h-44 overflow-hidden">
                  <img
                    src={course.imageUrl || '/images/berlin/brandenburg-gate.png'}
                    alt=""
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                  <div className="absolute top-2.5 start-2.5">
                    <span className="level-badge text-[9px]">{course.level}</span>
                  </div>
                  <div className="absolute bottom-2.5 end-2.5 opacity-0 group-hover:opacity-100 transition-all duration-200 translate-y-1.5 group-hover:translate-y-0">
                    <div className="w-8 h-8 rounded-lg bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-sm">
                      <ChevronRight className="w-4 h-4 text-brand-orange" />
                    </div>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-foreground mb-1 line-clamp-1 text-sm">
                    {getLocalizedField(course, 'title')}
                  </h3>
                  <p className="text-xs text-muted-foreground mb-4 line-clamp-2 leading-relaxed">
                    {getLocalizedField(course, 'description')}
                  </p>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <div className="w-7 h-7 rounded-lg bg-brand-orange/10 flex items-center justify-center">
                        <BookOpen className="w-3.5 h-3.5 text-brand-orange" />
                      </div>
                      <span className="font-medium">{course._count?.lessons || 0} {t(locale, 'courses_lessons')}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-7 h-7 rounded-lg bg-brand-red/10 flex items-center justify-center">
                        <Clock className="w-3.5 h-3.5 text-brand-red" />
                      </div>
                      <span className="font-medium">{Math.round(getTotalDuration(course) / 60)} {t(locale, 'courses_duration')}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
