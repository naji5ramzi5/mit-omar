'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Clock, Users, CheckCircle2 } from 'lucide-react';
import { useAppStore } from '@/stores/app-store';
import { t } from '@/lib/i18n';
import SectionTitle from '@/components/SectionTitle';

interface Quiz {
  id: string;
  level: string;
  titleAr: string; titleDe: string; titleEn: string;
  descriptionAr?: string; descriptionDe?: string; descriptionEn?: string;
  _count: { questions: number; attempts: number };
}

const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1'];
const LEVEL_COLORS: Record<string, string> = {
  A1: 'from-emerald-500 to-teal-500',
  A2: 'from-blue-500 to-cyan-500',
  B1: 'from-brand-orange to-amber-500',
  B2: 'from-brand-red to-rose-500',
  C1: 'from-purple-500 to-violet-500',
};

export default function ExamsView() {
  const { locale, navigate } = useAppStore();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/quizzes')
      .then(r => r.json())
      .then(data => { if (data.quizzes) setQuizzes(data.quizzes); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const getField = (obj: Record<string, unknown>, field: string) => {
    const localeKey = locale.charAt(0).toUpperCase() + locale.slice(1);
    return (obj[`${field}${localeKey}`] as string) || '';
  };

  const filtered = selectedLevel ? quizzes.filter(q => q.level === selectedLevel) : quizzes;

  return (
    <div className="pt-8 pb-20 min-h-screen">
      <div className="container-bold">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
          <SectionTitle badge={t(locale, 'exams_title')} title={t(locale, 'exams_title')} subtitle={t(locale, 'exams_subtitle')} />
        </motion.div>

        {/* Level Filter */}
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          <button
            onClick={() => setSelectedLevel(null)}
            className={`px-5 py-2 text-xs font-bold rounded-lg transition-all duration-200 ${
              !selectedLevel
                ? 'bg-gradient-to-r from-brand-orange to-brand-red text-white'
                : 'bg-secondary text-muted-foreground hover:text-foreground'
            }`}
          >
            {t(locale, 'exams_select_level')}
          </button>
          {LEVELS.map(level => (
            <button
              key={level}
              onClick={() => setSelectedLevel(level)}
              className={`px-5 py-2 text-xs font-bold rounded-lg transition-all duration-200 ${
                selectedLevel === level
                  ? 'bg-gradient-to-r from-brand-orange to-brand-red text-white'
                  : 'bg-secondary text-muted-foreground hover:text-foreground'
              }`}
            >
              {level}
            </button>
          ))}
        </div>

        {/* Quiz Cards */}
        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => <div key={i} className="h-44 skeleton-bold rounded-2xl" />)}
          </div>
        ) : filtered.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((quiz, i) => (
              <motion.div
                key={quiz.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                className="group relative card-bold border overflow-hidden hover:border-brand-orange/20 hover:shadow-card-hover transition-all duration-300 cursor-pointer"
                onClick={() => navigate('quiz', { quizId: quiz.id })}
              >
                <div className={`absolute top-0 inset-x-0 h-1 bg-gradient-to-r ${LEVEL_COLORS[quiz.level] || 'from-brand-orange to-brand-red'}`} />
                <div className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <span className={`text-4xl font-black bg-gradient-to-br ${LEVEL_COLORS[quiz.level] || 'from-brand-orange to-brand-red'} bg-clip-text text-transparent opacity-15`}>
                      {quiz.level}
                    </span>
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${LEVEL_COLORS[quiz.level] || 'from-brand-orange to-brand-red'} flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform`}>
                      <CheckCircle2 className="w-5 h-5 text-white" />
                    </div>
                  </div>
                  <h3 className="font-bold text-foreground mb-1 text-sm">{getField(quiz as unknown as Record<string, unknown>, 'title')}</h3>
                  <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{getField(quiz as unknown as Record<string, unknown>, 'description')}</p>
                  <div className="flex items-center gap-3 text-[10px] font-semibold text-muted-foreground">
                    <span className="flex items-center gap-1"><BookOpen className="w-3 h-3" />{quiz._count.questions} {t(locale, 'exams_questions')}</span>
                    <span className="flex items-center gap-1"><Users className="w-3 h-3" />{quiz._count.attempts}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-14">
            <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-brand-orange/10 flex items-center justify-center">
              <BookOpen className="w-8 h-8 text-brand-orange" />
            </div>
            <p className="text-muted-foreground text-sm">{t(locale, 'admin_no_data')}</p>
          </div>
        )}
      </div>
    </div>
  );
}
