'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, BookOpen, FileText, Image as ImageIcon, GraduationCap, Users, Star, Settings, Mail,
  LogOut, ExternalLink, ShieldCheck, Menu, X, Bell, Clapperboard, KeyRound, CalendarDays, Layers,
  Award, MessageSquare, Sun, Moon, Sparkles, Globe
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/stores/app-store';
import { useAuthStore } from '@/stores/auth-store';
import { adminFetch } from './api';
import Dashboard from './Dashboard';
import Courses from './Courses';
import Posts from './Posts';
import Banners from './Banners';
import Quizzes from './Quizzes';
import QuizResults from './QuizResults';
import Students from './Students';
import Testimonials from './Testimonials';
import SettingsSection from './Settings';
import Subscribers from './Subscribers';
import NotificationSection from './Notifications';
import Reels from './Reels';
import Codes from './Codes';
import Bookings from './Bookings';
import Flashcards from './Flashcards';
import Contacts from './Contacts';
import type { AdminStats } from './types';

type Section =
  | 'dashboard'
  | 'courses'
  | 'posts'
  | 'banners'
  | 'reels'
  | 'quizzes'
  | 'quiz-results'
  | 'students'
  | 'codes'
  | 'bookings'
  | 'contacts'
  | 'flashcards'
  | 'testimonials'
  | 'subscribers'
  | 'notifications'
  | 'settings';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3001';

interface NavGroup {
  title: string;
  items: { key: Section; label: string; icon: any }[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    title: 'نظرة عامة',
    items: [
      { key: 'dashboard', label: 'الرئيسية والإحصائيات', icon: LayoutDashboard },
    ],
  },
  {
    title: 'المحتوى والدروس',
    items: [
      { key: 'courses', label: 'الدورات والدروس', icon: BookOpen },
      { key: 'flashcards', label: 'بطاقات الحفظ', icon: Layers },
      { key: 'reels', label: 'الفيديوهات التعليمية', icon: Clapperboard },
      { key: 'posts', label: 'المقالات والمنشورات', icon: FileText },
      { key: 'banners', label: 'البانرات الإعلانية', icon: ImageIcon },
    ],
  },
  {
    title: 'الطلاب والاشتراكات',
    items: [
      { key: 'students', label: 'الطلاب المسجلين', icon: Users },
      { key: 'codes', label: 'أكواد التفعيل', icon: KeyRound },
      { key: 'bookings', label: 'حجوزات الأونلاين', icon: CalendarDays },
    ],
  },
  {
    title: 'الاختبارات والتقييم',
    items: [
      { key: 'quizzes', label: 'بنك الاختبارات', icon: GraduationCap },
      { key: 'quiz-results', label: 'نتائج الاختبارات', icon: Award },
    ],
  },
  {
    title: 'التواصل والمجتمع',
    items: [
      { key: 'contacts', label: 'رسائل التواصل', icon: MessageSquare },
      { key: 'testimonials', label: 'آراء الطلاب', icon: Star },
      { key: 'notifications', label: 'الإشعارات', icon: Bell },
      { key: 'subscribers', label: 'القائمة البريدية', icon: Mail },
    ],
  },
  {
    title: 'النظام',
    items: [
      { key: 'settings', label: 'إعدادات الموقع والأستاذ', icon: Settings },
    ],
  },
];

const ALL_NAV_ITEMS = NAV_GROUPS.flatMap((g) => g.items);

