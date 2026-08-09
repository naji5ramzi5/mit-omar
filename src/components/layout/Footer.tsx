'use client';

import { Instagram, Facebook, Youtube, Twitter } from 'lucide-react';
import { useAppStore } from '@/stores/app-store';
import { t } from '@/lib/i18n';
import Image from 'next/image';

export default function Footer() {
  const { locale, navigate } = useAppStore();
  const year = new Date().getFullYear();

  return (
    <footer className="bg-brand-dark text-white/70 mt-auto relative overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute top-0 start-1/4 w-96 h-96 bg-brand-orange/5 rounded-full blur-[150px] -translate-y-1/2" />
      <div className="absolute bottom-0 end-1/4 w-64 h-64 bg-brand-red/5 rounded-full blur-[120px] translate-y-1/2" />

      {/* Top gradient line */}
      <div className="h-1 bg-gradient-to-r from-brand-orange via-brand-red to-brand-orange" />

      <div className="container-bold py-16 lg:py-20 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-8">
          {/* Brand Column */}
          <div className="lg:col-span-4">
            <button onClick={() => navigate('home')} className="inline-block mb-5">
              <Image
                src="/images/logo-official.png"
                alt="Deutsch mit Omar"
                width={56}
                height={56}
                className="object-contain"
              />
            </button>
            <p className="text-sm leading-[1.8] text-white/40 max-w-xs mb-6">
              {t(locale, 'footer_description')}
            </p>
            <div className="flex items-center gap-3">
              {[Instagram, Facebook, Youtube, Twitter].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-xl border border-white/10 flex items-center justify-center text-white/30 hover:text-white hover:border-brand-orange/50 hover:bg-brand-orange/10 hover:shadow-glow transition-all duration-300"
                >
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Navigation */}
          <div className="lg:col-span-2 lg:col-start-6">
            <h4 className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/30 mb-5">
              {t(locale, 'footer_navigation')}
            </h4>
            <ul className="space-y-3">
              {['nav_home', 'nav_about', 'nav_courses', 'nav_posts', 'nav_contact'].map((key) => (
                <li key={key}>
                  <button
                    onClick={() => navigate(key === 'nav_home' ? 'home' : key === 'nav_about' ? 'about' : key === 'nav_courses' ? 'courses' : key === 'nav_posts' ? 'posts' : 'contact')}
                    className="text-sm text-white/40 hover:text-brand-orange hover:translate-x-1 transition-all duration-300"
                  >
                    {t(locale, key as Parameters<typeof t>[1])}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Quick Links */}
          <div className="lg:col-span-2">
            <h4 className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/30 mb-5">
              {t(locale, 'footer_quick_links')}
            </h4>
            <ul className="space-y-3">
              <li><button onClick={() => navigate('courses')} className="text-sm text-white/40 hover:text-brand-orange hover:translate-x-1 transition-all duration-300">{t(locale, 'nav_courses')}</button></li>
              <li><button onClick={() => navigate('activate')} className="text-sm text-white/40 hover:text-brand-orange hover:translate-x-1 transition-all duration-300">{t(locale, 'course_activate')}</button></li>
              <li><button onClick={() => navigate('login')} className="text-sm text-white/40 hover:text-brand-orange hover:translate-x-1 transition-all duration-300">{t(locale, 'nav_login')}</button></li>
            </ul>
          </div>

          {/* Contact */}
          <div className="lg:col-span-2">
            <h4 className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/30 mb-5">
              {t(locale, 'nav_contact')}
            </h4>
            <ul className="space-y-3 text-sm text-white/40">
              <li className="hover:text-brand-orange hover:translate-x-1 transition-all duration-300">info@deutschmitomar.com</li>
              <li className="hover:text-brand-orange hover:translate-x-1 transition-all duration-300">Berlin, Germany</li>
            </ul>
          </div>
        </div>

        <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent my-10" />

        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-white/25 tracking-wide">
          <p>© {year} Deutsch mit Omar. {t(locale, 'footer_rights')}</p>
          <p className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-orange shadow-glow" />
            Berlin, Germany
          </p>
        </div>
      </div>
    </footer>
  );
}
