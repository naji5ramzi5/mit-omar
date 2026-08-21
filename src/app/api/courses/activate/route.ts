import { supabaseAdmin } from '@/lib/supabase';
import { decodeUserId } from '@/lib/admin-auth';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const userId = decodeUserId(req);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { code } = await req.json();
    if (!code) return NextResponse.json({ error: 'Code is required' }, { status: 400 });

    // Find activation code
    const { data: activationCode } = await supabaseAdmin
      .from('activationCodes')
      .select('*')
      .eq('code', code.trim().toUpperCase())
      .eq('isUsed', false)
      .single();

    if (activationCode && activationCode.expiresAt && new Date(activationCode.expiresAt).getTime() < Date.now()) {
      return NextResponse.json({ error: 'This activation code has expired' }, { status: 410 });
    }

    let courseId: string | null = null;

    if (activationCode) {
      courseId = activationCode.courseId;
    } else {
      // Check site settings for old-style activation codes
      const { data: settings } = await supabaseAdmin
        .from('siteSettings')
        .select('*')
        .ilike('value', code.trim());

      for (const setting of settings || []) {
        if (setting.key.startsWith('activation_code_')) {
          courseId = setting.key.replace('activation_code_', '');
          break;
        }
      }

      // Also check if code is a course ID
      if (!courseId) {
        const { data: course } = await supabaseAdmin
          .from('courses')
          .select('id')
          .eq('id', code.trim())
          .single();
        if (course) courseId = course.id;
      }
    }

    if (!courseId) {
      return NextResponse.json({ error: 'Invalid activation code' }, { status: 404 });
    }

    // Check if already enrolled
    const { data: existing } = await supabaseAdmin
      .from('enrollments')
      .select('*')
      .eq('userId', userId)
      .eq('courseId', courseId)
      .single();

    if (existing) {
      const { data: course } = await supabaseAdmin
        .from('courses')
        .select('titleAr, titleDe')
        .eq('id', courseId)
        .single();

      return NextResponse.json({
        enrollment: {
          courseName: course?.titleAr || course?.titleDe || '',
          activatedAt: existing.activatedAt,
          expiresAt: existing.expiresAt || null,
          isActive: existing.isActive,
        },
      });
    }

    // Get course
    const { data: course } = await supabaseAdmin
      .from('courses')
      .select('id, titleAr, titleDe')
      .eq('id', courseId)
      .single();

    if (!course) return NextResponse.json({ error: 'Course not found' }, { status: 404 });

    // Create enrollment — expiry comes from the code's duration (fallback: 3 months)
    const expiresAt = activationCode?.expiresAt
      ? new Date(activationCode.expiresAt).toISOString()
      : new Date(Date.now() + 90 * 86400000).toISOString();

    const { data: enrollment, error: enrollError } = await supabaseAdmin
      .from('enrollments')
      .insert({
        userId,
        courseId,
        code: code.trim(),
        activatedAt: new Date().toISOString(),
        expiresAt,
        isActive: true,
      })
      .select()
      .single();

    if (enrollError) throw enrollError;

    // Mark activation code as used
    if (activationCode) {
      await supabaseAdmin
        .from('activationCodes')
        .update({ isUsed: true, usedBy: userId, usedAt: new Date().toISOString() })
        .eq('id', activationCode.id);
    }

    // Create notification
    await supabaseAdmin.from('notifications').insert({
      userId,
      titleAr: 'تم تفعيل دورة جديدة',
      titleDe: 'Neuer Kurs aktiviert',
      titleEn: 'New Course Activated',
      messageAr: `تم تفعيل دورة: ${course.titleAr}`,
      messageDe: `Kurs aktiviert: ${course.titleDe}`,
      messageEn: `Course activated: ${course.titleDe}`,
      type: 'course',
    });

    return NextResponse.json({
      enrollment: {
        courseName: course.titleAr || course.titleDe,
        activatedAt: enrollment.activatedAt,
        expiresAt: enrollment.expiresAt || null,
        isActive: true,
      },
    });
  } catch (error) {
    console.error('Activation error:', error);
    return NextResponse.json({ error: 'Failed to activate course' }, { status: 500 });
  }
}
