import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, BookOpen, FileText, Image as ImageIcon, GraduationCap, Users, Star, Settings, Mail,
  LogOut, ExternalLink, ShieldCheck, Menu, X, Bell, Clapperboard, KeyRound, CalendarDays, Layers,
  Award, MessageSquare,
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

const NAV: { key: Section; label: string; icon: any }[] = [
  { key: 'dashboard', label: 'الرئيسية', icon: LayoutDashboard },
  { key: 'courses', label: 'الدورات والدروس', icon: BookOpen },
  { key: 'posts', label: 'المقالات والمنشورات', icon: FileText },
  { key: 'reels', label: 'الفيديوهات التعليمية', icon: Clapperboard },
  { key: 'banners', label: 'البانرات الإعلانية', icon: ImageIcon },
  { key: 'flashcards', label: 'بطاقات الحفظ', icon: Layers },
  { key: 'quizzes', label: 'إدارة الاختبارات', icon: GraduationCap },
  { key: 'quiz-results', label: 'نتائج الاختبارات', icon: Award },
  { key: 'students', label: 'الطلاب المسجلين', icon: Users },
  { key: 'codes', label: 'أكواد التفعيل', icon: KeyRound },
  { key: 'bookings', label: 'حجوزات الأونلاين', icon: CalendarDays },
  { key: 'contacts', label: 'رسائل التواصل', icon: MessageSquare },
  { key: 'notifications', label: 'الإشعارات', icon: Bell },
  { key: 'testimonials', label: 'آراء الطلاب', icon: Star },
  { key: 'subscribers', label: 'القائمة البريدية', icon: Mail },
  { key: 'settings', label: 'إعدادات الموقع والأستاذ', icon: Settings },
];

export default function AdminDashboard({ user, onLogout }: { user: any; onLogout: () => void }) {
  const { locale } = useAppStore();
  const { token, isAdmin, logout } = useAuthStore();
  const [active, setActive] = useState<Section>(() => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname.replace(/^\/+/, '').split('/')[0] as Section;
      if (NAV.some((n) => n.key === path)) return path;
      const hash = window.location.hash.replace('#', '') as Section;
      if (NAV.some((n) => n.key === hash)) return hash;
    }
    return 'dashboard';
  });
  const [loading, setLoading] = useState(true);
  const [mobileNav, setMobileNav] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const targetUrl = active === 'dashboard' ? '/' : `/${active}`;
      if (window.location.pathname !== targetUrl) {
        window.history.replaceState(null, '', targetUrl);
      }
    }
  }, [active]);

  const [stats, setStats] = useState<AdminStats | null>(null);

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
        <div className="w-20 h-20 mx-auto mb-5 rounded-3xl bg-red-50 dark:bg-red-950 flex items-center justify-center">
          <ShieldCheck className="w-9 h-9 text-red-400" />
        </div>
        <p className="text-xl font-black text-foreground mb-2">غير مصرح بالدخول</p>
        <p className="text-sm text-muted-foreground mb-6">هذه الصفحة مخصصة للأستاذ عمر فقط</p>
        <a href={SITE_URL} className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-bold rounded-xl bg-gradient-to-r from-brand-orange to-brand-red text-white shadow-glow">
          العودة للموقع
        </a>
      </div>
    );
  }

  const activeLabel = NAV.find((n) => n.key === active)?.label || '';

  return (
    <div className="pt-6 pb-20 min-h-screen bg-gradient-to-b from-brand-warm/40 to-background">
      <div className="container-bold">
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-6">
          {/* Sidebar - fixed on desktop */}
          <aside className={cn(
            'lg:w-60 lg:shrink-0',
            mobileNav ? 'block' : 'hidden lg:block',
          )}>
            <div className="lg:sticky lg:top-4 lg:h-[calc(100vh-2rem)] lg:overflow-y-auto space-y-4">
              {/* Brand */}
              <div className="flex items-center gap-2.5 p-3.5 rounded-2xl bg-gradient-to-l from-brand-orange to-brand-red text-white shadow-glow">
                <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center font-black text-sm shrink-0">د</div>
                <div className="leading-tight min-w-0">
                  <p className="font-black text-sm truncate">دويتش مع عمر</p>
                  <p className="text-[10px] opacity-90">لوحة الإدارة الشاملة</p>
                </div>
              </div>

              {/* Nav */}
              <nav className="card-bold border-2 p-2 flex lg:flex-col gap-1 overflow-x-auto lg:overflow-y-auto lg:overflow-x-hidden">
                {NAV.map((item) => (
                  <button
                    key={item.key}
                    onClick={() => { setActive(item.key); setMobileNav(false); }}
                    className={cn(
                      'flex items-center gap-2 px-3 py-2 text-xs font-bold rounded-xl transition-all duration-200 whitespace-nowrap w-full',
                      active === item.key
                        ? 'bg-gradient-to-r from-brand-orange to-brand-red text-white shadow-glow'
                        : 'text-muted-foreground hover:text-foreground hover:bg-brand-orange/5',
                    )}
                  >
                    <item.icon className="w-4 h-4 shrink-0" />
                    {item.label}
                  </button>
                ))}
              </nav>

              {/* Footer actions */}
              <div className="card-bold border-2 p-2 space-y-1">
                <a href={SITE_URL} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-3 py-2 text-xs font-bold rounded-xl text-muted-foreground hover:text-foreground hover:bg-brand-orange/5 transition-all w-full">
                  <ExternalLink className="w-4 h-4" /> عرض الموقع
                </a>
                <button onClick={onLogout} className="flex items-center gap-2 px-3 py-2 text-xs font-bold rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-950 transition-all w-full">
                  <LogOut className="w-4 h-4" /> تسجيل الخروج
                </button>
              </div>
            </div>
          </aside>

          {/* Main */}
          <main className="flex-1 min-w-0">
            {/* Mobile nav toggle */}
            <div className="flex items-center justify-between mb-4 lg:hidden">
              <button onClick={() => setMobileNav((v) => !v)} className="p-2.5 rounded-xl bg-card border-2 border-border">
                {mobileNav ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
              <h1 className="text-lg font-black text-foreground">{activeLabel}</h1>
            </div>

            {/* Desktop page header */}
            <div className="hidden lg:flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-brand-orange/10 flex items-center justify-center text-brand-orange">
                  {NAV.find((n) => n.key === active)?.icon && (() => {
                    const Ico = NAV.find((n) => n.key === active)!.icon;
                    return <Ico className="w-5 h-5" />;
                  })()}
                </div>
                <h1 className="text-2xl font-black text-foreground">{activeLabel}</h1>
              </div>
              <div className="flex items-center gap-2 text-sm font-bold text-muted-foreground">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-orange to-brand-red text-white flex items-center justify-center text-xs font-black">
                  {user?.name?.charAt(0) || 'O'}
                </div>
                {user?.name || 'الأستاذ عمر'}
              </div>
            </div>

            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-[72px] skeleton-bold rounded-xl" />)}
              </div>
            ) : (
              <AnimatePresence mode="wait">
                <motion.div key={active} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                  {active === 'dashboard' && <Dashboard stats={stats} teacherName={user?.name || ''} onNavigate={(s) => setActive(s as Section)} />}
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
    </div>
  );
}
