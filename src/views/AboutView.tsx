'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  GraduationCap, 
  Target, 
  Lightbulb, 
  Users, 
  ArrowUpRight, 
  Award, 
  BookOpen, 
  Star, 
  Smartphone, 
  Video, 
  BarChart3,
  CheckCircle2,
  Instagram,
  MessageSquare,
  Sparkles,
  Layers,
  FileCheck,
  Stethoscope,
  Code2
} from 'lucide-react';
import { useAppStore } from '@/stores/app-store';
import { t } from '@/lib/i18n';
import { useInView } from '@/hooks/use-scroll';
import Image from 'next/image';

const academicQualifications = [
  {
    icon: GraduationCap,
    title: 'إجازة في اللغة الألمانية وآدابها',
    institution: 'جامعة دمشق — كلية الآداب والعلوم الإنسانية',
    desc: 'تأسيس أكاديمي متعمق في فقه اللغة الألمانية، النحو والصرف المتقدم، اللغويات التطبيقية، والأدب الألماني الكلاسيكي والمعاصر.',
    badge: 'تخصص لغوي أكاديمي',
    accent: 'border-blue-500/20 bg-blue-500/5 text-blue-600 dark:text-blue-400'
  },
  {
    icon: Code2,
    title: 'بكالوريوس في تكنولوجيا المعلومات والبرمجة',
    institution: 'الجامعة الافتراضية السورية (SVU)',
    desc: 'دمج علوم البرمجيات وهندسة المعرفة لتصميم حلول تعلم إلكتروني ذكية، وتطوير منصات تفاعلية تسهل استيعاب القواعد والمفردات.',
    badge: 'تكنولوجيا التعليم الذكي',
    accent: 'border-emerald-500/20 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400'
  },
  {
    icon: FileCheck,
    title: 'إعداد اختبارات الكفاءة الدولية المعتمدة',
    institution: 'Goethe-Zertifikat • telc Deutsch • ÖSD',
    desc: 'خبرة متخصصة على مدى 8 سنوات في تدريب الطلاب على استراتيجيات اجتياز امتحانات المستويات من A1 حتى B2 و C1 بأعلى الدرجات.',
    badge: 'تأهيل امتحانات دولية',
    accent: 'border-amber-500/20 bg-amber-500/5 text-amber-600 dark:text-amber-400'
  },
  {
    icon: Stethoscope,
    title: 'اللغة الألمانية التخصصية للمهن والطب',
    institution: 'Fachsprache Medizin & Pflege',
    desc: 'برامج تدريبية موجهة للأطباء والصيادلة والمهندسين للاندماج المهني واجتياز مقابلات التعديل والعمل في ألمانيا والنمسا.',
    badge: 'لغة العمل التخصصية',
    accent: 'border-purple-500/20 bg-purple-500/5 text-purple-600 dark:text-purple-400'
  }
];

const teachingMethodology = [
  {
    step: '01',
    title: 'التأسيس القواعدي الممنهج',
    subtitle: 'Systematische Grammatik',
    icon: Layers,
    desc: 'تبسيط قواعد اللغة الألمانية الصعبة عبر خرائط ذهنية ونماذج منطقية واضحة، مع استبعاد الحفظ العشوائي والتركيز على الفهم البنيوي العميق.'
  },
  {
    step: '02',
    title: 'المحادثة التفاعلية الحية',
    subtitle: 'Aktives Sprechen',
    icon: MessageSquare,
    desc: 'كسر حاجز الخوف والتردد من اليوم الأول. تدريب حواري متواصل على النطق السليم ومواقف الحياة اليومية والعملية في ألمانيا.'
  },
  {
    step: '03',
    title: 'المحاكاة الفعلية للاختبارات',
    subtitle: 'Echte Prüfungssimulation',
    icon: Target,
    desc: 'حل نماذج امتحانات رسمية سابقة تحت ظروف الوقت الواقعية، مع تدريب تفصيلي على أقسام القراءة، الاستماع، الكتابة، والتحدث.'
  }
];

