'use client';

import { useState, ReactNode, ElementType } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle, Loader2, Check } from 'lucide-react';
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
  onConfirm,
  onCancel,
  loading,
}: {
  open: boolean;
  title?: string;
  message: string;
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
                إلغاء
              </GhostButton>
              <button
                onClick={onConfirm}
                disabled={loading}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-bold rounded-xl bg-red-500 text-white hover:bg-red-600 transition-all disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                حذف
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
const LANGS: { key: 'Ar' | 'De' | 'En'; label: string; short: string }[] = [
  { key: 'Ar', label: 'العربية', short: 'ع' },
  { key: 'De', label: 'Deutsch', short: 'DE' },
  { key: 'En', label: 'English', short: 'EN' },
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
  return (
    <div className={cn('space-y-2', className)}>
      <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{label}</p>
      <div className="space-y-2">
        {LANGS.map((l) => {
          const name = `${field}${l.key}`;
          const common =
            'w-full px-4 py-2.5 text-sm rounded-xl border-2 border-border bg-background text-foreground ' +
            'focus:border-brand-orange focus:outline-none transition-all';
          return (
            <div key={l.key} className="flex items-start gap-2">
              <span className="w-9 shrink-0 pt-2.5 text-[10px] font-black text-muted-foreground text-center">
                {l.short}
              </span>
              {textarea ? (
                <textarea
                  value={form[name] || ''}
                  rows={rows}
                  required={required && l.key === 'Ar'}
                  onChange={(e) => onChange({ ...form, [name]: e.target.value })}
                  className={cn(common, 'resize-none')}
                />
              ) : (
                <input
                  type="text"
                  value={form[name] || ''}
                  required={required && l.key === 'Ar'}
                  onChange={(e) => onChange({ ...form, [name]: e.target.value })}
                  className={common}
                />
              )}
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
