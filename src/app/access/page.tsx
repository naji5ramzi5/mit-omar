'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { useAppStore } from '@/stores/app-store';
import { t } from '@/lib/i18n';
import { useRouter } from 'next/navigation';

interface CodeEntryState {
  code: string;
  isSubmitting: boolean;
  error: string | null;
  success: boolean;
}

export default function CodeEntryPage() {
  const { locale } = useAppStore();
  const router = useRouter();
  const [state, setState] = useState<CodeEntryState>({
    code: '',
    isSubmitting: false,
    error: null,
    success: false
  });

  

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setState(prev => ({ ...prev, code: e.target.value }));
  };

  const submitLabel = locale === 'en' ? 'Submit' : locale === 'de' ? 'Übermitteln' : 'Submit';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!state.code.trim()) {
      setState(prev => ({ ...prev, error: 'Please enter a code' }));
      return;
    }

    setState(prev => ({ ...prev, isSubmitting: true, error: null }));

    try {
      const res = await fetch('/api/verify-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code: state.code.trim() }),
      });

      const data = await res.json();

      if (data.success && data.data) {
        setState({
          code: '',
          isSubmitting: false,
          error: null,
          success: true
        });

        // Set session/cookie for persistent access
        const token = data.data.access_token;
        if (token) {
          localStorage.setItem('dmo-access-token', token);
          localStorage.setItem('dmo-course-id', data.data.course_id);
        }

        // Navigate to course page
        router.push(`/course/${data.data.course_id}?token=${data.data.access_token}`);
      } else {
        setState(prev => ({
          ...prev,
          isSubmitting: false,
          error: data.error || 'Invalid code. Please check and try again.'
        }));
      }
    } catch (err) {
      setState(prev => ({
        ...prev,
        isSubmitting: false,
        error: 'Network error. Please try again.'
      }));
    }
  };

  // Clear error when user starts typing
  useEffect(() => {
    // Error will be cleared on next submit attempt
  }, [state.code]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 sm:p-8">
      <div className="max-w-md w-full space-y-6 bg-white rounded-2xl shadow-lg p-8 md:p-10">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Enter Access Code
          </h1>
          <p className="text-muted-foreground text-lg">
            Please enter your activation code to access the course
          </p>
        </div>

        {/* Code Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label 
              className="block text-sm font-medium text-foreground mb-2"
            >
              {t(locale, 'code_entry_code_label')}
            </label>
            <input
              type="text"
              value={state.code}
              onChange={handleCodeChange}
              placeholder="X7K-M9P-3LQ"
              maxLength={17}
              disabled={state.isSubmitting}
              className="w-full rounded-xl border border-border px-4 py-3 text-3xl font-bold text-foreground focus:border-brand-orange outline-none transition-colors"
              aria-label="Enter access code"
            />
          </div>

          {state.error && (
            <div className="alert alert-error">
              <AlertCircle className="inline-block mr-2 text-red-500 w-5 h-5" />
              <span>{state.error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={state.isSubmitting}
            className="w-full py-3 px-6 font-bold rounded-xl bg-gradient-to-r from-brand-orange to-brand-red text-white hover:from-brand-orange-dark hover:to-brand-red-dark transition-colors"
          >
            {state.isSubmitting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin inline-block" />
            ) : (
              submitLabel
            )}
          </button>
        </form>

        {/* Success State */}
        {state.success && (
          <div className="pt-8 text-center">
            <CheckCircle className="w-12 h-12 text-green-500 mb-4 animate-bounce" />
            <h2 className="text-2xl font-bold text-foreground mb-2">
              {t(locale, 'code_entry_success')}
            </h2>
            <p className="text-muted-foreground text-lg">
              {t(locale, 'code_entry_access_granted')}
            </p>
            <p className="text-sm text-foreground/60 mt-2">
              You will be redirected to the course page automatically.
            </p>
          </div>
        )}

        {/* Failure State stays, user can retry */}
      </div>
    </div>
  );
}