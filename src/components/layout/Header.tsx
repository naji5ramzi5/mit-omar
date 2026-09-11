'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, ChevronDown, Bell, LogOut, BookOpen, Globe, Sun, Moon, User, Shield } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useAppStore } from '@/stores/app-store';
import { useAuthStore } from '@/stores/auth-store';
import { useScrollPosition } from '@/hooks/use-scroll';
import { t, localeNames, type Locale } from '@/lib/i18n';
import Image from 'next/image';

const navItems = [
  { key: 'nav_home', view: 'home' as const },
  { key: 'nav_about', view: 'about' as const },
  { key: 'nav_courses', view: 'courses' as const },
  { key: 'nav_online_booking', view: 'online_booking' as const },
  { key: 'nav_posts', view: 'posts' as const },
  { key: 'nav_contact', view: 'contact' as const },
] as const;

export default function Header() {
  const { locale, navigate, setLocale, theme, toggleTheme, isMobileMenuOpen, setMobileMenuOpen, view } = useAppStore();
  const { user, logout, isAuthenticated, unreadCount } = useAuthStore();
  const { isScrolled } = useScrollPosition();

  const isTransparent = !isScrolled && view === 'home';

  const transparentClass = (active: boolean) =>
    active
      ? 'text-white bg-white/10'
      : 'text-white/70 hover:text-white hover:bg-white/10';
  const solidClass = (active: boolean) =>
    active
      ? 'text-foreground bg-brand-orange/10'
      : 'text-muted-foreground hover:text-foreground hover:bg-brand-orange/5';

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ease-out ${
        isTransparent
          ? 'bg-gradient-to-b from-black/50 to-transparent'
          : 'bg-background/90 backdrop-blur-xl border-b border-border/60 shadow-[0_1px_0_rgba(0,0,0,0.02)]'
      }`}
    >
      <div className={`container-bold h-full flex items-center justify-between transition-all duration-300 ${
        isTransparent ? 'py-4' : 'py-2.5'
      }`}>
        {/* Logo */}
        <button
          onClick={() => navigate('home')}
          className="shrink-0 transition-all duration-300 flex items-center gap-2.5 group"
          aria-label="Deutsch mit Omar — الرئيسية"
        >
          <Image
            src="/images/logo-official.png"
            alt="Deutsch mit Omar"
            width={64}
            height={64}
            className={`object-contain rounded-xl h-12 md:h-16 w-auto transition-all duration-300 ${
              isTransparent ? 'brightness-0 invert' : ''
            } group-hover:scale-105`}
            priority
          />
          <span className={`hidden sm:block font-display text-xl md:text-2xl font-extrabold tracking-tight transition-all duration-300 ${
            isTransparent ? 'text-white' : 'text-foreground'
          }`}>
            Deutsch <span className="text-gradient">mit</span> Omar
          </span>
        </button>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-1" aria-label="القائمة الرئيسية">
          {navItems.map((item) => {
            const active = view === item.view;
            return (
              <button
                key={item.view}
                onClick={() => navigate(item.view)}
                aria-current={active ? 'page' : undefined}
                className={`relative px-3.5 py-2 text-[13px] font-semibold rounded-lg transition-all duration-200 ${
                  isTransparent
                    ? transparentClass(active)
                    : solidClass(active)
                }`}
              >
                {t(locale, item.key)}
              </button>
            );
          })}
        </nav>

        {/* Right Side */}
        <div className="flex items-center gap-1">
          {/* Language Switcher */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                aria-label="Change language — تغيير اللغة"
                className={`flex items-center gap-1.5 px-2.5 h-9 rounded-lg transition-all duration-200 ${
                  isTransparent
                    ? 'text-white/70 hover:text-white hover:bg-white/10'
                    : 'text-muted-foreground hover:text-foreground hover:bg-brand-orange/5'
                }`}
              >
                <Globe className="w-4 h-4" />
                <span className="hidden md:inline text-xs font-semibold tracking-wide">{localeNames[locale]}</span>
                <ChevronDown className="w-3 h-3 opacity-60" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-36 rounded-xl border-border bg-popover shadow-card p-1">
              {(Object.keys(localeNames) as Locale[]).map((loc) => (
                <DropdownMenuItem
                  key={loc}
                  onClick={() => setLocale(loc)}
                  className={`rounded-lg text-sm cursor-pointer ${locale === loc ? 'bg-brand-orange/10 text-brand-orange font-semibold' : ''}`}
                >
                  {localeNames[loc]}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            aria-label="Toggle theme — تبديل المظهر"
            className={`flex items-center justify-center w-9 h-9 rounded-lg transition-all duration-200 ${
              isTransparent
                ? 'text-white/70 hover:text-white hover:bg-white/10'
                : 'text-muted-foreground hover:text-brand-orange hover:bg-brand-orange/5'
            }`}
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* User Menu / Auth */}
          {isAuthenticated() ? (
            <>
              {/* Notifications */}
              <button
                onClick={() => navigate('notifications')}
                aria-label="Notifications — الإشعارات"
                className={`relative flex items-center justify-center w-9 h-9 rounded-lg transition-all duration-200 ${
                  isTransparent
                    ? 'text-white/70 hover:text-white hover:bg-white/10'
                    : 'text-muted-foreground hover:text-foreground hover:bg-brand-orange/5'
                }`}
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 end-1.5 w-2 h-2 bg-brand-red rounded-full ring-2 ring-white dark:ring-card" />
                )}
              </button>

              {/* User Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    aria-label="حسابي"
                    className={`flex items-center gap-1.5 ps-1 pe-2 h-9 rounded-lg transition-all duration-200 ${
                      isTransparent ? 'hover:bg-white/10' : 'hover:bg-brand-orange/5'
                    }`}
                  >
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-[11px] font-bold transition-all duration-200 ${
                      isTransparent
                        ? 'bg-white/15 text-white ring-1 ring-white/20'
                        : 'bg-gradient-to-br from-brand-orange to-brand-red text-white'
                    }`}>
                      {user?.name?.charAt(0) || 'U'}
                    </div>
                    <ChevronDown className={`w-3 h-3 ${isTransparent ? 'text-white/40' : 'text-muted-foreground'}`} />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52 rounded-xl border-border bg-popover shadow-card p-1">
                  <DropdownMenuItem onClick={() => navigate('student')} className="rounded-lg text-sm cursor-pointer">
                    <BookOpen className="w-4 h-4 ms-2 text-brand-orange" />
                    {t(locale, 'nav_my_courses')}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('profile')} className="rounded-lg text-sm cursor-pointer">
                    <User className="w-4 h-4 ms-2 text-brand-orange" />
                    {locale === 'ar' ? 'الملف الشخصي' : locale === 'de' ? 'Mein Profil' : 'My Profile'}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('notifications')} className="rounded-lg text-sm cursor-pointer">
                    <Bell className="w-4 h-4 ms-2 text-brand-orange" />
                    {t(locale, 'nav_notifications')}
                  </DropdownMenuItem>

                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout} className="text-red-500 rounded-lg text-sm cursor-pointer focus:text-red-500 focus:bg-red-50">
                    <LogOut className="w-4 h-4 ms-2" />
                    {t(locale, 'nav_logout')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              {/* Login */}
              <button
                onClick={() => navigate('login')}
                className={`hidden sm:flex items-center h-9 px-3.5 text-xs font-semibold rounded-lg transition-all duration-200 ${
                  isTransparent
                    ? 'text-white/85 hover:text-white hover:bg-white/10 border border-white/20'
                    : 'text-foreground hover:bg-brand-orange/5 border border-border'
                }`}
              >
                {t(locale, 'nav_login')}
              </button>

              {/* CTA Button */}
              <button
                onClick={() => navigate('courses')}
                className="hidden sm:flex items-center h-9 px-4 text-xs font-bold tracking-wide bg-gradient-to-r from-brand-orange to-brand-red text-white rounded-lg hover:from-brand-orange-dark hover:to-brand-red-dark active:scale-[0.98] transition-all duration-200"
              >
                {t(locale, 'hero_cta_primary')}
              </button>
            </>
          )}

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!isMobileMenuOpen)}
            aria-label={isMobileMenuOpen ? 'Close menu — إغلاق القائمة' : 'Open menu — فتح القائمة'}
            className={`lg:hidden flex items-center justify-center w-9 h-9 rounded-lg transition-all duration-200 ${
              isTransparent
                ? 'text-white hover:bg-white/10'
                : 'text-foreground hover:text-brand-orange hover:bg-brand-orange/5'
            }`}
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
            className="lg:hidden bg-background/95 backdrop-blur-2xl border-t border-border/60 overflow-hidden"
          >
            <nav className="container-bold py-3 flex flex-col" aria-label="القائمة">
              {navItems.map((item, i) => {
                const active = view === item.view;
                return (
                  <motion.button
                    key={item.view}
                    initial={{ opacity: 0, x: locale === 'ar' ? 8 : -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03, duration: 0.2 }}
                    onClick={() => navigate(item.view)}
                    className={`text-start px-4 py-3 text-sm font-semibold rounded-xl transition-all duration-200 ${
                      active ? 'text-brand-orange bg-brand-orange/10' : 'text-muted-foreground hover:text-brand-orange hover:bg-brand-orange/5'
                    }`}
                  >
                    {t(locale, item.key)}
                  </motion.button>
                );
              })}
              <div className="h-px bg-gradient-to-r from-transparent via-brand-orange/15 to-transparent my-2" />
              {isAuthenticated() ? (
                <>
                  <button onClick={() => navigate('student')} className="text-start px-4 py-3 text-sm font-semibold text-muted-foreground hover:text-brand-orange hover:bg-brand-orange/5 rounded-xl transition-all">{t(locale, 'nav_my_courses')}</button>
                  <button onClick={() => navigate('profile')} className="text-start px-4 py-3 text-sm font-semibold text-muted-foreground hover:text-brand-orange hover:bg-brand-orange/5 rounded-xl transition-all">{locale === 'ar' ? 'الملف الشخصي' : locale === 'de' ? 'Mein Profil' : 'My Profile'}</button>
                  <button onClick={() => navigate('notifications')} className="text-start px-4 py-3 text-sm font-semibold text-muted-foreground hover:text-brand-orange hover:bg-brand-orange/5 rounded-xl transition-all">{t(locale, 'nav_notifications')}</button>

                  <button onClick={logout} className="text-start px-4 py-3 text-sm font-semibold text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl transition-all">{t(locale, 'nav_logout')}</button>
                </>
              ) : (
                <button onClick={() => navigate('login')} className="mx-4 mt-2 py-3 text-sm font-bold tracking-wide bg-gradient-to-r from-brand-orange to-brand-red text-white rounded-xl transition-all">{t(locale, 'nav_login')}</button>
              )}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}