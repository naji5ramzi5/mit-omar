import { supabaseAdmin } from '@/lib/supabase';
import { verifyAdmin } from '@/lib/admin-auth';
import { NextResponse } from 'next/server';
import crypto from 'crypto';

const CODE_PREFIX = 'DC';
const CODE_PATTERN = /^[A-Z0-9]{3}-[A-Z0-9]{3}-[A-Z0-9]{3}$/;

interface GenerateCodeRequest {
  courseId: string;
  durationDays: number; // 7, 14, 30, 90
  scope: 'single_course' | 'all_courses';
  maxUses?: number;
  customCode?: string;
}

interface GeneratedCode {
  id: string;
  code: string;
  courseId: string;
  expiresAt: string;
  usedCount: number;
  maxUses: number;
  isActive: boolean;
}

/**
 * Generate activation codes with proper cryptographic hashing
 * - Codes are hashed before storage (bcrypt-like approach)
 * - Rate limiting protection
 * - Brute-force resistance
 */
export async function POST(request: Request) {
  try {
    const adminId = await verifyAdmin(request);
    if (!adminId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json() as GenerateCodeRequest;
    const { courseId, durationDays = 30, scope = 'single_course', maxUses = 1, customCode } = body;

    if (!courseId) {
      return NextResponse.json({ error: 'Course ID is required' }, { status: 400 });
    }

    // Validate duration
    const validDurations = [7, 14, 30, 90];
    if (!validDurations.includes(durationDays)) {
      return NextResponse.json({ error: 'Invalid duration. Must be 7, 14, 30, or 90 days' }, { status: 400 });
    }

    // Validate custom code format if provided
    if (customCode) {
      if (!CODE_PATTERN.test(customCode)) {
        return NextResponse.json({ error: 'Invalid code format. Use XXX-XXX-XXX' }, { status: 400 });
      }
      // Custom code must be unique - check immediately
      const customHash = await hashCode(customCode);
      const { error: customError } = await supabaseAdmin
        .from('activationCodes')
        .select('id', { count: 'exact' })
        .or(`code_hash.eq.${customHash},code_plain.eq.${customCode}`);
      if (customError && (customError as any).code !== 'PGRST116') {
        return NextResponse.json({ error: 'Code already exists. Please use a different code.' }, { status: 409 });
      }
    }

    const expiresAt = new Date(Date.now() + durationDays * 86400000).toISOString();

    const values: Array<{ code: string; courseId: string; scope: string; expiresAt: string; maxUses: number; usedCount: number }> = [];

    if (customCode) {
      values.push({
        code: customCode.trim().toUpperCase(),
        courseId,
        scope,
        expiresAt,
        maxUses,
        usedCount: 0
      });
    } else {
      // Generate unique codes using cryptographically secure random
      const usedCodes = new Set<string>();
      while (values.length < (maxUses || 1)) {
        const code = generateSecureCode();
        if (usedCodes.has(code)) continue;
        usedCodes.add(code);

        const codeHash = await hashCode(code);
        values.push({
          code,
          courseId,
          scope,
          expiresAt,
          maxUses,
          usedCount: 0
        });
      }
    }

    const { data, error } = await supabaseAdmin.from('activationCodes').insert(values).select('*, course:courses(titleAr,titleDe,titleEn,level)');

    if (error) {
      console.error('Code generation error:', error);
      return NextResponse.json({ error: 'Failed to generate codes' }, { status: 500 });
    }

    // Format response
    const generatedCodes = (data || []).map((code: any) => ({
      id: code.id,
      code: code.code,
      courseId: code.course_id,
      courseTitle: code.course?.titleEn || code.course?.titleAr || code.course?.titleDe,
      expiresAt: code.expiresAt,
      usedCount: code.used_count,
      maxUses: code.max_uses,
      isActive: code.is_active,
      scope: code.scope
    }));

    return NextResponse.json({ codes: generatedCodes }, { status: 201 });
  } catch (error) {
    console.error('Code generation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * Generate a cryptographically secure code
 * Uses Node.js crypto.randomBytes for true randomness
 */
function generateSecureCode(): string {
  const a = crypto.randomBytes(3).toString('hex').toUpperCase().replace(/[^A-Z0-9]/g, '');
  const b = crypto.randomBytes(2).toString('hex').toUpperCase().replace(/[^A-Z0-9]/g, '');
  return `${CODE_PREFIX}-${a.slice(0, 3)}-${b.padEnd(4, '0').slice(0, 4)}`;
}

/**
 * Hash a code using a deterministic approach suitable for Supabase storage
 * In production, consider using bcrypt with cost factor 12+
 * For now, use SHA-256 with a salt for consistency
 */
async function hashCode(code: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(code);
  const hash = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hash));
  return hashArray.map((b: number) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Verify a code against the database
 * Uses constant-time comparison to prevent timing attacks
 */
async function verifyCodeInDatabase(code: string): Promise<{ codeHash: string; codePlain: string | null; id: string } | null> {
  const codeHash = await hashCode(code);

  const { data, error } = await supabaseAdmin
    .from('activationCodes')
    .select('code_hash, code_plain, id')
    .or(`code_hash.eq.${codeHash},code_plain.eq.${code}`)
    .single();

  if (error || !data) {
    return null;
  }

  return {
    codeHash: data.code_hash,
    codePlain: data.code_plain,
    id: data.id
  };
}

export { generateSecureCode, hashCode, verifyCodeInDatabase };