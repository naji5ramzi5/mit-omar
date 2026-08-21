'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Layers, Volume2, RotateCcw, CheckCircle2, XCircle, Brain, ArrowRight, Lock, Loader2 } from 'lucide-react';
import { useAppStore } from '@/stores/app-store';
import { useAuthStore } from '@/stores/auth-store';
import { t } from '@/lib/i18n';

interface WordList {
  id: string;
  level: string;
  titleAr: string;
  titleDe: string;
  titleEn: string;
  words: Array<{ count: number }>;
  wordCount: number;
}

interface Card {
  id: string;
  wordDe: string;
  wordAr: string;
  wordEn: string;
  exampleDe: string;
  exampleAr?: string;
  exampleEn?: string;
  audioUrl?: string | null;
}

type AudioState = 'idle' | 'loading' | 'playing' | 'paused';

const GRADES = [
  { grade: 0, label: 'مرة أخرى', labelDe: 'Nochmal', labelEn: 'Again', color: 'text-red-500 border-red-200 bg-red-50 dark:bg-red-950/30 dark:border-red-900/50 hover:border-red-400' },
  { grade: 1, label: 'صعب', labelDe: 'Schwer', labelEn: 'Hard', color: 'text-amber-500 border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-900/50 hover:border-amber-400' },
  { grade: 2, label: 'جيد', labelDe: 'Gut', labelEn: 'Good', color: 'text-emerald-600 border-emerald-200 bg-emerald-50 dark:bg-emerald-950/30 dark:border-emerald-900/50 hover:border-emerald-400' },
  { grade: 3, label: 'سهل', labelDe: 'Leicht', labelEn: 'Easy', color: 'text-blue-600 border-blue-200 bg-blue-50 dark:bg-blue-950/30 dark:border-blue-900/50 hover:border-blue-400' },
] as const;

const resolveAudio = (url?: string | null) => {
  if (!url) return '';
  if (url.startsWith('r2:')) return `${process.env.NEXT_PUBLIC_R2_PUBLIC_URL || ''}${url.slice(4)}`;
  return url;
};

