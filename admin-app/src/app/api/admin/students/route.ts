import { supabaseAdmin } from '@/lib/supabase';
import { decodeUserId } from '@/lib/admin-auth';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  try {
    const userId = decodeUserId(req);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: user } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', userId)
      .single();

    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { data: students, error } = await supabaseAdmin
      .from('users')
      .select('id, name, email, phone, createdAt, enrollments(count)')
      .eq('role', 'student')
      .order('createdAt', { ascending: false });

    if (error) throw error;
    const normalized = (students as any[] || []).map((s) => ({
      ...s,
      enrollments: undefined,
      _count: { enrollments: s.enrollments?.[0]?.count ?? 0 },
    }));
    return NextResponse.json({ students: normalized });
  } catch (error) {
    console.error('Admin students error:', error);
    return NextResponse.json({ error: 'Failed to fetch students' }, { status: 500 });
  }
}
