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

/**
 * Read auth state synchronously from localStorage during store creation.
 * This prevents a second render/fetch cycle caused by async restoration.
 */
function getInitialAuthState(): { user: User | null; token: string | null; isLoading: boolean } {
  if (typeof window === 'undefined') {
    return { user: null, token: null, isLoading: false };
  }
  try {
    const savedToken = localStorage.getItem('dmo-token');
    const savedUser = localStorage.getItem('dmo-user');
    if (savedToken && savedUser) {
      const user = JSON.parse(savedUser) as User;
      return { user, token: savedToken, isLoading: false };
    }
  } catch {
    // Corrupted data — clear it
    localStorage.removeItem('dmo-token');
    localStorage.removeItem('dmo-user');
  }
  return { user: null, token: null, isLoading: false };
}

const initialAuth = getInitialAuthState();

export const useAuthStore = create<AuthState>((set, get) => ({
  user: initialAuth.user,
  token: initialAuth.token,
  isLoading: initialAuth.isLoading,
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
  },

  logout: () => {
    set({ user: null, token: null, isLoading: false, unreadCount: 0 });
    localStorage.removeItem('dmo-token');
    localStorage.removeItem('dmo-user');
  },

  isAuthenticated: () => !!get().token,
  isAdmin: () => get().user?.role === 'admin',
}));