export default function AdminDashboard({ user, onLogout }: { user: any; onLogout: () => void }) {
  const { locale, theme, toggleTheme } = useAppStore();
  const { token, isAdmin } = useAuthStore();

  const [active, setActive] = useState<Section>(() => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname.replace(/^\/+/, '').split('/')[0] as Section;
      if (ALL_NAV_ITEMS.some((n) => n.key === path)) return path;
      const hash = window.location.hash.replace('#', '') as Section;
      if (ALL_NAV_ITEMS.some((n) => n.key === hash)) return hash;
    }
    return 'dashboard';
  });

  const [loading, setLoading] = useState(true);
  const [mobileNav, setMobileNav] = useState(false);
  const [stats, setStats] = useState<AdminStats | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const targetUrl = active === 'dashboard' ? '/' : `/${active}`;
      if (window.location.pathname !== targetUrl) {
        window.history.replaceState(null, '', targetUrl);
      }
    }
  }, [active]);

  const refresh = useCallback(async () => {
    if (!token) return;
    try {
      const statsR = await adminFetch<{ stats: AdminStats }>('/api/admin/stats', token);
      setStats(statsR.stats || null);
    } catch (e) {
      console.error('Admin data load failed', e);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (!isAdmin()) return;
    refresh();
  }, [isAdmin, refresh]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [active]);

  if (!isAdmin()) {
    return (
      <div className="pt-24 pb-24 container-bold text-center">
        <div className="w-20 h-20 mx-auto mb-5 rounded-3xl bg-red-50 dark:bg-red-950/50 flex items-center justify-center border border-red-200 dark:border-red-900">
          <ShieldCheck className="w-9 h-9 text-red-400" />
        </div>
        <p className="text-xl font-black text-foreground mb-2">غير مصرح بالدخول</p>
        <p className="text-sm text-muted-foreground mb-6">هذه الصفحة مخصصة للأستاذ عمر فقط</p>
        <a
          href={SITE_URL}
          className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-bold rounded-xl bg-gradient-to-r from-brand-orange to-brand-red text-white shadow-glow"
        >
          العودة للموقع
        </a>
      </div>
    );
  }

  const activeItem = ALL_NAV_ITEMS.find((n) => n.key === active);
  const activeLabel = activeItem?.label || '';
  const ActiveIcon = activeItem?.icon || LayoutDashboard;

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-200 flex flex-col">
      {/* Top Main Navigation Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-card/85 backdrop-blur-md px-4 sm:px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Mobile hamburger toggle */}
          <button
            onClick={() => setMobileNav((v) => !v)}
            className="p-2 rounded-xl bg-secondary hover:bg-secondary/80 border border-border lg:hidden transition-colors cursor-pointer"
            title="القائمة الجانبية"
          >
            {mobileNav ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          {/* Platform Title & Brand */}
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-orange to-brand-red text-white flex items-center justify-center font-black text-sm shadow-xs shrink-0">
              ع
            </div>
            <div>
              <h1 className="font-black text-sm sm:text-base leading-tight text-foreground">
                تعلم الألمانية مع عمر
              </h1>
              <p className="text-[10px] text-muted-foreground hidden sm:block">
                لوحة الإدارة الشاملة للمحتوى والطلاب
              </p>
            </div>
          </div>
        </div>

        {/* Header Right Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* View Website */}
          <a
            href={SITE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-secondary hover:bg-secondary/80 text-foreground border border-border transition-all"
            title="معاينة الموقع للطلاب"
          >
            <Globe className="w-3.5 h-3.5 text-brand-orange" />
            <span>عرض الموقع</span>
            <ExternalLink className="w-3 h-3 text-muted-foreground" />
          </a>

          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl bg-secondary hover:bg-secondary/80 border border-border text-foreground transition-all cursor-pointer"
            title={theme === 'dark' ? 'التحويل للوضع المضيء' : 'التحويل للوضع الداكن (Dark Mode)'}
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-slate-700" />
            )}
          </button>

          {/* Teacher Profile Tag */}
          <div className="flex items-center gap-2 ps-2 border-s border-border">
            <div className="relative">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-orange to-brand-red text-white flex items-center justify-center text-xs font-black shadow-xs">
                {user?.name?.charAt(0) || 'ع'}
              </div>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-card absolute -bottom-0.5 -end-0.5" />
            </div>
            <div className="hidden sm:block text-start leading-tight">
              <p className="text-xs font-black text-foreground">{user?.name || 'الأستاذ عمر'}</p>
              <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">مسؤول المنصة</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Layout Area */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto p-4 sm:p-6 gap-6">
        {/* Sidebar */}
        <aside
          className={cn(
            'lg:w-64 lg:shrink-0 transition-all',
            mobileNav
              ? 'fixed inset-y-0 start-0 z-50 w-72 bg-card border-e border-border p-4 shadow-2xl overflow-y-auto'
              : 'hidden lg:block'
          )}
        >
          {mobileNav && (
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-border lg:hidden">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-brand-orange text-white flex items-center justify-center font-bold text-xs">
                  ع
                </div>
                <span className="font-bold text-xs">تعلم الألمانية مع عمر</span>
              </div>
              <button
                onClick={() => setMobileNav(false)}
                className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          <div className="lg:sticky lg:top-20 space-y-4 max-h-[calc(100vh-6rem)] lg:overflow-y-auto pe-1">
            {/* Nav Groups */}
            <nav className="space-y-4">
              {NAV_GROUPS.map((group, gIdx) => (
                <div key={gIdx} className="space-y-1">
                  <p className="text-[11px] font-black text-muted-foreground/70 uppercase tracking-wider px-3 mb-1.5">
                    {group.title}
                  </p>
                  <div className="space-y-0.5">
                    {group.items.map((item) => {
                      const isCur = active === item.key;
                      return (
                        <button
                          key={item.key}
                          onClick={() => {
                            setActive(item.key);
                            setMobileNav(false);
                          }}
                          className={cn(
                            'flex items-center gap-2.5 px-3 py-2 text-xs font-bold rounded-xl transition-all duration-150 w-full text-start cursor-pointer',
                            isCur
                              ? 'bg-brand-orange text-white shadow-xs font-black'
                              : 'text-muted-foreground hover:text-foreground hover:bg-secondary/80'
                          )}
                        >
                          <item.icon className={cn('w-4 h-4 shrink-0', isCur ? 'text-white' : 'text-muted-foreground')} />
                          <span className="truncate">{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </nav>

            {/* Bottom Actions Card */}
            <div className="pt-3 border-t border-border space-y-1">
              <button
                onClick={onLogout}
                className="flex items-center gap-2 px-3 py-2 text-xs font-bold rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-all w-full cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>تسجيل الخروج</span>
              </button>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 min-w-0">
          {/* Section Breadcrumb / Title Bar */}
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-border/80">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-brand-orange/10 border border-brand-orange/20 flex items-center justify-center text-brand-orange shadow-xs">
                <ActiveIcon className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-0.5">
                  <span>لوحة الإدارة</span>
                  <span>/</span>
                  <span className="font-semibold text-foreground">{activeLabel}</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-foreground">{activeLabel}</h2>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-20 bg-card/60 animate-pulse rounded-2xl border border-border" />
              ))}
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={active}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                {active === 'dashboard' && (
                  <Dashboard
                    stats={stats}
                    teacherName={user?.name || ''}
                    onNavigate={(s) => setActive(s as Section)}
                  />
                )}
                {active === 'courses' && <Courses token={token!} locale={locale} />}
                {active === 'posts' && <Posts token={token!} locale={locale} />}
                {active === 'banners' && <Banners token={token!} locale={locale} />}
                {active === 'quizzes' && <Quizzes token={token!} locale={locale} />}
                {active === 'quiz-results' && <QuizResults token={token!} locale={locale} />}
                {active === 'students' && <Students token={token!} locale={locale} />}
                {active === 'testimonials' && <Testimonials token={token!} locale={locale} />}
                {active === 'subscribers' && <Subscribers token={token!} />}
                {active === 'codes' && <Codes token={token!} />}
                {active === 'bookings' && <Bookings token={token!} />}
                {active === 'contacts' && <Contacts token={token!} locale={locale} />}
                {active === 'flashcards' && <Flashcards token={token!} locale={locale} />}
                {active === 'settings' && <SettingsSection token={token!} user={user} />}
                {active === 'notifications' && <NotificationSection token={token!} locale={locale} />}
                {active === 'reels' && <Reels token={token!} locale={locale} />}
              </motion.div>
            </AnimatePresence>
          )}
        </main>
      </div>
    </div>
  );
}
