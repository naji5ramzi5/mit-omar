import { supabaseAdmin } from '@/lib/supabase';
import { verifyAdmin } from '@/lib/admin-auth';
import { NextResponse } from 'next/server';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await verifyAdmin(req);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;

    const { data: counts, error: countsError } = await supabaseAdmin
      .from('users')
      .select('enrollments(count)')
      .eq('id', id)
      .single();

    const { data: student, error } = await supabaseAdmin
      .from('users')
      .select('id, name, email, phone, createdAt, enrollments(id, activatedAt, expiresAt, isActive, course: courses(id, titleAr, titleDe, titleEn, level))')
      .eq('id', id)
      .single();

    if (error || countsError || !student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    const { count: lessonProgress } = await supabaseAdmin
      .from('lessonProgress')
      .select('id', { count: 'exact', head: true })
      .eq('userId', id);

    return NextResponse.json({
      student: {
        ...student,
        _count: {
          enrollments: (counts?.enrollments as Array<{ count: number }> | undefined)?.[0]?.count ?? 0,
          lessonProgress: lessonProgress || 0,
        },
      },
    });
  } catch (error) {
    console.error('Admin student detail error:', error);
    return NextResponse.json({ error: 'Failed to fetch student' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await verifyAdmin(req);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    if (id === userId) {
      return NextResponse.json({ error: 'Cannot delete yourself' }, { status: 400 });
    }

    const { error } = await supabaseAdmin.from('users').delete().eq('id', id);
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Admin delete student error:', error);
    return NextResponse.json({ error: 'Failed to delete student' }, { status: 500 });
  }
}
