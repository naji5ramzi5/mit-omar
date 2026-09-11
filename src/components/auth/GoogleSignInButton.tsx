'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Loader2 } from 'lucide-react';

interface GoogleSignInButtonProps {
  text?: string;
  onError?: (msg: string) => void;
}

export default function GoogleSignInButton({ 
  text = 'تسجيل الدخول باستخدام Google',
  onError 
}: GoogleSignInButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      const redirectUrl = `${window.location.origin}/auth/callback`;
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            access_type: 'offline',
            prompt: 'select_account',
          },
        },
      });

      if (error) {
        throw error;
      }
    } catch (err: any) {
      console.error('Google Sign-In Error:', err);
      setLoading(false);
      if (onError) {
        onError(err?.message || 'فشل الاتصال بـ Google. يرجى المحاولة لاحقاً.');
      }
    }
  };

  return (
    <button
      type="button"
      onClick={handleGoogleLogin}
      disabled={loading}
      className="w-full h-12 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100 text-sm font-bold flex items-center justify-center gap-3 transition-all duration-200 shadow-sm active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed group"
    >
      {loading ? (
        <Loader2 className="w-5 h-5 animate-spin text-brand-orange" />
      ) : (
        /* Official Google 'G' Logo SVG */
        <svg className="w-5 h-5 shrink-0 transition-transform group-hover:scale-105" viewBox="0 0 24 24">
          <path
            fill="#4285F4"
            d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
          />
          <path
            fill="#34A853"
            d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
          />
          <path
            fill="#FBBC05"
            d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
          />
          <path
            fill="#EA4335"
            d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
          />
        </svg>
      )}
      <span>{loading ? 'جاري الاتصال بـ Google...' : text}</span>
    </button>
  );
}
