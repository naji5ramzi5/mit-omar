'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, Clock, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { useAppStore } from '@/stores/app-store';
import { useAuthStore } from '@/stores/auth-store';
import { t } from '@/lib/i18n';

interface Question {
  id: string;
  textAr: string; textDe: string; textEn: string;
  option1Ar: string; option1De: string; option1En: string;
  option2Ar: string; option2De: string; option2En: string;
  option3Ar: string; option3De: string; option3En: string;
  option4Ar: string; option4De: string; option4En: string;
  correctOption: number;
  order: number;
}

interface Quiz {
  id: string;
  level: string;
  titleAr: string; titleDe: string; titleEn: string;
  questions: Question[];
}

export default function QuizView() {
  const { locale, viewParams, navigate } = useAppStore();
  const { token } = useAuthStore();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

  const quizId = viewParams.quizId;

  useEffect(() => {
    if (!quizId) return;
    fetch(`/api/quizzes/${quizId}`)
      .then(r => r.json())
      .then(data => {
        if (data.quiz) {
          setQuiz(data.quiz);
          setTimeLeft(data.quiz.questions.length * 60);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [quizId]);

  const handleSubmit = useCallback(async () => {
    if (submitted || !quiz) return;
    setSubmitted(true);
    clearInterval(timerRef.current);
    setSubmitting(true);

    let score = 0;
    quiz.questions.forEach((q, i) => {
      if (answers[i] === q.correctOption) score++;
    });

    if (token) {
      try {
        await fetch('/api/quiz-attempts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            quizId: quiz.id,
            score,
            totalQuestions: quiz.questions.length,
            answers,
          }),
        });
      } catch {}
    }

    setSubmitting(false);
    navigate('quiz-result', {
      quizId: quiz.id,
      score: String(score),
      total: String(quiz.questions.length),
      level: quiz.level,
    });
  }, [submitted, quiz, answers, token, navigate]);

  useEffect(() => {
    if (submitted || timeLeft <= 0) return;
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [submitted, timeLeft]);

  const getField = (obj: Record<string, unknown>, field: string) => {
    const localeKey = locale.charAt(0).toUpperCase() + locale.slice(1);
    return (obj[`${field}${localeKey}`] as string) || '';
  };

  const getQuestionOptions = (q: Question) => {
    const localeKey = locale.charAt(0).toUpperCase() + locale.slice(1);
    return [
      (q as unknown as Record<string, unknown>)[`option1${localeKey}`] as string,
      (q as unknown as Record<string, unknown>)[`option2${localeKey}`] as string,
      (q as unknown as Record<string, unknown>)[`option3${localeKey}`] as string,
      (q as unknown as Record<string, unknown>)[`option4${localeKey}`] as string,
    ];
  };

  const handleAnswer = (qIndex: number, option: number) => {
    if (submitted) return;
    setAnswers(prev => ({ ...prev, [qIndex]: option }));
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const isRtl = locale === 'ar';
  const BackArrow = isRtl ? ArrowRight : ArrowLeft;
  const FwdArrow = isRtl ? ArrowLeft : ArrowRight;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-brand-orange animate-spin" />
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-muted-foreground">{t(locale, 'common_error')}</p>
      </div>
    );
  }

  const question = quiz.questions[currentQ];
  const options = question ? getQuestionOptions(question) : [];
  const totalQuestions = quiz.questions.length;
  const answeredCount = Object.keys(answers).length;
  const percentage = timeLeft > 0 ? (timeLeft / (totalQuestions * 60)) * 100 : 0;

  return (
    <div className="pt-8 pb-20 min-h-screen bg-brand-warm dark:bg-accent">
      <div className="container-bold max-w-4xl">
        {/* Header Bar */}
        <div className="flex items-center justify-between mb-6 card-bold p-4">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('exams')} className="p-2 hover:bg-secondary rounded-xl transition-all">
              <BackArrow className="w-5 h-5" />
            </button>
            <div>
              <h2 className="text-sm font-bold text-foreground">{quiz.level} — {getField(quiz as unknown as Record<string, unknown>, 'title')}</h2>
              <p className="text-xs text-muted-foreground">{currentQ + 1} {t(locale, 'exams_question_of')} {totalQuestions}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs font-semibold text-muted-foreground bg-secondary px-3 py-1.5 rounded-lg">
              {answeredCount}/{totalQuestions} {t(locale, 'exams_answered')}
            </span>
            <div className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm ${timeLeft < 60 ? 'bg-red-100 dark:bg-red-950 text-red-600 animate-pulse' : 'bg-secondary text-foreground'}`}>
              <Clock className="w-4 h-4" />
              {formatTime(timeLeft)}
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-6 h-2 bg-secondary rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-brand-orange to-brand-red rounded-full"
            animate={{ width: `${((currentQ + 1) / totalQuestions) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>

        {/* Question */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQ}
            initial={{ opacity: 0, x: isRtl ? -20 : 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: isRtl ? 20 : -20 }}
            transition={{ duration: 0.3 }}
            className="card-bold p-8 mb-6"
          >
            <div className="flex items-start gap-4 mb-8">
              <span className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-orange to-brand-red text-white flex items-center justify-center text-sm font-bold shrink-0">
                {currentQ + 1}
              </span>
              <h3 className="font-display text-lg font-bold text-foreground leading-relaxed">
                {getField(question as unknown as Record<string, unknown>, 'text')}
              </h3>
            </div>

            <div className="space-y-3">
              {options.map((option, idx) => {
                const isSelected = answers[currentQ] === idx + 1;
                return (
                  <button
                    key={idx}
                    onClick={() => handleAnswer(currentQ, idx + 1)}
                    className={`w-full text-start p-5 rounded-2xl border transition-all duration-300 flex items-center gap-4 ${
                      isSelected
                        ? 'border-brand-orange bg-brand-orange/5'
                        : 'border-border/50 hover:border-brand-orange/30 hover:bg-brand-orange/5'
                    }`}
                  >
                    <span className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold shrink-0 transition-all ${
                      isSelected
                        ? 'bg-gradient-to-br from-brand-orange to-brand-red text-white'
                        : 'bg-secondary text-muted-foreground'
                    }`}>
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <span className={`text-sm font-semibold ${isSelected ? 'text-brand-orange' : 'text-foreground'}`}>
                      {option}
                    </span>
                  </button>
                );
              })}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setCurrentQ(p => Math.max(0, p - 1))}
            disabled={currentQ === 0}
            className="flex items-center gap-2 px-5 py-3 text-sm font-bold rounded-xl border hover:bg-secondary disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            <BackArrow className="w-4 h-4" />
            {t(locale, 'exams_prev')}
          </button>

          <div className="flex items-center gap-2">
            {quiz.questions.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentQ(i)}
                className={`w-3 h-3 rounded-full transition-all ${
                  i === currentQ
                    ? 'bg-brand-orange scale-125'
                    : answers[i]
                    ? 'bg-green-500'
                    : 'bg-secondary'
                }`}
              />
            ))}
          </div>

          {currentQ === totalQuestions - 1 ? (
            <button
              onClick={handleSubmit}
              disabled={submitting || answeredCount === 0}
              className="flex items-center gap-2 px-6 py-3 text-sm font-bold rounded-xl bg-gradient-to-r from-brand-orange to-brand-red text-white disabled:opacity-50 transition-all"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              {t(locale, 'exams_submit')}
            </button>
          ) : (
            <button
              onClick={() => setCurrentQ(p => Math.min(totalQuestions - 1, p + 1))}
              className="flex items-center gap-2 px-5 py-3 text-sm font-bold rounded-xl bg-gradient-to-r from-brand-orange to-brand-red text-white transition-all"
            >
              {t(locale, 'exams_next')}
              <FwdArrow className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