export default function FlashcardsView() {
  const { locale, navigate } = useAppStore();
  const { isAuthenticated } = useAuthStore();
  const [lists, setLists] = useState<WordList[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedList, setSelectedList] = useState<WordList | null>(null);
  const [cards, setCards] = useState<Card[]>([]);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [done, setDone] = useState(false);
  const [saving, setSaving] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [audioState, setAudioState] = useState<AudioState>('idle');
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const a = new Audio();
    a.addEventListener('playing', () => setAudioState('playing'));
    a.addEventListener('pause', () => setAudioState('paused'));
    a.addEventListener('ended', () => {
      setAudioState('idle');
      a.currentTime = 0;
    });
    audioRef.current = a;
    return () => {
      a.pause();
    };
  }, []);

  const ui = locale === 'ar'
    ? {
        badge: 'بطاقات الحفظ',
        title: 'احفظ الكلمات الألمانية',
        subtitle: 'نظام تكرار ذكي يعرض لك الكلمات في الوقت المناسب لتثبيتها في الذاكرة',
        choose: 'اختر قائمة الكلمات',
        wordsCount: (n: number) => `${n} كلمة`,
        start: 'ابدأ المراجعة',
        showAnswer: 'اعرض المعنى',
        meaning: 'المعنى',
        example: 'مثال',
        gradeHint: 'قيّم نفسك بصراحة — سيتذكر النظام إجابتك',
        sessionDone: 'انتهت الجلسة!',
        sessionAgain: 'كلمات تحتاج مراجعة الآن؟ جلسة جديدة',
        loginHint: 'سجّل الدخول لحفظ تقدمك عبر الأجهزة',
        restart: 'مراجعة جديدة',
        chooseAnother: 'قائمة أخرى',
        noCards: 'لا توجد كلمات في هذه القائمة بعد',
        again: GRADES[0].label,
        hard: GRADES[1].label,
        good: GRADES[2].label,
        easy: GRADES[3].label,
      }
    : locale === 'de'
    ? {
        badge: 'Lernkarten',
        title: 'Deutsche Wörter sicher behalten',
        subtitle: 'Mit intelligentem Wiederholen tauchen die Karten genau dann wieder auf, wenn du sie brauchst',
        choose: 'Wähle eine Wortliste',
        wordsCount: (n: number) => `${n} Wörter`,
        start: 'Lernen starten',
        showAnswer: 'Antwort zeigen',
        meaning: 'Bedeutung',
        example: 'Beispiel',
        gradeHint: 'Bewerte dich ehrlich — das System merkt es sich',
        sessionDone: 'Sitzung beendet!',
        sessionAgain: 'Wörter brauchen Wiederholung? Neue Runde',
        loginHint: 'Melde dich an, um deinen Fortschritt zu speichern',
        restart: 'Neue Runde',
        chooseAnother: 'Andere Liste',
        noCards: 'Keine Wörter in dieser Liste',
        again: GRADES[0].labelDe,
        hard: GRADES[1].labelDe,
        good: GRADES[2].labelDe,
        easy: GRADES[3].labelDe,
      }
    : {
        badge: 'Flashcards',
        title: 'Master German vocabulary',
        subtitle: 'Smart spaced repetition brings each word back exactly when you are about to forget it',
        choose: 'Choose a word list',
        wordsCount: (n: number) => `${n} words`,
        start: 'Start review',
        showAnswer: 'Show answer',
        meaning: 'Meaning',
        example: 'Example',
        gradeHint: 'Grade yourself honestly — the system remembers',
        sessionDone: 'Session complete!',
        sessionAgain: 'Words need review? Start a new round',
        loginHint: 'Log in to keep your progress across devices',
        restart: 'New round',
        chooseAnother: 'Another list',
        noCards: 'No words in this list yet',
        again: GRADES[0].labelEn,
        hard: GRADES[1].labelEn,
        good: GRADES[2].labelEn,
        easy: GRADES[3].labelEn,
      };

  useEffect(() => {
    fetch('/api/flashcards/lists')
      .then((r) => r.json())
      .then((data) => {
        const normalized = (data.lists || []).map((l: WordList) => ({
          ...l,
          wordCount: l.words?.[0]?.count ?? 0,
        }));
        setLists(normalized);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const resetSession = useCallback(() => {
    audioRef.current?.pause();
    setAudioState('idle');
    setSpeaking(false);
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) window.speechSynthesis.cancel();
    setIndex(0);
    setFlipped(false);
    setDone(false);
  }, []);

  const startList = async (list: WordList) => {
    setSelectedList(list);
    setCards([]);
    resetSession();
    const res = await fetch(`/api/flashcards?listId=${list.id}`);
    const data = await res.json();
    setCards(data.cards || []);
  };

  const speakTTS = useCallback((word: string) => {
    if (!('speechSynthesis' in window)) return;
    setSpeaking(true);
    const u = new SpeechSynthesisUtterance(word);
    u.lang = 'de-DE';
    u.rate = 0.85;
    u.onend = () => setSpeaking(false);
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  }, []);

  const playWord = useCallback(() => {
    const card = cards[index];
    if (!card) return;
    if (card.audioUrl && audioRef.current) {
      const a = audioRef.current;
      a.src = resolveAudio(card.audioUrl);
      setAudioState('loading');
      a.play().catch(() => {
        setAudioState('idle');
        speakTTS(card.wordDe);
      });
    } else {
      speakTTS(card.wordDe);
    }
  }, [cards, index, speakTTS]);

  const toggleAudio = useCallback(() => {
    const a = audioRef.current;
    if (audioState === 'playing') {
      a?.pause();
    } else {
      playWord();
    }
  }, [audioState, playWord]);

  const stopAudio = useCallback(() => {
    audioRef.current?.pause();
    setAudioState('idle');
    setSpeaking(false);
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) window.speechSynthesis.cancel();
  }, []);

  const gradeCard = async (grade: number) => {
    audioRef.current?.pause();
    setAudioState('idle');
    setSpeaking(false);
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) window.speechSynthesis.cancel();
    setFlipped(false);
    if (isAuthenticated() && !saving) {
      setSaving(true);
      try {
        await fetch('/api/flashcards/review', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('dmo-token') || ''}` },
          body: JSON.stringify({ wordId: cards[index].id, grade }),
        });
      } catch { /* ignore */ }
      setSaving(false);
    }
    if (index + 1 >= cards.length) {
      setDone(true);
    } else {
      setIndex((i) => i + 1);
    }
  };

  const getField = (obj: Record<string, unknown>, field: string) => {
    const localeKey = locale.charAt(0).toUpperCase() + locale.slice(1);
    return (obj[`${field}${localeKey}`] as string) || (obj[`${field}Ar`] as string) || '';
  };

  return (
    <div className="pt-8 pb-20">
      <div className="container-bold max-w-3xl">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2.5 mb-4">
            <span className="h-px w-6 bg-brand-orange/40 rounded-full" />
            <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-brand-orange">
              <Brain className="w-3.5 h-3.5" />
              {ui.badge}
            </span>
            <span className="h-px w-6 bg-brand-orange/40 rounded-full" />
          </div>
          <h1 className="font-display text-2xl sm:text-3xl md:text-4xl font-black text-foreground mb-3">{ui.title}</h1>
          <p className="text-muted-foreground max-w-xl mx-auto text-sm">{ui.subtitle}</p>

          {isAuthenticated() && (
            <button
              onClick={() => navigate('student')}
              className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold rounded-xl border border-border/70 text-muted-foreground hover:text-brand-orange hover:border-brand-orange/35 transition-all"
            >
              <Layers className="w-3.5 h-3.5" />
              {t(locale, 'nav_my_courses')}
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => <div key={i} className="h-16 skeleton-bold rounded-xl" />)}
          </div>
        ) : selectedList && cards.length > 0 ? (
          <div>
            {/* Session header */}
            <div className="flex items-center justify-between mb-5">
              <button
                onClick={() => { setSelectedList(null); setCards([]); }}
                className="text-sm font-bold text-muted-foreground hover:text-brand-orange transition-colors flex items-center gap-1.5"
              >
                <ArrowRight className={`w-4 h-4 ${locale === 'ar' ? 'rotate-180' : ''}`} />
                {ui.chooseAnother}
              </button>
              <div className="flex items-center gap-1.5 text-sm font-bold text-brand-orange">
                <span>{index + 1}</span>
                <span className="text-muted-foreground">/</span>
                <span>{cards.length}</span>
              </div>
            </div>

            {/* Progress bar */}
            <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden mb-6">
              <motion.div
                className="h-full bg-gradient-to-r from-brand-orange to-brand-red rounded-full"
                animate={{ width: `${((index + (flipped ? 0 : 0)) / cards.length) * 100}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>

            {/* Card */}
            <div className="relative" style={{ perspective: 1200 }}>
              <AnimatePresence mode="wait">
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: 40 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -40 }}
                  transition={{ duration: 0.25 }}
                  onClick={() => !flipped && setFlipped(true)}
                  className="cursor-pointer"
                >
                  <motion.div
                    animate={{ rotateY: flipped ? 180 : 0 }}
                    transition={{ duration: 0.45, ease: [0.4, 0, 0.2, 1] }}
                    className="relative"
                    style={{ transformStyle: 'preserve-3d' }}
                  >
                    {/* Front */}
                    <div
                      className="card-bold p-10 sm:p-14 text-center relative overflow-hidden min-h-[260px] flex flex-col items-center justify-center"
                      style={{ backfaceVisibility: 'hidden' }}
                    >
                      <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-brand-orange to-brand-red" />
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleAudio(); }}
                        aria-label="استمع لنطق الأستاذ"
                        className="w-12 h-12 mx-auto mb-6 rounded-full bg-brand-orange/10 flex items-center justify-center text-brand-orange hover:bg-brand-orange hover:text-white transition-all group relative"
                      >
                        <span className={`absolute inset-0 rounded-full border-2 border-brand-orange/40 ${audioState === 'playing' ? 'animate-ping opacity-60' : 'opacity-0'}`} />
                        {audioState === 'loading' ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <Volume2 className={`w-5 h-5 ${(audioState === 'playing' || speaking) ? 'animate-pulse' : 'group-hover:scale-110'} transition-transform`} />
                        )}
                      </button>
                      <p className="font-display text-3xl sm:text-4xl font-black text-foreground leading-snug">{cards[index].wordDe}</p>
                      <span className="mt-6 inline-flex items-center gap-2 text-xs font-bold text-muted-foreground">
                        <RotateCcw className="w-3.5 h-3.5" />
                        {ui.showAnswer}
                      </span>
                    </div>

                    {/* Back */}
                    <div
                      className="absolute inset-0 card-bold p-10 sm:p-14 text-center overflow-hidden min-h-[260px] flex flex-col items-center justify-center"
                      style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
                    >
                      <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-brand-red to-brand-orange" />
                      <p className="level-badge mb-4">{ui.meaning}</p>
                      <p className="font-display text-2xl sm:text-3xl font-black text-brand-orange mb-1">{cards[index].wordAr}</p>
                      {cards[index].wordEn && (
                        <p className="text-sm text-muted-foreground font-semibold mb-5">{cards[index].wordEn}</p>
                      )}
                      {cards[index].exampleDe && (
                        <div className="mt-3 px-4 py-2.5 rounded-xl bg-muted/60 text-sm text-foreground/80 font-medium italic max-w-sm">
                          „{cards[index].exampleDe}“
                        </div>
                      )}
                    </div>
                  </motion.div>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Grade buttons */}
            <div className="mt-8">
              <p className="text-center text-xs text-muted-foreground mb-3">{ui.gradeHint}</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {GRADES.map((g) => (
                  <button
                    key={g.grade}
                    onClick={() => gradeCard(g.grade)}
                    disabled={!flipped || saving}
                    className={`px-4 py-3.5 text-sm font-bold rounded-xl border transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.97] ${g.color}`}
                  >
                    {locale === 'ar' ? g.label : locale === 'de' ? g.labelDe : g.labelEn}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : done ? (
          <div className="card-bold p-10 text-center">
            <div className="w-16 h-16 mx-auto mb-5 rounded-full bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center shadow-md">
              <CheckCircle2 className="w-8 h-8 text-white" />
            </div>
            <h2 className="font-display text-2xl font-black text-foreground mb-2">{ui.sessionDone}</h2>
            <p className="text-sm text-muted-foreground mb-6">{ui.sessionAgain}</p>
            {!isAuthenticated() && (
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-orange/10 text-brand-orange text-xs font-bold mb-6">
                <Lock className="w-3.5 h-3.5" />
                {ui.loginHint}
              </div>
            )}
            <div className="flex flex-wrap justify-center gap-3">
              <button onClick={() => startList(selectedList!)} className="btn-bold-primary">
                <RotateCcw className="w-4 h-4" />
                {ui.restart}
              </button>
              <button onClick={() => { setSelectedList(null); setCards([]); }} className="btn-bold-secondary">
                {ui.chooseAnother}
              </button>
            </div>
          </div>
        ) : (
          /* List selection */
          <div>
            <h2 className="font-display text-lg font-bold text-foreground mb-5 flex items-center gap-2">
              <Layers className="w-5 h-5 text-brand-orange" />
              {ui.choose}
            </h2>
            {lists.length === 0 ? (
              <div className="card-bold p-10 text-center">
                <XCircle className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground text-sm">{ui.noCards}</p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-4">
                {lists.map((list, i) => (
                  <motion.button
                    key={list.id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.06, duration: 0.4 }}
                    onClick={() => startList(list)}
                    className="card-bold p-5 text-start flex items-center gap-4 hover:border-brand-orange/40 hover:-translate-y-0.5 transition-all duration-200 group"
                  >
                    <div className="w-12 h-12 shrink-0 rounded-xl bg-gradient-to-br from-brand-orange/10 to-brand-red/10 flex items-center justify-center transition-colors group-hover:from-brand-orange group-hover:to-brand-red">
                      <Layers className="w-5 h-5 text-brand-orange group-hover:text-white transition-colors" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="level-badge mb-1.5 inline-block">{list.level}</span>
                      <p className="font-bold text-sm text-foreground leading-snug truncate">{getField(list as unknown as Record<string, unknown>, 'title')}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{ui.wordsCount(list.wordCount)}</p>
                    </div>
                    <ArrowRight className={`w-4 h-4 text-muted-foreground group-hover:text-brand-orange transition-colors ${locale === 'ar' ? 'rotate-180' : ''}`} />
                  </motion.button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}