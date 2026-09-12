'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Layers, Volume2, RotateCcw, CheckCircle2, ArrowRight, ArrowLeft,
  X, Loader2, Sparkles, ChevronRight, ChevronLeft, Image as ImageIcon
} from 'lucide-react';
import { resolveMediaUrl } from '@/lib/media';

export interface LessonCard {
  id: string;
  wordDe: string;
  wordAr: string;
  wordEn?: string;
  exampleDe?: string;
  exampleAr?: string;
  exampleEn?: string;
  audioUrl?: string | null;
  imageUrl?: string | null;
}

interface LessonFlashcardsPlayerProps {
  lessonTitle: string;
  cards: LessonCard[];
  locale: string;
  token?: string | null;
  onClose: () => void;
  onNextLesson?: () => void;
  hasNextLesson?: boolean;
}

const GRADES = [
  { grade: 0, labelAr: 'مرة أخرى', labelDe: 'Nochmal', labelEn: 'Again', color: 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border-red-500/30' },
  { grade: 1, labelAr: 'صعب', labelDe: 'Schwer', labelEn: 'Hard', color: 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border-amber-500/30' },
  { grade: 2, labelAr: 'جيد', labelDe: 'Gut', labelEn: 'Good', color: 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
  { grade: 3, labelAr: 'سهل', labelDe: 'Leicht', labelEn: 'Easy', color: 'bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border-blue-500/30' },
];

export default function LessonFlashcardsPlayer({
  lessonTitle,
  cards,
  locale,
  token,
  onClose,
  onNextLesson,
  hasNextLesson = false,
}: LessonFlashcardsPlayerProps) {
  const isRtl = locale === 'ar';
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [done, setDone] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [savingGrade, setSavingGrade] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const currentCard = cards[index] || null;

  // Cleanup audio on unmount or card change
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    setFlipped(false);
    setIsPlayingAudio(false);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
  }, [index]);

  const playAudio = () => {
    if (!currentCard) return;

    if (currentCard.audioUrl) {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      const resolved = resolveMediaUrl(currentCard.audioUrl);
      const audio = new Audio(resolved);
      audioRef.current = audio;
      setIsPlayingAudio(true);

      audio.onended = () => setIsPlayingAudio(false);
      audio.onerror = () => {
        setIsPlayingAudio(false);
        speakUtterance(currentCard.wordDe);
      };
      audio.play().catch(() => {
        setIsPlayingAudio(false);
        speakUtterance(currentCard.wordDe);
      });
    } else {
      speakUtterance(currentCard.wordDe);
    }
  };

  const speakUtterance = (text: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = 'de-DE';
    utter.rate = 0.85;
    setIsPlayingAudio(true);
    utter.onend = () => setIsPlayingAudio(false);
    utter.onerror = () => setIsPlayingAudio(false);
    window.speechSynthesis.speak(utter);
  };

  const handleNext = () => {
    if (index < cards.length - 1) {
      setIndex((prev) => prev + 1);
    } else {
      setDone(true);
    }
  };

  const handlePrev = () => {
    if (index > 0) {
      setIndex((prev) => prev - 1);
    }
  };

  const handleGrade = async (grade: number) => {
    if (!currentCard) return;
    if (token) {
      setSavingGrade(true);
      try {
        await fetch('/api/flashcards/review', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ wordId: currentCard.id, grade }),
        });
      } catch {
        // Continue even if logging fails
      } finally {
        setSavingGrade(false);
      }
    }
    handleNext();
  };

  const restartSession = () => {
    setIndex(0);
    setFlipped(false);
    setDone(false);
  };

  if (!cards || cards.length === 0) {
    return (
      <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
        <div className="bg-[#121826] border border-white/10 rounded-3xl p-8 max-w-md w-full text-center space-y-4">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-white/5 flex items-center justify-center text-white/40">
            <Layers className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-white">لا توجد بطاقات حفظ لهذا الدرس</h3>
          <p className="text-xs text-white/60">
            لم يقم الأستاذ بإضافة بطاقات حفظ لهذا الدرس بعد.
          </p>
          <button
            onClick={onClose}
            className="w-full py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition-all cursor-pointer"
          >
            إغلاق
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-[#0e1422] border border-white/10 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col my-auto max-h-[95vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-brand-orange/20 border border-brand-orange/30 flex items-center justify-center text-brand-orange">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-black text-white flex items-center gap-2">
                بطاقات حفظ الدرس
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-white/10 text-white/70 font-normal">
                  {index + 1} / {cards.length}
                </span>
              </h2>
              <p className="text-xs text-white/50 truncate max-w-xs sm:max-w-md">{lessonTitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white/60 hover:text-white flex items-center justify-center transition-all cursor-pointer"
            title="إغلاق"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-1 bg-white/10">
          <motion.div
            className="h-full bg-gradient-to-r from-brand-orange to-amber-400"
            animate={{ width: `${((index + 1) / cards.length) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>

        {/* Card Body */}
        <div className="p-6 sm:p-8 flex-1 flex flex-col justify-center">
          {!done ? (
            <div className="space-y-6">
              {/* Flip Card Container */}
              <div
                className="relative cursor-pointer select-none"
                style={{ perspective: 1200 }}
                onClick={() => setFlipped(!flipped)}
              >
                <motion.div
                  animate={{ rotateY: flipped ? 180 : 0 }}
                  transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
                  className="relative min-h-[280px] sm:min-h-[320px] rounded-3xl border border-white/10 shadow-xl"
                  style={{ transformStyle: 'preserve-3d' }}
                >
                  {/* FRONT: German Word + Omar's Audio + Image */}
                  <div
                    className="absolute inset-0 rounded-3xl bg-gradient-to-b from-[#162033] to-[#0f172a] p-6 sm:p-8 flex flex-col items-center justify-between text-center"
                    style={{ backfaceVisibility: 'hidden' }}
                  >
                    <div className="w-full flex items-center justify-between text-xs text-white/40">
                      <span className="font-semibold text-brand-orange">الألمانية</span>
                      <span>انقر لقلب البطاقة ومعرفة المعنى ↺</span>
                    </div>

                    <div className="my-auto space-y-4 w-full flex flex-col items-center">
                      {currentCard.imageUrl && (
                        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden border border-white/20 shadow-md bg-black/40">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={resolveMediaUrl(currentCard.imageUrl)}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}

                      <h3 className="text-3xl sm:text-4xl font-black text-white tracking-wide">
                        {currentCard.wordDe}
                      </h3>

                      {/* Teacher Voice Audio Button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          playAudio();
                        }}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-orange/20 hover:bg-brand-orange text-brand-orange hover:text-white border border-brand-orange/40 transition-all font-bold text-xs cursor-pointer active:scale-95"
                      >
                        <Volume2 className={`w-4 h-4 ${isPlayingAudio ? 'animate-pulse' : ''}`} />
                        <span>{currentCard.audioUrl ? 'استمع لنطق الأستاذ عمر 🎙️' : 'استمع للنطق 🔊'}</span>
                      </button>
                    </div>

                    <p className="text-[11px] text-white/40 flex items-center gap-1.5 font-medium">
                      <RotateCcw className="w-3.5 h-3.5" />
                      انقر لعرض الترجمة والمثال
                    </p>
                  </div>

                  {/* BACK: Arabic Translation + English + Example Sentence */}
                  <div
                    className="absolute inset-0 rounded-3xl bg-gradient-to-b from-[#1a2333] to-[#111827] p-6 sm:p-8 flex flex-col items-center justify-between text-center border-t-2 border-brand-orange"
                    style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
                  >
                    <div className="w-full flex items-center justify-between text-xs text-white/40">
                      <span className="font-semibold text-emerald-400">الترجمة والمثال</span>
                      <span>انقر للعودة للألمانية ↺</span>
                    </div>

                    <div className="my-auto space-y-3 w-full">
                      <h4 className="text-2xl sm:text-3xl font-black text-amber-400">
                        {currentCard.wordAr}
                      </h4>

                      {currentCard.wordEn && (
                        <p className="text-xs text-white/50 font-semibold">{currentCard.wordEn}</p>
                      )}

                      {currentCard.exampleDe && (
                        <div className="mt-4 p-3.5 rounded-2xl bg-white/5 border border-white/10 text-xs sm:text-sm text-white/90 text-start space-y-1">
                          <p className="font-semibold text-brand-orange">„{currentCard.exampleDe}“</p>
                          {currentCard.exampleAr && (
                            <p className="text-white/60 text-xs">{currentCard.exampleAr}</p>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          playAudio();
                        }}
                        className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white/80 transition-all text-xs flex items-center gap-1 cursor-pointer"
                        title="إعادة سماع النطق"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                        نطق الكلمة
                      </button>
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* Navigation & Self-assessment Buttons */}
              <div className="space-y-3">
                {flipped ? (
                  <div className="space-y-2">
                    <p className="text-center text-xs text-white/50">كيف كان تذكرك لهذه الكلمة؟</p>
                    <div className="grid grid-cols-4 gap-2">
                      {GRADES.map((g) => (
                        <button
                          key={g.grade}
                          type="button"
                          disabled={savingGrade}
                          onClick={() => handleGrade(g.grade)}
                          className={`py-2 px-1 text-xs font-bold rounded-xl border transition-all active:scale-95 cursor-pointer text-center ${g.color}`}
                        >
                          {locale === 'de' ? g.labelDe : locale === 'en' ? g.labelEn : g.labelAr}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-3 pt-2">
                    <button
                      type="button"
                      onClick={handlePrev}
                      disabled={index === 0}
                      className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:pointer-events-none text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      {isRtl ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                      السابق
                    </button>

                    <button
                      type="button"
                      onClick={() => setFlipped(true)}
                      className="flex-1 py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer border border-white/10"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-brand-orange" />
                      عرض المعنى
                    </button>

                    <button
                      type="button"
                      onClick={handleNext}
                      className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-brand-orange to-brand-red text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-md hover:brightness-110"
                    >
                      {index === cards.length - 1 ? 'إنهاء' : 'التالي'}
                      {isRtl ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Done State */
            <div className="text-center py-8 space-y-5">
              <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <CheckCircle2 className="w-10 h-10 text-white" />
              </div>

              <div>
                <h3 className="text-2xl font-black text-white mb-2">أحسنت! أكملت مراجعة جميع البطاقات 👏</h3>
                <p className="text-xs sm:text-sm text-white/60 max-w-md mx-auto">
                  تمت مراجعة {cards.length} كلمة بنجاح من درس &quot;{lessonTitle}&quot;. تكرار هذه الكلمات يثبتها في ذاكرتك الدائمة.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
                <button
                  type="button"
                  onClick={restartSession}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                  مراجعة البطاقات مرة أخرى
                </button>

                {hasNextLesson && onNextLesson && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onNextLesson();
                    }}
                    className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-brand-orange to-brand-red hover:from-brand-orange-dark hover:to-brand-red-dark text-white text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md"
                  >
                    الانتقال إلى الدرس التالي
                    {isRtl ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
                  </button>
                )}

                <button
                  type="button"
                  onClick={onClose}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-white/20 text-white/80 hover:text-white text-xs font-bold transition-all cursor-pointer"
                >
                  العودة لمشاهدة الفيديو
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
