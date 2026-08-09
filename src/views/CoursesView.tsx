'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Clock, ChevronRight, Filter } from 'lucide-react';
import { useAppStore } from '@/stores/app-store';
import { t } from '@/lib/i18n';

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
    return (course as Record<string, unknown>)[`${field}${localeKey}`] as string || '';
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
        <div className="text-center mb-12">
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl sm:text-4xl font-black text-foreground mb-3"
          >
            {t(locale, 'courses_title')}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-muted-foreground text-lg"
          >
            {t(locale, 'courses_subtitle')}
          </motion.p>
        </div>

        {/* Level Filters */}
        <div className="flex flex-wrap justify-center gap-2.5 mb-12">
          <button
            onClick={() => setActiveLevel('all')}
            className={`px-6 py-2.5 text-sm font-bold rounded-xl transition-all duration-300 ${
              activeLevel === 'all'
                ? 'bg-gradient-to-r from-brand-orange to-brand-red text-white shadow-glow'
                : 'bg-white dark:bg-card border-2 border-border text-muted-foreground hover:text-foreground hover:border-brand-orange/30 hover:shadow-card'
            }`}
          >
            {t(locale, 'courses_level_all')}
          </button>
          {LEVELS.map(level => (
            <button
              key={level}
              onClick={() => setActiveLevel(level)}
              className={`px-6 py-2.5 text-sm font-bold rounded-xl transition-all duration-300 ${
                activeLevel === level
                  ? 'bg-gradient-to-r from-brand-orange to-brand-red text-white shadow-glow'
                  : 'bg-white dark:bg-card border-2 border-border text-muted-foreground hover:text-foreground hover:border-brand-orange/30 hover:shadow-card'
              }`}
            >
              {level}
            </button>
          ))}
        </div>

        {/* Courses Grid */}
        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="card-bold overflow-hidden">
                <div className="h-52 skeleton-bold" />
                <div className="p-6 space-y-4">
                  <div className="h-4 w-20 skeleton-bold rounded-lg" />
                  <div className="h-6 w-3/4 skeleton-bold rounded-lg" />
                  <div className="h-4 w-full skeleton-bold rounded-lg" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-brand-orange/10 flex items-center justify-center">
              <Filter className="w-8 h-8 text-brand-orange" />
            </div>
            <p className="text-muted-foreground text-lg">{t(locale, 'courses_no_courses')}</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((course, i) => (
              <motion.div
                key={course.id}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="card-bold overflow-hidden group cursor-pointer"
                onClick={() => navigate('course-detail', { id: course.id })}
              >
                <div className="relative h-52 overflow-hidden">
                  <img
                    src={course.imageUrl || '/images/berlin/brandenburg-gate.png'}
                    alt=""
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="absolute top-3 start-3">
                    <span className="level-badge">{course.level}</span>
                  </div>
                  <div className="absolute bottom-3 end-3 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
                    <div className="w-10 h-10 rounded-xl bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-lg">
                      <ChevronRight className="w-5 h-5 text-brand-orange" />
                    </div>
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="font-bold text-foreground mb-2 line-clamp-1 text-lg">
                    {getLocalizedField(course, 'title')}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-5 line-clamp-2 leading-relaxed">
                    {getLocalizedField(course, 'description')}
                  </p>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-brand-orange/10 flex items-center justify-center">
                        <BookOpen className="w-4 h-4 text-brand-orange" />
                      </div>
                      <span className="font-medium">{course._count?.lessons || 0} {t(locale, 'courses_lessons')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-brand-red/10 flex items-center justify-center">
                        <Clock className="w-4 h-4 text-brand-red" />
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
