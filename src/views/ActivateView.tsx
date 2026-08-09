'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { KeyRound, CheckCircle, AlertCircle } from 'lucide-react';
import { useAppStore } from '@/stores/app-store';
import { useAuthStore } from '@/stores/auth-store';
import { t } from '@/lib/i18n';

interface ActivationResult {
  courseName: string;
  activatedAt: string;
  expiresAt: string;
  isActive: boolean;
}

export default function ActivateView() {
  const { locale, navigate } = useAppStore();
  const { isAuthenticated, token } = useAuthStore();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<ActivationResult | null>(null);

  const handleActivate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated()) {
      navigate('login');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/courses/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ code: code.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || t(locale, 'activate_invalid'));
        return;
      }
      setResult(data.enrollment);
    } catch {
      setError(t(locale, 'common_error'));
    }
    setLoading(false);
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <motion.div initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="card-bold p-8 border-2">
          <div className="text-center mb-8">
            <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-brand-orange/10 to-brand-red/10 flex items-center justify-center">
              <KeyRound className="w-7 h-7 text-brand-orange" />
            </div>
            <h1 className="text-2xl font-black text-foreground">{t(locale, 'activate_title')}</h1>
            <p className="text-sm text-muted-foreground mt-2">{t(locale, 'activate_desc')}</p>
          </div>

          {result ? (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-green-100 flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-lg font-bold text-foreground">{t(locale, 'activate_success_title')}</h2>
              <div className="text-sm space-y-2 text-muted-foreground bg-secondary/50 rounded-2xl p-5">
                <div className="flex justify-between"><span>{t(locale, 'activate_success_course')}</span><span className="font-bold text-foreground">{result.courseName}</span></div>
                <div className="flex justify-between"><span>{t(locale, 'activate_success_status')}</span><span className={`font-bold ${result.isActive ? 'text-green-600' : 'text-red-500'}`}>{result.isActive ? t(locale, 'activate_active') : t(locale, 'activate_expired')}</span></div>
              </div>
              <button onClick={() => navigate('student')} className="btn-bold-primary mt-4">{t(locale, 'nav_my_courses')}</button>
            </div>
          ) : (
            <>
              {error && (
                <div className="mb-4 p-3 flex items-center gap-2 bg-red-50 text-red-600 text-sm rounded-xl border-2 border-red-100 font-medium">
                  <AlertCircle className="w-4 h-4 shrink-0" /> {error}
                </div>
              )}
              <form onSubmit={handleActivate} className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-foreground mb-1.5">{t(locale, 'activate_input')}</label>
                  <input type="text" required value={code} onChange={e => setCode(e.target.value)} className="input-bold" placeholder="OMAR-A1-2024" style={{ fontFamily: 'var(--font-inter)', letterSpacing: '0.05em' }} />
                </div>
                <button type="submit" disabled={loading} className="btn-bold-primary w-full">
                  {loading ? t(locale, 'common_loading') : t(locale, 'activate_button')}
                </button>
              </form>
              <p className="mt-4 text-xs text-center text-muted-foreground">
                {!isAuthenticated() && t(locale, 'login_no_account')}
                {!isAuthenticated() && <button onClick={() => navigate('login')} className="text-brand-orange font-bold hover:underline ms-1">{t(locale, 'login_button')}</button>}
              </p>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
