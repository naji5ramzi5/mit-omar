'use client';

import { useState, ReactNode, ElementType } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle, Loader2, Check, Sparkles, Languages } from 'lucide-react';
import { toast } from './toast';

import { cn } from '@/lib/utils';
import { LEVELS } from './types';
import { ImageUploader } from './media-uploaders/ImageUploader';
import { VideoUploader } from './media-uploaders/VideoUploader';
import { AudioUploader } from './media-uploaders/AudioUploader';

export { ImageUploader, VideoUploader, AudioUploader };

/* ----------------------------- Primary button ----------------------------- */
export function PrimaryButton({
  children,
  onClick,
  disabled,
  type = 'button',
  icon: Icon,
  className,
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  type?: 'button' | 'submit';
  icon?: ElementType;
  className?: string;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-bold rounded-xl',
        'bg-gradient-to-r from-brand-orange to-brand-red text-white shadow-glow',
        'hover:shadow-glow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed',
        className,
      )}
    >
      {disabled ? <Loader2 className="w-4 h-4 animate-spin" /> : Icon ? <Icon className="w-4 h-4" /> : null}
      {children}
    </button>
  );
}

export function GhostButton({
  children,
  onClick,
  disabled,
  type = 'button',
  className,
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  type?: 'button' | 'submit';
  className?: string;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-bold rounded-xl',
        'border-2 border-border bg-transparent text-foreground',
        'hover:bg-secondary transition-all duration-300 disabled:opacity-50',
        className,
      )}
    >
      {children}
    </button>
  );
}

/* ------------------------------- Modal ----------------------------------- */
export function Modal({
  open,
  onClose,
  title,
  children,
  size = 'lg',
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  size?: 'md' | 'lg' | 'xl';
}) {
  const max = size === 'md' ? 'max-w-lg' : size === 'xl' ? 'max-w-4xl' : 'max-w-2xl';
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => e.stopPropagation()}
            className={cn(
              'w-full bg-card border-2 border-border rounded-2xl shadow-2xl',
              'max-h-[92vh] flex flex-col',
              max,
            )}
          >
            <div className="flex items-center justify-between p-5 border-b border-border shrink-0">
              <h3 className="text-lg font-black text-foreground">{title}</h3>
              <button
                onClick={onClose}
                className="p-2 rounded-xl hover:bg-secondary text-muted-foreground transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 overflow-y-auto">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ---------------------------- Confirm dialog ----------------------------- */
export function ConfirmDialog({
  open,
  title,
  message,
  confirmText,
  cancelText,
  onConfirm,
  onCancel,
  loading,
}: {
  open: boolean;
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={onCancel}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-card border-2 border-border rounded-2xl p-6 max-w-sm w-full shadow-2xl"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-11 h-11 rounded-xl bg-red-100 dark:bg-red-950 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <p className="text-sm font-black text-foreground">{title || 'تأكيد الحذف'}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{message}</p>
              </div>
            </div>
            <div className="flex gap-3 justify-end">
              <GhostButton onClick={onCancel} disabled={loading}>
                {cancelText || 'إلغاء'}
              </GhostButton>
              <button
                onClick={onConfirm}
                disabled={loading}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-bold rounded-xl bg-red-500 text-white hover:bg-red-600 transition-all disabled:opacity-50 cursor-pointer"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                {confirmText || 'حذف'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* --------------------------- Section header ------------------------------ */
export function SectionHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-end justify-between gap-4 mb-6">
      <div>
        <h2 className="text-xl font-black text-foreground">{title}</h2>
        {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

/* ------------------------------ Stat card ------------------------------- */
export function StatCard({
  label,
  value,
  icon: Icon,
  gradient = 'from-brand-orange to-brand-red',
  hint,
}: {
  label: string;
  value: number | string;
  icon: ElementType;
  gradient?: string;
  hint?: string;
}) {
  return (
    <div className="card-bold p-5 border-2 hover:border-brand-orange/40 transition-all duration-300">
      <div className={cn('w-12 h-12 rounded-2xl bg-gradient-to-br flex items-center justify-center mb-4 shadow-lg', gradient)}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <p className="text-3xl font-black text-foreground leading-none">{value}</p>
      <p className="text-xs font-bold text-muted-foreground mt-2">{label}</p>
      {hint && <p className="text-[11px] text-muted-foreground/70 mt-0.5">{hint}</p>}
    </div>
  );
}

/* ------------------------------ Empty state ----------------------------- */
export function EmptyState({ icon: Icon, text }: { icon: ElementType; text: string }) {
  return (
    <div className="text-center py-16 text-muted-foreground">
      <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-secondary flex items-center justify-center">
        <Icon className="w-7 h-7 opacity-60" />
      </div>
      <p className="text-sm font-medium">{text}</p>
    </div>
  );
}

/* ------------------------------- Loading -------------------------------- */
export function ListLoading({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-[72px] skeleton-bold rounded-xl" />
      ))}
    </div>
  );
}

