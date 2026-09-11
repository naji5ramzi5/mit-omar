import { verifyAdmin } from '@/lib/admin-auth';
import { supabaseAdmin } from '@/lib/supabase';
import {
  generateCourseCode,
  normalizeCode,
  getCodeMeta,
  saveCodeMeta,
} from '@/lib/activation';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  try {
    const userId = await verifyAdmin(req);
    if (!userId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const courseId = searchParams.get('courseId');

    let query = supabaseAdmin
      .from('activationCodes')
      .select('*, course:courses(id,titleAr,titleDe,titleEn,level), user:users(id,name,email)')
      .order('createdAt', { ascending: false });

    if (courseId) {
      query = query.eq('courseId', courseId);
    }

    const { data: codes, error } = await query;
    if (error) throw error;

    // Enhance codes with metadata and student enrollment details
    const enhanced = await Promise.all(
      (codes || []).map(async (c) => {
        const meta = await getCodeMeta(c.code);
        let studentEnrollment: any = null;
        if (c.usedBy) {
          const { data: enr } = await supabaseAdmin
            .from('enrollments')
            .select('activatedAt, expiresAt, isActive')
            .eq('userId', c.usedBy)
            .eq('courseId', c.courseId)
            .maybeSingle();
          studentEnrollment = enr;
        }

        return {
          ...c,
          durationDays: meta.durationDays || 30,
          maxUses: meta.maxUses || 1,
          usedCount: meta.usedCount || (c.isUsed ? 1 : 0),
          status: meta.status || (c.isUsed ? 'used' : 'active'),
          notes: meta.notes || null,
          studentEnrollment,
        };
      })
    );

    return NextResponse.json({ codes: enhanced });
  } catch (error) {
    console.error('Admin codes GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch codes' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const userId = await verifyAdmin(req);
    if (!userId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const {
      courseId,
      count = 1,
      durationDays = 30,
      maxUses = 1,
      customCode,
      notes,
    } = await req.json();

    if (!courseId) return NextResponse.json({ error: 'الدورة مطلوبة' }, { status: 400 });
    const total = Math.min(Math.max(parseInt(count) || 1, 1), 100);
    const days = Math.max(parseInt(durationDays) || 30, 1);
    const uses = Math.max(parseInt(maxUses) || 1, 1);

    // Get course to brand the code with its level (e.g. OMAR-A1-XXXX)
    const { data: course } = await supabaseAdmin
      .from('courses')
      .select('level')
      .eq('id', courseId)
      .maybeSingle();

    const level = course?.level || 'A1';

    const values: Array<{ code: string; courseId: string; expiresAt: string | null }> = [];
    const used = new Set<string>();

    if (customCode) {
      const cleanCustom = normalizeCode(customCode);
      values.push({ code: cleanCustom, courseId, expiresAt: null });
      used.add(cleanCustom);
    }

    while (values.length < total) {
      const code = generateCourseCode(level);
      if (used.has(code)) continue;
      used.add(code);
      values.push({ code, courseId, expiresAt: null });
    }

    const { data, error } = await supabaseAdmin
      .from('activationCodes')
      .insert(values)
      .select('*, course:courses(id,titleAr,titleDe,titleEn,level)');

    if (error) throw error;

    // Save metadata for all generated codes
    await Promise.all(
      values.map((v) =>
        saveCodeMeta(v.code, {
          durationDays: days,
          maxUses: uses,
          usedCount: 0,
          status: 'active',
          notes: notes || undefined,
        })
      )
    );

    return NextResponse.json({ codes: data || [] }, { status: 201 });
  } catch (error: any) {
    console.error('Admin codes POST error:', error);
    return NextResponse.json({ error: error.message || 'فشل توليد الأكواد' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const userId = await verifyAdmin(req);
    if (!userId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { id, action, days } = await req.json();
    if (!id) return NextResponse.json({ error: 'معرف الكود مطلوب' }, { status: 400 });

    const { data: code } = await supabaseAdmin
      .from('activationCodes')
      .select('*, user:users(id,name,email)')
      .eq('id', id)
      .single();

    if (!code) return NextResponse.json({ error: 'الكود غير موجود' }, { status: 404 });

    const currentMeta = await getCodeMeta(code.code);

    if (action === 'revoke') {
      // Revoke code so it cannot be used
      await saveCodeMeta(code.code, { status: 'revoked' });
      await supabaseAdmin
        .from('activationCodes')
        .update({ isUsed: true })
        .eq('id', id);

      // If already redeemed, revoke the active enrollment as well
      if (code.usedBy) {
        await supabaseAdmin
          .from('enrollments')
          .update({ isActive: false })
          .eq('userId', code.usedBy)
          .eq('courseId', code.courseId);
      }

      return NextResponse.json({ success: true, message: 'تم إبطال الكود وإيقاف الصلاحية' });
    }

    if (action === 'extend') {
      const addDays = Math.max(parseInt(days) || 30, 1);
      const newDuration = (currentMeta.durationDays || 30) + addDays;
      await saveCodeMeta(code.code, { durationDays: newDuration, status: 'active' });

      // If already redeemed by a student, extend their enrollment expiresAt
      if (code.usedBy) {
        const { data: enr } = await supabaseAdmin
          .from('enrollments')
          .select('expiresAt')
          .eq('userId', code.usedBy)
          .eq('courseId', code.courseId)
          .maybeSingle();

        const base = enr?.expiresAt && new Date(enr.expiresAt) > new Date()
          ? new Date(enr.expiresAt)
          : new Date();
        const newExpiry = new Date(base.getTime() + addDays * 86_400_000).toISOString();

        await supabaseAdmin
          .from('enrollments')
          .update({ expiresAt: newExpiry, isActive: true })
          .eq('userId', code.usedBy)
          .eq('courseId', code.courseId);
      }

      return NextResponse.json({ success: true, message: `تم تمديد الصلاحية بمقدار ${addDays} يوماً` });
    }

    return NextResponse.json({ error: 'إجراء غير مدعوم' }, { status: 400 });
  } catch (error: any) {
    console.error('Admin codes PATCH error:', error);
    return NextResponse.json({ error: error.message || 'فشل تحديث الكود' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const userId = await verifyAdmin(req);
    if (!userId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });

    await supabaseAdmin.from('activationCodes').delete().eq('id', id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Admin codes DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete code' }, { status: 500 });
  }
}