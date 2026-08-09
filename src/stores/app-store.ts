import { create } from 'zustand';
import type { Locale } from '@/lib/i18n';

export type AppView =
  | 'home'
  | 'about'
  | 'courses'
  | 'course-detail'
  | 'posts'
  | 'post-detail'
  | 'contact'
  | 'login'
  | 'register'
  | 'activate'
  | 'student'
  | 'video-lesson'
  | 'notifications'
  | 'admin';

type Theme = 'light' | 'dark' | 'system';

interface AppState {
  view: AppView;
  viewParams: Record<string, string>;
  prevView: AppView | null;
  prevParams: Record<string, string>;
  locale: Locale;
  theme: Theme;
  isMobileMenuOpen: boolean;
  isNotificationOpen: boolean;

  navigate: (view: AppView, params?: Record<string, string>) => void;
  goBack: () => void;
  setLocale: (locale: Locale) => void;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  setMobileMenuOpen: (open: boolean) => void;
  setNotificationOpen: (open: boolean) => void;
}

function applyTheme(theme: Theme) {
  if (typeof window === 'undefined') return;
  const isDark =
    theme === 'dark' ||
    (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.classList.toggle('dark', isDark);
  localStorage.setItem('dmo-theme', theme);
}

function getInitialTheme(): Theme {
  if (typeof window === 'undefined') return 'light';
  return (localStorage.getItem('dmo-theme') as Theme) || 'light';
}

export const useAppStore = create<AppState>((set, get) => ({
  view: 'home',
  viewParams: {},
  prevView: null,
  prevParams: {},
  locale: 'ar',
  theme: 'light',
  isMobileMenuOpen: false,
  isNotificationOpen: false,

  navigate: (view, params = {}) => {
    const state = get();
    set({
      prevView: state.view,
      prevParams: state.viewParams,
      view,
      viewParams: params,
      isMobileMenuOpen: false,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  },

  goBack: () => {
    const state = get();
    if (state.prevView) {
      set({
        view: state.prevView,
        viewParams: state.prevParams,
        prevView: null,
        prevParams: {},
      });
    } else {
      set({ view: 'home', viewParams: {} });
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  },

  setLocale: (locale) => {
    set({ locale });
    document.documentElement.lang = locale;
    document.documentElement.dir = locale === 'ar' ? 'rtl' : 'ltr';
    if (typeof window !== 'undefined') {
      localStorage.setItem('dmo-locale', locale);
    }
  },

  setTheme: (theme) => {
    set({ theme });
    applyTheme(theme);
  },

  toggleTheme: () => {
    const { theme } = get();
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    set({ theme: newTheme });
    applyTheme(newTheme);
  },

  setMobileMenuOpen: (open) => set({ isMobileMenuOpen: open }),
  setNotificationOpen: (open) => set({ isNotificationOpen: open }),
}));

// Apply saved theme on load
if (typeof window !== 'undefined') {
  applyTheme(getInitialTheme());
}
