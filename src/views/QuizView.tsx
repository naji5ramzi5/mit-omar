'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, ArrowRight, Clock, CheckCircle2, XCircle, Loader2,
  Volume2, HelpCircle, AlertCircle, Check, ChevronLeft, ChevronRight,
  ShieldAlert, RefreshCw, Send, Layers
} from 'lucide-react';
import { useAppStore } from '@/stores/app-store';
import { useAuthStore } from '@/stores/auth-store';
import { t } from '@/lib/i18n';
import { resolveMediaUrl } from '@/lib/media';
import { QuestionType, StudentAnswer } from '@/lib/quiz-engine';

export default function QuizView() {
  const { locale, viewParams, navigate } = useAppStore();
  const { token, isAuthenticated } = useAuthStore();
  const [quiz, setQuiz] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, StudentAnswer>>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [startedAt, setStartedAt] = useState<string>('');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitConfirmOpen, setSubmitConfirmOpen] = useState(false);
  const [autosavedTime, setAutosavedTime] = useState<string | null>(null);

  const timerRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  const quizId = viewParams.quizId;
  const isRtl = locale === 'ar';
  const BackArrow = isRtl ? ArrowRight : ArrowLeft;
  const FwdArrow = isRtl ? ArrowLeft : ArrowRight;

  // 1. Fetch Quiz Data and Restore Draft
  useEffect(() => {
    if (!quizId) return;

    fetch(`/api/quizzes/${quizId}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then(r => r.json())
      .then(data => {
        if (data.quiz) {
          setQuiz(data.quiz);
          const durationSecs = (data.quiz.durationMinutes || 30) * 60;
          setTimeLeft(durationSecs);
          setStartedAt(new Date().toISOString());

          // Try restoring from localStorage first
          const localDraft = localStorage.getItem(`dmo-exam-draft-${quizId}`);
          if (localDraft) {
            try {
              const parsed = JSON.parse(localDraft);
              if (parsed.answers) setAnswers(parsed.answers);
              if (parsed.currentIdx !== undefined) setCurrentIdx(parsed.currentIdx);
              if (parsed.timeLeft && parsed.timeLeft > 0) setTimeLeft(parsed.timeLeft);
            } catch {}
          }
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [quizId, token]);

  // 2. Submit Handler
  const handleSubmit = useCallback(async () => {
    if (submitted || !quiz) return;
    setSubmitted(true);
    clearInterval(timerRef.current);
    setSubmitting(true);
    setSubmitConfirmOpen(false);

    // Clear local draft upon submit
    localStorage.removeItem(`dmo-exam-draft-${quiz.id}`);

    const durationSeconds = (quiz.durationMinutes * 60) - timeLeft;

    try {
      const res = await fetch('/api/quiz-attempts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          quizId: quiz.id,
          answers,
          startedAt,
          durationSeconds: Math.max(durationSeconds, 1),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'فشل في تسليم الاختبار');

      // Store evaluation in sessionStorage for result view
      sessionStorage.setItem(`dmo-last-result-${quiz.id}`, JSON.stringify({
        ...data,
        quizTitle: quiz.titleAr,
        quizLevel: quiz.level,
      }));

      navigate('quiz-result', {
        quizId: quiz.id,
        score: String(data.totalScore),
        maxScore: String(data.maxScore),
        percentage: String(data.percentage),
        passed: String(data.passed),
        level: quiz.level,
      });
    } catch (err: any) {
      console.error('Quiz submit failed:', err);
      alert(err.message || 'حدث خطأ أثناء إرسال الإجابات، يرجى المحاولة مرة أخرى.');
      setSubmitted(false);
    } finally {
      setSubmitting(false);
    }
  }, [submitted, quiz, answers, timeLeft, startedAt, token, navigate]);

  // 3. Countdown Timer & Auto-Submit on Zero
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
  }, [submitted, timeLeft, handleSubmit]);

  // 4. Autosave to LocalStorage and Remote Server
  useEffect(() => {
    if (!quiz || submitted) return;

    // Save to local storage immediately
    localStorage.setItem(`dmo-exam-draft-${quiz.id}`, JSON.stringify({
      answers,
      currentIdx,
      timeLeft,
      savedAt: new Date().toISOString(),
    }));

    // Debounced remote backup every 10 seconds if authenticated
    const timer = setTimeout(() => {
      if (token) {
        fetch('/api/quiz-attempts/autosave', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            quizId: quiz.id,
            answers,
            timeRemainingSeconds: timeLeft,
          }),
        })
          .then(r => r.json())
          .then(data => {
            if (data.success) {
              setAutosavedTime(new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }));
            }
          })
          .catch(() => {});
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [answers, currentIdx, timeLeft, quiz, submitted, token]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="w-10 h-10 text-brand-orange animate-spin" />
        <p className="text-sm font-bold text-muted-foreground">جارٍ تجهيز الاختبار…</p>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="pt-20 pb-20 text-center container-bold">
        <h2 className="text-2xl font-bold mb-4">الاختبار غير موجود</h2>
        <button onClick={() => navigate('exams')} className="btn-bold-primary">
          العودة للاختبارات
        </button>
      </div>
    );
  }

  // Check attempt limit
  if (quiz.canAttempt === false) {
    return (
      <div className="pt-20 pb-20 text-center container-bold max-w-lg mx-auto">
        <div className="w-16 h-16 rounded-3xl bg-amber-500/10 text-amber-500 mx-auto flex items-center justify-center mb-4">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-black mb-2">استنفدت عدد المحاولات</h2>
        <p className="text-sm text-muted-foreground mb-6">
          لقد استنفدت الحد الأقصى للمحاولات المسموح بها لهذا الاختبار ({quiz.allowedAttempts} محاولة).
        </p>
        <button onClick={() => navigate('exams')} className="btn-bold-primary">
          العودة لقائمة الاختبارات
        </button>
      </div>
    );
  }

  const questions = quiz.questions || [];
  const currentQuestion = questions[currentIdx];
  const qId = currentQuestion?.id;
  const currentAnswer = answers[qId] || {};

  const handleSelectOption = (optId: string) => {
    setAnswers(prev => ({
      ...prev,
      [qId]: { ...prev[qId], questionId: qId, selectedOption: optId },
    }));
  };

  const handleToggleMultipleOption = (optId: string) => {
    const existing = currentAnswer.selectedOptions || [];
    const next = existing.includes(optId)
      ? existing.filter((id: string) => id !== optId)
      : [...existing, optId];
    setAnswers(prev => ({
      ...prev,
      [qId]: { ...prev[qId], questionId: qId, selectedOptions: next },
    }));
  };

  const handleTextChange = (text: string) => {
    setAnswers(prev => ({
      ...prev,
      [qId]: { ...prev[qId], questionId: qId, textValue: text },
    }));
  };

  const answeredCount = Object.keys(answers).length;
  const progressPercent = questions.length > 0 ? Math.round(((currentIdx + 1) / questions.length) * 100) : 0;

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <div className="pt-6 pb-20 min-h-screen bg-background">
      <div className="container-bold max-w-4xl">
        {/* Exam Navigation Header */}
        <div className="flex items-center justify-between gap-4 mb-6 pb-4 border-b border-border">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                if (confirm('هل أنت متأكد من مغادرة الاختبار؟ سيتم حفظ تقدمك التلقائي.')) {
                  navigate('exams');
                }
              }}
              className="p-2 rounded-xl hover:bg-secondary text-muted-foreground transition-colors"
              title="مغادرة الاختبار"
            >
              <BackArrow className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="level-badge font-bold">{quiz.level}</span>
                <h1 className="text-lg sm:text-xl font-black text-foreground truncate">{quiz.titleAr}</h1>
              </div>
              <p className="text-xs text-muted-foreground">
                السؤال {currentIdx + 1} من {questions.length} • تم الإجابة على {answeredCount}
              </p>
            </div>
          </div>

          {/* Timer & Autosave Status */}
          <div className="flex items-center gap-3 shrink-0">
            {autosavedTime && (
              <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-emerald-600 font-bold bg-emerald-500/10 px-2.5 py-1 rounded-full">
                <Check className="w-3 h-3" /> تم الحفظ تلقائياً
              </span>
            )}

            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-2xl font-mono font-bold text-sm border-2 ${
              timeLeft < 300
                ? 'border-red-500 bg-red-500/10 text-red-600 animate-pulse'
                : 'border-brand-orange/30 bg-brand-orange/5 text-brand-orange'
            }`}>
              <Clock className="w-4 h-4" />
              <span>{formatTime(timeLeft)}</span>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-2 bg-secondary rounded-full overflow-hidden mb-6">
          <div
            className="h-full bg-gradient-to-r from-brand-orange to-brand-red transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Question Container Card */}
        {currentQuestion ? (
          <div className="card-bold p-6 sm:p-8 border-2 shadow-lg space-y-6">
            {/* Question Meta Header */}
            <div className="flex items-center justify-between gap-2 border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold px-3 py-1 rounded-xl bg-secondary text-foreground">
                  {currentQuestion.sectionName || 'القسم'}
                </span>
                <span className="text-xs font-bold px-2.5 py-1 rounded-xl bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                  {currentQuestion.points} نقطة
                </span>
              </div>

              {/* Instructions banner per type */}
              {currentQuestion.type === 'multiple_choice' ? (
                <span className="text-xs font-black text-brand-orange bg-brand-orange/10 px-3 py-1 rounded-xl flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  اختر أكثر من إجابة
                </span>
              ) : currentQuestion.type === 'single_choice' ? (
                <span className="text-xs font-bold text-muted-foreground">
                  اختر إجابة واحدة
                </span>
              ) : null}
            </div>

            {/* Audio Player if Listening Question */}
            {currentQuestion.audioUrl && (
              <div className="p-4 rounded-2xl bg-brand-orange/5 border border-brand-orange/20 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-brand-orange">
                  <Volume2 className="w-4 h-4 animate-pulse" />
                  <span>استمع للمقطع الصوتي بعناية:</span>
                </div>
                <audio
                  controls
                  src={resolveMediaUrl(currentQuestion.audioUrl)}
                  className="w-full mt-1"
                />
              </div>
            )}

            {/* Image if Image Question */}
            {currentQuestion.imageUrl && (
              <div className="rounded-2xl overflow-hidden max-h-72 border border-border">
                <img
                  src={resolveMediaUrl(currentQuestion.imageUrl)}
                  alt="Question graphic"
                  className="w-full h-full object-contain bg-black/5"
                />
              </div>
            )}

            {/* Question Text */}
            <h2 className="text-xl sm:text-2xl font-black text-foreground leading-relaxed">
              {currentQuestion.promptAr}
            </h2>

            {/* Answers Interaction based on type */}
            {/* 1. Single Choice */}
            {currentQuestion.type === 'single_choice' && (
              <div className="space-y-3 pt-2">
                {(currentQuestion.options || []).map((opt: any, idx: number) => {
                  const isSelected = currentAnswer.selectedOption === opt.id;
                  const label = String.fromCharCode(65 + idx); // A, B, C, D
                  return (
                    <div
                      key={opt.id}
                      onClick={() => handleSelectOption(opt.id)}
                      className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-center gap-4 ${
                        isSelected
                          ? 'border-brand-orange bg-brand-orange/10 font-bold shadow-xs'
                          : 'border-border bg-card hover:bg-secondary/40'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 transition-all ${
                        isSelected ? 'bg-brand-orange text-white shadow-xs' : 'bg-secondary text-muted-foreground'
                      }`}>
                        {isSelected ? <Check className="w-4 h-4" /> : label}
                      </div>
                      <span className="text-base text-foreground flex-1">{opt.textAr}</span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* 2. Multiple Choice */}
            {currentQuestion.type === 'multiple_choice' && (
              <div className="space-y-3 pt-2">
                {(currentQuestion.options || []).map((opt: any, idx: number) => {
                  const isSelected = currentAnswer.selectedOptions?.includes(opt.id);
                  const label = String.fromCharCode(65 + idx);
                  return (
                    <div
                      key={opt.id}
                      onClick={() => handleToggleMultipleOption(opt.id)}
                      className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-center gap-4 ${
                        isSelected
                          ? 'border-brand-orange bg-brand-orange/10 font-bold shadow-xs'
                          : 'border-border bg-card hover:bg-secondary/40'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-xl border-2 flex items-center justify-center font-bold text-xs shrink-0 transition-all ${
                        isSelected ? 'bg-brand-orange border-brand-orange text-white' : 'border-border bg-secondary'
                      }`}>
                        {isSelected ? <Check className="w-4 h-4" /> : label}
                      </div>
                      <span className="text-base text-foreground flex-1">{opt.textAr}</span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* 3. True / False */}
            {currentQuestion.type === 'true_false' && (
              <div className="grid grid-cols-2 gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => handleSelectOption('true')}
                  className={`p-6 rounded-2xl border-2 font-black text-lg transition-all flex flex-col items-center gap-2 ${
                    currentAnswer.selectedOption === 'true'
                      ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600 shadow-md'
                      : 'border-border bg-secondary/30 hover:bg-secondary/60 text-muted-foreground'
                  }`}
                >
                  <CheckCircle2 className="w-7 h-7" />
                  <span>صح (Richtig)</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectOption('false')}
                  className={`p-6 rounded-2xl border-2 font-black text-lg transition-all flex flex-col items-center gap-2 ${
                    currentAnswer.selectedOption === 'false'
                      ? 'border-red-500 bg-red-500/10 text-red-600 shadow-md'
                      : 'border-border bg-secondary/30 hover:bg-secondary/60 text-muted-foreground'
                  }`}
                >
                  <XCircle className="w-7 h-7" />
                  <span>خطأ (Falsch)</span>
                </button>
              </div>
            )}

            {/* 4. Fill in the Blank */}
            {currentQuestion.type === 'fill_blank' && (
              <div className="pt-3 space-y-2">
                <label className="text-xs font-bold text-muted-foreground block">
                  اكتب الكلمة الصحيحة لملء الفراغ:
                </label>
                <input
                  type="text"
                  value={currentAnswer.textValue || ''}
                  onChange={(e) => handleTextChange(e.target.value)}
                  placeholder="اكتب إجابتك هنا..."
                  className="w-full p-4 rounded-2xl bg-secondary/40 border-2 border-border focus:border-brand-orange text-lg font-bold focus:outline-none"
                />
              </div>
            )}

            {/* 5. Text Answer */}
            {currentQuestion.type === 'text' && (
              <div className="pt-3 space-y-2">
                <label className="text-xs font-bold text-muted-foreground block">
                  اكتب إجابتك النصية بالتفصيل:
                </label>
                <textarea
                  value={currentAnswer.textValue || ''}
                  onChange={(e) => handleTextChange(e.target.value)}
                  placeholder="اكتب الإجابة هنا..."
                  rows={4}
                  className="w-full p-4 rounded-2xl bg-secondary/40 border-2 border-border focus:border-brand-orange text-base focus:outline-none"
                />
              </div>
            )}
          </div>
        ) : null}

        {/* Footer Navigation Buttons */}
        <div className="flex items-center justify-between gap-4 mt-6">
          <button
            disabled={currentIdx === 0}
            onClick={() => setCurrentIdx(i => Math.max(0, i - 1))}
            className="py-3 px-5 rounded-2xl bg-secondary hover:bg-secondary/80 disabled:opacity-30 font-bold text-sm flex items-center gap-2 transition-all"
          >
            <BackArrow className="w-4 h-4" />
            السؤال السابق
          </button>

          {currentIdx < questions.length - 1 ? (
            <button
              onClick={() => setCurrentIdx(i => Math.min(questions.length - 1, i + 1))}
              className="btn-bold-primary text-sm py-3 px-6 flex items-center gap-2"
            >
              السؤال التالي
              <FwdArrow className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={() => setSubmitConfirmOpen(true)}
              className="py-3 px-8 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-sm shadow-md flex items-center gap-2 transition-all active:scale-95"
            >
              <Send className="w-4 h-4" />
              تسليم الامتحان النهائي
            </button>
          )}
        </div>
      </div>

      {/* Confirmation Submit Modal */}
      {submitConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="relative w-full max-w-md bg-background rounded-3xl p-6 sm:p-7 border-2 border-border shadow-2xl text-center space-y-5">
            <div className="w-14 h-14 rounded-3xl bg-emerald-500/10 text-emerald-600 mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-xl font-black text-foreground">تأكيد تسليم الامتحان</h3>
              <p className="text-xs text-muted-foreground mt-1">
                لقد أجبت على {answeredCount} من أصل {questions.length} سؤال. هل ترغب في إنهاء الاختبار وتسليمه للتصحيح؟
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setSubmitConfirmOpen(false)}
                className="py-2.5 px-5 rounded-xl bg-secondary hover:bg-secondary/80 font-bold text-xs"
              >
                متابعة المراجعة
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className="btn-bold-primary text-xs py-2.5 px-6 flex items-center gap-2"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'تأكيد التسليم'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
