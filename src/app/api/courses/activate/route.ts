import { supabaseAdmin } from '@/lib/supabase';
import { decodeUserId } from '@/lib/admin-auth';
import {
  normalizeCode,
  checkActivationRateLimit,
  resetActivationRateLimit,
  getCodeMeta,
  saveCodeMeta,
  calculateExpiryDate,
} from '@/lib/activation';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const userId = decodeUserId(req);
    if (!userId) {
      return NextResponse.json({ error: 'يجب تسجيل الدخول أولاً لتفعيل الكورس' }, { status: 401 });
    }

    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || userId;
    const rateCheck = checkActivationRateLimit(ip);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: `محاولات تفعيل كثيرة خاطئة. يرجى الانتظار ${rateCheck.remainingSeconds} ثانية قبل المحاولة مجدداً.` },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { code, courseId: reqCourseId } = body;

    if (!code || typeof code !== 'string' || !code.trim()) {
      return NextResponse.json({ error: 'كود التفعيل مطلوب' }, { status: 400 });
    }

    const cleanCode = normalizeCode(code);

    // 1. Query activation code from activationCodes table
    const { data: activationCode } = await supabaseAdmin
      .from('activationCodes')
      .select('*')
      .eq('code', cleanCode)
      .maybeSingle();

    if (!activationCode) {
      return NextResponse.json({ error: 'كود التفعيل غير صالح' }, { status: 404 });
    }

    const targetCourseId = activationCode.courseId;

    // 2. Validate course association (the code must belong to the requested course)
    if (reqCourseId && reqCourseId !== targetCourseId) {
      return NextResponse.json({ error: 'هذا الكود غير مخصص لهذا الكورس' }, { status: 400 });
    }

    // 3. Retrieve code policy and usage metadata
    const meta = await getCodeMeta(cleanCode);

    if (meta.status === 'revoked') {
      return NextResponse.json({ error: 'تم إبطال صلاحية هذا الكود من قبل الإدارة' }, { status: 403 });
    }

    // Check if single-use already used or multi-use exhausted
    if (activationCode.isUsed && meta.maxUses <= 1) {
      return NextResponse.json({ error: 'تم استخدام كود التفعيل هذا مسبقاً' }, { status: 410 });
    }

    if (meta.usedCount >= meta.maxUses) {
      return NextResponse.json({ error: 'تم استنفاد الحد الأقصى لاستخدام كود التفعيل هذا' }, { status: 410 });
    }

    // Check if code itself had a redemption deadline that passed
    if (activationCode.expiresAt && new Date(activationCode.expiresAt).getTime() < Date.now()) {
      return NextResponse.json({ error: 'انتهت صلاحية كود التفعيل' }, { status: 410 });
    }

    // 4. Verify target course exists
    const { data: course } = await supabaseAdmin
      .from('courses')
      .select('id, titleAr, titleDe')
      .eq('id', targetCourseId)
      .single();

    if (!course) {
      return NextResponse.json({ error: 'الدورة غير موجودة' }, { status: 404 });
    }

    // 5. Calculate student access duration from the code's durationDays
    const durationDays = meta.durationDays || 30;
    const studentExpiresAt = calculateExpiryDate(durationDays);
    const nowIso = new Date().toISOString();

    // 6. Check existing enrollment: either renew/extend or create new
    const { data: existing } = await supabaseAdmin
      .from('enrollments')
      .select('id, expiresAt, isActive')
      .eq('userId', userId)
      .eq('courseId', targetCourseId)
      .maybeSingle();

    let enrollment: any;

    if (existing) {
      // Update enrollment with new expiration date and ensure isActive: true
      const { data: updated, error: updateErr } = await supabaseAdmin
        .from('enrollments')
        .update({
          code: cleanCode,
          activatedAt: nowIso,
          expiresAt: studentExpiresAt,
          isActive: true,
          updatedAt: nowIso,
        })
        .eq('id', existing.id)
        .select()
        .single();

      if (updateErr) throw updateErr;
      enrollment = updated;
    } else {
      // Insert new enrollment
      const { data: inserted, error: insertErr } = await supabaseAdmin
        .from('enrollments')
        .insert({
          userId,
          courseId: targetCourseId,
          code: cleanCode,
          activatedAt: nowIso,
          expiresAt: studentExpiresAt,
          isActive: true,
        })
        .select()
        .single();

      if (insertErr) throw insertErr;
      enrollment = inserted;
    }

    // 7. Update activation code usage
    const newUsedCount = (meta.usedCount || 0) + 1;
    const isExhausted = newUsedCount >= meta.maxUses;

    await saveCodeMeta(cleanCode, {
      usedCount: newUsedCount,
      status: isExhausted ? 'used' : 'active',
    });

    await supabaseAdmin
      .from('activationCodes')
      .update({
        isUsed: isExhausted,
        usedBy: userId,
        usedAt: nowIso,
      })
      .eq('id', activationCode.id);

    // Reset rate limiter on successful activation
    resetActivationRateLimit(ip);

    // 8. Create notification for student
    await supabaseAdmin.from('notifications').insert({
      userId,
      titleAr: 'تم تفعيل الدورة بنجاح 🎉',
      titleDe: 'Kurs erfolgreich aktiviert 🎉',
      titleEn: 'Course successfully activated 🎉',
      messageAr: `تم تفعيل اشتراكك في دورة: ${course.titleAr} لمدة ${durationDays} يوماً.`,
      messageDe: `Dein Zugang zum Kurs "${course.titleDe}" wurde für ${durationDays} Tage aktiviert.`,
      messageEn: `Your access to "${course.titleDe}" is activated for ${durationDays} days.`,
      type: 'course',
    });

    return NextResponse.json({
      success: true,
      enrollment: {
        courseId: targetCourseId,
        courseName: course.titleAr || course.titleDe,
        activatedAt: enrollment.activatedAt,
        expiresAt: enrollment.expiresAt,
        durationDays,
        isActive: true,
      },
    });
  } catch (error: any) {
    console.error('Activation route error:', error);
    return NextResponse.json({ error: error.message || 'فشل تفعيل الكورس' }, { status: 500 });
  }
}
