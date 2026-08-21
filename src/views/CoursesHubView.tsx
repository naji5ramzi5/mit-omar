'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, GraduationCap, Languages, Layers } from 'lucide-react';
import { useAppStore } from '@/stores/app-store';
import { t } from '@/lib/i18n';
import CoursesView from '@/views/CoursesView';
import ExamsView from '@/views/ExamsView';
import TranslationView from '@/views/TranslationView';
import FlashcardsView from '@/views/FlashcardsView';

type Tab = 'courses' | 'exams' | 'translation' | 'flashcards';

const TABS: { key: Tab; labelKey: string; icon: typeof BookOpen }[] = [
  { key: 'courses', labelKey: 'nav_courses', icon: BookOpen },
  { key: 'exams', labelKey: 'nav_exams', icon: GraduationCap },
  { key: 'translation', labelKey: 'nav_translation', icon: Languages },
  { key: 'flashcards', labelKey: 'nav_flashcards', icon: Layers },
];

export default function CoursesHubView() {
  const { locale } = useAppStore();
  const [tab, setTab] = useState<Tab>('courses');

  return (
    <div className="min-h-screen">
      {/* Sticky tab bar */}
      <div className="sticky top-16 lg:top-20 z-30 bg-background/85 backdrop-blur-xl border-b border-border/60">
        <div className="container-bold py-3">
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar" role="tablist" aria-label="تجربة التعلم">
            {TABS.map((tb) => {
              const active = tab === tb.key;
              return (
                <button
                  key={tb.key}
                  role="tab"
                  aria-selected={active}
                  onClick={() => setTab(tb.key)}
                  className={`relative flex items-center gap-2 px-4 py-2.5 text-sm font-bold rounded-full whitespace-nowrap transition-all duration-200 shrink-0 ${
                    active ? 'text-white' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {active && (
                    <motion.span
                      layoutId="hub-tab"
                      className="absolute inset-0 rounded-full bg-gradient-to-r from-brand-orange to-brand-red shadow-glow"
                      transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                    />
                  )}
                  <tb.icon className="relative z-10 w-4 h-4" />
                  <span className="relative z-10">{t(locale, tb.labelKey as any)}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="container-bold">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
        >
          {tab === 'courses' && <CoursesView />}
          {tab === 'exams' && <ExamsView />}
          {tab === 'translation' && <TranslationView />}
          {tab === 'flashcards' && <FlashcardsView />}
        </motion.div>
      </div>
    </div>
  );
}
