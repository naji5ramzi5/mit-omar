import { verifyAdmin } from '@/lib/admin-auth';
import { supabaseAdmin } from '@/lib/supabase';
import { NextResponse } from 'next/server';
import crypto from 'crypto';

const CODE_PREFIX = 'DMO';

function makeCode(): string {
  const a = crypto.randomBytes(3).toString('hex').toUpperCase();
  const b = crypto.randomBytes(2).toString('hex').toUpperCase();
  return `${CODE_PREFIX}-${a.slice(0, 3)}-${b.slice(0, 4)}`;
}

export async function GET(req: Request) {
  try {
    const userId = await verifyAdmin(req);
    if (!userId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { data } = await supabaseAdmin
      .from('activationCodes')
      .select('*, course:courses(titleAr,titleDe,titleEn,level), user:users(name,email)')
      .order('createdAt', { ascending: false });

    return NextResponse.json({ codes: data || [] });
  } catch (error) {
    console.error('Admin codes GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch codes' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const userId = await verifyAdmin(req);
    if (!userId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { courseId, count = 1, durationDays, customCode } = await req.json();
    if (!courseId) return NextResponse.json({ error: 'courseId is required' }, { status: 400 });
    const total = Math.min(Math.max(parseInt(count) || 1, 1), 200);
    const days = Math.max(parseInt(durationDays) || 30, 1);
    if (!Number.isFinite(days)) return NextResponse.json({ error: 'Invalid duration' }, { status: 400 });

    const expiresAt = new Date(Date.now() + days * 86400000).toISOString();

    const values: Array<{ code: string; courseId: string; expiresAt: string }> = [];
    const used = new Set<string>();
    if (customCode) values.push({ code: customCode.trim().toUpperCase(), courseId, expiresAt });
    while (values.length < total) {
      const code = makeCode();
      if (used.has(code)) continue;
      used.add(code);
      values.push({ code, courseId, expiresAt });
    }

    const { data, error } = await supabaseAdmin.from('activationCodes').insert(values).select('*, course:courses(titleAr,titleDe,titleEn,level)');
    if (error) throw error;
    if (customCode && total > 1) {
      const { data: rest } = await supabaseAdmin
        .from('activationCodes')
        .select('*, course:courses(titleAr,titleDe,titleEn,level)')
        .in('code', values.map((v) => v.code));
      return NextResponse.json({ codes: rest || [] }, { status: 201 });
    }

    return NextResponse.json({ codes: data || [] }, { status: 201 });
  } catch (error) {
    console.error('Admin codes POST error:', error);
    return NextResponse.json({ error: 'Failed to create codes' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const userId = await verifyAdmin(req);
    if (!userId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { id, days } = await req.json();
    if (!id || !days) return NextResponse.json({ error: 'id and days are required' }, { status: 400 });
    const addDays = Math.max(parseInt(days) || 1, 1);

    const { data: code } = await supabaseAdmin
      .from('activationCodes')
      .select('expiresAt')
      .eq('id', id)
      .single();

    const base = code?.expiresAt && new Date(code.expiresAt) > new Date()
      ? new Date(code.expiresAt)
      : new Date();
    const newExpiry = new Date(base.getTime() + addDays * 86400000).toISOString();

    const { data, error } = await supabaseAdmin
      .from('activationCodes')
      .update({ expiresAt: newExpiry })
      .eq('id', id)
      .select('*, course:courses(titleAr,titleDe,titleEn,level), user:users(name,email)');
    if (error) throw error;

    return NextResponse.json({ codes: data || [] });
  } catch (error) {
    console.error('Admin codes PATCH error:', error);
    return NextResponse.json({ error: 'Failed to extend code' }, { status: 500 });
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