'use client';

import { motion } from 'framer-motion';
import { CheckCircle2, XCircle, Trophy, ArrowUpRight, RotateCcw } from 'lucide-react';
import { useAppStore } from '@/stores/app-store';
import { t } from '@/lib/i18n';

export default function QuizResultView() {
  const { locale, viewParams, navigate } = useAppStore();

  const score = parseInt(viewParams.score || '0');
  const total = parseInt(viewParams.total || '1');
  const level = viewParams.level || '';
  const percentage = Math.round((score / total) * 100);
  const passed = percentage >= 50;

  return (
    <div className="pt-8 pb-20 min-h-screen bg-brand-warm dark:bg-accent">
      <div className="container-bold max-w-lg">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="card-bold overflow-hidden"
        >
          {/* Header */}
          <div className={`p-8 text-center ${passed ? 'bg-gradient-to-br from-green-500 to-emerald-600' : 'bg-gradient-to-br from-red-500 to-rose-600'}`}>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="w-24 h-24 mx-auto mb-4 rounded-full bg-white/20 flex items-center justify-center"
            >
              {passed ? (
                <Trophy className="w-12 h-12 text-white" />
              ) : (
                <XCircle className="w-12 h-12 text-white" />
              )}
            </motion.div>
            <h1 className="font-display text-3xl font-black text-white mb-2">
              {passed ? t(locale, 'exams_passed') : t(locale, 'exams_failed')}
            </h1>
            <p className="text-white/80 text-sm">{t(locale, 'exams_pass_rate')}</p>
          </div>

          {/* Score */}
          <div className="p-8">
            <div className="text-center mb-8">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.4, type: 'spring', stiffness: 200 }}
                className="inline-flex items-center gap-3"
              >
                <span className="font-display text-6xl font-black text-gradient">{percentage}%</span>
              </motion.div>
              <p className="text-muted-foreground mt-2">{t(locale, 'exams_score')}: {score}/{total}</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="text-center p-4 bg-secondary/50 rounded-2xl">
                <p className="font-display text-2xl font-black text-green-500">{score}</p>
                <p className="text-xs font-semibold text-muted-foreground">{t(locale, 'exams_correct')}</p>
              </div>
              <div className="text-center p-4 bg-secondary/50 rounded-2xl">
                <p className="font-display text-2xl font-black text-red-500">{total - score}</p>
                <p className="text-xs font-semibold text-muted-foreground">{t(locale, 'exams_incorrect')}</p>
              </div>
              <div className="text-center p-4 bg-secondary/50 rounded-2xl">
                <p className="font-display text-2xl font-black text-foreground">{level}</p>
                <p className="text-xs font-semibold text-muted-foreground">Level</p>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-3">
              <button
                onClick={() => navigate('exams')}
                className="w-full flex items-center justify-center gap-2 px-6 py-3.5 text-sm font-bold rounded-xl bg-gradient-to-r from-brand-orange to-brand-red text-white transition-all"
              >
                {t(locale, 'exams_back_to_exams')}
                <ArrowUpRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => navigate('exams')}
                className="w-full flex items-center justify-center gap-2 px-6 py-3.5 text-sm font-bold rounded-xl border hover:bg-secondary transition-all"
              >
                <RotateCcw className="w-4 h-4" />
                {t(locale, 'exams_try_again')}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
