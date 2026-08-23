'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, BookOpen, Users, Award, Clock, GraduationCap, Play, ArrowUpRight, MessageCircle, Target, Star, BookMarked, PenTool, Mic, Trophy, X } from 'lucide-react';
import { useAppStore } from '@/stores/app-store';
import { t } from '@/lib/i18n';
import { useCountUp } from '@/hooks/use-scroll';
import Image from 'next/image';
import SectionTitle from '@/components/SectionTitle';

interface Banner { id: string; titleAr: string; titleDe: string; titleEn: string; descriptionAr?: string; descriptionDe?: string; descriptionEn?: string; labelAr?: string; labelDe?: string; labelEn?: string; imageUrl?: string; order: number; }
interface SiteStat { students: number; years: number; courses: number; lessons: number; }
interface Post { id: string; titleAr: string; titleDe: string; titleEn: string; excerptAr?: string; excerptDe?: string; excerptEn?: string; imageUrl?: string; category?: string; createdAt: string; }
interface Testimonial { id: string; nameAr: string; nameDe: string; nameEn: string; roleAr?: string; roleDe?: string; roleEn?: string; textAr: string; textDe: string; textEn: string; level?: string; rating: number; avatar?: string; }
interface Reel { id: string; titleAr: string; titleDe: string; titleEn: string; videoUrl: string; videoId?: string; thumbnail?: string; duration: number; }

const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1'];
const berlinImages = ['/images/berlin/brandenburg-gate.png', '/images/berlin/reichstag.png', '/images/berlin/skyline.png', '/images/berlin/cathedral.png'];

const whyOmar = [
  { icon: BookMarked, titleKey: 'home_why_1_title', descKey: 'home_why_1_desc', gradient: 'from-emerald-500 to-teal-600' },
  { icon: MessageCircle, titleKey: 'home_why_2_title', descKey: 'home_why_2_desc', gradient: 'from-blue-500 to-indigo-600' },
  { icon: Target, titleKey: 'home_why_3_title', descKey: 'home_why_3_desc', gradient: 'from-brand-orange to-amber-500' },
  { icon: Mic, titleKey: 'home_why_4_title', descKey: 'home_why_4_desc', gradient: 'from-brand-red to-rose-600' },
];

const features = [
  { icon: BookOpen, titleKey: 'home_features_1_title', descKey: 'home_features_1_desc', color: 'text-brand-orange', bg: 'bg-brand-orange/10' },
  { icon: MessageCircle, titleKey: 'home_features_2_title', descKey: 'home_features_2_desc', color: 'text-sky-600', bg: 'bg-sky-100 dark:bg-sky-500/10' },
  { icon: PenTool, titleKey: 'home_features_3_title', descKey: 'home_features_3_desc', color: 'text-emerald-600', bg: 'bg-emerald-100 dark:bg-emerald-500/10' },
  { icon: Trophy, titleKey: 'home_features_4_title', descKey: 'home_features_4_desc', color: 'text-purple-600', bg: 'bg-purple-100 dark:bg-purple-500/10' },
];

