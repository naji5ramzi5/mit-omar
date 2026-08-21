'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { GraduationCap, Target, Lightbulb, Users, ArrowUpRight, Award, BookOpen, Star, Smartphone, Video, Clapperboard, BarChart3 } from 'lucide-react';
import { useAppStore } from '@/stores/app-store';
import { t } from '@/lib/i18n';
import { useInView } from '@/hooks/use-scroll';
import Image from 'next/image';
import SectionTitle from '@/components/SectionTitle';

const qualifications = [
  { icon: GraduationCap, key: 'about_qual_1' },
  { icon: Lightbulb, key: 'about_qual_2' },
  { icon: Target, key: 'about_qual_3' },
  { icon: Users, key: 'about_qual_4' },
];

export default function AboutView() {
  const { locale, navigate } = useAppStore();
  const isRtl = locale === 'ar';
  const { ref: bioRef, isInView: bioInView } = useInView(0.1);
  const { ref: qualRef, isInView: qualInView } = useInView(0.1);
  const { ref: futureRef, isInView: futureInView } = useInView(0.1);
  const [settings, setSettings] = useState<Record<string, string>>({});

  useEffect(() => {
    fetch('/api/settings').then(r => r.json()).then(data => {
      if (data.settings) setSettings(data.settings);
    }).catch(() => {});
  }, []);

  const teacherImage = settings.teacher_image || '/images/teacher/omar-hero.png';
  const yearsValue = `${settings.stats_years || 8}+`;
  const statsValues = (key: string, fallback: string) => `${settings[key] || fallback}+`;

  return (
    <div className="pt-8 pb-20">
      {/* Hero Section */}
      <section className="py-12 lg:py-20">
        <div className="container-bold">
          <div className="grid lg:grid-cols-2 gap-8 sm:gap-12 lg:gap-20 items-center">
            <motion.div
              initial={{ opacity: 0, x: isRtl ? 40 : -40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, ease: [0.4, 0, 0.2, 1] }}
              className="relative"
            >
              <div className="absolute -top-5 -start-5 w-20 h-20 bg-brand-orange/8 rounded-2xl -z-10" />
              <div className="absolute -bottom-5 -end-5 w-28 h-28 bg-brand-red/8 rounded-full -z-10" />

              <div className="relative aspect-[3/4] max-w-lg mx-auto lg:mx-0 rounded-2xl overflow-hidden shadow-xl shadow-black/5">
                <Image src={teacherImage} alt="Omar — German Language Teacher" fill className="object-cover object-top" />
              </div>

              <div className="absolute -bottom-4 end-6 lg:end-0 bg-white dark:bg-card rounded-xl shadow-lg p-4 border border-border/50">
                <p className="font-display text-2xl font-black text-gradient">{yearsValue}<span className="text-sm">+</span></p>
                <p className="text-[9px] uppercase tracking-[0.12em] text-muted-foreground font-semibold mt-0.5">{t(locale, 'stats_years')}</p>
              </div>
            </motion.div>

            <motion.div
              ref={bioRef}
              initial={{ opacity: 0, y: 24 }}
              animate={bioInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.15, ease: [0.4, 0, 0.2, 1] }}
            >
              <SectionTitle
                badge={t(locale, 'about_badge')}
                title={t(locale, 'about_title')}
                centered={false}
              />
              <div className="space-y-3.5 text-muted-foreground leading-relaxed text-base mt-5">
                {(() => {
                  const cap = locale.charAt(0).toUpperCase() + locale.slice(1);
                  const bio = settings[`about${cap}`];
                  if (bio) {
                    return bio.split('\n').filter(Boolean).map((p, i) => <p key={i}>{p}</p>);
                  }
                  return (
                    <>
                      <p>{t(locale, 'about_bio_1')}</p>
                      <p>{t(locale, 'about_bio_2')}</p>
                      <p>{t(locale, 'about_bio_3')}</p>
                    </>
                  );
                })()}
              </div>

              <button
                onClick={() => navigate('courses')}
                className="group mt-7 inline-flex items-center gap-2 px-7 py-3.5 text-sm font-bold tracking-wide bg-gradient-to-r from-brand-orange to-brand-red text-white rounded-xl hover:from-brand-orange-dark hover:to-brand-red-dark active:scale-[0.98] transition-all duration-200 shadow-sm shadow-brand-orange/20"
              >
                {t(locale, 'hero_cta_primary')}
                <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-14 bg-white dark:bg-card relative">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-orange/20 to-transparent" />
        <div className="container-bold">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {[
                { icon: Award, value: yearsValue, label: t(locale, 'stats_years'), gradient: 'from-brand-orange/10 to-brand-red/10' },
                { icon: Users, value: statsValues('stats_students', '500'), label: t(locale, 'stats_students'), gradient: 'from-blue-500/10 to-blue-600/10' },
                { icon: BookOpen, value: statsValues('stats_courses', '20'), label: t(locale, 'stats_courses'), gradient: 'from-emerald-500/10 to-teal-500/10' },
                { icon: Star, value: '95%', label: t(locale, 'about_omar_pass_rate'), gradient: 'from-purple-500/10 to-violet-500/10' },
              ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.4 }}
                className="text-center p-5 rounded-2xl border border-border/30 hover:border-brand-orange/20 hover:shadow-sm transition-all duration-300"
              >
                <div className={`w-12 h-12 mx-auto mb-3 rounded-xl bg-gradient-to-br ${item.gradient} flex items-center justify-center`}>
                  <item.icon className="w-5 h-5 text-brand-orange" />
                </div>
                <p className="font-display text-2xl font-black text-foreground mb-0.5">{item.value}</p>
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{item.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Qualifications */}
      <section className="py-16 lg:py-24 bg-brand-warm dark:bg-accent relative" ref={qualRef}>
        <div className="container-bold">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={qualInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5 }}
            className="text-center mb-12"
          >
            <SectionTitle
              badge={t(locale, 'about_qualification')}
              title={t(locale, 'about_qualification')}
            />
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {qualifications.map((q, i) => (
              <motion.div
                key={q.key}
                initial={{ opacity: 0, y: 20 }}
                animate={qualInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.4, delay: i * 0.08 }}
                className="group p-6 rounded-2xl border border-border/50 bg-white dark:bg-card hover:border-brand-orange/20 hover:shadow-card-hover transition-all duration-300"
              >
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-brand-orange/10 to-brand-red/10 flex items-center justify-center mb-4 group-hover:from-brand-orange group-hover:to-brand-red transition-all duration-200">
                  <q.icon className="w-5 h-5 text-brand-orange group-hover:text-white transition-colors" />
                </div>
                <p className="text-sm font-semibold text-foreground/80 leading-relaxed">
                  {t(locale, q.key as any)}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Future Plans */}
      <section className="py-16 lg:py-24 bg-white dark:bg-card relative" ref={futureRef}>
        <div className="container-bold">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={futureInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5 }}
            className="text-center mb-12"
          >
            <SectionTitle
              badge={t(locale, 'about_omar_future')}
              title={t(locale, 'about_omar_future')}
              subtitle="نعمل باستمرار على تطوير المنصة لتقديم أفضل تجربة تعليمية"
            />
          </motion.div>

          <div className="grid sm:grid-cols-2 gap-4 max-w-3xl mx-auto">
            {[
              { key: 'about_omar_future_1', icon: Smartphone },
              { key: 'about_omar_future_2', icon: Video },
              { key: 'about_omar_future_3', icon: Clapperboard },
              { key: 'about_omar_future_4', icon: BarChart3 },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 16 }}
                animate={futureInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: i * 0.08, duration: 0.4 }}
                className="flex items-center gap-3.5 p-5 rounded-xl bg-brand-warm dark:bg-accent border border-border/30 hover:border-brand-orange/20 hover:shadow-sm transition-all duration-300 group"
              >
                <span className="w-10 h-10 shrink-0 rounded-xl bg-gradient-to-br from-brand-orange/10 to-brand-red/10 flex items-center justify-center group-hover:from-brand-orange group-hover:to-brand-red transition-colors duration-200">
                  <item.icon className="w-4 h-4 text-brand-orange group-hover:text-white transition-colors" />
                </span>
                <p className="text-sm font-semibold text-foreground/80">{t(locale, item.key as any)}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