/* ------------------------------- Level badge ----------------------------- */
const LEVEL_COLORS: [string, string][] = [
  ['#0ea5e9', '#2563eb'],
  ['#06b6d4', '#0d9488'],
  ['#E85D26', '#DC3545'],
  ['#8b5cf6', '#7c3aed'],
  ['#f59e0b', '#ea580c'],
];

export function LevelBadge({ level }: { level: string }) {
  const idx = LEVELS.indexOf(level);
  const [c1, c2] = LEVEL_COLORS[idx] || LEVEL_COLORS[2];
  return (
    <span
      className="level-badge text-[10px]"
      style={{ backgroundImage: `linear-gradient(135deg, ${c1}, ${c2})` }}
    >
      {level}
    </span>
  );
}

/* -------------------------------- Toggle -------------------------------- */
export function Toggle({ checked, onChange, labels }: { checked: boolean; onChange: () => void; labels?: [string, string] }) {
  return (
    <button type="button" onClick={onChange} className="flex items-center gap-2 text-sm font-bold text-foreground">
      {checked ? (
        <Check className="w-8 h-8 text-green-500" />
      ) : (
        <span className="w-8 h-8 rounded-full border-2 border-gray-300 dark:border-gray-600" />
      )}
      {labels && <span>{checked ? labels[0] : labels[1]}</span>}
    </button>
  );
}

/* --------------------------- Multilingual field ------------------------- */
const LANGS: { key: 'Ar' | 'De' | 'En'; code: 'ar' | 'de' | 'en'; label: string; short: string }[] = [
  { key: 'Ar', code: 'ar', label: 'العربية', short: 'ع' },
  { key: 'De', code: 'de', label: 'Deutsch', short: 'DE' },
  { key: 'En', code: 'en', label: 'English', short: 'EN' },
];

