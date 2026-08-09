'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, ChevronDown, Bell, LogOut, BookOpen, Settings, Globe, Sun, Moon } from 'lucide-react';
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
  { key: 'nav_posts', view: 'posts' as const },
  { key: 'nav_contact', view: 'contact' as const },
];

export default function Header() {
  const { locale, navigate, setLocale, theme, toggleTheme, isMobileMenuOpen, setMobileMenuOpen, view } = useAppStore();
  const { user, logout, isAuthenticated, isAdmin, unreadCount } = useAuthStore();
  const { isScrolled } = useScrollPosition();

  const isTransparent = !isScrolled && view === 'home';

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ease-out ${
        isTransparent
          ? 'bg-gradient-to-b from-black/40 to-transparent'
          : 'bg-background/95 backdrop-blur-xl border-b border-border/50'
      }`}
    >
      <div className={`container-bold h-full flex items-center justify-between transition-all duration-500 ${
        isTransparent ? 'py-5' : 'py-3.5'
      }`}>
        {/* Logo */}
        <button
          onClick={() => navigate('home')}
          className="shrink-0 transition-all duration-500 flex items-center gap-3"
        >
          <Image
            src="/images/logo-official.png"
            alt="Deutsch mit Omar"
            width={64}
            height={64}
            className={`object-contain rounded-xl transition-all duration-500 ${
              isTransparent ? 'brightness-0 invert' : 'brightness-90'
            }`}
            priority
          />
          <span className={`hidden sm:block text-xl font-black tracking-tight transition-all duration-500 ${
            isTransparent ? 'text-white' : 'text-foreground'
          }`}>
            Deutsch <span className="text-gradient">mit</span> Omar
          </span>
        </button>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-1">
          {navItems.map((item) => (
            <button
              key={item.view}
              onClick={() => navigate(item.view)}
              className={`relative px-4 py-2 text-[13px] font-semibold tracking-wide uppercase transition-all duration-300 rounded-lg group ${
                isTransparent
                  ? 'text-white/70 hover:text-white hover:bg-white/10'
                  : 'text-muted-foreground hover:text-foreground hover:bg-brand-orange/5'
              }`}
            >
              {t(locale, item.key)}
              <span className={`absolute bottom-0.5 left-1/2 -translate-x-1/2 w-0 h-[2px] transition-all duration-300 group-hover:w-6 rounded-full ${
                isTransparent ? 'bg-white' : 'bg-gradient-to-r from-brand-orange to-brand-red'
              }`} />
            </button>
          ))}
        </nav>

        {/* Right Side */}
        <div className="flex items-center gap-2">
          {/* Language Selector */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl transition-all duration-300 ${
                isTransparent
                  ? 'text-white/60 hover:text-white hover:bg-white/10'
                  : 'text-muted-foreground hover:text-foreground hover:bg-brand-orange/5'
              }`}>
                <Globe className="w-3.5 h-3.5" />
                <span className="hidden sm:inline text-[11px] tracking-wider uppercase">{localeNames[locale]}</span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-36 rounded-xl">
              {(Object.keys(localeNames) as Locale[]).map((loc) => (
                <DropdownMenuItem
                  key={loc}
                  onClick={() => setLocale(loc)}
                  className={`rounded-lg ${locale === loc ? 'bg-brand-orange/10 text-brand-orange font-semibold' : ''}`}
                >
                  {localeNames[loc]}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className={`p-2.5 rounded-xl transition-all duration-300 ${
              isTransparent
                ? 'text-white/60 hover:text-white hover:bg-white/10'
                : 'text-muted-foreground hover:text-brand-orange hover:bg-brand-orange/5'
            }`}
          >
            {theme === 'dark' ? <Sun className="w-[18px] h-[18px]" /> : <Moon className="w-[18px] h-[18px]" />}
          </button>

          {isAuthenticated() ? (
            <>
              <button
                onClick={() => navigate('notifications')}
                className={`relative p-2.5 rounded-xl transition-all duration-300 ${
                  isTransparent
                    ? 'text-white/60 hover:text-white hover:bg-white/10'
                    : 'text-muted-foreground hover:text-foreground hover:bg-brand-orange/5'
                }`}
              >
                <Bell className="w-[17px] h-[17px]" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-brand-red rounded-full ring-2 ring-white animate-pulse" />
                )}
              </button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className={`flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all duration-300 ${
                    isTransparent
                      ? 'hover:bg-white/10'
                      : 'hover:bg-brand-orange/5'
                  }`}>
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-[11px] font-bold transition-all duration-300 ${
                      isTransparent
                        ? 'bg-white/15 text-white ring-2 ring-white/20'
                        : 'bg-gradient-to-br from-brand-orange to-brand-red text-white shadow-glow'
                    }`}>
                      {user?.name?.charAt(0) || 'U'}
                    </div>
                    <ChevronDown className={`w-3 h-3 ${isTransparent ? 'text-white/50' : 'text-muted-foreground'}`} />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 rounded-xl">
                  <DropdownMenuItem onClick={() => navigate('student')} className="rounded-lg">
                    <BookOpen className="w-4 h-4 ms-2 text-brand-orange" />
                    {t(locale, 'nav_my_courses')}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('notifications')} className="rounded-lg">
                    <Bell className="w-4 h-4 ms-2 text-brand-orange" />
                    {t(locale, 'nav_notifications')}
                  </DropdownMenuItem>
                  {isAdmin() && (
                    <DropdownMenuItem onClick={() => navigate('admin')} className="rounded-lg">
                      <Settings className="w-4 h-4 ms-2 text-brand-orange" />
                      {t(locale, 'nav_admin')}
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout} className="text-red-500 rounded-lg focus:text-red-500 focus:bg-red-50">
                    <LogOut className="w-4 h-4 ms-2" />
                    {t(locale, 'nav_logout')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <button
              onClick={() => navigate('login')}
              className={`hidden sm:flex items-center px-4 py-2 text-xs font-semibold tracking-wide rounded-xl transition-all duration-300 ${
                isTransparent
                  ? 'text-white/80 hover:text-white hover:bg-white/10 border border-white/20'
                  : 'text-foreground hover:bg-brand-orange/5'
              }`}
            >
              {t(locale, 'nav_login')}
            </button>
          )}

          {!isAuthenticated() && (
            <button
              onClick={() => navigate('login')}
              className="hidden sm:flex items-center px-6 py-2.5 text-xs font-bold tracking-wider uppercase bg-gradient-to-r from-brand-orange to-brand-red text-white rounded-xl hover:from-brand-orange-dark hover:to-brand-red-dark hover:shadow-glow active:scale-[0.97] transition-all duration-300"
            >
              {t(locale, 'hero_cta_primary')}
            </button>
          )}

          <button
            onClick={() => setMobileMenuOpen(!isMobileMenuOpen)}
            className={`lg:hidden p-2.5 rounded-xl transition-all duration-300 ${
              isTransparent
                ? 'text-white hover:bg-white/15'
                : 'text-foreground hover:bg-brand-orange/5'
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
            transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
            className="lg:hidden bg-background/98 backdrop-blur-2xl border-t border-border/50 overflow-hidden"
          >
            <nav className="container-bold py-5 flex flex-col gap-1">
              {navItems.map((item, i) => (
                <motion.button
                  key={item.view}
                  initial={{ opacity: 0, x: locale === 'ar' ? 12 : -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04, duration: 0.3 }}
                  onClick={() => navigate(item.view)}
                  className="text-start px-4 py-3 text-sm font-semibold text-muted-foreground hover:text-brand-orange hover:bg-brand-orange/5 rounded-xl transition-all duration-200"
                >
                  {t(locale, item.key)}
                </motion.button>
              ))}
              <div className="h-px bg-gradient-to-r from-transparent via-brand-orange/20 to-transparent my-2" />
              {isAuthenticated() ? (
                <>
                  <button onClick={() => navigate('student')} className="text-start px-4 py-3 text-sm font-semibold text-muted-foreground hover:text-brand-orange hover:bg-brand-orange/5 rounded-xl transition-all">{t(locale, 'nav_my_courses')}</button>
                  {isAdmin() && (
                    <button onClick={() => navigate('admin')} className="text-start px-4 py-3 text-sm font-semibold text-muted-foreground hover:text-brand-orange hover:bg-brand-orange/5 rounded-xl transition-all">{t(locale, 'nav_admin')}</button>
                  )}
                  <button onClick={logout} className="text-start px-4 py-3 text-sm font-semibold text-red-500 hover:bg-red-50 rounded-xl transition-all">{t(locale, 'nav_logout')}</button>
                </>
              ) : (
                <button onClick={() => navigate('login')} className="mx-4 mt-2 py-3 text-sm font-bold tracking-wide bg-gradient-to-r from-brand-orange to-brand-red text-white rounded-xl hover:shadow-glow transition-all">{t(locale, 'nav_login')}</button>
              )}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
