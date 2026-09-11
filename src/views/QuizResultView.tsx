'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2, XCircle, Trophy, ArrowRight, RotateCcw,
  Check, X, ChevronDown, ChevronUp, Clock, Award, HelpCircle
} from 'lucide-react';
import { useAppStore } from '@/stores/app-store';
import { t } from '@/lib/i18n';

export default function QuizResultView() {
  const { locale, viewParams, navigate } = useAppStore();
  const quizId = viewParams.quizId || '';

  const [resultData, setResultData] = useState<any | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    if (quizId) {
      const stored = sessionStorage.getItem(`dmo-last-result-${quizId}`);
      if (stored) {
        try {
          setResultData(JSON.parse(stored));
        } catch {}
      }
    }
  }, [quizId]);

  const score = resultData ? resultData.totalScore : parseInt(viewParams.score || '0');
  const maxScore = resultData ? resultData.maxScore : parseInt(viewParams.maxScore || viewParams.total || '1');
  const percentage = resultData ? resultData.percentage : Math.round((score / Math.max(maxScore, 1)) * 100);
  const passed = resultData ? resultData.passed : (viewParams.passed === 'true' || percentage >= 60);
  const level = resultData?.quizLevel || viewParams.level || 'A1';

  return (
    <div className="pt-8 pb-20 min-h-screen bg-background">
      <div className="container-bold max-w-2xl">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="card-bold border-2 shadow-2xl overflow-hidden"
        >
          {/* Header Banner */}
          <div className={`p-8 text-center text-white ${
            passed
              ? 'bg-gradient-to-br from-emerald-600 via-teal-600 to-emerald-700'
              : 'bg-gradient-to-br from-red-600 via-rose-600 to-red-700'
          }`}>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="w-20 h-20 mx-auto mb-4 rounded-3xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-lg"
            >
              {passed ? (
                <Trophy className="w-10 h-10 text-white" />
              ) : (
                <XCircle className="w-10 h-10 text-white" />
              )}
            </motion.div>

            <span className="text-xs font-bold px-3 py-1 rounded-full bg-white/20 backdrop-blur-md mb-2 inline-block">
              المستوى: {level}
            </span>

            <h1 className="text-3xl font-black mb-1">
              {passed ? 'تهانينا! لقد اجتزت الاختبار بنجاح' : 'لم تجتز الاختبار هذه المرة'}
            </h1>
            <p className="text-white/80 text-xs">
              {passed ? 'أحسنت صنعاً! يمكنك متابعة دروسك أو إعادة المحاولة لتحسين نتيجتك.' : 'لا تقلق، راجع الدروس والأسئلة وحاول مرة أخرى.'}
            </p>
          </div>

          {/* Score & KPI Dashboard */}
          <div className="p-6 sm:p-8 space-y-6">
            <div className="text-center">
              <span className="text-xs text-muted-foreground font-bold block mb-1">النتيجة النهائية</span>
              <div className="flex items-center justify-center gap-3">
                <span className={`text-6xl font-black ${passed ? 'text-emerald-600' : 'text-red-500'}`}>
                  {percentage}%
                </span>
              </div>
              <p className="text-sm font-bold text-foreground mt-2">
                مجموع الدرجات: <span className="font-mono text-base">{score}</span> من <span className="font-mono text-base">{maxScore}</span>
              </p>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center">
                <span className="text-2xl font-black text-emerald-600 block">
                  {resultData ? resultData.correctCount : score}
                </span>
                <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400">إجابات صحيحة</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/20 text-center">
                <span className="text-2xl font-black text-red-500 block">
                  {resultData ? resultData.incorrectCount : Math.max(0, maxScore - score)}
                </span>
                <span className="text-[11px] font-bold text-red-700 dark:text-red-400">إجابات خاطئة</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-secondary border border-border text-center">
                <span className="text-2xl font-black text-foreground block">
                  {resultData ? resultData.totalQuestions : maxScore}
                </span>
                <span className="text-[11px] font-bold text-muted-foreground">مجموع الأسئلة</span>
              </div>
            </div>

            {/* Section Breakdown if Goethe Model */}
            {resultData?.sectionScores && resultData.sectionScores.length > 0 && (
              <div className="p-4 rounded-2xl bg-secondary/30 border border-border space-y-3">
                <h3 className="text-xs font-bold text-muted-foreground">توزيع الدرجات وفق أقسام الامتحان:</h3>
                <div className="space-y-2">
                  {resultData.sectionScores.map((sec: any) => (
                    <div key={sec.sectionId || sec.sectionTitle} className="space-y-1">
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span className="text-foreground">{sec.sectionTitle}</span>
                        <span className="text-muted-foreground font-mono">
                          {sec.score} / {sec.maxScore} ({sec.percentage}%)
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden">
                        <div
                          className={`h-full ${sec.percentage >= 60 ? 'bg-emerald-500' : 'bg-brand-orange'}`}
                          style={{ width: `${sec.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Detailed Answers Accordion (Only if allowed by admin) */}
            {resultData?.showDetailedResults && resultData?.questionResults && (
              <div className="border border-border rounded-2xl overflow-hidden">
                <button
                  onClick={() => setShowDetails(!showDetails)}
                  className="w-full p-4 bg-secondary/40 hover:bg-secondary/70 flex items-center justify-between text-xs font-bold text-foreground transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <HelpCircle className="w-4 h-4 text-brand-orange" />
                    مراجعة الإجابات التفصيلية والتفسيرات التعليمية
                  </span>
                  {showDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>

                <AnimatePresence>
                  {showDetails && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="divide-y divide-border p-4 space-y-3 text-xs"
                    >
                      {resultData.questionResults.map((qr: any, idx: number) => (
                        <div key={qr.questionId || idx} className="pt-3 first:pt-0 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-foreground">السؤال #{idx + 1}</span>
                            <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                              qr.isCorrect
                                ? 'bg-emerald-500/10 text-emerald-600'
                                : 'bg-red-500/10 text-red-600'
                            }`}>
                              {qr.isCorrect ? '✓ صحيح' : '✗ غير صحيح'} ({qr.earnedPoints}/{qr.maxPoints} نقطة)
                            </span>
                          </div>

                          {qr.explanation && (
                            <p className="text-[11px] text-muted-foreground p-2 rounded-xl bg-secondary/30 italic">
                              💡 التفسير: {qr.explanation}
                            </p>
                          )}
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* Actions */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => navigate('exams')}
                className="btn-bold-primary text-xs py-3 flex items-center justify-center gap-2"
              >
                العودة للاختبارات
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => navigate('quiz', { quizId })}
                className="py-3 px-4 rounded-2xl bg-secondary hover:bg-secondary/80 font-bold text-xs text-foreground flex items-center justify-center gap-2 transition-all"
              >
                <RotateCcw className="w-4 h-4 text-brand-orange" />
                إعادة المحاولة
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
