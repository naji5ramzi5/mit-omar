'use client';

import { useState } from 'react';
import { Instagram, Facebook, Youtube, Twitter, Send, CheckCircle2 } from 'lucide-react';
import { useAppStore } from '@/stores/app-store';
import { t } from '@/lib/i18n';
import { SOCIAL_LINKS, CONTACT_EMAIL } from '@/lib/site-config';
import Image from 'next/image';

const SOCIAL_ICONS = { Instagram, Facebook, Youtube, Twitter } as const;

export default function Footer() {
  const { locale, navigate } = useAppStore();
  const year = new Date().getFullYear();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');

  const subscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes('@') || status === 'loading') return;
    setStatus('loading');
    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        setStatus('done');
        setEmail('');
      } else {
        setStatus('done');
        setEmail('');
      }
    } catch {
      setStatus('error');
    }
  };

  return (
    <footer className="bg-brand-dark text-white/70 mt-auto relative overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute top-0 start-1/4 w-72 h-72 bg-brand-orange/5 rounded-full blur-[90px] -translate-y-1/2 pointer-events-none" />
      <div className="absolute bottom-0 end-1/4 w-56 h-56 bg-brand-red/5 rounded-full blur-[80px] translate-y-1/2 pointer-events-none" />

      {/* Top gradient line */}
      <div className="h-px bg-gradient-to-r from-transparent via-brand-orange/30 to-transparent" />

      <div className="container-bold py-12 lg:py-14 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-6">
          {/* Brand Column */}
          <div className="lg:col-span-4">
            <button onClick={() => navigate('home')} className="inline-block mb-4">
              <Image
                src="/images/logo-official.png"
                alt="Deutsch mit Omar"
                width={48}
                height={48}
                className="object-contain brightness-0 invert opacity-80"
              />
            </button>
            <p className="text-sm leading-relaxed text-white/40 max-w-xs mb-5">
              {t(locale, 'footer_description')}
            </p>
            <div className="flex items-center gap-2.5">
              {SOCIAL_LINKS.map((link) => {
                const Icon = SOCIAL_ICONS[link.name];
                return (
                  <a
                    key={link.name}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-9 h-9 rounded-lg border border-white/10 flex items-center justify-center text-white/30 hover:text-white hover:border-brand-orange/50 hover:bg-brand-orange/10 transition-all duration-200"
                  >
                    <Icon className="w-3.5 h-3.5" />
                  </a>
                );
              })}
            </div>

            {/* Newsletter */}
            <div className="mt-6 max-w-xs">
              <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40 mb-2">
                {t(locale, 'newsletter_title')}
              </h4>
              <p className="text-xs text-white/40 mb-3 leading-relaxed">
                {t(locale, 'newsletter_subtitle')}
              </p>
              {status === 'done' ? (
                <p className="flex items-center gap-1.5 text-xs font-bold text-green-400">
                  <CheckCircle2 className="w-4 h-4" /> {t(locale, 'newsletter_success')}
                </p>
              ) : (
                <form onSubmit={subscribe} className="flex items-center gap-2">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t(locale, 'newsletter_placeholder')}
                    className="flex-1 min-w-0 px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-brand-orange/50 transition-colors"
                  />
                  <button
                    type="submit"
                    disabled={status === 'loading'}
                    className="w-10 h-10 shrink-0 rounded-xl bg-gradient-to-br from-brand-orange to-brand-red text-white flex items-center justify-center hover:opacity-90 transition-all disabled:opacity-50"
                    aria-label={t(locale, 'newsletter_button')}
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* Navigation */}
          <div className="lg:col-span-3 lg:col-start-5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white/70 mb-4">
              {t(locale, 'footer_navigation')}
            </h4>
            <ul className="space-y-2.5">
              {[
                { key: 'nav_home', view: 'home' },
                { key: 'nav_about', view: 'about' },
                { key: 'nav_courses', view: 'courses' },
                { key: 'nav_online_booking', view: 'online_booking' },
                { key: 'nav_posts', view: 'posts' },
                { key: 'nav_contact', view: 'contact' },
              ].map((item) => (
                <li key={item.key}>
                  <button
                    onClick={() => navigate(item.view as any)}
                    className="text-sm text-white hover:text-brand-orange font-medium transition-colors duration-200"
                  >
                    {t(locale, item.key as Parameters<typeof t>[1])}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Quick Links */}
          <div className="lg:col-span-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white/70 mb-4">
              {t(locale, 'footer_quick_links')}
            </h4>
            <ul className="space-y-2.5">
              <li>
                <button
                  onClick={() => navigate('courses')}
                  className="text-sm text-white hover:text-brand-orange font-medium transition-colors duration-200"
                >
                  {t(locale, 'nav_courses')}
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigate('activate')}
                  className="text-sm text-white hover:text-brand-orange font-medium transition-colors duration-200"
                >
                  {t(locale, 'course_activate')}
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigate('login')}
                  className="text-sm text-white hover:text-brand-orange font-medium transition-colors duration-200"
                >
                  {t(locale, 'nav_login')}
                </button>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div className="lg:col-span-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white/70 mb-4">
              {t(locale, 'nav_contact')}
            </h4>
            <ul className="space-y-2.5 text-sm text-white">
              <li className="hover:text-brand-orange transition-colors duration-200 font-medium">{CONTACT_EMAIL}</li>
              <li className="hover:text-brand-orange transition-colors duration-200 font-medium">Berlin, Germany</li>
            </ul>
          </div>
        </div>

        <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent my-8" />

        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-[10px] text-white/25 tracking-wide">
          <p>&copy; {year} Deutsch mit Omar. {t(locale, 'footer_rights')}</p>
          <p className="flex items-center gap-1.5">
            <span className="w-1 h-1 rounded-full bg-brand-orange/60" />
            Berlin, Germany
          </p>
        </div>
      </div>
    </footer>
  );
}
