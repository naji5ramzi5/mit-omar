'use client';

import { motion } from 'framer-motion';
import { CheckCircle, GraduationCap, Target, Lightbulb, Users, ArrowUpRight } from 'lucide-react';
import { useAppStore } from '@/stores/app-store';
import { t } from '@/lib/i18n';
import { useInView } from '@/hooks/use-scroll';
import Image from 'next/image';

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

  return (
    <div className="pt-8 pb-20">
      <section className="py-12 lg:py-20">
        <div className="container-bold">
          <div className="grid lg:grid-cols-2 gap-8 sm:gap-12 lg:gap-20 items-center">
            <motion.div
              initial={{ opacity: 0, x: isRtl ? 40 : -40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, ease: [0.4, 0, 0.2, 1] }}
              className="relative"
            >
              <div className="absolute -top-6 -start-6 w-24 h-24 bg-brand-orange/10 rounded-2xl -z-10" />
              <div className="absolute -bottom-6 -end-6 w-32 h-32 bg-brand-red/10 rounded-full -z-10" />

              <div className="relative aspect-[3/4] max-w-lg mx-auto lg:mx-0 rounded-3xl overflow-hidden shadow-2xl shadow-black/10">
                <Image src="/images/teacher/omar-hero.png" alt="Omar — German Language Teacher" fill className="object-cover object-top" />
              </div>

              <div className="absolute -bottom-4 end-6 lg:end-0 bg-white rounded-2xl shadow-card-hover p-5 border-2 border-border/50">
                <p className="text-3xl font-black text-gradient">8<span className="text-lg">+</span></p>
                <p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground font-bold mt-0.5">{t(locale, 'stats_years')}</p>
              </div>
            </motion.div>

            <motion.div
              ref={bioRef}
              initial={{ opacity: 0, y: 28 }}
              animate={bioInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.2, ease: [0.4, 0, 0.2, 1] }}
            >
              <span className="inline-flex items-center gap-2 text-brand-orange text-[11px] font-bold uppercase tracking-[0.25em] mb-5">
                <span className="w-8 h-0.5 bg-gradient-to-r from-brand-orange to-brand-red rounded-full" />
                {t(locale, 'about_badge')}
              </span>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-foreground leading-tight mb-7">
                {t(locale, 'about_title')}
              </h1>
              <div className="space-y-4 text-muted-foreground leading-[1.9] text-lg">
                <p>{t(locale, 'about_bio_1')}</p>
                <p>{t(locale, 'about_bio_2')}</p>
                <p>{t(locale, 'about_bio_3')}</p>
              </div>

              <button
                onClick={() => navigate('courses')}
                className="group mt-8 inline-flex items-center gap-2 px-8 py-3.5 text-[13px] font-bold tracking-wide bg-gradient-to-r from-brand-orange to-brand-red text-white rounded-xl hover:from-brand-orange-dark hover:to-brand-red-dark active:scale-[0.97] transition-all duration-300 shadow-glow"
              >
                {t(locale, 'hero_cta_primary')}
                <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </button>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="py-20 lg:py-28 bg-white relative">
        <div className="container-bold" ref={qualRef}>
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={qualInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <span className="inline-flex items-center gap-2 text-brand-orange text-[11px] font-bold uppercase tracking-[0.25em] mb-4">
              <span className="w-8 h-0.5 bg-gradient-to-r from-brand-orange to-brand-red rounded-full" />
              {t(locale, 'about_qualification')}
              <span className="w-8 h-0.5 bg-gradient-to-r from-brand-red to-brand-orange rounded-full" />
            </span>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {qualifications.map((q, i) => (
              <motion.div
                key={q.key}
                initial={{ opacity: 0, y: 24 }}
                animate={qualInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: i * 0.1, ease: [0.4, 0, 0.2, 1] }}
                className="group p-7 rounded-3xl border-2 border-border/50 bg-white hover:border-brand-orange/30 hover:shadow-card-hover transition-all duration-500"
              >
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-orange/10 to-brand-red/10 flex items-center justify-center mb-5 group-hover:from-brand-orange group-hover:to-brand-red transition-all duration-300">
                  <q.icon className="w-5 h-5 text-brand-orange group-hover:text-white transition-colors" />
                </div>
                <p className="text-sm font-semibold text-foreground/80 leading-relaxed">
                  {t(locale, q.key as keyof typeof import('@/lib/i18n').translations.en)}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
