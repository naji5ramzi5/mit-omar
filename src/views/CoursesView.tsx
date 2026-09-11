'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Clock, ChevronRight, Layers, Film, Search } from 'lucide-react';
import { useAppStore } from '@/stores/app-store';
import { t } from '@/lib/i18n';
import SectionTitle from '@/components/SectionTitle';

interface Course {
  id: string;
  titleAr: string; titleDe: string; titleEn: string;
  descriptionAr: string; descriptionDe: string; descriptionEn: string;
  level?: string;
  imageUrl?: string;
  order: number;
  _count?: { levels?: number; lessons: number };
  lessons?: { duration: number }[];
  introVideo?: { videoUrl: string | null; duration: number } | null;
}

export default function CoursesView() {
  const { locale, navigate } = useAppStore();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

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

  const filtered = courses.filter((c) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const tAr = c.titleAr?.toLowerCase() || '';
    const tDe = c.titleDe?.toLowerCase() || '';
    const tEn = c.titleEn?.toLowerCase() || '';
    const dAr = c.descriptionAr?.toLowerCase() || '';
    return tAr.includes(q) || tDe.includes(q) || tEn.includes(q) || dAr.includes(q);
  });

  const getTotalDuration = (course: Course) => {
    if (course.lessons) return course.lessons.reduce((acc, l) => acc + l.duration, 0);
    return 0;
  };

  return (
    <div className="pt-8 pb-20">
      <div className="container-bold">
        {/* Header */}
        <div className="text-center mb-8">
          <SectionTitle
            badge={t(locale, 'courses_title')}
            title={t(locale, 'courses_title')}
            subtitle={t(locale, 'courses_subtitle')}
          />
        </div>

        {/* Search Bar */}
        <div className="max-w-md mx-auto mb-10">
          <div className="relative">
            <Search className="w-4 h-4 text-muted-foreground absolute start-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث عن دورة تعليمية بالاسم أو الوصف…"
              className="w-full ps-11 pe-4 py-3 rounded-2xl bg-card border-2 border-border focus:border-brand-orange text-sm font-semibold text-foreground outline-none transition-all shadow-sm"
            />
          </div>
        </div>

        {/* Courses Grid */}
        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="card-bold overflow-hidden">
                <div className="h-48 skeleton-bold" />
                <div className="p-5 space-y-3">
                  <div className="h-4 w-20 skeleton-bold rounded-lg" />
                  <div className="h-6 w-3/4 skeleton-bold rounded-lg" />
                  <div className="h-3 w-full skeleton-bold rounded-lg" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 card-bold border-2 border-dashed max-w-lg mx-auto">
            <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-brand-orange/10 flex items-center justify-center">
              <BookOpen className="w-7 h-7 text-brand-orange" />
            </div>
            <h3 className="font-bold text-foreground text-base mb-1">
              {searchQuery ? 'لا توجد نتائج مطابقة للبحث' : t(locale, 'courses_no_courses')}
            </h3>
            <p className="text-xs text-muted-foreground">
              {searchQuery ? 'جرب البحث بكلمات أخرى' : 'سيتم إضافة الدورات قريباً'}
            </p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((course, i) => (
              <motion.div
                key={course.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: i * 0.08 }}
                className="card-bold overflow-hidden group cursor-pointer border-2 hover:border-brand-orange/50 transition-all flex flex-col justify-between"
                onClick={() => navigate('course-detail', { id: course.id })}
              >
                <div>
                  <div className="relative h-48 overflow-hidden bg-secondary">
                    <img
                      src={course.imageUrl || '/images/berlin/brandenburg-gate.png'}
                      alt=""
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-80" />

                    {/* Top Badges */}
                    <div className="absolute top-3 start-3 flex items-center gap-2">
                      <span className="px-3 py-1 rounded-xl bg-black/70 backdrop-blur-md text-white text-xs font-black border border-white/20 flex items-center gap-1.5 shadow-sm">
                        <Layers className="w-3.5 h-3.5 text-brand-orange" />
                        {course._count?.levels || 1} مستويات
                      </span>
                    </div>

                    <div className="absolute bottom-3 end-3 opacity-0 group-hover:opacity-100 transition-all duration-200 translate-y-1 group-hover:translate-y-0">
                      <div className="w-9 h-9 rounded-xl bg-white/95 backdrop-blur-sm flex items-center justify-center shadow-md">
                        <ChevronRight className="w-5 h-5 text-brand-orange rotate-180 rtl:rotate-0" />
                      </div>
                    </div>
                  </div>

                  <div className="p-5">
                    <h3 className="font-black text-foreground mb-2 text-base group-hover:text-brand-orange transition-colors line-clamp-1">
                      {getLocalizedField(course, 'title')}
                    </h3>
                    <p className="text-xs text-muted-foreground mb-4 line-clamp-2 leading-relaxed">
                      {getLocalizedField(course, 'description') || 'مسار تعليمي متكامل لتعلم اللغة الألمانية وفق المنهج الأوروبي.'}
                    </p>
                  </div>
                </div>

                <div className="px-5 pb-5 pt-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-1.5 font-bold text-foreground">
                    <div className="w-7 h-7 rounded-lg bg-brand-orange/10 flex items-center justify-center">
                      <BookOpen className="w-3.5 h-3.5 text-brand-orange" />
                    </div>
                    <span>{course._count?.lessons || 0} {t(locale, 'courses_lessons')}</span>
                  </div>

                  <div className="flex items-center gap-1.5 font-bold text-foreground">
                    <div className="w-7 h-7 rounded-lg bg-brand-red/10 flex items-center justify-center">
                      <Clock className="w-3.5 h-3.5 text-brand-red" />
                    </div>
                    <span>{Math.max(1, Math.round(getTotalDuration(course) / 60))} {t(locale, 'courses_duration')}</span>
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