export default function HomeView() {
  const { locale, navigate } = useAppStore();
  const [banners, setBanners] = useState<Banner[]>([]);
  const [stats, setStats] = useState<SiteStat>({ students: 500, years: 8, courses: 15, lessons: 200 });
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
    studentsCount.ref(el); yearsCount.ref(el); coursesCount.ref(el); lessonsCount.ref(el);
  };

  useEffect(() => {
    fetch('/api/courses?includeLessons=false&limit=100').then(r => r.json()).then(data => { if (data.courses) setStats(s => ({ ...s, courses: data.courses.length })); }).catch(() => {});
    fetch('/api/stats').then(r => r.json()).then(data => { if (data.students) setStats(s => ({ ...s, students: data.students })); if (data.years) setStats(s => ({ ...s, years: data.years })); if (data.lessons) setStats(s => ({ ...s, lessons: data.lessons })); }).catch(() => {});
    fetch('/api/banners').then(r => r.json()).then(data => { if (data.banners?.length) setBanners(data.banners); }).catch(() => {});
    fetch('/api/posts?limit=6').then(r => r.json()).then(data => { if (data.posts) setPosts(data.posts.slice(0, 6)); }).catch(() => {});
    fetch('/api/testimonials').then(r => r.json()).then(data => { if (data.testimonials) setTestimonials(data.testimonials); }).catch(() => {});
    fetch('/api/reels').then(r => r.json()).then(data => { if (data.reels) setReels(data.reels); }).catch(() => {});
    fetch('/api/settings').then(r => r.json()).then(data => {
      const s = data.settings as Record<string, string> | undefined;
      if (!s) return;
      setStats(prev => ({
        students: parseInt(s.stats_students || '') || prev.students,
        years: parseInt(s.stats_years || '') || prev.years,
        courses: parseInt(s.stats_courses || '') || prev.courses,
        lessons: parseInt(s.stats_lessons || '') || prev.lessons,
      }));
    }).catch(() => {});
  }, []);

  const slideCount = banners.length > 0 ? banners.length : berlinImages.length;
  const getBannerField = useCallback((banner: Banner, field: string) => { const localeKey = locale.charAt(0).toUpperCase() + locale.slice(1); return (banner as unknown as Record<string, unknown>)[`${field}${localeKey}`] as string || ''; }, [locale]);
  const nextSlide = useCallback(() => { if (slideCount === 0) return; setCurrentSlide(p => (p + 1) % slideCount); }, [slideCount]);
  const prevSlide = useCallback(() => { if (slideCount === 0) return; setCurrentSlide(p => (p - 1 + slideCount) % slideCount); }, [slideCount]);

  useEffect(() => {
    if (!isAutoPlaying || slideCount <= 1) return;
    timerRef.current = setTimeout(() => { setCurrentSlide(p => (p + 1) % slideCount); }, 6000);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [isAutoPlaying, currentSlide, slideCount]);

  const banner = banners.length > 0 ? banners[currentSlide] : null;
  const currentImage = banner?.imageUrl || berlinImages[currentSlide % berlinImages.length];
  const slideLabel = banner ? getBannerField(banner, 'label') : t(locale, `carousel_${currentSlide + 1}_label` as any);
  const slideTitle = banner ? getBannerField(banner, 'title') : t(locale, `carousel_${currentSlide + 1}_title` as any);
  const slideDesc = banner ? getBannerField(banner, 'description') : t(locale, `carousel_${currentSlide + 1}_desc` as any);
  const isRtl = locale === 'ar';
  const BackArrow = isRtl ? ArrowRight : ArrowLeft;
  const FwdArrow = isRtl ? ArrowLeft : ArrowRight;
  const getPostField = (obj: Record<string, unknown>, field: string) => { const localeKey = locale.charAt(0).toUpperCase() + locale.slice(1); return (obj[`${field}${localeKey}`] as string) || ''; };
  const getTestimonialField = (obj: Record<string, unknown>, field: string) => { const localeKey = locale.charAt(0).toUpperCase() + locale.slice(1); return (obj[`${field}${localeKey}`] as string) || ''; };

  const getReelField = (reel: Reel, field: string) => { const localeKey = locale.charAt(0).toUpperCase() + locale.slice(1); return ((reel as unknown as Record<string, unknown>)[`${field}${localeKey}`] as string) || ''; };

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
    initial: { opacity: 0, y: 20 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: '-60px' } as const,
    transition: { duration: 0.55, delay, ease: [0.4, 0, 0.2, 1] as const },
  });

  return (
    <div>
      {/* ============ HERO ============ */}
      <div className="pt-20 pb-6">
        <div className="container-bold">
          <div className="relative overflow-hidden rounded-[2rem] lg:rounded-[2.5rem] min-h-[420px] md:h-[52vh] md:min-h-[440px] lg:h-[54vh] lg:min-h-[460px] lg:max-h-[560px] shadow-[0_16px_40px_-16px_rgba(0,0,0,0.3)] ring-1 ring-black/5">
            <AnimatePresence mode="wait">
              <motion.div key={currentSlide} initial={{ opacity: 0, scale: 1.06 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 1.2, ease: 'easeOut' }} className="absolute inset-0">
                <Image src={currentImage} alt="" fill sizes="100vw" priority className="object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/20" />
                <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/30 to-transparent" />
              </motion.div>
            </AnimatePresence>

            {/* Content */}
            <div className="relative z-10 h-full flex flex-col justify-center pb-10 pt-12">
              <div className="w-full px-6 sm:px-8 lg:px-12 max-w-3xl">
                <AnimatePresence mode="wait">
                  <motion.div key={currentSlide} initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.6, delay: 0.15, ease: 'easeOut' }}>
                    <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-3 border border-white/15 bg-white/10 backdrop-blur-md shadow-sm">
                      <span className="w-1.5 h-1.5 rounded-full bg-brand-orange shadow-[0_0_8px_rgba(232,93,38,0.6)]" />
                      <span className="text-white text-[10px] font-bold tracking-[0.14em] uppercase">{slideLabel}</span>
                    </div>
                    <h1 className="font-display text-white font-[800] leading-[1.04] tracking-[-0.02em] mb-2.5 text-balance drop-shadow-[0_4px_24px_rgba(0,0,0,0.4)]" style={{ fontSize: 'clamp(1.95rem, 4.2vw, 3.25rem)', textShadow: '0 2px 24px rgba(0,0,0,0.35), 0 1px 2px rgba(0,0,0,0.4)' }}>
                      {slideTitle}
                    </h1>

                    <p className="leading-relaxed mb-4 max-w-[560px] text-[15px]" style={{ color: 'rgba(255,255,255,0.72)' }}>
                      {slideDesc}
                    </p>

                    <div className="flex flex-wrap items-center gap-3 mb-5">
                      <button onClick={() => navigate('courses')} className="group inline-flex items-center gap-2 px-6 py-3 text-sm font-bold tracking-wide text-white rounded-xl shadow-lg shadow-brand-orange/25 hover:shadow-brand-orange/40 hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-200" style={{ background: 'linear-gradient(135deg, #E85D26, #DC3545)' }}>
                        {t(locale, 'hero_cta_primary')}
                        <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                      </button>
                      <button onClick={() => navigate('online_booking')} className="group inline-flex items-center gap-2 px-5 py-3 text-sm font-semibold tracking-wide text-white rounded-xl border border-white/15 bg-white/10 backdrop-blur-xl hover:bg-white/15 transition-all duration-200">
                        <CalendarIcon className="w-4 h-4" />
                        {t(locale, 'nav_online_booking')}
                      </button>
                    </div>

                    <div className="inline-flex items-center rounded-2xl bg-white/[0.07] backdrop-blur-xl border border-white/10 overflow-hidden shadow-[0_8px_24px_rgba(0,0,0,0.2)]">
                      {[
                        { v: `${stats.students}+`, l: t(locale, 'stats_students') },
                        { v: `${stats.years}+`, l: t(locale, 'stats_years') },
                        { v: `${stats.courses}+`, l: t(locale, 'stats_courses') },
                      ].map((s, i, arr) => (
                        <div key={i} className={`flex items-center gap-3 px-4 sm:px-5 py-3 ${i !== arr.length - 1 ? 'border-e border-white/10' : ''}`}>
                          <div>
                            <p className="font-display text-[17px] font-extrabold leading-none text-white number-display">{s.v}</p>
                            <p className="text-[10px] font-semibold tracking-wide mt-1" style={{ color: 'rgba(255,255,255,0.55)' }}>{s.l}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Carousel controls */}
              <div className="flex items-center gap-3 mt-5 px-6 sm:px-8 lg:px-12">
                <button onClick={prevSlide} aria-label="السابق" className="w-10 h-10 rounded-full border border-white/15 bg-white/10 backdrop-blur-xl flex items-center justify-center text-white hover:bg-white/15 hover:scale-105 active:scale-95 transition-all duration-200 shadow-lg">
                  <BackArrow className="w-4 h-4" />
                </button>
                <div className="flex items-center gap-2 rounded-full px-3 py-2 bg-black/20 backdrop-blur-xl border border-white/10">
                  {Array.from({ length: slideCount }).map((_, i) => (
                    <button key={i} onClick={() => setCurrentSlide(i)} onMouseEnter={() => setIsAutoPlaying(false)} onMouseLeave={() => setIsAutoPlaying(true)}
                      aria-label={`Slide ${i + 1}`}
                      className="h-1.5 rounded-full transition-all duration-300"
                      style={{ width: i === currentSlide ? '28px' : '8px', background: i === currentSlide ? 'linear-gradient(90deg, #E85D26, #DC3545)' : 'rgba(255,255,255,0.35)' }} />
                  ))}
                </div>
                <button onClick={nextSlide} aria-label="التالي" className="w-10 h-10 rounded-full border border-white/15 bg-white/10 backdrop-blur-xl flex items-center justify-center text-white hover:bg-white/15 hover:scale-105 active:scale-95 transition-all duration-200 shadow-lg">
                  <FwdArrow className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Scroll hint */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 hidden md:block">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.6 }} className="flex flex-col items-center gap-1.5">
                <span className="text-[10px] uppercase tracking-[0.2em]" style={{ color: 'rgba(255,255,255,0.35)' }}>{t(locale, 'nav_courses')}</span>
                <div className="w-5 h-9 rounded-full border border-white/20 flex items-start justify-center p-1.5">
                  <motion.div animate={{ y: [0, 14, 0] }} transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }} className="w-1 h-2.5 rounded-full" style={{ background: '#E85D26' }} />
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>

      {/* ============ VALUE BAND ============ */}
      <section className="py-12">
        <div className="container-bold">
          <div className="relative overflow-hidden rounded-[2rem] lg:rounded-[2.5rem] bg-brand-warm dark:bg-accent px-6 sm:px-10 lg:px-14 py-12 lg:py-16">
            {/* Soft organic brand shapes */}
            <div className="absolute -top-24 -start-16 w-72 h-72 rounded-full bg-brand-orange/10 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -end-10 w-72 h-72 rounded-full bg-brand-red/10 blur-3xl pointer-events-none" />
            <div className="relative grid lg:grid-cols-[0.9fr_1.1fr] gap-10 lg:gap-14 items-center">
              <div>
                <span className="inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 mb-5 border border-brand-orange/25 bg-brand-orange/5">
                  <span className="w-1.5 h-1.5 bg-brand-orange rounded-full" />
                  <span className="text-brand-orange text-[11px] font-bold tracking-wide uppercase">{t(locale, 'home_why_omar')}</span>
                </span>
                <h2 className="font-display text-2xl sm:text-3xl lg:text-[2.1rem] font-black text-foreground leading-tight mb-3 text-balance">
                  {t(locale, 'home_features_lead')}
                </h2>
                <p className="text-muted-foreground leading-relaxed text-sm max-w-md">{t(locale, 'home_features_lead_desc')}</p>
              </div>
              <div className="grid sm:grid-cols-2 gap-x-8 gap-y-7">
                {features.map((f, i) => (
                  <motion.div key={i} {...fade(i * 0.06)} className="flex items-start gap-3.5">
                    <f.icon className={`w-5 h-5 mt-0.5 shrink-0 ${f.color}`} />
                    <div className="min-w-0">
                      <p className="font-display font-bold text-[15px] text-foreground leading-tight">{t(locale, f.titleKey as any)}</p>
                      <p className="text-[12px] text-muted-foreground mt-1 leading-relaxed">{t(locale, f.descKey as any)}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ WHY OMAR ============ */}
      <section className="py-16 lg:py-20 bg-brand-warm dark:bg-accent relative overflow-hidden">
        <div className="container-bold">
          <motion.div {...fade(0)}>
            <SectionTitle badge={t(locale, 'home_why_omar')} title={t(locale, 'home_why_omar')} subtitle={t(locale, 'home_why_subtitle')} />
          </motion.div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {whyOmar.map((item, i) => (
              <motion.div key={i} {...fade(i * 0.07)}>
                <div className="group h-full p-6 rounded-2xl border border-border/70 bg-card hover:border-brand-orange/30 hover:-translate-y-1 transition-all duration-300">
                  <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${item.gradient} flex items-center justify-center mb-4 shadow-md shadow-black/5 group-hover:scale-105 transition-transform duration-300`}>
                    <item.icon className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="font-display font-bold text-foreground mb-1.5 text-[15px]">{t(locale, item.titleKey as any)}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{t(locale, item.descKey as any)}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ TEACHER ============ */}
      <section className="py-16 lg:py-24 bg-card relative overflow-hidden">
        <div className="container-bold">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            <motion.div {...fade(0)} className="relative">
              <div className="relative rounded-3xl overflow-hidden shadow-[0_24px_60px_-12px_rgba(0,0,0,0.25)] ring-1 ring-border bg-brand-warm dark:bg-accent">
                <div className="aspect-[4/5] sm:aspect-[5/6] w-full">
                  <Image src="/images/teacher/omar-hero.png" alt="Omar — الأستاذ عمر" fill sizes="(max-width:1024px) 100vw, 45vw" className="object-cover object-top" priority />
                </div>
                <div className="absolute bottom-0 inset-x-0 h-28 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
              </div>
              <div className="absolute -bottom-4 start-6 px-4 py-3 rounded-xl bg-card border border-border shadow-card">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-brand-orange to-brand-red flex items-center justify-center">
                    <Award className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="font-display text-base font-extrabold text-gradient leading-none">{t(locale, 'home_teacher_years')}</p>
                    <p className="text-[10px] text-muted-foreground font-semibold mt-1">{t(locale, 'home_teacher_years_sub')}</p>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div {...fade(0.1)}>
              <div className="inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 mb-5 border border-brand-orange/25 bg-brand-orange/5">
                <span className="w-1.5 h-1.5 bg-brand-orange rounded-full" />
                <span className="text-brand-orange text-[11px] font-bold tracking-wide uppercase">{t(locale, 'home_teacher_badge')}</span>
              </div>
              <h2 className="font-display text-3xl sm:text-4xl font-black text-foreground leading-tight mb-4 text-balance">
                {t(locale, 'home_teacher_title_1')} <span className="text-gradient">{t(locale, 'home_teacher_title_2')}</span>
              </h2>
              <p className="text-muted-foreground leading-relaxed text-base mb-7">
                {t(locale, 'home_teacher_desc')}
              </p>
              <div className="grid grid-cols-2 gap-x-6 gap-y-4 mb-7">
                {[{ icon: GraduationCap, title: t(locale, 'home_teacher_stat_1'), count: t(locale, 'home_teacher_stat_3') }, { icon: Target, title: t(locale, 'home_teacher_stat_2') }, { icon: Users, title: t(locale, 'home_teacher_stat_3') }, { icon: BookOpen, title: t(locale, 'home_teacher_stat_4') }].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 pb-3 border-b border-border/70 last:border-0">
                    <div className="w-9 h-9 rounded-lg bg-brand-orange/10 flex items-center justify-center shrink-0">
                      <item.icon className="w-4 h-4 text-brand-orange" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-display text-sm font-bold text-foreground leading-tight">{item.title}</h3>
                      <p className="text-xs text-muted-foreground">{item.count}</p>
                    </div>
                  </div>
                ))}
              </div>
              <button onClick={() => navigate('about')} className="group inline-flex items-center gap-2 text-sm font-bold text-brand-orange hover:text-brand-orange-dark transition-colors">
                {t(locale, 'hero_cta_secondary')}
                <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ============ STATS ============ */}
      <section className="py-12 bg-card border-y border-border/60 dark:border-border" ref={setCountersRef}>
        <div className="container-bold">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { count: yearsCount.count, label: t(locale, 'stats_years'), icon: Award },
              { count: coursesCount.count, label: t(locale, 'stats_courses'), icon: BookOpen },
              { count: lessonsCount.count, label: t(locale, 'stats_lessons'), icon: Clock },
              { count: studentsCount.count, label: t(locale, 'stats_students'), icon: Users },
            ].map((item, i) => (
              <motion.div key={i} {...fade(i * 0.06)} className="flex items-center gap-4">
                <div className="w-11 h-11 shrink-0 rounded-xl bg-brand-orange/8 flex items-center justify-center">
                  <item.icon className="w-5 h-5 text-brand-orange" />
                </div>
                <div>
                  <div className="font-display text-2xl md:text-3xl font-extrabold text-foreground tracking-tight leading-none number-display">
                    {item.count}<span className="text-gradient">+</span>
                  </div>
                  <p className="text-[11px] font-semibold tracking-wider text-muted-foreground mt-1">{item.label}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ LEVELS ============ */}
      <section className="py-16 lg:py-20 bg-brand-warm dark:bg-accent relative overflow-hidden">
        <div className="container-bold">
          <motion.div {...fade(0)}>
            <SectionTitle badge={t(locale, 'home_levels_badge')} title={t(locale, 'home_levels_title')} subtitle={t(locale, 'home_levels_subtitle')} />
          </motion.div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {LEVELS.map((level, i) => (
              <motion.button key={level} {...fade(i * 0.06)}
                onClick={() => navigate('courses')}
                className="group relative p-5 rounded-xl border border-border/70 bg-card hover:border-brand-orange/40 hover:-translate-y-1 transition-all duration-300 text-center overflow-hidden">
                <span className="font-display text-4xl font-black absolute -top-0.5 -end-0.5 opacity-[0.06] text-foreground">{level}</span>
                <div className="relative z-10">
                  <div className="w-11 h-11 mx-auto mb-3 rounded-lg bg-gradient-to-br from-brand-orange/10 to-brand-red/10 flex items-center justify-center group-hover:from-brand-orange group-hover:to-brand-red transition-all duration-300">
                    <span className="font-display text-base font-extrabold text-brand-orange group-hover:text-white transition-colors duration-300">{level}</span>
                  </div>
                  <div className="flex items-center justify-center gap-1 text-[11px] font-semibold text-muted-foreground group-hover:text-brand-orange transition-colors duration-200">
                    <span>{t(locale, 'courses_view_details')}</span>
                    <Play className="w-3 h-3" />
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      </section>

      {/* ============ EDUCATIONAL VIDEOS ============ */}
      {reels.length > 0 && (
        <section className="py-16 lg:py-20 bg-brand-warm dark:bg-accent relative overflow-hidden">
          <div className="container-bold">
            <motion.div {...fade(0)}>
              <SectionTitle badge={t(locale, 'reels_title')} title={t(locale, 'reels_title')} subtitle={t(locale, 'reels_subtitle')} />
            </motion.div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-4xl mx-auto">
              {reels.slice(0, 3).map((reel, i) => (
                <motion.button key={reel.id} {...fade(i * 0.07)}
                  onClick={() => setActiveReel(reel)}
                  className="group relative aspect-[9/16] rounded-2xl overflow-hidden shadow-lg shadow-black/10 ring-1 ring-black/5 dark:ring-white/10 cursor-pointer text-start">
                  {reel.thumbnail ? (
                    <Image src={reel.thumbnail} alt={getReelField(reel, 'title')} fill sizes="(max-width:1024px) 50vw, 25vw" className="object-cover group-hover:scale-[1.03] transition-transform duration-500" />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-brand-dark to-[#1a1008]" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <motion.div whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.96 }}
                      className="w-14 h-14 rounded-full flex items-center justify-center border border-white/25 backdrop-blur-md transition-all"
                      style={{ background: 'rgba(0,0,0,0.4)' }}>
                      <Play className="w-5 h-5 text-white ms-0.5 fill-white" />
                    </motion.div>
                  </div>
                  <div className="absolute bottom-0 inset-x-0 p-4">
                    <h3 className="font-display text-sm font-bold text-white mb-1 line-clamp-2">{getReelField(reel, 'title')}</h3>
                    {formatDuration(reel.duration) && (
                      <p className="text-[11px] font-semibold text-white/60">{formatDuration(reel.duration)}</p>
                    )}
                  </div>
                </motion.button>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ============ REEL MODAL ============ */}
      <AnimatePresence>
        {activeReel && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
            onClick={() => setActiveReel(null)}>
            <motion.div initial={{ opacity: 0, scale: 0.96, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96, y: 12 }} transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-2xl relative">
              <button onClick={() => setActiveReel(null)} aria-label="إغلاق"
                className="absolute -top-11 end-0 text-white/70 hover:text-white transition-colors text-sm font-bold flex items-center gap-1">
                <X className="w-5 h-5" />
              </button>
              {(() => {
                const embed = getReelEmbedUrl(activeReel);
                return embed ? (
                  <div className="relative rounded-2xl overflow-hidden shadow-2xl" style={{ aspectRatio: '16/9' }}>
                    <iframe src={embed} title={getReelField(activeReel, 'title')} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen className="absolute inset-0 w-full h-full" />
                  </div>
                ) : (
                  <video src={activeReel.videoUrl} controls autoPlay className="w-full rounded-2xl shadow-2xl" style={{ aspectRatio: '16/9' }} />
                );
              })()}
              <div className="mt-4 text-center">
                <h3 className="font-display text-lg font-black text-white">{getReelField(activeReel, 'title')}</h3>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ============ TESTIMONIALS ============ */}
      {testimonials.length > 0 && (
        <section className="py-16 lg:py-20 bg-white dark:bg-card relative overflow-hidden">
          <div className="container-bold">
            <motion.div {...fade(0)}>
              <SectionTitle badge={t(locale, 'testimonials_title')} title={t(locale, 'testimonials_title')} subtitle={t(locale, 'testimonials_subtitle')} />
            </motion.div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {testimonials.slice(0, 3).map((testimonial, i) => (
                <motion.div key={testimonial.id} {...fade(i * 0.07)}>
                  <div className="p-6 h-full rounded-2xl border border-border/70 bg-card hover:border-brand-orange/25 transition-colors duration-300">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-orange to-brand-red flex items-center justify-center text-white text-base font-bold shrink-0">
                        {getTestimonialField(testimonial as unknown as Record<string, unknown>, 'name').charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <p className="font-display font-bold text-sm text-foreground truncate">{getTestimonialField(testimonial as unknown as Record<string, unknown>, 'name')}</p>
                        <p className="text-xs text-muted-foreground truncate">{getTestimonialField(testimonial as unknown as Record<string, unknown>, 'role')}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-0.5 mb-3">
                      {Array.from({ length: 5 }).map((_, j) => (
                        <Star key={j} className={'w-3.5 h-3.5 ' + (j < testimonial.rating ? 'text-amber-400 fill-amber-400' : 'text-muted')} />
                      ))}
                    </div>
                    <p className="text-sm leading-relaxed text-foreground/75">&ldquo;{getTestimonialField(testimonial as unknown as Record<string, unknown>, 'text')}&rdquo;</p>
                    {testimonial.level && <span className="inline-block mt-4 level-badge">{testimonial.level}</span>}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ============ BLOG / POSTS ============ */}
      {posts.length > 0 && (
        <section className="py-16 lg:py-20 bg-brand-warm dark:bg-accent relative overflow-hidden">
          <div className="container-bold">
            <motion.div {...fade(0)}>
              <div className="flex items-end justify-between gap-4">
                <SectionTitle badge={t(locale, 'home_latest_posts')} title={t(locale, 'home_latest_posts')} />
                <button onClick={() => navigate('posts')} className="hidden sm:flex items-center gap-1.5 text-xs font-bold text-brand-orange hover:text-brand-orange-dark transition-colors pb-1 shrink-0">
                  {t(locale, 'home_view_all')} <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {posts.slice(0, 3).map((post, i) => (
                <motion.div key={post.id} {...fade(i * 0.07)}>
                  <div onClick={() => navigate('post-detail', { id: post.id })} className="group cursor-pointer">
                    <div className="overflow-hidden rounded-xl border border-border/70 bg-card hover:border-brand-orange/30 hover:-translate-y-1 transition-all duration-300">
                      <div className="relative aspect-[16/10] overflow-hidden">
                        <Image src={post.imageUrl || '/images/berlin/brandenburg-gate.png'} alt={getPostField(post as unknown as Record<string, unknown>, 'title')} fill sizes="(max-width:1024px) 100vw, 33vw" className="object-cover group-hover:scale-[1.04] transition-transform duration-500" />
                        {post.category && <span className="absolute top-3 start-3 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider bg-brand-orange text-white rounded-md">{post.category}</span>}
                      </div>
                      <div className="p-5">
                        <h3 className="font-display font-bold text-foreground mb-1.5 line-clamp-2 group-hover:text-brand-orange transition-colors text-[15px] leading-snug">{getPostField(post as unknown as Record<string, unknown>, 'title')}</h3>
                        <p className="text-[13px] text-muted-foreground line-clamp-2 mb-3 leading-relaxed">{getPostField(post as unknown as Record<string, unknown>, 'excerpt')}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] text-muted-foreground font-medium">{new Date(post.createdAt).toLocaleDateString(locale === 'ar' ? 'ar-SA' : locale === 'de' ? 'de-DE' : 'en-US')}</span>
                          <span className="text-[11px] font-bold text-brand-orange flex items-center gap-1 group-hover:gap-1.5 transition-all">{t(locale, 'home_read_more')} <ArrowUpRight className="w-3 h-3" /></span>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ============ FINAL CTA ============ */}
      <section className="py-14">
        <div className="container-bold">
          <motion.div {...fade(0)}>
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-dark via-[#1a1008] to-[#0f0f0f] px-6 py-10 sm:p-12 lg:p-14 text-center">
              <img
                src="/images/berlin/brandenburg-gate.png"
                alt=""
                className="absolute inset-0 w-full h-full object-cover opacity-40 select-none pointer-events-none"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-black/60 pointer-events-none" />
              <div className="absolute top-0 start-1/2 -translate-x-1/2 w-[420px] h-[220px] rounded-full blur-[90px] pointer-events-none" style={{ background: 'rgba(232, 93, 38, 0.22)' }} />
              <div className="absolute bottom-0 end-0 w-[320px] h-[180px] rounded-full blur-[80px] pointer-events-none" style={{ background: 'rgba(220, 53, 69, 0.16)' }} />
              <div className="relative z-10 max-w-xl mx-auto">
                <div className="inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 mb-5 border border-white/15" style={{ background: 'rgba(255,255,255,0.05)' }}>
                  <span className="w-1.5 h-1.5 bg-brand-orange rounded-full" />
                  <span className="text-[11px] font-semibold tracking-[0.15em] uppercase" style={{ color: 'rgba(255,255,255,0.75)' }}>Deutsch mit Omar</span>
                </div>
                <h2 className="font-display text-2xl sm:text-3xl lg:text-[2.4rem] font-black text-white leading-tight mb-3 text-balance">{t(locale, 'carousel_3_title')}</h2>
                <p className="leading-relaxed mb-7 text-sm sm:text-base max-w-md mx-auto" style={{ color: 'rgba(255,255,255,0.5)' }}>{t(locale, 'carousel_3_desc')}</p>
                <button onClick={() => navigate('courses')} className="group inline-flex items-center gap-2 px-6 py-3 text-sm font-bold tracking-wide uppercase text-white rounded-xl shadow-lg shadow-brand-orange/30 hover:shadow-brand-orange/45 hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-200" style={{ background: 'linear-gradient(135deg, #E85D26, #DC3545)' }}>
                  {t(locale, 'hero_cta_primary')}
                  <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}

function CalendarIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  );
}