const futureRoadmap = [
  {
    step: '01',
    title: 'تطبيق ذكي متكامل للهواتف',
    desc: 'تطبيق مخصص يتيح مراجعة البطاقات التعليمية، متابعة التمارين اليومية، والاستماع للدروس في أي وقت.',
    icon: Smartphone
  },
  {
    step: '02',
    title: 'منصة محاكاة امتحانات غوته و telc',
    desc: 'بيئة رقمية تفاعلية تحاكي أنظمة الاختبارات الرسمية وتمنح تقييماً فورياً لمستوى الطالب ونقاط القوة والضعف.',
    icon: Target
  },
  {
    step: '03',
    title: 'مجتمع المتعلمين والتبادل اللغوي الحي',
    desc: 'ملتقى تفاعلي للطلاب مع جلسات محادثة أسبوعية مباشرة لتبادل الخبرات وتثبيت مهارات التحدث.',
    icon: Users
  },
  {
    step: '04',
    title: 'مسارات متخصصة للمصطلحات المهنية والطبية',
    desc: 'كورسات مكثفة وموجهة للكوادر الطبية والتقنية للتحضير لامتحانات التعديل وسوق العمل الألماني.',
    icon: BarChart3
  }
];

export default function AboutView() {
  const { locale, navigate } = useAppStore();
  const isRtl = locale === 'ar';
  const { ref: bioRef, isInView: bioInView } = useInView(0.1);
  const { ref: qualRef, isInView: qualInView } = useInView(0.1);
  const { ref: methodRef, isInView: methodInView } = useInView(0.1);
  const { ref: futureRef, isInView: futureInView } = useInView(0.1);
  const [settings, setSettings] = useState<Record<string, string>>({});

  useEffect(() => {
    fetch('/api/settings')
      .then((r) => r.json())
      .then((data) => {
        if (data.settings) setSettings(data.settings);
      })
      .catch(() => {});
  }, []);

  const teacherImage = settings.teacher_image || '/images/teacher/omar-hero.png';
  const yearsValue = `${settings.stats_years || 8}+`;
  const statsValues = (key: string, fallback: string) => `${settings[key] || fallback}+`;

  return (
    <div className="pt-6 pb-24 space-y-16 lg:space-y-24">
      {/* 1. Hero Section: Formal Teacher Presentation */}
      <section className="relative pt-6 pb-10 overflow-hidden">
        <div className="container-bold">
          <div className="grid lg:grid-cols-12 gap-10 lg:gap-14 items-center">
            
            {/* Teacher Portrait & Visual Credibility */}
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              className="lg:col-span-5 relative"
            >
              <div className="relative mx-auto max-w-sm lg:max-w-none">
                {/* Subtle warm backdrop glow */}
                <div className="absolute -inset-2 bg-gradient-to-br from-brand-orange/15 to-transparent rounded-3xl filter blur-xl -z-10 opacity-70" />
                
                {/* Main Portrait Frame */}
                <div className="relative aspect-[4/5] rounded-3xl overflow-hidden shadow-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-900">
                  <Image 
                    src={teacherImage} 
                    alt="الأستاذ عمر وهاب — مدرس لغة ألمانية" 
                    fill 
                    priority
                    className="object-cover object-top" 
                  />
                  
                  {/* Subtle lower gradient for contrast */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
                  
                  {/* Teacher Name Tag on Mobile */}
                  <div className="absolute bottom-4 inset-x-4 p-4 rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200/60 dark:border-slate-800 shadow-lg flex items-center justify-between">
                    <div>
                      <p className="text-base font-black text-slate-900 dark:text-white">الأستاذ عمر وهاب</p>
                      <p className="text-xs text-brand-orange font-bold">تعليم أكاديمي وخبرة 8 سنوات</p>
                    </div>
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-brand-orange/10 text-brand-orange border border-brand-orange/20">
                      معتمد
                    </span>
                  </div>
                </div>

                {/* Floating Experience Badge */}
                <motion.div 
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.5 }}
                  className="hidden sm:flex absolute -top-4 -end-4 bg-white dark:bg-slate-900 rounded-2xl shadow-xl p-4 border border-slate-200/80 dark:border-slate-800 items-center gap-3"
                >
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-brand-orange to-brand-red flex items-center justify-center text-white shadow-md shadow-brand-orange/20">
                    <Award className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="font-display text-xl font-black text-slate-900 dark:text-white">8+ سنوات</p>
                    <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">خبرة أكاديمية</p>
                  </div>
                </motion.div>
              </div>
            </motion.div>

            {/* Narrative & Authority Text */}
            <motion.div
              ref={bioRef}
              initial={{ opacity: 0, y: 24 }}
              animate={bioInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
              className="lg:col-span-7"
            >
              {/* Subtle Institutional Badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-slate-900 text-white dark:bg-slate-800 border border-slate-700/60 shadow-sm text-xs font-bold mb-4">
                <GraduationCap className="w-4 h-4 text-brand-orange" />
                <span>تعليم أكاديمي</span>
              </div>

              {/* Main Formal Title */}
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-slate-900 dark:text-white mb-3">
                الأستاذ عمر وهاب
              </h1>
              
              <p className="text-base sm:text-lg text-brand-orange font-bold mb-6">
                مدرس لغة ألمانية أكاديمي ومختص في إعداد اختبارات معهد غوته و telc و ÖSD
              </p>

              {/* Bio Paragraphs */}
              <div className="space-y-4 text-slate-600 dark:text-slate-300 leading-relaxed text-sm sm:text-base border-s-2 border-brand-orange/30 ps-4 mb-8">
                <p>
                  {t(locale, 'about_bio_1')}
                </p>
                <p>
                  {t(locale, 'about_bio_2')}
                </p>
                <p>
                  {t(locale, 'about_bio_3')}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3.5">
                <button
                  onClick={() => navigate('courses')}
                  className="inline-flex items-center gap-2 px-6 py-3 text-sm font-bold bg-gradient-to-r from-brand-orange to-brand-red text-white rounded-xl hover:shadow-lg hover:shadow-brand-orange/20 active:scale-[0.98] transition-all"
                >
                  <span>استكشف الدورات المتاحة</span>
                  <ArrowUpRight className="w-4 h-4" />
                </button>

                <a
                  href="https://wa.me/963934090166"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3 text-sm font-bold text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl border border-slate-200 dark:border-slate-700 active:scale-[0.98] transition-all"
                >
                  <MessageSquare className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>استشارة عبر واتساب</span>
                </a>
              </div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* 2. Key Metrics Bar */}
      <section className="container-bold">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {[
            {
              icon: Award,
              val: yearsValue,
              title: 'سنوات خبرة تعليمية',
              subtitle: 'تدريس تخصصي مكثف'
            },
            {
              icon: Users,
              val: statsValues('stats_students', '1000'),
              title: 'طالب وطالبة تخرجوا',
              subtitle: 'في كافة المستويات'
            },
            {
              icon: Star,
              val: '95%',
              title: 'نسبة اجتياز الامتحانات',
              subtitle: 'Goethe & telc & ÖSD'
            },
            {
              icon: BookOpen,
              val: 'A1 - C1',
              title: 'تغطية شاملة للمستويات',
              subtitle: 'وفق الإطار الأوروبي المشترك'
            }
          ].map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08, duration: 0.4 }}
              className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:border-brand-orange/30 transition-all text-center sm:text-start flex flex-col sm:flex-row items-center gap-4"
            >
              <div className="w-12 h-12 shrink-0 rounded-2xl bg-brand-orange/10 dark:bg-brand-orange/15 flex items-center justify-center text-brand-orange">
                <stat.icon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white leading-tight">
                  {stat.val}
                </p>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                  {stat.title}
                </p>
                <p className="text-[11px] text-muted-foreground hidden sm:block">
                  {stat.subtitle}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* 3. Academic Qualifications & Field Experience */}
      <section className="py-12 bg-slate-50/70 dark:bg-slate-950/40 rounded-3xl border border-slate-200/60 dark:border-slate-800/60" ref={qualRef}>
        <div className="container-bold">
          <div className="max-w-2xl mx-auto text-center mb-12">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-orange/10 text-brand-orange border border-brand-orange/20 text-xs font-bold mb-3">
              <GraduationCap className="w-3.5 h-3.5" />
              الخلفية والمؤهلات
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              المؤهلات الأكاديمية والخبرة الميدانية
            </h2>
            <p className="text-sm text-muted-foreground mt-2">
              جمع متوازن بين التخصص الأكاديمي الرصين في علم اللغويات وخبرة الميدان الطويلة في تدريب الطلاب
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-5 sm:gap-6">
            {academicQualifications.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={qualInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className="p-6 sm:p-7 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-brand-orange/30 shadow-sm transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-3 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-brand-orange">
                      <item.icon className="w-6 h-6" />
                    </div>
                    <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${item.accent}`}>
                      {item.badge}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1.5">
                    {item.title}
                  </h3>
                  
                  <p className="text-xs font-semibold text-brand-orange mb-3">
                    {item.institution}
                  </p>

                  <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. The 3-Pillar Teaching Methodology */}
      <section className="container-bold" ref={methodRef}>
        <div className="max-w-2xl mx-auto text-center mb-12">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 text-white dark:bg-slate-800 border border-slate-700 text-xs font-bold mb-3">
            <Sparkles className="w-3.5 h-3.5 text-brand-orange" />
            فلسفة التدريس
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            المنهجية التعليمية ثلاثية الركائز
          </h2>
          <p className="text-sm text-muted-foreground mt-2">
            منظومة متكاملة تضمن انتقال الطالب من الفهم السلبي للقواعد إلى الطلاقة التعبيرية واجتياز الامتحانات
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {teachingMethodology.map((pillar, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={methodInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.4, delay: i * 0.12 }}
              className="relative p-6 sm:p-7 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-brand-orange/40 shadow-sm transition-all"
            >
              {/* Step indicator */}
              <div className="flex items-center justify-between mb-5">
                <span className="font-display text-3xl font-black text-brand-orange/30">
                  {pillar.step}
                </span>
                <div className="w-10 h-10 rounded-xl bg-brand-orange/10 flex items-center justify-center text-brand-orange">
                  <pillar.icon className="w-5 h-5" />
                </div>
              </div>

              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
                {pillar.title}
              </h3>
              
              <p className="text-xs text-brand-orange font-semibold mb-3">
                {pillar.subtitle}
              </p>

              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                {pillar.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* 5. Future Roadmap: Numbered 01-04 */}
      <section className="py-12 bg-slate-50/70 dark:bg-slate-950/40 rounded-3xl border border-slate-200/60 dark:border-slate-800/60" ref={futureRef}>
        <div className="container-bold">
          <div className="max-w-2xl mx-auto text-center mb-12">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 text-white dark:bg-slate-800 border border-slate-700 text-xs font-bold mb-3">
              خارطة التطوير
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              {t(locale, 'about_omar_future')}
            </h2>
            <p className="text-sm text-muted-foreground mt-2">
              {t(locale, 'about_omar_future_subtitle')}
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-5 max-w-4xl mx-auto">
            {futureRoadmap.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 16 }}
                animate={futureInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: i * 0.08, duration: 0.4 }}
                className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-brand-orange/30 shadow-sm transition-all flex items-start gap-4"
              >
                <div className="shrink-0 flex flex-col items-center">
                  <span className="font-display text-lg font-black text-brand-orange bg-brand-orange/10 w-9 h-9 rounded-xl flex items-center justify-center">
                    {item.step}
                  </span>
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {item.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. Direct Contact & Social Channels */}
      <section className="container-bold">
        <div className="p-8 sm:p-12 rounded-3xl text-white relative overflow-hidden shadow-2xl border border-white/10 group">
          {/* Real Berlin Skyline Background Image - Bright, Vivid & Clear */}
          <div className="absolute inset-0 -z-0">
            <Image
              src="/images/berlin/skyline.png"
              alt="Berlin Skyline"
              fill
              sizes="100vw"
              priority
              className="object-cover object-center group-hover:scale-105 transition-transform duration-1000 ease-out"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/50 to-black/35 pointer-events-none" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/25 to-black/70 pointer-events-none" />
          </div>

          <div className="relative z-10 max-w-xl mx-auto text-center space-y-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-white border border-white/20 text-xs font-semibold backdrop-blur-md shadow-xs">
              <Users className="w-3.5 h-3.5 text-brand-orange" />
              تواصل مباشر
            </span>

            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white drop-shadow-md">
              تواصل مع الأستاذ عمر
            </h2>

            <p className="text-xs sm:text-sm text-white/85 leading-relaxed max-w-sm mx-auto">
              متاح للإجابة على استفساراتكم ومساعدتكم في تحديد مستواكم.
            </p>

            {/* Official Social Action Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              {/* WhatsApp Button */}
              <a
                href="https://wa.me/963934090166"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 h-10 sm:h-11 px-5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white text-xs sm:text-sm font-bold transition-all shadow-lg shadow-emerald-950/40 hover:-translate-y-0.5 active:scale-[0.98]"
              >
                <MessageSquare className="w-4 h-4" />
                <span>واتساب: 166 090 934 963+</span>
              </a>

              {/* Instagram Official Button */}
              <a
                href="https://instagram.com/omar_wahab20"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 h-10 sm:h-11 px-5 rounded-xl bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white text-xs sm:text-sm font-bold transition-all shadow-lg shadow-purple-950/40 hover:-translate-y-0.5 active:scale-[0.98]"
              >
                <Instagram className="w-4 h-4" />
                <span>إنستغرام: @omar_wahab20</span>
              </a>

              {/* TikTok Channel Button */}
              <a
                href="https://www.tiktok.com/@omar_wahab20"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 h-10 sm:h-11 px-5 rounded-xl bg-white/15 hover:bg-white/20 text-white text-xs sm:text-sm font-bold border border-white/25 backdrop-blur-md transition-all hover:-translate-y-0.5 active:scale-[0.98]"
              >
                <Video className="w-4 h-4 text-brand-orange" />
                <span>تيك توك (+12.6K متابع)</span>
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
