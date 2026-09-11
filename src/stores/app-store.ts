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
  | 'profile'
  | 'video-lesson'
  | 'notifications'
  | 'exams'
  | 'quiz'
  | 'quiz-result'
  | 'translation'
  | 'online_booking'
  | 'flashcards'
  | 'certificate';

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

  navigate: (view: AppView, params?: Record<string, string>, replace?: boolean) => void;
  goBack: () => void;
  setLocale: (locale: Locale) => void;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  setMobileMenuOpen: (open: boolean) => void;
  setNotificationOpen: (open: boolean) => void;
}

export function viewToHash(view: AppView, params: Record<string, string> = {}): string {
  if (view === 'home') return '#/';
  const search = new URLSearchParams(params).toString();
  return `#/${view}${search ? `?${search}` : ''}`;
}

export function parseHash(hash: string): { view: AppView; params: Record<string, string> } | null {
  if (!hash || hash === '#' || hash === '#/') return { view: 'home', params: {} };
  const clean = hash.startsWith('#/') ? hash.slice(2) : hash.startsWith('#') ? hash.slice(1) : hash;
  const [viewPart, queryPart] = clean.split('?');
  const params: Record<string, string> = {};
  if (queryPart) {
    new URLSearchParams(queryPart).forEach((v, k) => {
      params[k] = v;
    });
  }
  const validViews: AppView[] = [
    'home', 'about', 'courses', 'course-detail', 'posts', 'post-detail',
    'contact', 'login', 'register', 'activate', 'student', 'profile', 'video-lesson',
    'notifications', 'exams', 'quiz', 'quiz-result', 'translation',
    'online_booking', 'flashcards', 'certificate'
  ];
  if (validViews.includes(viewPart as AppView)) {
    return { view: viewPart as AppView, params };
  }
  return null;
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

function getInitialLocale(): Locale {
  if (typeof window === 'undefined') return 'ar';
  const saved = localStorage.getItem('dmo-locale');
  if (saved && ['ar', 'de', 'en'].includes(saved)) return saved as Locale;
  return 'ar';
}

function getInitialView(): { view: AppView; params: Record<string, string> } {
  if (typeof window === 'undefined') return { view: 'home', params: {} };
  const fromHash = parseHash(window.location.hash);
  if (fromHash) return fromHash;
  return { view: 'home', params: {} };
}

const initial = getInitialView();

export const useAppStore = create<AppState>((set, get) => ({
  view: initial.view,
  viewParams: initial.params,
  prevView: null,
  prevParams: {},
  locale: getInitialLocale(),
  theme: 'light',
  isMobileMenuOpen: false,
  isNotificationOpen: false,

  navigate: (view, params = {}, replace = false) => {
    const state = get();
    set({
      prevView: state.view,
      prevParams: state.viewParams,
      view,
      viewParams: params,
      isMobileMenuOpen: false,
    });
    if (typeof window !== 'undefined') {
      const hash = viewToHash(view, params);
      if (replace) {
        window.history.replaceState({ view, params }, '', hash);
      } else {
        window.history.pushState({ view, params }, '', hash);
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  },

  goBack: () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      window.history.back();
    } else {
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
    }
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

// Listen to browser navigation (back/forward)
if (typeof window !== 'undefined') {
  window.addEventListener('popstate', (e) => {
    const state = e.state as { view: AppView; params: Record<string, string> } | null;
    if (state && state.view) {
      useAppStore.setState({
        view: state.view,
        viewParams: state.params || {},
        isMobileMenuOpen: false,
      });
    } else {
      const parsed = parseHash(window.location.hash);
      if (parsed) {
        useAppStore.setState({
          view: parsed.view,
          viewParams: parsed.params,
          isMobileMenuOpen: false,
        });
      }
    }
  });

  window.addEventListener('hashchange', () => {
    const parsed = parseHash(window.location.hash);
    if (parsed) {
      const current = useAppStore.getState();
      if (current.view !== parsed.view || JSON.stringify(current.viewParams) !== JSON.stringify(parsed.params)) {
        useAppStore.setState({
          view: parsed.view,
          viewParams: parsed.params,
          isMobileMenuOpen: false,
        });
      }
    }
  });

  applyTheme(getInitialTheme());
}
