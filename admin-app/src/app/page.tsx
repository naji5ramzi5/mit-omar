'use client';

import { useEffect, useState, Suspense, lazy } from 'react';
import { useAuthStore } from '@/stores/auth-store';

const AdminDashboard = lazy(() => import('@/views/admin/AdminDashboard'));

export default function AdminPage() {
  const { token, user, isAdmin, logout } = useAuthStore();
  const [mounted, setMounted] = useState(false);
  const [showLogin, setShowLogin] = useState(false);

  useEffect(() => {
    setMounted(true);
    const savedToken = localStorage.getItem('dmo-token');
    const savedUser = localStorage.getItem('dmo-user');
    if (savedToken && savedUser) {
      try {
        useAuthStore.setState({
          token: savedToken,
          user: JSON.parse(savedUser),
        });
      } catch {
        localStorage.removeItem('dmo-token');
        localStorage.removeItem('dmo-user');
      }
    }
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-brand-orange/20 border-t-brand-orange rounded-full animate-spin" />
      </div>
    );
  }

  const isLoggedIn = !!token && isAdmin();
  if (!isLoggedIn) {
    return <LoginForm onSuccess={() => setShowLogin(false)} />;
  }

  return (
    <AdminDashboard
      user={user}
      onLogout={() => {
        logout();
        window.location.reload();
      }}
    />
  );
}

function LoginForm({ onSuccess }: { onSuccess: () => void }) {
  const { login } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'فشل تسجيل الدخول');
        return;
      }
      login(data.user, data.token);
      onSuccess();
    } catch {
      setError('خطأ في الاتصال');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden">
      <div className="absolute top-1/4 start-1/4 w-64 h-64 bg-brand-orange/5 rounded-full blur-[120px]" />
      <div className="absolute bottom-1/4 end-1/4 w-64 h-64 bg-brand-red/5 rounded-full blur-[120px]" />

      <div className="w-full max-w-md relative z-10">
        <div className="card-bold p-8 border-2 relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-brand-orange via-brand-red to-brand-orange" />
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-brand-orange to-brand-red flex items-center justify-center shadow-glow">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h1 className="text-2xl font-black text-foreground">لوحة التحكم</h1>
            <p className="text-sm text-muted-foreground mt-1">دخول الأستاذ عمر</p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 text-sm rounded-xl border-2 border-red-100 dark:border-red-900/50 font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-foreground mb-1.5">البريد الإلكتروني</label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="input-bold"
                placeholder="admin@deutschmitomar.com"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-foreground mb-1.5">كلمة المرور</label>
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="input-bold"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="btn-bold-primary w-full shadow-glow-lg hover:shadow-brand-orange/50"
            >
              {loading ? 'جاري الدخول...' : 'دخول اللوحة'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}