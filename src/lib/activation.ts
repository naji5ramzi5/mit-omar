import crypto from 'crypto';
import { supabaseAdmin } from './supabase';

export interface CodeMeta {
  durationDays: number;
  maxUses: number;
  usedCount: number;
  status: 'active' | 'used' | 'expired' | 'revoked';
  notes?: string;
}

// In-memory rate limiting for activation attempts (IP or User ID)
const attemptMap = new Map<string, { count: number; resetAt: number }>();

export function checkActivationRateLimit(key: string): { allowed: boolean; remainingSeconds?: number } {
  const now = Date.now();
  const entry = attemptMap.get(key);
  if (!entry || now > entry.resetAt) {
    attemptMap.set(key, { count: 1, resetAt: now + 60_000 });
    return { allowed: true };
  }
  if (entry.count >= 6) {
    const remainingSeconds = Math.ceil((entry.resetAt - now) / 1000);
    return { allowed: false, remainingSeconds };
  }
  entry.count += 1;
  return { allowed: true };
}

export function resetActivationRateLimit(key: string) {
  attemptMap.delete(key);
}

export function normalizeCode(raw: string): string {
  return (raw || '').trim().toUpperCase().replace(/\s+/g, '-');
}

export function hashCode(code: string): string {
  return crypto.createHash('sha256').update(normalizeCode(code)).digest('hex');
}

export function generateCourseCode(level: string = 'A1'): string {
  const cleanLevel = level.replace(/[^A-Za-z0-9]/g, '').toUpperCase() || 'A1';
  const rand1 = crypto.randomBytes(2).toString('hex').toUpperCase();
  const rand2 = crypto.randomBytes(2).toString('hex').toUpperCase();
  return `OMAR-${cleanLevel}-${rand1}-${rand2}`;
}

export function calculateExpiryDate(days: number, startDate: Date = new Date()): string {
  const safeDays = Math.max(days || 30, 1);
  return new Date(startDate.getTime() + safeDays * 86_400_000).toISOString();
}

/**
 * Get code metadata from siteSettings (or fallback defaults)
 */
export async function getCodeMeta(code: string): Promise<CodeMeta> {
  const norm = normalizeCode(code);
  try {
    const { data } = await supabaseAdmin
      .from('siteSettings')
      .select('value')
      .eq('key', `code_meta_${norm}`)
      .maybeSingle();

    if (data?.value) {
      return JSON.parse(data.value);
    }
  } catch {
    // ignore
  }
  return {
    durationDays: 30,
    maxUses: 1,
    usedCount: 0,
    status: 'active',
  };
}

/**
 * Save code metadata to siteSettings
 */
export async function saveCodeMeta(code: string, meta: Partial<CodeMeta>): Promise<void> {
  const norm = normalizeCode(code);
  const existing = await getCodeMeta(norm);
  const updated: CodeMeta = {
    ...existing,
    ...meta,
  };

  await supabaseAdmin.from('siteSettings').upsert({
    key: `code_meta_${norm}`,
    value: JSON.stringify(updated),
    updatedAt: new Date().toISOString(),
  }, { onConflict: 'key' });
}

/**
 * Helper to get course intro video
 */
export async function getCourseIntroVideo(courseId: string): Promise<{ videoUrl: string | null; duration: number; isPublished: boolean }> {
  try {
    const { data } = await supabaseAdmin
      .from('siteSettings')
      .select('value')
      .eq('key', `course_intro_${courseId}`)
      .maybeSingle();

    if (data?.value) {
      return JSON.parse(data.value);
    }
  } catch {
    // ignore
  }
  return { videoUrl: null, duration: 0, isPublished: true };
}

/**
 * Helper to save course intro video
 */
export async function saveCourseIntroVideo(courseId: string, intro: { videoUrl?: string | null; duration?: number; isPublished?: boolean }): Promise<void> {
  const existing = await getCourseIntroVideo(courseId);
  const updated = {
    videoUrl: intro.videoUrl !== undefined ? intro.videoUrl : existing.videoUrl,
    duration: intro.duration !== undefined ? intro.duration : existing.duration,
    isPublished: intro.isPublished !== undefined ? intro.isPublished : existing.isPublished,
  };

  await supabaseAdmin.from('siteSettings').upsert({
    key: `course_intro_${courseId}`,
    value: JSON.stringify(updated),
    updatedAt: new Date().toISOString(),
  }, { onConflict: 'key' });
}
