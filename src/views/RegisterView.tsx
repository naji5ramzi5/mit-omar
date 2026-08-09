'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { UserPlus, Eye, EyeOff } from 'lucide-react';
import { useAppStore } from '@/stores/app-store';
import { t } from '@/lib/i18n';

export default function RegisterView() {
  const { locale, navigate } = useAppStore();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirm) {
      setError(t(locale, 'register_error_password'));
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: form.name, email: form.email, password: form.password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || t(locale, 'common_error'));
        return;
      }
      setSuccess(true);
    } catch {
      setError(t(locale, 'common_error'));
    }
    setLoading(false);
  };

  if (success) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4 relative overflow-hidden">
        <div className="absolute top-1/4 start-1/4 w-64 h-64 bg-brand-orange/5 rounded-full blur-[120px]" />
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center card-bold p-8 max-w-md w-full border-2 relative z-10">
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-green-400 via-emerald-500 to-green-400" />
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shadow-lg">
            <UserPlus className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-xl font-black text-foreground mb-2">{t(locale, 'register_success')}</h2>
          <button onClick={() => navigate('login')} className="btn-bold-primary mt-4">{t(locale, 'login_button')}</button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 relative overflow-hidden">
      <div className="absolute top-1/4 start-1/4 w-64 h-64 bg-brand-orange/5 rounded-full blur-[120px]" />
      <div className="absolute bottom-1/4 end-1/4 w-64 h-64 bg-brand-red/5 rounded-full blur-[120px]" />
      <motion.div initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md relative z-10">
        <div className="card-bold p-8 border-2 relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-brand-orange via-brand-red to-brand-orange" />
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-brand-orange to-brand-red flex items-center justify-center shadow-glow">
              <UserPlus className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-black text-foreground">{t(locale, 'register_title')}</h1>
            <p className="text-sm text-muted-foreground mt-1">{t(locale, 'register_subtitle')}</p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 text-sm rounded-xl border-2 border-red-100 dark:border-red-900/50 font-medium">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-foreground mb-1.5">{t(locale, 'register_name')}</label>
              <input type="text" required value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className="input-bold" />
            </div>
            <div>
              <label className="block text-sm font-bold text-foreground mb-1.5">{t(locale, 'register_email')}</label>
              <input type="email" required value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} className="input-bold" />
            </div>
            <div>
              <label className="block text-sm font-bold text-foreground mb-1.5">{t(locale, 'register_password')}</label>
              <div className="relative">
                <input type={showPassword ? 'text' : 'password'} required value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} className="input-bold pe-10" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-brand-orange transition-colors">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-foreground mb-1.5">{t(locale, 'register_confirm')}</label>
              <input type="password" required value={form.confirm} onChange={e => setForm(p => ({ ...p, confirm: e.target.value }))} className="input-bold" />
            </div>
            <button type="submit" disabled={loading} className="btn-bold-primary w-full shadow-glow-lg hover:shadow-brand-orange/50">
              {loading ? t(locale, 'common_loading') : t(locale, 'register_button')}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            <span>{t(locale, 'register_has_account')} </span>
            <button onClick={() => navigate('login')} className="text-brand-orange font-bold hover:underline">
              {t(locale, 'register_login')}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
