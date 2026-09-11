'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/auth-store';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

export default function AuthCallbackPage() {
  const { login } = useAuthStore();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    let isHandled = false;

    async function handleAuth() {
      try {
        // Retrieve Supabase session from URL hash / query
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) throw error;
        if (!session?.user) {
          // If not available immediately, listen to onAuthStateChange
          const { data: authListener } = supabase.auth.onAuthStateChange(async (event, newSession) => {
            if (newSession?.user && !isHandled) {
              isHandled = true;
              await syncUser(newSession.user);
            }
          });
          return () => {
            authListener.subscription.unsubscribe();
          };
        }

        if (!isHandled) {
          isHandled = true;
          await syncUser(session.user);
        }
      } catch (err: any) {
        console.error('OAuth Callback Error:', err);
        setStatus('error');
        setErrorMessage(err?.message || 'فشل تسجيل الدخول عبر Google، يرجى المحاولة ثانية.');
      }
    }

    async function syncUser(sbUser: any) {
      try {
        const res = await fetch('/api/auth/google-sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: sbUser.email,
            name: sbUser.user_metadata?.full_name || sbUser.user_metadata?.name || sbUser.email?.split('@')[0],
            avatarUrl: sbUser.user_metadata?.avatar_url,
          }),
        });

        const data = await res.json();
        if (!res.ok || !data.token) {
          throw new Error(data.error || 'Failed to sync user');
        }

        // Save session in auth store
        login(data.user, data.token);
        setStatus('success');

        // Redirect to student portal / home
        setTimeout(() => {
          window.location.href = '/#/student';
        }, 800);
      } catch (err: any) {
        console.error('User Sync Error:', err);
        setStatus('error');
        setErrorMessage(err?.message || 'حدث خطأ أثناء مزامنة بيانات الحساب');
      }
    }

    handleAuth();
  }, [login]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-background">
      <div className="card-bold max-w-md w-full p-8 text-center space-y-4">
        {status === 'loading' && (
          <>
            <Loader2 className="w-12 h-12 animate-spin text-brand-orange mx-auto" />
            <h2 className="text-xl font-bold text-foreground">جاري تسجيل الدخول عبر Google...</h2>
            <p className="text-sm text-muted-foreground">لحظات ويتم نقلك إلى لوحة التعلم الخاصة بك</p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
            <h2 className="text-xl font-bold text-foreground">تم تسجيل الدخول بنجاح!</h2>
            <p className="text-sm text-muted-foreground">أهلاً بك، يتم نقلك الآن إلى المنصة...</p>
          </>
        )}

        {status === 'error' && (
          <>
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
            <h2 className="text-xl font-bold text-foreground">عذراً، حدث خطأ</h2>
            <p className="text-sm text-red-500">{errorMessage}</p>
            <button
              onClick={() => { window.location.href = '/#/login'; }}
              className="mt-4 px-6 py-2.5 rounded-xl bg-brand-orange text-white font-bold text-sm"
            >
              العودة لصفحة تسجيل الدخول
            </button>
          </>
        )}
      </div>
    </div>
  );
}