export function LangInput({
  label,
  form,
  field,
  onChange,
  textarea,
  rows = 3,
  required,
  className,
}: {
  label: string;
  form: Record<string, any>;
  field: string;
  onChange: (next: Record<string, any>) => void;
  textarea?: boolean;
  rows?: number;
  required?: boolean;
  className?: string;
}) {
  const [translating, setTranslating] = useState(false);

  // Auto translate from any source language to the other two
  const handleAutoTranslate = async (preferredSource?: 'Ar' | 'De' | 'En') => {
    let sourceKey: 'Ar' | 'De' | 'En' | null = preferredSource || null;
    
    if (!sourceKey) {
      if (form[`${field}Ar`]?.trim()) sourceKey = 'Ar';
      else if (form[`${field}De`]?.trim()) sourceKey = 'De';
      else if (form[`${field}En`]?.trim()) sourceKey = 'En';
    }

    const textToTranslate = sourceKey ? form[`${field}${sourceKey}`]?.trim() : '';

    if (!sourceKey || !textToTranslate) {
      toast.error('يرجى كتابة نص في أحد الحقول أولاً لتتم ترجمته');
      return;
    }

    const sourceLang = LANGS.find((l) => l.key === sourceKey)!;
    const targets = LANGS.filter((l) => l.key !== sourceKey);

    setTranslating(true);
    try {
      const updates: Record<string, string> = {};

      await Promise.all(
        targets.map(async (target) => {
          try {
            // Strategy 1: Direct Google GTX fetch from client (bypasses server IP restrictions, zero latency)
            let translation: string | null = null;
            try {
              const gUrl = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${encodeURIComponent(sourceLang.code)}&tl=${encodeURIComponent(target.code)}&dt=t&q=${encodeURIComponent(textToTranslate)}`;
              const gRes = await fetch(gUrl);
              if (gRes.ok) {
                const gData = await gRes.json();
                if (Array.isArray(gData) && Array.isArray(gData[0])) {
                  const combined = gData[0].map((c: any) => c[0]).join('');
                  if (combined) translation = combined;
                }
              }
            } catch (gErr) {
              console.warn('Client Google Translate failed, trying server API:', gErr);
            }

            // Strategy 2: Server API endpoint (/api/admin/translate)
            if (!translation) {
              try {
                const res = await fetch('/api/admin/translate', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    text: textToTranslate,
                    from: sourceLang.code,
                    to: target.code,
                  }),
                });
                if (res.ok) {
                  const data = await res.json();
                  if (data.translation) translation = data.translation;
                }
              } catch (sErr) {
                console.warn('Server translate API failed, trying MyMemory:', sErr);
              }
            }

            // Strategy 3: Direct MyMemory fallback
            if (!translation) {
              try {
                const mUrl = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(textToTranslate)}&langpair=${sourceLang.code}|${target.code}`;
                const mRes = await fetch(mUrl);
                if (mRes.ok) {
                  const mData = await mRes.json();
                  if (mData.responseData?.translatedText) translation = mData.responseData.translatedText;
                }
              } catch (mErr) {
                console.warn('Direct MyMemory failed:', mErr);
              }
            }

            if (translation) {
              updates[`${field}${target.key}`] = translation;
            }
          } catch (err) {
            console.error(`Failed to translate to ${target.label}:`, err);
          }
        })
      );

      if (Object.keys(updates).length > 0) {
        onChange({ ...form, ...updates });
        toast.success(`تمت الترجمة من ${sourceLang.label} إلى اللغات الأخرى بنجاح ✨`);
      } else {
        toast.error('تعذر إتمام الترجمة، يرجى المحاولة لاحقاً');
      }
    } catch (e: any) {
      toast.error('حدث خطأ أثناء الترجمة: ' + (e.message || ''));
    } finally {
      setTranslating(false);
    }
  };

  return (
    <div className={cn('space-y-2.5 p-3 rounded-2xl bg-secondary/20 border border-border/60', className)}>
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <p className="text-xs font-bold text-foreground flex items-center gap-1.5">
          <Languages className="w-3.5 h-3.5 text-brand-orange" />
          <span>{label}</span>
        </p>

        <button
          type="button"
          disabled={translating}
          onClick={() => handleAutoTranslate()}
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold text-brand-orange bg-brand-orange/10 hover:bg-brand-orange/20 border border-brand-orange/25 transition-all disabled:opacity-50 cursor-pointer shadow-xs active:scale-95"
          title="ترجمة النص المكتوب تلقائياً إلى اللغتين الأخريين ويمكنك تعديلهما بعدها"
        >
          {translating ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>جارٍ الترجمة...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-3.5 h-3.5" />
              <span>ترجمة ذكية تلقائية (3 لغات)</span>
            </>
          )}
        </button>
      </div>

      <div className="space-y-2">
        {LANGS.map((l) => {
          const name = `${field}${l.key}`;
          const hasVal = !!form[name]?.trim();
          const common =
            'w-full px-3.5 py-2.5 text-sm rounded-xl border border-border bg-background text-foreground ' +
            'focus:border-brand-orange focus:outline-none transition-all placeholder:text-muted-foreground/40';

          return (
            <div key={l.key} className="flex items-start gap-2">
              <span className="w-9 shrink-0 pt-2.5 text-[11px] font-black text-foreground/70 text-center font-mono">
                {l.short}
              </span>
              
              <div className="flex-1 relative">
                {textarea ? (
                  <textarea
                    value={form[name] || ''}
                    rows={rows}
                    placeholder={`${label} بـ ${l.label}...`}
                    required={required && l.key === 'Ar'}
                    onChange={(e) => onChange({ ...form, [name]: e.target.value })}
                    className={cn(common, 'resize-none')}
                  />
                ) : (
                  <input
                    type="text"
                    value={form[name] || ''}
                    placeholder={`${label} بـ ${l.label}...`}
                    required={required && l.key === 'Ar'}
                    onChange={(e) => onChange({ ...form, [name]: e.target.value })}
                    className={common}
                  />
                )}
              </div>

              <button
                type="button"
                disabled={translating || !hasVal}
                onClick={() => handleAutoTranslate(l.key)}
                className="h-10 px-2.5 rounded-xl border border-border/80 bg-background hover:bg-brand-orange/10 hover:border-brand-orange/40 hover:text-brand-orange text-muted-foreground transition-all text-[11px] font-bold shrink-0 flex items-center gap-1 disabled:opacity-25 disabled:pointer-events-none cursor-pointer"
                title={`ترجمة هذا النص من ${l.label} إلى باقي اللغات`}
              >
                <Sparkles className="w-3 h-3 text-brand-orange" />
                <span className="hidden sm:inline">ترجم للباقي</span>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}


/* ------------------------------ Image field ----------------------------- */
export function ImageField({
  value,
  onChange,
  placeholder = 'انقر لرفع صورة من الكمبيوتر أو اسحبها هنا',
  aspectRatio,
}: {
  value?: string | null;
  onChange: (v: string | null) => void;
  placeholder?: string;
  aspectRatio?: string;
}) {
  return (
    <ImageUploader
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      aspectRatio={aspectRatio}
    />
  );
}

/* --------------------------- Form field wrapper ------------------------- */
export function FormRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-2">
      <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">{label}</label>
      {children}
    </div>
  );
}

export const inputClass =
  'w-full px-4 py-2.5 text-sm rounded-xl border-2 border-border bg-background text-foreground focus:border-brand-orange focus:outline-none transition-all';
