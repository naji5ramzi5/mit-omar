'use client';

import { motion } from 'framer-motion';
import { useInView } from '@/hooks/use-scroll';
import { type LucideIcon } from 'lucide-react';

interface SectionTitleProps {
  badge?: string;
  title: string;
  subtitle?: string;
  centered?: boolean;
  light?: boolean;
  icon?: LucideIcon;
}

export default function SectionTitle({ badge, title, subtitle, centered = true, light = false, icon: Icon }: SectionTitleProps) {
  const { ref, isInView } = useInView(0.1);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 16 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
      className={`${centered ? 'text-center' : ''} mb-2`}
    >
      {/* Badge / Eyebrow */}
      {badge && (
        <div className={`${centered ? 'flex justify-center' : ''} mb-4`}>
          <span className={`inline-flex items-center gap-2.5 rounded-full px-5 py-2 text-[11px] font-bold uppercase tracking-[0.16em] shadow-sm backdrop-blur-sm ${
            light
              ? 'bg-white/10 border border-white/20 text-white/85'
              : 'bg-gradient-to-r from-brand-orange/[0.09] to-brand-red/[0.09] border border-brand-orange/15 text-brand-orange shadow-brand-orange/5'
          }`}>
            {Icon ? <Icon className="w-3.5 h-3.5 opacity-90" /> : <span className="w-1.5 h-1.5 rounded-full bg-gradient-to-br from-brand-orange to-brand-red shadow-sm" />}
            {badge}
          </span>
        </div>
      )}

      {/* Main Title */}
      <h2 className={`font-display font-black leading-[1.15] tracking-tight mb-3 text-balance ${
        light ? 'text-white' : 'text-foreground'
      } text-2xl sm:text-3xl lg:text-4xl`}>
        {title}
      </h2>
      <div className={`h-1 w-10 rounded-full bg-gradient-to-r from-brand-orange to-brand-red/30 ${centered ? 'mx-auto' : ''} mb-3`} />

      {/* Subtitle */}
      {subtitle && (
        <p className={`text-sm sm:text-base max-w-2xl ${centered ? 'mx-auto' : ''} ${
          light ? 'text-white/55' : 'text-muted-foreground'
        } leading-relaxed`}>
          {subtitle}
        </p>
      )}
    </motion.div>
  );
}