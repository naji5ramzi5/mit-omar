import { translations as ar } from './ar';
import { translations as de } from './de';
import { translations as en } from './en';

export type Locale = 'ar' | 'de' | 'en';

export const locales = ['ar', 'de', 'en'] as const;

export const localeNames: Record<Locale, string> = {
  ar: 'العربية',
  de: 'Deutsch',
  en: 'English',
};

export const localeDirections: Record<Locale, 'rtl' | 'ltr'> = {
  ar: 'rtl',
  de: 'ltr',
  en: 'ltr',
};

const translations = { ar, de, en };

export type TranslationKeys = typeof ar;

export function t(locale: Locale, key: keyof typeof ar): string {
  const mods = { ar, de, en };
  return mods[locale][key] || en[key] || key;
}

export function getLocalizedField<T extends Record<string, unknown>>(
  obj: T | null | undefined,
  field: string,
  locale: Locale
): string {
  if (!obj) return '';
  const key = `${field}${locale.charAt(0).toUpperCase()}${locale.slice(1)}` as keyof T;
  return (obj[key] as string) || '';
}