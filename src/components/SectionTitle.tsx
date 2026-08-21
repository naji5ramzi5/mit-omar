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
      className={`${centered ? 'text-center' : ''} mb-8 sm:mb-10`}
    >
      {/* Badge / Eyebrow */}
      {badge && (
        <div className={`inline-flex items-center gap-2 mb-3.5 ${centered ? 'justify-center' : ''}`}>
          <span className="h-px w-8 bg-gradient-to-r from-transparent to-brand-orange/50 rounded-full" />
          <span className={`flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.18em] ${
            light ? 'text-white/70' : 'text-brand-orange'
          }`}>
            {Icon && <Icon className="w-3.5 h-3.5" />}
            {badge}
          </span>
          <span className="h-px w-8 bg-gradient-to-l from-transparent to-brand-red/50 rounded-full" />
        </div>
      )}

      {/* Main Title */}
      <h2 className={`font-display font-black leading-[1.15] tracking-tight mb-3 text-balance ${
        light ? 'text-white' : 'text-foreground'
      } text-2xl sm:text-3xl lg:text-4xl`}>
        {title}
      </h2>

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