import { create } from 'zustand';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  unreadCount: number;

  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  setLoading: (loading: boolean) => void;
  setUnreadCount: (count: number) => void;
  login: (user: User, token: string) => void;
  logout: () => void;
  isAuthenticated: () => boolean;
  isAdmin: () => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isLoading: true,
  unreadCount: 0,

  setUser: (user) => set({ user }),
  setToken: (token) => {
    set({ token });
    if (token) {
      localStorage.setItem('dmo-token', token);
    } else {
      localStorage.removeItem('dmo-token');
    }
  },
  setLoading: (isLoading) => set({ isLoading }),
  setUnreadCount: (unreadCount) => set({ unreadCount }),

  login: (user, token) => {
    set({ user, token, isLoading: false });
    localStorage.setItem('dmo-token', token);
    localStorage.setItem('dmo-user', JSON.stringify(user));
    if (typeof document !== 'undefined') {
      document.cookie = `dmo-token=${encodeURIComponent(token)}; path=/; max-age=${30 * 86400}; SameSite=Lax`;
    }
  },

  logout: () => {
    set({ user: null, token: null, isLoading: false, unreadCount: 0 });
    localStorage.removeItem('dmo-token');
    localStorage.removeItem('dmo-user');
    if (typeof document !== 'undefined') {
      document.cookie = 'dmo-token=; path=/; max-age=0; SameSite=Lax';
    }
  },

  isAuthenticated: () => !!get().token,
  isAdmin: () => get().user?.role === 'admin',
}));
