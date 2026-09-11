'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, ArrowRight, BookOpen, Users, Award, Clock, GraduationCap, Play, 
  ArrowUpRight, MessageCircle, Target, Star, BookMarked, PenTool, Mic, Trophy, 
  X, CheckCircle2, ShieldCheck, Sparkles, KeyRound, Calendar
} from 'lucide-react';
import { useAppStore } from '@/stores/app-store';
import { t } from '@/lib/i18n';
import { useCountUp } from '@/hooks/use-scroll';
import Image from 'next/image';
import SectionTitle from '@/components/SectionTitle';
import { resolveMediaUrl } from '@/lib/media';

interface Banner {
  id: string;
  titleAr: string; titleDe: string; titleEn: string;
  descriptionAr?: string; descriptionDe?: string; descriptionEn?: string;
  labelAr?: string; labelDe?: string; labelEn?: string;
  imageUrl?: string;
  order: number;
}

interface Course {
  id: string;
  titleAr: string; titleDe: string; titleEn: string;
  descriptionAr: string; descriptionDe: string; descriptionEn: string;
  level: string;
  imageUrl?: string;
  order: number;
  introVideo?: { videoUrl: string | null; duration: number; isPublished: boolean } | null;
  lessons?: { id: string; duration: number; isFree?: boolean }[];
  _count?: { lessons: number };
}

interface SiteStat {
  students: number;
  years: number;
  courses: number;
  lessons: number;
}

interface Post {
  id: string;
  titleAr: string; titleDe: string; titleEn: string;
  excerptAr?: string; excerptDe?: string; excerptEn?: string;
  imageUrl?: string;
  category?: string;
  createdAt: string;
}

interface Testimonial {
  id: string;
  nameAr: string; nameDe: string; nameEn: string;
  roleAr?: string; roleDe?: string; roleEn?: string;
  textAr: string; textDe: string; textEn: string;
  level?: string;
  rating: number;
  avatar?: string;
}

interface Reel {
  id: string;
  titleAr: string; titleDe: string; titleEn: string;
  videoUrl: string;
  videoId?: string;
  thumbnail?: string;
  duration: number;
}

const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1'];
const berlinImages = [
  '/images/berlin/brandenburg-gate.png',
  '/images/berlin/reichstag.png',
  '/images/berlin/skyline.png',
  '/images/berlin/cathedral.png'
];

