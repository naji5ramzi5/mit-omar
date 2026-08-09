'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, BookOpen, Users, Award, Clock, GraduationCap, Headphones, Globe, Sparkles, Play, ArrowUpRight, MessageCircle, PenTool, Mic, BookMarked, Lightbulb, Languages, Target, CheckCircle2 } from 'lucide-react';
import { useAppStore } from '@/stores/app-store';
import { t } from '@/lib/i18n';
import { useCountUp, useInView } from '@/hooks/use-scroll';
import Image from 'next/image';

interface Banner {
  id: string;
  titleAr: string; titleDe: string; titleEn: string;
  descriptionAr?: string; descriptionDe?: string; descriptionEn?: string;
  labelAr?: string; labelDe?: string; labelEn?: string;
  imageUrl?: string;
  order: number;
}

interface SiteStat {
  students: number;
  years: number;
  courses: number;
  lessons: number;
}

const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1'];
const berlinImages = [
  '/images/berlin/brandenburg-gate.png',
  '/images/berlin/reichstag.png',
  '/images/berlin/skyline.png',
  '/images/berlin/cathedral.png',
];

const features = [
  { icon: GraduationCap, key: 'about_qual_1' },
  { icon: Headphones, key: 'about_qual_3' },
  { icon: Globe, key: 'about_qual_2' },
  { icon: Sparkles, key: 'about_qual_4' },
];

const germanLevels = [
  { level: 'A1', titleAr: 'المستوى المبتدئ', descAr: 'أساسيات اللغة والتعريف بالنفس والحياة اليومية', color: 'from-green-400 to-emerald-500', icon: BookMarked },
  { level: 'A2', titleAr: 'المستوى elementary', descAr: 'فهم المحادثات البسيطة والتعامل في المواقف اليومية', color: 'from-blue-400 to-cyan-500', icon: MessageCircle },
  { level: 'B1', titleAr: 'المستوى المتوسط', descAr: 'التعبير عن الآراء وفهم النصوص المعقدة نسبياً', color: 'from-brand-orange to-amber-500', icon: PenTool },
  { level: 'B2', titleAr: 'المستوى فوق المتوسط', descAr: 'الطلاقة في المحادثة وفهم الأفلام والمقالات', color: 'from-brand-red to-rose-500', icon: Mic },
  { level: 'C1', titleAr: 'المستوى المتقدم', descAr: 'إتقان اللغة والتحدث بطلاقة شبه محلية', color: 'from-purple-500 to-violet-500', icon: Languages },
];

const learningTips = [
  { icon: MessageCircle, title: 'تحدّث يومياً', desc: 'مارس المحادثة بالألماني حتى لو 10 دقائق يومياً' },
  { icon: BookOpen, title: 'اقرأ النصوص', desc: 'ابدأ بنصوص بسيطة وزد الصعوبة تدريجياً' },
  { icon: Mic, title: 'استمع وكرر', desc: 'استمع للأغاني والأفلام الألمانية وكرر الجمل' },
  { icon: PenTool, title: 'اكتب يومياتك', desc: 'اكتب جمل بسيطة عن يومك بالألماني' },
];

