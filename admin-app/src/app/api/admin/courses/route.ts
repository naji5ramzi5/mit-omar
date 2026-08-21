import { supabaseAdmin } from '@/lib/supabase';
import { verifyAdmin } from '@/lib/admin-auth';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  try {
    const userId = await verifyAdmin(req);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: courses, error } = await supabaseAdmin
      .from('courses')
      .select('*, lessons(count), enrollments(count)')
      .order('order', { ascending: true });

    if (error) throw error;
    const normalized = (courses as any[] || []).map((c) => ({
      ...c,
      lessons: undefined,
      enrollments: undefined,
      _count: {
        lessons: c.lessons?.[0]?.count ?? 0,
        enrollments: c.enrollments?.[0]?.count ?? 0,
      },
    }));
    return NextResponse.json({ courses: normalized });
  } catch (error) {
    console.error('Admin courses error:', error);
    return NextResponse.json({ error: 'Failed to fetch courses' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const userId = await verifyAdmin(req);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { titleAr, titleDe, titleEn, descriptionAr, descriptionDe, descriptionEn, level, imageUrl, order, isActive } = body;

    if (!titleAr || !titleDe || !titleEn || !level) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { data: course, error } = await supabaseAdmin
      .from('courses')
      .insert({
        titleAr, titleDe, titleEn,
        descriptionAr: descriptionAr || '',
        descriptionDe: descriptionDe || '',
        descriptionEn: descriptionEn || '',
        level,
        imageUrl: imageUrl || null,
        order: order ?? 0,
        isActive: isActive ?? true,
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ course }, { status: 201 });
  } catch (error) {
    console.error('Admin create course error:', error);
    return NextResponse.json({ error: 'Failed to create course' }, { status: 500 });
  }
}
