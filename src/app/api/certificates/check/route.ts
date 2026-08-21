import { supabaseAdmin } from '@/lib/supabase';
import { decodeUserId } from '@/lib/admin-auth';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  try {
    const userId = decodeUserId(req);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const courseId = searchParams.get('courseId');
    if (!courseId) return NextResponse.json({ error: 'courseId is required' }, { status: 400 });

    const { data: enrollment } = await supabaseAdmin
      .from('enrollments')
      .select('id, activatedAt, expiresAt, isActive')
      .eq('userId', userId)
      .eq('courseId', courseId)
      .maybeSingle();

    if (!enrollment || !enrollment.isActive) {
      return NextResponse.json({ eligible: false });
    }
    if (enrollment.expiresAt && new Date(enrollment.expiresAt) < new Date()) {
      return NextResponse.json({ eligible: false });
    }

    const { data: course } = await supabaseAdmin
      .from('courses')
      .select('id, titleAr, titleDe, titleEn')
      .eq('id', courseId)
      .maybeSingle();

    const { data: lessons } = await supabaseAdmin
      .from('lessons')
      .select('id')
      .eq('courseId', courseId);

    const lessonIds = (lessons || []).map((l) => l.id);
    if (!lessonIds.length) return NextResponse.json({ eligible: false });

    const { data: progressRows } = await supabaseAdmin
      .from('lessonProgress')
      .select('lessonId, updatedAt')
      .eq('userId', userId)
      .in('lessonId', lessonIds)
      .eq('completed', true);

    const completed = progressRows || [];
    const eligible = completed.length >= lessonIds.length;
    if (!eligible) {
      return NextResponse.json({
        eligible: false,
        progress: { completed: completed.length, total: lessonIds.length },
      });
    }

    const completedAt = completed.reduce((latest, row) =>
      !latest || (row.updatedAt && row.updatedAt > latest) ? row.updatedAt : latest,
      null as string | null);

    return NextResponse.json({
      eligible: true,
      name: '',
      courseTitle: { ar: course?.titleAr, de: course?.titleDe, en: course?.titleEn },
      completedAt,
      progress: { completed: completed.length, total: lessonIds.length },
    });
  } catch (error) {
    console.error('Certificate check error:', error);
    return NextResponse.json({ error: 'Failed to check certificate' }, { status: 500 });
  }
}