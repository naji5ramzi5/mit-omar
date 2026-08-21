import { create } from 'zustand';

export type Locale = 'ar' | 'de' | 'en';

type Theme = 'light' | 'dark' | 'system';

interface AdminAppState {
  locale: Locale;
  theme: Theme;

  setLocale: (locale: Locale) => void;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;

  // No-op navigate for standalone admin
  navigate: (view: string) => void;
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

export const useAppStore = create<AdminAppState>((set, get) => ({
  locale: 'ar',
  theme: 'light',

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

  navigate: () => {
    // No-op for standalone admin
  },
}));

// Apply saved theme on load
if (typeof window !== 'undefined') {
  applyTheme(getInitialTheme());
}