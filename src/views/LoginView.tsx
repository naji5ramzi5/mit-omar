'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { LogIn, Eye, EyeOff } from 'lucide-react';
import { useAppStore } from '@/stores/app-store';
import { useAuthStore } from '@/stores/auth-store';
import { t } from '@/lib/i18n';

export default function LoginView() {
  const { locale, navigate } = useAppStore();
  const { login } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
        setError(data.error || t(locale, 'login_error'));
        return;
      }
      login(data.user, data.token);
      navigate('student');
    } catch {
      setError(t(locale, 'common_error'));
    }
    setLoading(false);
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute top-1/4 start-1/4 w-64 h-64 bg-brand-orange/5 rounded-full blur-[120px]" />
      <div className="absolute bottom-1/4 end-1/4 w-64 h-64 bg-brand-red/5 rounded-full blur-[120px]" />
      
      <motion.div
        initial={{ opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="card-bold p-8 relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-brand-orange via-brand-red to-brand-orange" />
          <div className="text-center mb-8">
            <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-brand-orange to-brand-red flex items-center justify-center">
              <LogIn className="w-8 h-8 text-white" />
            </div>
            <h1 className="font-display text-2xl font-black text-foreground">{t(locale, 'login_title')}</h1>
            <p className="text-sm text-muted-foreground mt-1">{t(locale, 'login_subtitle')}</p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 text-sm rounded-xl border border-red-100 dark:border-red-900/50 font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-foreground mb-1.5">{t(locale, 'login_email')}</label>
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="input-bold" placeholder="name@example.com" />
            </div>
            <div>
              <label className="block text-sm font-bold text-foreground mb-1.5">{t(locale, 'login_password')}</label>
              <div className="relative">
                <input type={showPassword ? 'text' : 'password'} required value={password} onChange={e => setPassword(e.target.value)} className="input-bold pe-10" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-brand-orange transition-colors">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-bold-primary w-full">
              {loading ? t(locale, 'common_loading') : t(locale, 'login_button')}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            <span>{t(locale, 'login_no_account')} </span>
            <button onClick={() => navigate('register')} className="text-brand-orange font-bold hover:underline">
              {t(locale, 'login_register')}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