export default function HomeView() {
  const { locale, navigate } = useAppStore();
  const [banners, setBanners] = useState<Banner[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [activeCourseLevel, setActiveCourseLevel] = useState<string>('all');
  const [stats, setStats] = useState<SiteStat>({ students: 12600, years: 8, courses: 15, lessons: 200 });
  const [posts, setPosts] = useState<Post[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [reels, setReels] = useState<Reel[]>([]);
  const [activeReel, setActiveReel] = useState<Reel | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const studentsCount = useCountUp(stats.students, 1800, true);
  const yearsCount = useCountUp(stats.years, 1800, true);
  const coursesCount = useCountUp(stats.courses, 1800, true);
  const lessonsCount = useCountUp(stats.lessons, 1800, true);

  const setCountersRef = (el: HTMLElement | null) => {
    studentsCount.ref(el);
    yearsCount.ref(el);
    coursesCount.ref(el);
    lessonsCount.ref(el);
  };

  // ── Phase 1: Critical above-fold data via consolidated endpoint ──────────
  useEffect(() => {
    fetch('/api/home')
      .then(r => r.json())
      .then(data => {
        if (data.banners) setBanners(data.banners);
        if (data.courses) {
          setCourses(data.courses);
        }
        if (data.stats) {
          setStats({
            students: data.stats.students || 12600,
            years: data.stats.years || 8,
            courses: data.stats.courses || 15,
            lessons: data.stats.lessons || 200,
          });
        }
      })
      .catch(() => {});

    // ── Phase 2: Below-fold deferred data ─────────────────────────────────
    // Delay so the browser prioritizes rendering critical content first
    const deferredTimer = setTimeout(() => {
      Promise.allSettled([
        fetch('/api/posts?limit=6').then(r => r.json()).then(data => {
          if (data.posts) setPosts(data.posts.slice(0, 6));
        }),
        fetch('/api/testimonials').then(r => r.json()).then(data => {
          if (data.testimonials) setTestimonials(data.testimonials);
        }),
        fetch('/api/reels').then(r => r.json()).then(data => {
          if (data.reels) setReels(data.reels);
        }),
      ]);
    }, 800);

    return () => clearTimeout(deferredTimer);
  }, []);


  const slideCount = banners.length > 0 ? banners.length : berlinImages.length;
  const getBannerField = useCallback((banner: Banner, field: string) => {
    const localeKey = locale.charAt(0).toUpperCase() + locale.slice(1);
    return (banner as unknown as Record<string, unknown>)[`${field}${localeKey}`] as string || '';
  }, [locale]);

  const nextSlide = useCallback(() => {
    if (slideCount === 0) return;
    setCurrentSlide(p => (p + 1) % slideCount);
  }, [slideCount]);

  const prevSlide = useCallback(() => {
    if (slideCount === 0) return;
    setCurrentSlide(p => (p - 1 + slideCount) % slideCount);
  }, [slideCount]);

  useEffect(() => {
    if (!isAutoPlaying || slideCount <= 1) return;
    timerRef.current = setTimeout(() => {
      setCurrentSlide(p => (p + 1) % slideCount);
    }, 6000);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isAutoPlaying, currentSlide, slideCount]);

  const banner = banners.length > 0 ? banners[currentSlide] : null;
  const currentImage = banner?.imageUrl || berlinImages[currentSlide % berlinImages.length];
  const slideLabel = banner ? getBannerField(banner, 'label') : t(locale, `carousel_${currentSlide + 1}_label` as any);
  const slideTitle = banner ? getBannerField(banner, 'title') : t(locale, `carousel_${currentSlide + 1}_title` as any);
  const slideDesc = banner ? getBannerField(banner, 'description') : t(locale, `carousel_${currentSlide + 1}_desc` as any);
  
  const isRtl = locale === 'ar';
  const BackArrow = isRtl ? ArrowRight : ArrowLeft;
  const FwdArrow = isRtl ? ArrowLeft : ArrowRight;

  const ht = (ar: string, de: string, en?: string) => {
    if (locale === 'de') return de;
    if (locale === 'en') return en || de;
    return ar;
  };

  const getField = (obj: Record<string, unknown> | undefined, field: string) => {
    if (!obj) return '';
    const localeKey = locale.charAt(0).toUpperCase() + locale.slice(1);
    const directVal = (obj[`${field}${localeKey}`] as string)?.trim();
    if (directVal) return directVal;

    if (locale === 'de') {
      const deVal = (obj[`${field}De`] as string)?.trim();
      if (deVal) return deVal;
      const enVal = (obj[`${field}En`] as string)?.trim();
      if (enVal) return enVal;
    } else if (locale === 'en') {
      const enVal = (obj[`${field}En`] as string)?.trim();
      if (enVal) return enVal;
      const deVal = (obj[`${field}De`] as string)?.trim();
      if (deVal) return deVal;
    }

    return (obj[`${field}Ar`] as string) || (obj[`${field}De`] as string) || (obj[`${field}En`] as string) || '';
  };

  const getPostField = (obj: Record<string, unknown>, field: string) => getField(obj, field);
  const getTestimonialField = (obj: Record<string, unknown>, field: string) => getField(obj, field);
  const getReelField = (reel: Reel, field: string) => getField(reel as unknown as Record<string, unknown>, field);

  const getReelEmbedUrl = (reel: Reel): string | null => {
    if (reel.videoId) return `https://www.youtube.com/embed/${reel.videoId}`;
    const url = reel.videoUrl || '';
    const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]+)/);
    if (match) return `https://www.youtube.com/embed/${match[1]}`;
    return null;
  };

  const formatDuration = (seconds: number) => {
    if (!seconds || seconds <= 0) return '';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const fade = (delay = 0) => ({
    initial: { opacity: 0, y: 16 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: '-40px' } as const,
    transition: { duration: 0.5, delay, ease: [0.4, 0, 0.2, 1] as const },
  });

  const filteredCourses = activeCourseLevel === 'all'
    ? courses
    : courses.filter(c => c.level?.toUpperCase() === activeCourseLevel.toUpperCase());

  return (
    <div className="space-y-0">
      {/* ============================================================
          PART 1: HERO CAROUSEL (CLEAN, NO DECORATIVE DOTS)
      ============================================================ */}
      <div className="pt-4 pb-4">
        <div className="container-bold">
          <div className="relative overflow-hidden rounded-2xl md:rounded-[22px] min-h-[380px] md:min-h-[420px] lg:min-h-[450px] lg:max-h-[500px] shadow-lg ring-1 ring-black/5">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentSlide}
                initial={{ opacity: 0, scale: 1.04 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.1, ease: 'easeOut' }}
                className="absolute inset-0"
              >
                <Image src={currentImage} alt="" fill sizes="100vw" priority className="object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/45 to-black/25" />
                <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/35 to-transparent" />
              </motion.div>
            </AnimatePresence>

            {/* Content (Clean, No orange dots next to labels) */}
            <div className="relative z-10 h-full flex flex-col justify-center pb-8 pt-8 md:pb-10 md:pt-10">
              <div className="w-full px-6 sm:px-8 lg:px-10 max-w-3xl">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentSlide}
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.5, delay: 0.1, ease: 'easeOut' }}
                  >
                    {/* Clean Eyebrow Badge — Pure text, zero decorative dots */}
                    <div className="inline-flex items-center rounded-full px-4 py-1.5 mb-3 border border-white/15 bg-white/10 backdrop-blur-md shadow-xs">
                      <span className="text-white text-[11px] font-bold tracking-[0.14em] uppercase">{slideLabel}</span>
                    </div>

                    <h1
                      className="font-display text-white font-black leading-[1.08] tracking-tight mb-3 text-balance drop-shadow-[0_4px_16px_rgba(0,0,0,0.5)]"
                      style={{ fontSize: 'clamp(1.85rem, 3.8vw, 2.9rem)' }}
                    >
                      {slideTitle}
                    </h1>

                    <p className="leading-relaxed mb-5 max-w-[540px] text-sm sm:text-base text-white/80">
                      {slideDesc}
                    </p>

                    <div className="flex flex-wrap items-center gap-3 mb-6">
                      <button
                        onClick={() => navigate('courses')}
                        className="group inline-flex items-center gap-2 px-5 py-2.5 text-xs sm:text-sm font-bold tracking-wide text-white rounded-xl shadow-md shadow-brand-orange/20 hover:shadow-brand-orange/35 hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-200"
                        style={{ background: 'linear-gradient(135deg, #E85D26, #DC3545)' }}
                      >
                        {t(locale, 'hero_cta_primary')}
                        <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                      </button>
                      <button
                        onClick={() => navigate('online_booking')}
                        className="group inline-flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-medium tracking-wide text-white rounded-xl border border-white/20 bg-white/10 backdrop-blur-xl hover:bg-white/20 transition-all duration-200"
                      >
                        <Calendar className="w-3.5 h-3.5" />
                        {t(locale, 'nav_online_booking')}
                      </button>
                    </div>

                    <div className="inline-flex items-center rounded-xl bg-white/[0.08] backdrop-blur-xl border border-white/10 overflow-hidden shadow-xs">
                      {[
                        { v: `${stats.students}+`, l: ht('متابع وطالب', 'Lernende & Follower', 'Students & Followers') },
                        { v: `${stats.years}+`, l: t(locale, 'stats_years') },
                        { v: `${stats.courses}+`, l: t(locale, 'stats_courses') },
                      ].map((s, i, arr) => (
                        <div key={i} className={`flex items-center gap-2.5 px-3.5 sm:px-4 py-2 ${i !== arr.length - 1 ? 'border-e border-white/10' : ''}`}>
                          <div>
                            <p className="font-display text-sm sm:text-base font-extrabold leading-none text-white number-display">{s.v}</p>
                            <p className="text-[10px] font-medium tracking-wide mt-0.5 text-white/60">{s.l}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Carousel controls */}
              <div className="flex items-center gap-2 mt-4 px-4 sm:px-6 lg:px-8">
                <button
                  onClick={prevSlide}
                  aria-label={ht('السابق', 'Zurück', 'Previous')}
                  className="w-9 h-9 rounded-full border border-white/15 bg-white/10 backdrop-blur-xl flex items-center justify-center text-white hover:bg-white/20 hover:scale-105 active:scale-95 transition-all duration-200"
                >
                  <BackArrow className="w-4 h-4" />
                </button>
                <div className="flex items-center gap-1.5 rounded-full px-2.5 py-1.5 bg-black/25 backdrop-blur-xl border border-white/10">
                  {Array.from({ length: slideCount }).map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentSlide(i)}
                      onMouseEnter={() => setIsAutoPlaying(false)}
                      onMouseLeave={() => setIsAutoPlaying(true)}
                      aria-label={`Slide ${i + 1}`}
                      className="h-1.5 rounded-full transition-all duration-300"
                      style={{
                        width: i === currentSlide ? '24px' : '6px',
                        background: i === currentSlide ? 'linear-gradient(90deg, #E85D26, #DC3545)' : 'rgba(255,255,255,0.3)',
                      }}
                    />
                  ))}
                </div>
                <button
                  onClick={nextSlide}
                  aria-label={ht('التالي', 'Weiter', 'Next')}
                  className="w-9 h-9 rounded-full border border-white/15 bg-white/10 backdrop-blur-xl flex items-center justify-center text-white hover:bg-white/20 hover:scale-105 active:scale-95 transition-all duration-200"
                >
                  <FwdArrow className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================
          PART 2: ELEVATED & PREMIUM CATEGORIES (التصنيفات والمسارات)
      ============================================================ */}
      <section className="py-8 md:py-12 bg-transparent">
        <div className="container-bold">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2.5 mb-6 md:mb-8">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-orange/10 text-brand-orange text-xs font-bold mb-2 border border-brand-orange/15 shadow-xs">
                <Sparkles className="w-3.5 h-3.5" />
                <span>{ht('مسارات التعلم المتخصصة', 'Spezialisierte Lernpfade', 'Specialized Learning Paths')}</span>
              </div>
              <h2 className="font-display text-xl sm:text-2xl lg:text-3xl font-black text-foreground tracking-tight">
                {ht('التصنيفات والخدمات التعليمية', 'Kategorien & Bildungsangebote', 'Categories & Educational Services')}
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-sm">
              {ht('اختر مسارك التعليمي المفضل وابدأ فوراً بدراسة اللغة الألمانية واجتياز الامتحانات', 'Wählen Sie Ihren bevorzugten Lernpfad und starten Sie sofort mit Deutsch und der Prüfungsvorbereitung.', 'Choose your preferred learning path and start learning German and preparing for exams right away.')}
            </p>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 sm:gap-4.5">
            {[
              {
                icon: BookOpen,
                tag: ht('5 مستويات', '5 Niveaustufen', '5 Levels'),
                title: ht('دورات المستويات (A1–C1)', 'Niveaukurse (A1–C1)', 'Level Courses (A1–C1)'),
                desc: ht('تأسيس شامل للقواعد والمحادثة وفق الإطار الأوروبي', 'Umfassende Grundlagen in Grammatik und Konversation nach GER', 'Comprehensive grammar and conversation foundation based on CEFR'),
                action: () => {
                  const el = document.getElementById('educational-pathways');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                  else navigate('courses');
                },
                gradient: 'from-amber-500 to-orange-600',
                glowColor: 'hover:shadow-amber-500/15',
                borderColor: 'hover:border-amber-500/40',
                bgTint: 'from-amber-500/[0.08] to-transparent',
                badgeBg: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/20',
                btnColor: 'text-amber-600 dark:text-amber-400',
              },
              {
                icon: Award,
                tag: ht('امتحانات دولية', 'Offizielle Prüfungen', 'Official Exams'),
                title: ht('امتحانات Goethe & Telc', 'Goethe- & Telc-Prüfungen', 'Goethe & Telc Exams'),
                desc: ht('نماذج وتدريبات مكثفة على امتحانات السفارة ولم الشمل', 'Intensive Vorbereitung auf Botschafts- und Visaprüfungen', 'Intensive preparation for embassy and family reunion exams'),
                action: () => navigate('exams'),
                gradient: 'from-blue-600 to-indigo-700',
                glowColor: 'hover:shadow-blue-500/15',
                borderColor: 'hover:border-blue-500/40',
                bgTint: 'from-blue-500/[0.08] to-transparent',
                badgeBg: 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/20',
                btnColor: 'text-blue-600 dark:text-blue-400',
              },
              {
                icon: Trophy,
                tag: ht('تقييم فوري', 'Sofortige Auswertung', 'Instant Evaluation'),
                title: ht('الاختبارات التفاعلية', 'Interaktive Tests', 'Interactive Quizzes'),
                desc: ht('اختبر مستواك بدقة مع تصحيح ذكي للدرجات', 'Ermitteln Sie Ihr Sprachniveau präzise mit Sofort-Feedback', 'Test your language level accurately with smart scoring'),
                action: () => navigate('exams'),
                gradient: 'from-emerald-500 to-teal-700',
                glowColor: 'hover:shadow-emerald-500/15',
                borderColor: 'hover:border-emerald-500/40',
                bgTint: 'from-emerald-500/[0.08] to-transparent',
                badgeBg: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
                btnColor: 'text-emerald-600 dark:text-emerald-400',
              },
              {
                icon: BookMarked,
                tag: ht('ذاكرة وتكرار', 'Wiederholung', 'Spaced Repetition'),
                title: ht('بطاقات الحفظ السريع', 'Lernkarten & Vokabeln', 'Vocabulary Flashcards'),
                desc: ht('أهم الكلمات والتراكيب مع النطق الصوتي والأمثلة', 'Wichtige Wörter und Phrasen mit nativer Aussprache', 'Key words and phrases with audio pronunciation and examples'),
                action: () => navigate('flashcards'),
                gradient: 'from-purple-600 to-fuchsia-600',
                glowColor: 'hover:shadow-purple-500/15',
                borderColor: 'hover:border-purple-500/40',
                bgTint: 'from-purple-500/[0.08] to-transparent',
                badgeBg: 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/20',
                btnColor: 'text-purple-600 dark:text-purple-400',
              },
              {
                icon: Calendar,
                tag: ht('جلسات خاصة', '1:1 Unterricht', 'Private 1:1'),
                title: ht('حجز درس أونلاين', 'Online-Stunde buchen', 'Book Online Lesson'),
                desc: ht('تدريب مباشر ومحادثة فردية 1:1 مع الأستاذ عمر', 'Individuelle Betreuung und Konversation mit Lehrer Omar', 'Direct 1:1 coaching and conversation with Teacher Omar'),
                action: () => navigate('online_booking'),
                gradient: 'from-rose-500 to-red-600',
                glowColor: 'hover:shadow-rose-500/15',
                borderColor: 'hover:border-rose-500/40',
                bgTint: 'from-rose-500/[0.08] to-transparent',
                badgeBg: 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/20',
                btnColor: 'text-rose-600 dark:text-rose-400',
              },
            ].map((cat, i) => (
              <motion.div
                key={i}
                {...fade(i * 0.05)}
                onClick={cat.action}
                className={`group relative p-5 rounded-2xl border border-border/70 bg-card hover:shadow-xl ${cat.glowColor} ${cat.borderColor} hover:-translate-y-1.5 active:scale-[0.99] transition-all duration-300 cursor-pointer flex flex-col justify-between overflow-hidden`}
              >
                {/* Subtle top ambient glow */}
                <div className={`absolute top-0 inset-x-0 h-24 bg-gradient-to-b ${cat.bgTint} pointer-events-none opacity-60 group-hover:opacity-100 transition-opacity duration-300`} />

                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-3.5">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${cat.gradient} flex items-center justify-center text-white shadow-md group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300`}>
                      <cat.icon className="w-5 h-5" />
                    </div>
                    <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md border ${cat.badgeBg}`}>
                      {cat.tag}
                    </span>
                  </div>

                  <h3 className="font-display font-bold text-sm sm:text-base text-foreground mb-1.5 group-hover:text-brand-orange transition-colors">
                    {cat.title}
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                    {cat.desc}
                  </p>
                </div>

                <div className={`relative z-10 pt-3 mt-3.5 border-t border-border/50 flex items-center justify-between text-xs font-bold ${cat.btnColor}`}>
                  <span>{ht('دخول المسار', 'Pfad öffnen', 'Open Path')}</span>
                  <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center group-hover:bg-brand-orange group-hover:text-white transition-colors duration-200">
                    <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================
          PART 2, 4, 5, 6: "المسارات التعليمية" (PROFESSIONAL CATALOG)
      ============================================================ */}
      <section id="educational-pathways" className="py-8 md:py-12 bg-transparent">
        <div className="container-bold">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="font-display text-xl sm:text-2xl lg:text-3xl font-bold text-foreground">
                {ht('المسارات التعليمية', 'Bildungswege & Kurse', 'Educational Pathways & Courses')}
              </h2>
              <p className="text-muted-foreground text-xs sm:text-sm mt-1">
                {ht('دورات منهجية متكاملة وفق الإطار الأوروبي المشترك (CEFR)', 'Methodische Gesamtkurse nach dem Gemeinsamen Europäischen Referenzrahmen (GER)', 'Systematic comprehensive courses aligned with the CEFR')}
              </p>
            </div>

            {/* Level Filter Tabs */}
            <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-secondary/60 border border-border/60">
              <button
                onClick={() => setActiveCourseLevel('all')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 ${
                  activeCourseLevel === 'all'
                    ? 'bg-gradient-to-r from-brand-orange to-brand-red text-white shadow-sm shadow-brand-orange/25'
                    : 'text-muted-foreground hover:text-foreground hover:bg-background/80'
                }`}
              >
                {ht('الكل', 'Alle', 'All')}
              </button>
              {LEVELS.map(lvl => {
                const count = courses.filter(c => c.level?.toUpperCase() === lvl).length;
                return (
                  <button
                    key={lvl}
                    onClick={() => setActiveCourseLevel(lvl)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 ${
                      activeCourseLevel === lvl
                        ? 'bg-gradient-to-r from-brand-orange to-brand-red text-white shadow-sm shadow-brand-orange/25'
                        : 'text-muted-foreground hover:text-foreground hover:bg-background/80'
                    }`}
                  >
                    {lvl} {count > 0 && <span className="opacity-75 text-[10px] font-mono">({count})</span>}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Courses Cards Grid */}
          {filteredCourses.length > 0 ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredCourses.map((course, idx) => {
                const courseObj = course as unknown as Record<string, unknown>;
                const totalDuration = course.lessons?.reduce((acc, l) => acc + (l.duration || 0), 0) || 0;
                const lessonsCount = course.lessons?.length || 0;
                const hasFreeLesson = course.lessons?.some(l => l.isFree);

                return (
                  <motion.div
                    key={course.id}
                    {...fade(idx * 0.04)}
                    className="card-bold group rounded-xl overflow-hidden border border-border/80 hover:border-brand-orange/30 hover:shadow-lg transition-all duration-200 flex flex-col justify-between bg-card"
                  >
                    <div>
                      {/* Course Image & Non-Green Institutional Badge */}
                      <div className="relative aspect-[16/9] w-full bg-slate-900 overflow-hidden">
                        <Image
                          src={resolveMediaUrl(course.imageUrl) || '/images/berlin/brandenburg-gate.png'}
                          alt={getField(courseObj, 'title')}
                          fill
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent" />

                        {/* Top Badges (Institutional Palette: Navy & Controlled Brand Accent) */}
                        <div className="absolute top-3 start-3 flex items-center gap-1.5">
                          <span className="level-badge shadow-xs font-bold text-[11px] px-2.5 py-0.5">
                            {course.level}
                          </span>
                          {hasFreeLesson && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-900/90 dark:bg-slate-800 text-white border border-slate-700 shadow-xs flex items-center gap-1">
                              <Star className="w-2.5 h-2.5 text-brand-orange fill-brand-orange" />
                              {ht('الدرس مجاني', 'Kostenlose Lektion', 'Free Lesson')}
                            </span>
                          )}
                        </div>

                        {/* Direct Play Intro Video Pill */}
                        <button
                          onClick={() => navigate('course-detail', { id: course.id })}
                          aria-label={ht('مشاهدة الفيديو التعريفي', 'Einführungsvideo ansehen', 'Watch Intro Video')}
                          className="absolute inset-0 m-auto w-11 h-11 rounded-full bg-slate-900/85 hover:bg-brand-orange text-white flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-200"
                        >
                          <Play className="w-4 h-4 fill-current ms-0.5" />
                        </button>
                      </div>

                      {/* Course Info */}
                      <div className="p-4 space-y-2">
                        <h3 className="font-display font-bold text-base text-foreground group-hover:text-brand-orange transition-colors line-clamp-1">
                          {getField(courseObj, 'title')}
                        </h3>
                        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                          {getField(courseObj, 'description') || ht('منهاج تدريبي مكثف لاحتراف اللغة الألمانية واجتياز الامتحانات الرسمية.', 'Intensiver Lehrplan zum Meistern der deutschen Sprache und Bestehen der Prüfungen.', 'Intensive curriculum to master German and pass official exams.')}
                        </p>

                        {/* Meta Info */}
                        <div className="pt-2 flex items-center justify-between text-xs text-muted-foreground border-t border-border/60">
                          <span className="flex items-center gap-1 font-medium">
                            <BookOpen className="w-3.5 h-3.5 text-brand-orange" />
                            {lessonsCount} {ht('درس', 'Lektionen', 'Lessons')}
                          </span>
                          <span className="flex items-center gap-1 font-medium">
                            <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                            {Math.round(totalDuration / 60)} {ht('ساعة', 'Std.', 'Hours')}
                          </span>
                          <span className="flex items-center gap-1 font-medium text-brand-orange">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            {ht('فيديو تعريفي', 'Einführungsvideo', 'Intro Video')}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Action Button */}
                    <div className="p-4 pt-0">
                      <button
                        onClick={() => navigate('course-detail', { id: course.id })}
                        className="w-full py-2.5 px-3 rounded-lg bg-secondary hover:bg-slate-900 hover:text-white dark:hover:bg-brand-orange dark:hover:text-white font-bold text-xs text-foreground flex items-center justify-center gap-2 border border-border/70 transition-all duration-150"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>{ht('مشاهدة الفيديو وتفاصيل الدورة', 'Video & Kursdetails ansehen', 'Watch Video & Course Details')}</span>
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-10 p-6 rounded-xl bg-secondary/40 border border-border">
              <BookOpen className="w-10 h-10 text-muted-foreground/40 mx-auto mb-2" />
              <p className="text-muted-foreground text-xs font-semibold mb-3">
                {ht(`لا توجد دورات مدرجة حالياً في المستوى ${activeCourseLevel}.`, `Derzeit sind keine Kurse auf Stufe ${activeCourseLevel} verfügbar.`, `No courses currently available for level ${activeCourseLevel}.`)}
              </p>
              <button
                onClick={() => setActiveCourseLevel('all')}
                className="btn-bold-primary text-xs py-1.5 px-3"
              >
                {ht('عرض كافة الدورات', 'Alle Kurse anzeigen', 'View All Courses')}
              </button>
            </div>
          )}
        </div>
      </section>

      {/* ============================================================
          PART 7: SEAMLESS BACKGROUND (NO ARTIFICIAL HORIZONTAL DIVIDERS)
      ============================================================ */}
      <section className="py-10 md:py-14 bg-transparent relative">
        <div className="container-bold">
          <div className="text-center mb-8">
            <h2 className="font-display text-xl sm:text-2xl font-bold text-foreground mb-2">
              {ht('منظومة تعليمية متكاملة تضمن لك النجاح', 'Ein integriertes Bildungssystem für Ihren Erfolg', 'An Integrated Educational System Ensuring Your Success')}
            </h2>
            <p className="text-muted-foreground text-xs sm:text-sm max-w-lg mx-auto leading-relaxed">
              {ht('نجمع بين الدقة اللغوية الأكاديمية والتطبيق العملي الواقعي للوصول إلى الطلاقة واجتياز الامتحانات.', 'Wir verbinden akademische Sprachpräzision mit praxisnaher Anwendung für fließendes Deutsch und Prüfungserfolg.', 'We combine academic precision with practical application to achieve fluency and pass official exams.')}
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                icon: BookMarked,
                title: ht('مناهج معتمدة دولياً', 'International anerkannte Lehrpläne', 'Internationally Accredited Curricula'),
                desc: ht('محتوى متطابق تماماً مع معايير Goethe و Telc و ÖSD الرسمية من A1 حتى C1.', 'Vollständig abgestimmt auf offizielle Goethe-, Telc- und ÖSD-Standards von A1 bis C1.', 'Fully aligned with official Goethe, Telc, and ÖSD standards from A1 to C1.'),
              },
              {
                icon: Play,
                title: ht('فيديو تعريفي ودرس مجاني', 'Einführungsvideo & Kostenlose Lektion', 'Intro Video & Free Lesson'),
                desc: ht('شاهد الفيديو التمهيدي والدرس الأول لأي دورة مجاناً بالكامل قبل الاشتراك.', 'Sehen Sie das Einführungsvideo und die erste Lektion jedes Kurses kostenlos an.', 'Watch the introductory video and the first lesson of any course for free before enrolling.'),
              },
              {
                icon: Clock,
                title: ht('مرونة دراسة 24/7', 'Flexibles Lernen 24/7', '24/7 Flexible Learning'),
                desc: ht('تعلم في الوقت الذي يناسبك ومن أي جهاز مع حفظ تلقائي لمستوى تقدمك.', 'Lernen Sie flexibel auf jedem Gerät mit automatischer Fortschrittsspeicherung.', 'Learn at your own pace from any device with automatic progress saving.'),
              },
              {
                icon: MessageCircle,
                title: ht('متابعة واستفسارات مباشرة', 'Direkte Betreuung & Fragen', 'Direct Mentorship & Q&A'),
                desc: ht('قنوات تواصل مباشرة مع الأستاذ عمر وهاب للإجابة عن أسئلتك وتصحيح التمارين.', 'Direkte Kommunikationskanäle mit Lehrer Omar Wahab zur Beantwortung von Fragen und Übungskorrekturen.', 'Direct communication channels with Teacher Omar Wahab to answer questions and correct exercises.'),
              },
            ].map((f, i) => (
              <motion.div
                key={i}
                {...fade(i * 0.05)}
                className="p-5 rounded-xl border border-border/70 bg-card hover:border-brand-orange/30 hover:shadow-sm transition-all duration-200"
              >
                <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center text-foreground mb-3">
                  <f.icon className="w-5 h-5 text-brand-orange" />
                </div>
                <h3 className="font-display font-bold text-sm text-foreground mb-1.5">
                  {f.title}
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {f.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================
          PART 8, 9, 10, 11: TEACHER SECTION — "الأستاذ عمر وهاب"
          Hierarchy: الأستاذ عمر وهاب -> تعليم أكاديمي -> خبرة 8 سنوات -> details
      ============================================================ */}
      <section className="py-10 md:py-14 bg-transparent relative overflow-hidden">
        <div className="container-bold">
          <div className="grid lg:grid-cols-12 gap-8 items-center">
            {/* Teacher Image with Well-Cropped Responsive Framing */}
            <motion.div {...fade(0)} className="lg:col-span-5 relative max-w-[360px] mx-auto lg:mx-0 w-full">
              <div className="relative rounded-2xl overflow-hidden shadow-md border border-border bg-slate-900">
                <div className="aspect-[4/5] w-full relative">
                  <Image
                    src="/images/teacher/omar-hero.png"
                    alt={ht('الأستاذ عمر وهاب', 'Lehrer Omar Wahab', 'Instructor Omar Wahab')}
                    fill
                    sizes="(max-width: 1024px) 100vw, 360px"
                    className="object-cover object-top"
                    priority
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent" />
                </div>
                <div className="absolute bottom-0 inset-x-0 p-3.5 bg-black/65 backdrop-blur-md flex items-center justify-between text-white text-xs">
                  <div>
                    <p className="font-bold">{ht('الأستاذ عمر وهاب', 'Lehrer Omar Wahab', 'Instructor Omar Wahab')}</p>
                    <p className="text-[11px] text-white/70 font-mono">Berlin & Damascus</p>
                  </div>
                  <span className="px-2.5 py-1 rounded-md bg-brand-orange text-white font-mono font-bold text-xs">
                    {stats.years}+ {ht('سنوات خبرة', 'Jahre Erfahrung', 'Years Experience')}
                  </span>
                </div>
              </div>
            </motion.div>

            {/* Teacher Editorial Story with Formal Presentation */}
            <motion.div {...fade(0.1)} className="lg:col-span-7 space-y-3.5">
              {/* PART 9: Sophisticated "تعليم أكاديمي" Badge */}
              <div className="inline-flex items-center gap-1.5 rounded-md px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-300/80 dark:border-slate-700 text-xs font-bold tracking-wide">
                <GraduationCap className="w-3.5 h-3.5 text-brand-orange" />
                <span>{ht('تعليم أكاديمي', 'Akademische Ausbildung', 'Academic Education')}</span>
              </div>

              {/* PART 8: Formal Name */}
              <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl font-black text-foreground leading-snug">
                {ht('الأستاذ عمر وهاب', 'Lehrer Omar Wahab', 'Instructor Omar Wahab')}
              </h2>

              {/* PART 10: Prominently visible "خبرة 8 سنوات" figure */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-brand-orange/10 border border-brand-orange/25 text-brand-orange">
                <Award className="w-4 h-4" />
                <span className="text-sm font-black font-display tracking-wide">
                  {ht('خبرة 8 سنوات في تدريس اللغة الألمانية والتحضير لامتحانات Goethe و Telc', '8 Jahre Erfahrung im Deutschunterricht und in der Vorbereitung auf Goethe- und Telc-Prüfungen', '8 years of experience teaching German and preparing for Goethe and Telc exams')}
                </span>
              </div>

              <p className="text-muted-foreground leading-relaxed text-sm">
                {ht(
                  'مدرس لغة ألمانية معتمد حاصل على بكالوريوس في اللغة الألمانية وآدابها (جامعة دمشق) وبكالوريوس في تكنولوجيا المعلومات والبرمجة (الجامعة الافتراضية السورية). يمنحه هذا التخصص المزدوج أسلوباً تحليلياً دقيقاً في تفكيك قواعد الألمانية الصعبة وتحويلها إلى معادلات منطقية ميسرة تضمن اجتياز الامتحانات الرسمية بأعلى الدرجات.',
                  'Zertifizierter Deutschlehrer mit Doppelabschluss: Bachelor in Deutscher Sprache und Literatur (Universität Damaskus) sowie Bachelor in Informationstechnologie und Softwareentwicklung (Syrische Virtuelle Universität). Diese Spezialisierung ermöglicht einen präzisen, analytischen Unterrichtsstil, der komplexe Grammatik in einfache, logische Regeln auflöst und Bestnoten sichert.',
                  'Certified German instructor with a dual degree: Bachelor in German Language and Literature (Damascus University) and Bachelor in Information Technology and Programming (Syrian Virtual University). This unique combination provides an analytical teaching method that simplifies complex grammar into clear, logical rules.'
                )}
              </p>

              <div className="grid grid-cols-2 gap-3 pt-1">
                {[
                  { icon: Award, label: ht('خبرة تدريس متخصصة', 'Spezialisierte Lehrerfahrung', 'Specialized Teaching'), val: `${stats.years || 8}+ ` + ht('سنوات', 'Jahre', 'Years') },
                  { icon: Users, label: ht('متابع وطالب مؤهل', 'Lernende & Follower', 'Qualified Students'), val: '12,600+' },
                  { icon: Target, label: ht('نسبة النجاح الرسمية', 'Offizielle Erfolgsquote', 'Official Success Rate'), val: '95%' },
                  { icon: ShieldCheck, label: ht('معايير الإطار الأوروبي', 'GER-Standards', 'CEFR Standards'), val: 'CEFR A1–C1' },
                ].map((st, i) => (
                  <div key={i} className="p-2.5 rounded-xl border border-border/70 bg-card flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center text-brand-orange shrink-0">
                      <st.icon className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-foreground font-mono">{st.val}</p>
                      <p className="text-[10px] text-muted-foreground">{st.label}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-2 flex flex-wrap items-center gap-3">
                <button
                  onClick={() => navigate('about')}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs hover:opacity-90 transition-opacity"
                >
                  <span>{ht('الملف الأكاديمي الكامل للأستاذ', 'Vollständiges akademisches Profil', 'Teacher Complete Profile')}</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => navigate('online_booking')}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border hover:bg-secondary text-foreground font-bold text-xs transition-colors"
                >
                  <Calendar className="w-3.5 h-3.5 text-brand-orange" />
                  <span>{ht('حجز استشارة أو درس أونلاين', 'Beratung oder Online-Stunde buchen', 'Book Consultation or Lesson')}</span>
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ============================================================
          PART 12: COMMUNITY & SOCIAL PROOF WITH HARMONIZED BUTTONS
      ============================================================ */}
      <section className="py-10 md:py-14 bg-slate-900 text-white relative overflow-hidden">
        <div className="container-bold relative z-10">
          <div className="grid lg:grid-cols-12 gap-8 items-center">
            {/* Content: Community highlights & stats */}
            <motion.div {...fade(0)} className="lg:col-span-7 space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 bg-white/10 border border-white/15 text-white text-xs font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>{ht('مجتمع الأستاذ عمر وهاب', 'Omar Wahabs Community', 'Omar Wahab Community')}</span>
                <span className="opacity-40">|</span>
                <span className="font-mono text-brand-orange">@omar_wahab20</span>
              </div>

              <h2 className="font-display text-2xl sm:text-3xl font-black text-white leading-tight">
                {ht('أكثر من', 'Über', 'Over')}{' '}
                <span className="text-gradient">
                  12,600 {ht('طالب ومتابع', 'Schüler & Follower', 'Students & Followers')}
                </span>{' '}
                {ht('يتعلمون الألمانية معنا', 'lernen mit uns Deutsch', 'learn German with us')}
              </h2>

              <p className="text-slate-300 text-sm leading-relaxed">
                {ht(
                  'شروحات يومية وتدريبات على أهم أسئلة امتحانات Goethe و Telc وقواعد اللغة الألمانية عبر الحسابات الرسمية.',
                  'Tägliche Erklärungen und Übungen zu Goethe- und Telc-Prüfungen sowie deutscher Grammatik auf den offiziellen Kanälen.',
                  'Daily explanations and exercises for Goethe and Telc exams as well as German grammar across official channels.'
                )}
              </p>

              <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 text-xs text-slate-300 space-y-1">
                <p className="font-mono font-bold text-emerald-400" dir="ltr">
                  Deutsch lernen mit Omar. Überall mit dir 🇩🇪
                </p>
                <p>
                  {ht(
                    'خريج قسم اللغة الألمانية • دورات تفاعلية ومتابعة مباشرة • رقم التواصل: +963 934 090 166',
                    'Germanistik-Absolvent • Interaktive Kurse & direkte Betreuung • Kontakt: +963 934 090 166',
                    'German Studies Graduate • Interactive Courses & Direct Mentorship • Contact: +963 934 090 166'
                  )}
                </p>
              </div>

              {/* PART 12: HARMONIZED SOCIAL / CONTACT BUTTONS (Consistent Height, Radius, Style) */}
              <div className="pt-2 flex flex-wrap items-center gap-3">
                <a
                  href="https://www.tiktok.com/@omar_wahab20"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="h-11 px-5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs flex items-center gap-2 transition-all"
                >
                  <Play className="w-3.5 h-3.5 fill-current text-brand-orange" />
                  <span>{ht('تابع الحساب عبر التيك توك', 'Auf TikTok folgen', 'Follow on TikTok')}</span>
                  <ArrowUpRight className="w-3.5 h-3.5 opacity-60" />
                </a>

                <a
                  href="https://wa.me/963934090166"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="h-11 px-5 rounded-xl bg-emerald-600/90 hover:bg-emerald-600 border border-emerald-500/30 text-white font-bold text-xs flex items-center gap-2 transition-all shadow-xs"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>{ht('تواصل عبر الواتساب', 'WhatsApp-Kontakt', 'Chat on WhatsApp')}</span>
                </a>
              </div>
            </motion.div>

            {/* Right: Phone Mockup Frame */}
            <motion.div {...fade(0.1)} className="lg:col-span-5 flex justify-center">
              <div className="relative w-full max-w-[280px]">
                <div className="relative rounded-[2.2rem] bg-slate-950 p-2.5 border-4 border-slate-700 shadow-2xl ring-1 ring-white/10">
                  <div className="w-20 h-3.5 bg-slate-800 rounded-full mx-auto mb-2 flex items-center justify-center">
                    <span className="w-2 h-2 rounded-full bg-slate-900 border border-slate-700" />
                  </div>

                  <div className="relative aspect-[9/19] w-full rounded-[1.8rem] overflow-hidden bg-black border border-slate-800">
                    <Image
                      src="/images/teacher/omar-social-proof.png"
                      alt={ht('حساب الأستاذ عمر وهاب الرسمي', 'Offizielles Profil von Lehrer Omar Wahab', 'Official Profile of Teacher Omar Wahab')}
                      fill
                      sizes="280px"
                      className="object-cover object-top"
                    />
                    <div className="absolute bottom-0 inset-x-0 p-2.5 bg-gradient-to-t from-black via-black/85 to-transparent text-center">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-brand-orange text-white text-[10px] font-bold">
                        <Star className="w-2.5 h-2.5 fill-current" />
                        12,600+ {ht('متابع حقيقي', 'Echte Follower', 'Real Followers')}
                      </span>
                    </div>
                  </div>

                  <div className="w-24 h-1 bg-slate-600 rounded-full mx-auto mt-2" />
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ============================================================
          EDUCATIONAL SHORTS & REELS
      ============================================================ */}
      {reels.length > 0 && (
        <section className="py-10 md:py-14 bg-transparent relative">
          <div className="container-bold">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="font-display text-xl sm:text-2xl font-bold text-foreground">
                  {ht('مقاطع تعليمية سريعة', 'Kurze Lernvideos & Reels', 'Educational Shorts & Reels')}
                </h2>
                <p className="text-muted-foreground text-xs sm:text-sm mt-0.5">
                  {ht('شروحات مقتضبة لأهم الكلمات والمصطلحات الألمانية', 'Kompakte Erklärungen zu wichtigen deutschen Ausdrücken', 'Concise explanations of essential German words and expressions')}
                </p>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-4xl mx-auto">
              {reels.slice(0, 3).map((reel, i) => (
                <motion.button
                  key={reel.id}
                  {...fade(i * 0.05)}
                  onClick={() => setActiveReel(reel)}
                  className="group relative aspect-[9/16] rounded-xl overflow-hidden shadow-md ring-1 ring-border cursor-pointer text-start bg-slate-900"
                >
                  {reel.thumbnail ? (
                    <Image
                      src={reel.thumbnail}
                      alt={getReelField(reel, 'title')}
                      fill
                      sizes="(max-width: 1024px) 50vw, 25vw"
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-slate-900" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                  
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center border border-white/20 bg-black/40 backdrop-blur-md group-hover:scale-105 transition-transform">
                      <Play className="w-5 h-5 text-white fill-white ms-0.5" />
                    </div>
                  </div>

                  <div className="absolute bottom-0 inset-x-0 p-3.5 space-y-1">
                    <h3 className="font-display text-xs sm:text-sm font-bold text-white line-clamp-2">
                      {getReelField(reel, 'title')}
                    </h3>
                    {formatDuration(reel.duration) && (
                      <p className="text-[10px] font-medium text-white/70">
                        {formatDuration(reel.duration)} {ht('دقيقة', 'Min.', 'min')}
                      </p>
                    )}
                  </div>
                </motion.button>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Reel Modal */}
      <AnimatePresence>
        {activeReel && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
            onClick={() => setActiveReel(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-2xl relative bg-black rounded-2xl overflow-hidden border border-white/20 shadow-2xl p-2"
            >
              <button
                onClick={() => setActiveReel(null)}
                aria-label={ht('إغلاق', 'Schließen', 'Close')}
                className="absolute top-3 end-3 z-20 w-8 h-8 rounded-full bg-black/70 text-white flex items-center justify-center hover:bg-black transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
              {(() => {
                const embed = getReelEmbedUrl(activeReel);
                return embed ? (
                  <div className="relative rounded-xl overflow-hidden" style={{ aspectRatio: '16/9' }}>
                    <iframe
                      src={embed}
                      title={getReelField(activeReel, 'title')}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                      className="absolute inset-0 w-full h-full"
                    />
                  </div>
                ) : (
                  <video
                    src={activeReel.videoUrl}
                    controls
                    autoPlay
                    className="w-full rounded-xl"
                    style={{ aspectRatio: '16/9' }}
                  />
                );
              })()}
              <div className="p-3 text-center">
                <h3 className="font-display text-sm font-bold text-white">
                  {getReelField(activeReel, 'title')}
                </h3>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ============================================================
          STUDENT TESTIMONIALS
      ============================================================ */}
      {testimonials.length > 0 && (
        <section className="py-10 md:py-14 bg-transparent relative">
          <div className="container-bold">
            <div className="mb-6">
              <h2 className="font-display text-xl sm:text-2xl font-bold text-foreground">
                {ht('آراء وقصص نجاح الطلاب', 'Erfahrungsberichte & Erfolgsgeschichten', 'Student Reviews & Success Stories')}
              </h2>
              <p className="text-muted-foreground text-xs sm:text-sm mt-0.5">
                {ht('تجارب حقيقية لطلاب اجتازوا امتحانات Goethe و Telc مع الأستاذ عمر وهاب', 'Echte Erfahrungen von Lernenden, die Goethe- und Telc-Prüfungen bestanden haben', 'Real experiences from students who passed Goethe and Telc exams with Teacher Omar')}
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {testimonials.slice(0, 3).map((testi, i) => (
                <motion.div
                  key={testi.id}
                  {...fade(i * 0.05)}
                  className="p-5 rounded-xl border border-border/80 bg-card hover:border-brand-orange/30 hover:shadow-sm transition-all duration-200 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center gap-1 text-amber-500">
                      {Array.from({ length: 5 }).map((_, si) => (
                        <Star key={si} className="w-3.5 h-3.5 fill-current" />
                      ))}
                    </div>
                    <p className="text-xs sm:text-sm text-foreground/80 leading-relaxed italic">
                      &ldquo;{getTestimonialField(testi as unknown as Record<string, unknown>, 'text')}&rdquo;
                    </p>
                  </div>

                  <div className="pt-3 mt-3 border-t border-border/60 flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-slate-900 dark:bg-slate-800 text-white flex items-center justify-center font-bold text-xs">
                      {getTestimonialField(testi as unknown as Record<string, unknown>, 'name').charAt(0) || 'ط'}
                    </div>
                    <div>
                      <p className="font-bold text-xs text-foreground">
                        {getTestimonialField(testi as unknown as Record<string, unknown>, 'name')}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {getTestimonialField(testi as unknown as Record<string, unknown>, 'role') || ht('طالب معتمد', 'Zertifizierter Schüler', 'Verified Student')}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ============================================================
          LATEST POSTS & ARTICLES
      ============================================================ */}
      {posts.length > 0 && (
        <section className="py-10 md:py-14 bg-transparent relative">
          <div className="container-bold">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="font-display text-xl sm:text-2xl font-bold text-foreground">
                  {ht('أحدث المقالات التعليمية', 'Neueste Bildungsartikel & Tipps', 'Latest Educational Articles & Tips')}
                </h2>
                <p className="text-muted-foreground text-xs sm:text-sm mt-0.5">
                  {ht('إرشادات لغوية ونصائح لاجتياز امتحانات المعاهد الرسمية', 'Sprachtipps und Ratschläge für offizielle Prüfungen', 'Language tips and guidance for passing official exams')}
                </p>
              </div>
              <button
                onClick={() => navigate('posts')}
                className="text-xs font-bold text-brand-orange hover:text-brand-orange-dark flex items-center gap-1 transition-colors"
              >
                <span>{ht('عرض كافة المقالات', 'Alle Artikel anzeigen', 'View All Articles')}</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid sm:grid-cols-3 gap-5">
              {posts.slice(0, 3).map((post, i) => (
                <motion.div
                  key={post.id}
                  {...fade(i * 0.05)}
                  onClick={() => navigate('post-detail', { id: post.id })}
                  className="group cursor-pointer rounded-xl border border-border/80 bg-card overflow-hidden hover:border-brand-orange/30 hover:shadow-md transition-all duration-200 flex flex-col justify-between"
                >
                  <div className="relative aspect-[16/9] bg-slate-900 overflow-hidden">
                    <Image
                      src={resolveMediaUrl(post.imageUrl) || '/images/berlin/brandenburg-gate.png'}
                      alt={getPostField(post as unknown as Record<string, unknown>, 'title')}
                      fill
                      sizes="(max-width: 1024px) 100vw, 33vw"
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="p-4 space-y-1.5 flex-1 flex flex-col justify-between">
                    <div>
                      <h4 className="font-bold text-xs sm:text-sm text-foreground group-hover:text-brand-orange transition-colors line-clamp-2 mb-1">
                        {getPostField(post as unknown as Record<string, unknown>, 'title')}
                      </h4>
                      <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                        {getPostField(post as unknown as Record<string, unknown>, 'excerpt')}
                      </p>
                    </div>
                    <div className="pt-2.5 border-t border-border/60 flex items-center justify-between text-[10px] text-muted-foreground">
                      <span>{new Date(post.createdAt).toLocaleDateString(locale === 'ar' ? 'ar-EG' : locale === 'de' ? 'de-DE' : 'en-US')}</span>
                      <span className="font-bold text-brand-orange flex items-center gap-0.5">
                        {ht('اقرأ المزيد', 'Weiterlesen', 'Read More')} <ArrowUpRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ============================================================
          PART 13: "ابدأ رحلتك الآن" FINAL CTA WITH BERLIN BACKGROUND IMAGE
      ============================================================ */}
      <section className="py-10 md:py-14">
        <div className="container-bold">
          <div className="relative overflow-hidden rounded-2xl md:rounded-[24px] text-white p-8 md:p-12 text-center shadow-2xl border border-white/10 group">
            {/* Real Berlin Architecture Background Image - Vivid & Beautiful */}
            <div className="absolute inset-0 -z-0">
              <Image
                src="/images/berlin/brandenburg-gate.png"
                alt="Berlin Architecture — Deutsch mit Omar"
                fill
                sizes="100vw"
                className="object-cover object-center group-hover:scale-105 transition-transform duration-1000 ease-out"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/45 to-black/25 pointer-events-none" />
              <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/20 to-black/75 pointer-events-none" />
            </div>

            <div className="relative z-10 max-w-xl mx-auto space-y-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-white/90 border border-white/15 text-xs font-semibold backdrop-blur-md shadow-xs">
                {ht('ابدأ رحلتك الآن', 'Starten Sie Ihre Reise', 'Start Your Journey Now')}
              </span>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight drop-shadow-md">
                {ht('جاهز لإتقان اللغة الألمانية؟', 'Bereit, Deutsch zu meistern?', 'Ready to Master German?')}
              </h2>
              <p className="text-xs sm:text-sm text-white/85 leading-relaxed max-w-md mx-auto">
                {ht('اختر مسارك التعليمي، وشاهد الدرس الأول مجاناً وابدأ بثقة.', 'Wählen Sie Ihren Lernpfad, sehen Sie die erste Lektion kostenlos und starten Sie mit Zuversicht.', 'Choose your learning path, watch the first lesson for free, and start with confidence.')}
              </p>
              <div className="pt-2 flex items-center justify-center gap-3 flex-wrap">
                <button
                  onClick={() => navigate('courses')}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-brand-orange to-brand-red text-white text-xs sm:text-sm font-bold shadow-lg shadow-brand-orange/30 hover:shadow-brand-orange/50 hover:-translate-y-0.5 active:scale-[0.98] transition-all flex items-center gap-2"
                >
                  <span>{ht('تصفح كافة الدورات', 'Alle Kurse anzeigen', 'Browse All Courses')}</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => navigate('online_booking')}
                  className="px-5 py-2.5 rounded-xl border border-white/25 bg-black/30 backdrop-blur-md hover:bg-white/15 text-white text-xs sm:text-sm font-semibold transition-all flex items-center gap-1.5"
                >
                  <Calendar className="w-3.5 h-3.5 text-brand-orange" />
                  <span>{ht('حجز درس أونلاين', 'Online-Stunde buchen', 'Book Online Lesson')}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}