export default function HomeView() {
  const { locale, navigate } = useAppStore();
  const [banners, setBanners] = useState<Banner[]>([]);
  const [stats, setStats] = useState<SiteStat>({ students: 500, years: 8, courses: 15, lessons: 200 });
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  const studentsCount = useCountUp(stats.students, 2000, true);
  const yearsCount = useCountUp(stats.years, 2000, true);
  const coursesCount = useCountUp(stats.courses, 2000, true);
  const lessonsCount = useCountUp(stats.lessons, 2000, true);

  const setCountersRef = (el: HTMLElement | null) => {
    studentsCount.ref(el);
    yearsCount.ref(el);
    coursesCount.ref(el);
    lessonsCount.ref(el);
  };

  const { ref: teacherRef, isInView: teacherInView } = useInView(0.1);
  const { ref: levelsRef, isInView: levelsInView } = useInView(0.1);
  const { ref: tipsRef, isInView: tipsInView } = useInView(0.1);
  const { ref: germanRef, isInView: germanInView } = useInView(0.1);

  useEffect(() => {
    fetch('/api/courses?includeLessons=false&limit=100')
      .then(r => r.json())
      .then(data => { if (data.courses) setStats(s => ({ ...s, courses: data.courses.length })); }).catch(() => {});
    fetch('/api/stats')
      .then(r => r.json())
      .then(data => {
        if (data.students) setStats(s => ({ ...s, students: data.students }));
        if (data.years) setStats(s => ({ ...s, years: data.years }));
        if (data.lessons) setStats(s => ({ ...s, lessons: data.lessons }));
      }).catch(() => {});
    fetch('/api/banners')
      .then(r => r.json())
      .then(data => { if (data.banners?.length) setBanners(data.banners); }).catch(() => {});
  }, []);

  const slideCount = banners.length > 0 ? banners.length : berlinImages.length;

  const getBannerField = useCallback((banner: Banner, field: string) => {
    const localeKey = locale.charAt(0).toUpperCase() + locale.slice(1);
    return (banner as Record<string, unknown>)[`${field}${localeKey}`] as string || '';
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
    timerRef.current = setTimeout(() => { setCurrentSlide(p => (p + 1) % slideCount); }, 6000);
    return () => clearTimeout(timerRef.current);
  }, [isAutoPlaying, currentSlide, slideCount]);

  const banner = banners.length > 0 ? banners[currentSlide] : null;
  const currentImage = banner?.imageUrl || berlinImages[currentSlide % berlinImages.length];
  const slideLabel = banner ? getBannerField(banner, 'label') : t(locale, `carousel_${currentSlide + 1}_label` as keyof typeof import('@/lib/i18n').translations.en);
  const slideTitle = banner ? getBannerField(banner, 'title') : t(locale, `carousel_${currentSlide + 1}_title` as keyof typeof import('@/lib/i18n').translations.en);
  const slideDesc = banner ? getBannerField(banner, 'description') : t(locale, `carousel_${currentSlide + 1}_desc` as keyof typeof import('@/lib/i18n').translations.en);

  const isRtl = locale === 'ar';
  const BackArrow = isRtl ? ArrowRight : ArrowLeft;
  const FwdArrow = isRtl ? ArrowLeft : ArrowRight;

  return (
    <div>
      {/* ═══════════ HERO CAROUSEL (Full Width — No Teacher) ═══════════ */}
      <section className="relative h-[80vh] sm:h-[85vh] min-h-[500px] sm:min-h-[600px] max-h-[900px] overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, scale: 1.06 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2, ease: [0.4, 0, 0.2, 1] }}
            className="absolute inset-0"
          >
            <div className="absolute inset-0">
              <Image src={currentImage} alt="" fill className="object-cover scale-105" priority />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/60 to-black/30" />
              <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/30 to-transparent" />
              {/* Extra overlay for premium depth */}
              <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/40" />
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Floating decorative elements */}
        <div className="absolute top-1/4 end-8 w-3 h-3 bg-brand-orange rounded-full animate-float opacity-50" />
        <div className="absolute top-1/3 start-12 w-2 h-2 bg-brand-red rounded-full animate-float opacity-35" style={{ animationDelay: '1s' }} />
        <div className="absolute bottom-1/3 end-1/4 w-1.5 h-1.5 bg-brand-orange-light rounded-full animate-float opacity-40" style={{ animationDelay: '2s' }} />

        <div className="relative z-10 h-full flex items-center pb-16 sm:pb-20">
          <div className="container-bold w-full">
            <div className="max-w-3xl">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentSlide}
                  initial={{ opacity: 0, y: 40 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.8, delay: 0.3, ease: [0.4, 0, 0.2, 1] }}
                >
                  <span className="inline-flex items-center gap-2 text-brand-orange text-[11px] font-bold uppercase tracking-[0.25em] mb-6">
                    <span className="w-12 h-0.5 bg-gradient-to-r from-brand-orange to-brand-red rounded-full" />
                    {slideLabel}
                  </span>
                  <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-white leading-[1.05] mb-6 tracking-tight drop-shadow-2xl">
                    {slideTitle}
                  </h1>
                  <p className="text-lg sm:text-xl text-white/60 leading-[1.8] mb-10 max-w-xl drop-shadow-lg">
                    {slideDesc}
                  </p>
                  <div className="flex flex-wrap items-center gap-4">
                    <button onClick={() => navigate('courses')} className="group inline-flex items-center gap-3 px-6 sm:px-10 py-3.5 sm:py-4 text-sm font-bold tracking-wide uppercase bg-gradient-to-r from-brand-orange to-brand-red text-white rounded-2xl hover:from-brand-orange-dark hover:to-brand-red-dark active:scale-[0.97] transition-all duration-300 shadow-glow-lg hover:shadow-brand-orange/50">
                      {t(locale, 'hero_cta_primary')}
                      <ArrowUpRight className="w-5 h-5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                    </button>
                    <button
                      onClick={() => navigate('about')}
                      className="group inline-flex items-center gap-2 px-6 sm:px-8 py-3.5 sm:py-4 text-sm font-semibold tracking-wide text-white/80 rounded-2xl border-2 border-white/20 hover:bg-white/10 hover:border-white/30 active:scale-[0.97] transition-all duration-300 backdrop-blur-sm"
                    >
                      {t(locale, 'hero_cta_secondary')}
                    </button>
                  </div>
                </motion.div>
              </AnimatePresence>

              {/* Carousel Controls */}
              <div className="flex items-center gap-4 mt-12">
                <button onClick={prevSlide} className="w-12 h-12 rounded-2xl border-2 border-white/20 flex items-center justify-center text-white/50 hover:text-white hover:border-brand-orange hover:bg-brand-orange/15 transition-all duration-300 backdrop-blur-sm">
                  <BackArrow className="w-5 h-5" />
                </button>
                <div className="flex items-center gap-2">
                  {Array.from({ length: slideCount }).map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentSlide(i)}
                      onMouseEnter={() => setIsAutoPlaying(false)}
                      onMouseLeave={() => setIsAutoPlaying(true)}
                      className={`h-2 rounded-full transition-all duration-500 ${
                        i === currentSlide ? 'w-14 bg-gradient-to-r from-brand-orange to-brand-red shadow-glow' : 'w-3 bg-white/30 hover:bg-white/50'
                      }`}
                    />
                  ))}
                </div>
                <button onClick={nextSlide} className="w-12 h-12 rounded-2xl border-2 border-white/20 flex items-center justify-center text-white/50 hover:text-white hover:border-brand-orange hover:bg-brand-orange/15 transition-all duration-300 backdrop-blur-sm">
                  <FwdArrow className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ TEACHER SECTION ═══════════ */}
      <section className="py-14 sm:py-20 lg:py-28 bg-brand-warm dark:bg-accent relative overflow-hidden">
        <div className="absolute top-0 start-0 w-96 h-96 bg-brand-orange/5 rounded-full blur-[120px] -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 end-0 w-72 h-72 bg-brand-red/5 rounded-full blur-[100px] translate-x-1/3 translate-y-1/3" />

        <div className="container-bold" ref={teacherRef}>
          <div className="grid lg:grid-cols-2 gap-10 sm:gap-14 lg:gap-20 items-center">
            {/* Teacher Image */}
            <motion.div
              initial={{ opacity: 0, x: isRtl ? 60 : -60 }}
              animate={teacherInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
              className="relative"
            >
              <div className="relative">
                {/* Decorative frame */}
                <div className="absolute -top-6 -start-6 w-full h-full border-2 border-brand-orange/20 rounded-3xl" />
                <div className="absolute -bottom-6 -end-6 w-full h-full border-2 border-brand-red/15 rounded-3xl" />

                {/* Image */}
                <div className="relative rounded-3xl overflow-hidden shadow-2xl shadow-black/15">
                  <Image
                    src="/images/teacher/omar-hero.png"
                    alt="Omar — German Language Teacher"
                    width={600}
                    height={800}
                    className="w-full h-auto object-cover"
                    priority
                  />
                  <div className="absolute bottom-0 inset-x-0 h-40 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
                </div>

                {/* Experience Badge */}
                <div className="absolute -bottom-5 start-8 bg-white dark:bg-card rounded-2xl shadow-card-hover p-5 border-2 border-border/50">
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-brand-orange to-brand-red flex items-center justify-center shadow-glow">
                      <Award className="w-7 h-7 text-white" />
                    </div>
                    <div>
                      <p className="text-2xl font-black text-gradient">8+ سنوات</p>
                      <p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground font-bold">{t(locale, 'stats_years')} من الخبرة</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Teacher Info */}
            <motion.div
              initial={{ opacity: 0, x: isRtl ? -60 : 60 }}
              animate={teacherInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.2, ease: [0.4, 0, 0.2, 1] }}
            >
              <span className="inline-flex items-center gap-2 text-brand-orange text-[11px] font-bold uppercase tracking-[0.25em] mb-5">
                <span className="w-10 h-0.5 bg-gradient-to-r from-brand-orange to-brand-red rounded-full" />
                المدرس المعتمد
              </span>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-foreground leading-tight mb-6">
                تعلّم الألمانية مع <span className="text-gradient">الأستاذ عمر</span>
              </h2>
              <p className="text-muted-foreground leading-[1.9] text-lg mb-8">
                مدرس ألماني معتمد بخبرة تزيد عن 8 سنوات في تعليم اللغة الألمانية للناطقين بالعربية. متخصص في تحضير الطلاب لاختبارات Goethe من A1 إلى C1 بمنهج مبسط وأساليب تفاعلية حديثة.
              </p>

              <div className="grid grid-cols-2 gap-4 mb-8">
                {[
                  { icon: GraduationCap, text: 'شهادة Goethe المعتمدة', color: 'from-brand-orange/10 to-brand-red/10' },
                  { icon: Target, text: 'نجاح 95%+ في الاختبارات', color: 'from-green-500/10 to-emerald-500/10' },
                  { icon: Users, text: '+500 طالب نشط', color: 'from-blue-500/10 to-cyan-500/10' },
                  { icon: BookOpen, text: '+200 درس مسجل', color: 'from-purple-500/10 to-violet-500/10' },
                ].map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 16 }}
                    animate={teacherInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ delay: 0.4 + i * 0.1, duration: 0.5 }}
                    className="flex items-center gap-3 p-4 rounded-2xl bg-white dark:bg-card border-2 border-border/30 hover:border-brand-orange/25 hover:shadow-card-hover transition-all duration-300 group"
                  >
                    <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform`}>
                      <item.icon className="w-5 h-5 text-brand-orange" />
                    </div>
                    <p className="text-sm font-semibold text-foreground/80">{item.text}</p>
                  </motion.div>
                ))}
              </div>

              <button
                onClick={() => navigate('about')}
                className="group inline-flex items-center gap-2 text-sm font-bold text-brand-orange hover:text-brand-orange-dark transition-colors duration-300"
              >
                {t(locale, 'hero_cta_secondary')}
                <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ═══════════ STATS ═══════════ */}
      <section className="relative py-14 sm:py-18 bg-white dark:bg-card overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-brand-orange via-brand-red to-brand-orange" />
        <div className="absolute top-1/2 start-1/4 w-48 h-48 bg-brand-orange/5 rounded-full blur-[80px]" />
        <div className="absolute top-1/2 end-1/4 w-48 h-48 bg-brand-red/5 rounded-full blur-[80px]" />
        <div className="container-bold" ref={setCountersRef}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
            {[
              { count: yearsCount.count, label: t(locale, 'stats_years'), icon: Award, gradient: 'from-brand-orange/10 to-brand-red/10' },
              { count: coursesCount.count, label: t(locale, 'stats_courses'), icon: BookOpen, gradient: 'from-blue-500/10 to-blue-600/10' },
              { count: lessonsCount.count, label: t(locale, 'stats_lessons'), icon: Clock, gradient: 'from-green-500/10 to-green-600/10' },
              { count: studentsCount.count, label: t(locale, 'stats_students'), icon: Users, gradient: 'from-purple-500/10 to-purple-600/10' },
            ].map((item, i) => (
              <div key={i} className={`text-center ${i < 3 ? 'md:border-e md:border-border/60' : ''}`}>
                <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br ${item.gradient} flex items-center justify-center hover:scale-110 transition-transform shadow-card`}>
                  <item.icon className="w-7 h-7 text-brand-orange" />
                </div>
                <div className="text-4xl sm:text-5xl font-black text-foreground tracking-tight mb-1">
                  {item.count}<span className="text-gradient">+</span>
                </div>
                <p className="text-[11px] uppercase tracking-[0.15em] text-muted-foreground font-semibold">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ GERMAN LEVELS SECTION ═══════════ */}
      <section className="py-16 sm:py-24 lg:py-32 bg-white dark:bg-card relative overflow-hidden">
        <div className="absolute top-0 start-1/4 w-64 h-64 bg-brand-orange/5 rounded-full blur-[100px]" />
        <div className="absolute bottom-0 end-1/4 w-64 h-64 bg-brand-red/5 rounded-full blur-[100px]" />
        <div className="container-bold" ref={germanRef}>
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            animate={germanInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7 }}
            className="text-center mb-16"
          >
            <span className="inline-flex items-center gap-2 text-brand-orange text-[11px] font-bold uppercase tracking-[0.25em] mb-4">
              <span className="w-10 h-0.5 bg-gradient-to-r from-brand-orange to-brand-red rounded-full" />
              مستويات اللغة الألمانية
              <span className="w-10 h-0.5 bg-gradient-to-r from-brand-red to-brand-orange rounded-full" />
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-foreground">من الصفر إلى الاحتراف</h2>
            <p className="mt-4 text-muted-foreground text-lg max-w-2xl mx-auto">
              كل مستوى مصمم بعناية ليأخذك خطوة أخرى نحو إتقان اللغة الألمانية
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-5">
            {germanLevels.map((item, i) => (
              <motion.button
                key={item.level}
                initial={{ opacity: 0, y: 28 }}
                animate={germanInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: i * 0.1, ease: [0.4, 0, 0.2, 1] }}
                onClick={() => navigate('courses')}
                className="group relative p-7 text-center rounded-3xl border-2 border-border/50 bg-white dark:bg-card hover:border-brand-orange/30 hover:shadow-card-hover transition-all duration-500 cursor-pointer overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-brand-orange/5 to-brand-red/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative z-10">
                  <span className="text-5xl sm:text-7xl font-black text-foreground/10 group-hover:text-brand-orange/15 transition-colors duration-500 absolute -top-3 -end-1">{item.level}</span>
                  <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center group-hover:scale-110 transition-all duration-500 shadow-lg`}>
                    <item.icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="font-black text-foreground mb-1">{item.level}</h3>
                  <p className="text-xs font-semibold text-brand-orange mb-2">{item.titleAr}</p>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">{item.descAr}</p>
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ LEARNING TIPS ═══════════ */}
      <section className="py-16 sm:py-24 lg:py-32 bg-brand-warm dark:bg-accent relative overflow-hidden">
        <div className="absolute top-0 end-0 w-72 h-72 bg-brand-orange/5 rounded-full blur-[100px]" />
        <div className="absolute bottom-0 start-0 w-72 h-72 bg-brand-red/5 rounded-full blur-[100px]" />
        <div className="container-bold" ref={tipsRef}>
          <div className="grid lg:grid-cols-2 gap-10 sm:gap-14 lg:gap-20 items-center">
            <motion.div
              initial={{ opacity: 0, x: isRtl ? 40 : -40 }}
              animate={tipsInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.7 }}
            >
              <span className="inline-flex items-center gap-2 text-brand-orange text-[11px] font-bold uppercase tracking-[0.25em] mb-5">
                <span className="w-10 h-0.5 bg-gradient-to-r from-brand-orange to-brand-red rounded-full" />
                نصائح للتعلّم
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-foreground leading-tight mb-6">
                كيف تتعلّم الألمانية <span className="text-gradient">بفعالية</span>
              </h2>
              <p className="text-muted-foreground leading-[1.9] text-lg mb-4">
                تعلّم اللغة الجديدة ليس سهلاً، لكن بالطريقة الصحيحة يمكن أن يكون ممتعاً ومحفّزاً. إليك بعض النصائح المهمة من خبرتنا في تعليم الألمانية.
              </p>

              <div className="bg-white dark:bg-card rounded-3xl p-8 border-2 border-border/50 shadow-card-hover overflow-hidden relative">
                <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-brand-orange via-brand-red to-brand-orange" />
                <div className="space-y-5">
                  {[
                    { word: 'Guten Morgen', meaning: 'صباح الخير', pron: 'غوتن مورغن' },
                    { word: 'Wie geht es Ihnen?', meaning: 'كيف حالك؟', pron: 'في غايت إس إينن' },
                    { word: 'Danke schön', meaning: 'شكراً جزيلاً', pron: 'دانكه شون' },
                    { word: 'Entschuldigung', meaning: 'عذراً', pron: 'أنتشولديغونغ' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-4 p-3 rounded-xl hover:bg-brand-orange/5 transition-colors">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-orange/10 to-brand-red/10 flex items-center justify-center shrink-0">
                        <span className="text-brand-orange font-bold text-sm">{i + 1}</span>
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-foreground">{item.word}</p>
                        <p className="text-sm text-muted-foreground">{item.meaning}</p>
                      </div>
                      <span className="text-xs text-brand-orange font-medium bg-brand-orange/10 px-3 py-1 rounded-lg">{item.pron}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: isRtl ? -40 : 40 }}
              animate={tipsInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="space-y-5"
            >
              {learningTips.map((tip, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={tipsInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ delay: 0.3 + i * 0.1, duration: 0.5 }}
                  className="flex items-start gap-5 p-6 rounded-3xl bg-white dark:bg-card border-2 border-border/50 hover:border-brand-orange/25 hover:shadow-card-hover transition-all duration-300 group"
                >
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-orange/10 to-brand-red/10 flex items-center justify-center shrink-0 group-hover:from-brand-orange group-hover:to-brand-red transition-all duration-300 shadow-card">
                    <tip.icon className="w-6 h-6 text-brand-orange group-hover:text-white transition-colors" />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground mb-1">{tip.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{tip.desc}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* ═══════════ COURSE LEVELS ═══════════ */}
      <section className="py-16 sm:py-24 lg:py-32 bg-white dark:bg-card relative overflow-hidden">
        <div className="absolute top-1/3 start-1/4 w-56 h-56 bg-brand-orange/5 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/3 end-1/4 w-56 h-56 bg-brand-red/5 rounded-full blur-[100px]" />
        <div className="container-bold" ref={levelsRef}>
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={levelsInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <span className="inline-flex items-center gap-2 text-brand-orange text-[11px] font-bold uppercase tracking-[0.25em] mb-4">
              <span className="w-10 h-0.5 bg-gradient-to-r from-brand-orange to-brand-red rounded-full" />
              {t(locale, 'courses_all_levels')}
              <span className="w-10 h-0.5 bg-gradient-to-r from-brand-red to-brand-orange rounded-full" />
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-foreground">{t(locale, 'courses_title')}</h2>
            <p className="mt-3 text-muted-foreground text-lg">{t(locale, 'courses_subtitle')}</p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-5">
            {LEVELS.map((level, i) => (
              <motion.button
                key={level}
                initial={{ opacity: 0, y: 24 }}
                animate={levelsInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: i * 0.1, ease: [0.4, 0, 0.2, 1] }}
                onClick={() => navigate('courses')}
                className="group relative p-8 text-center rounded-3xl border-2 border-border/50 bg-white dark:bg-card hover:border-brand-orange/30 hover:shadow-card-hover transition-all duration-500 cursor-pointer overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-brand-orange/5 to-brand-red/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative z-10">
                  <span className="text-5xl sm:text-7xl font-black text-foreground/10 group-hover:text-brand-orange/15 transition-colors duration-500 absolute -top-3 -end-1">{level}</span>
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-brand-orange/10 to-brand-red/10 flex items-center justify-center group-hover:from-brand-orange group-hover:to-brand-red group-hover:scale-110 transition-all duration-500 shadow-lg">
                    <span className="text-xl font-black text-brand-orange group-hover:text-white transition-colors duration-500">{level}</span>
                  </div>
                  <div className="flex items-center justify-center gap-2 text-sm font-semibold text-muted-foreground group-hover:text-brand-orange transition-colors duration-300">
                    <span>{t(locale, 'courses_view_details')}</span>
                    <Play className="w-4 h-4" />
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ CTA SECTION ═══════════ */}
      <section className="py-16 sm:py-24 lg:py-32">
        <div className="container-bold">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-dark via-[#1a1008] to-[#0f0f0f] p-8 sm:p-12 lg:p-24">
            <div className="absolute top-0 start-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-brand-orange/10 rounded-full blur-[140px]" />
            <div className="absolute bottom-0 end-0 w-[500px] h-[250px] bg-brand-red/8 rounded-full blur-[120px]" />
            <div className="absolute top-1/2 start-0 w-[250px] h-[500px] bg-brand-orange/5 rounded-full blur-[100px]" />
            {/* Decorative dots */}
            <div className="absolute top-8 start-8 w-2 h-2 bg-brand-orange/30 rounded-full" />
            <div className="absolute top-16 start-16 w-1.5 h-1.5 bg-brand-red/20 rounded-full" />
            <div className="absolute bottom-8 end-16 w-2 h-2 bg-brand-orange/20 rounded-full" />

            <div className="relative z-10 text-center max-w-2xl mx-auto">
              <span className="inline-flex items-center gap-2 text-brand-orange text-[11px] font-bold uppercase tracking-[0.25em] mb-6">
                <span className="w-10 h-0.5 bg-gradient-to-r from-brand-orange to-brand-red rounded-full" />
                Deutsch mit Omar
                <span className="w-10 h-0.5 bg-gradient-to-r from-brand-red to-brand-orange rounded-full" />
              </span>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white leading-tight mb-5 drop-shadow-lg">
                {t(locale, 'carousel_3_title')}
              </h2>
              <p className="text-white/45 leading-relaxed mb-10 text-lg drop-shadow">
                {t(locale, 'carousel_3_desc')}
              </p>
              <button
                onClick={() => navigate('courses')}
                className="group inline-flex items-center gap-2 px-6 sm:px-10 py-3.5 sm:py-4 text-sm font-bold tracking-wide uppercase bg-gradient-to-r from-brand-orange to-brand-red text-white rounded-2xl hover:from-brand-orange-dark hover:to-brand-red-dark active:scale-[0.97] transition-all duration-300 shadow-glow-lg hover:shadow-brand-orange/50"
              >
                {t(locale, 'hero_cta_primary')}
                <ArrowUpRight className="w-5 h-5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
