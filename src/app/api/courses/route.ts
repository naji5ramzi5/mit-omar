import { supabase, supabaseAdmin } from '@/lib/supabase';
import { decodeUserId } from '@/lib/admin-auth';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const includeLessons = searchParams.get('includeLessons') === 'true';
    const enrolled = searchParams.get('enrolled') === 'true';
    const limit = parseInt(searchParams.get('limit') || '100');

    const userId = decodeUserId(req);

    // If enrolled, return user's enrollments with progress
    if (enrolled && userId) {
      const { data: enrollments } = await supabaseAdmin
        .from('enrollments')
        .select('*, course:courses(id, titleAr, titleDe, titleEn, level, imageUrl)')
        .eq('userId', userId)
        .order('activatedAt', { ascending: false });

      const result: unknown[] = [];
      for (const e of (enrollments || []) as any[]) {
        const { data: lessons } = await supabaseAdmin
          .from('lessons')
          .select('id, titleAr, titleDe, titleEn, descriptionAr, descriptionDe, descriptionEn, duration, order, isFree, videoUrl, progress:lessonProgress(completed)')
          .eq('courseId', e.courseId)
          .order('order', { ascending: true });

        const lessonsList = lessons || [];
        const completedLessons = lessonsList.filter((l: Record<string, unknown>) => {
          const progress = l.progress as Array<{ completed: boolean }>;
          return progress?.some((p) => p.completed);
        }).length;
        const nextLesson = lessonsList.find((l: Record<string, unknown>) => {
          const progress = l.progress as Array<{ completed: boolean }>;
          return !progress?.some((p) => p.completed);
        });

        result.push({
          id: e.id,
          course: e.course,
          activatedAt: e.activatedAt,
          expiresAt: e.expiresAt || null,
          isActive: e.isActive && (!e.expiresAt || new Date(e.expiresAt) > new Date()),
          _count: { lessons: lessonsList.length },
          completedLessons,
          nextLessonId: nextLesson?.id || null,
        });
      }

      return NextResponse.json({ enrollments: result });
    }

    // Regular courses list
    let query = supabase
      .from('courses')
      .select(includeLessons
        ? '*, lessons(*)'
        : '*, lessons(count)')
      .eq('isActive', true)
      .order('order', { ascending: true })
      .limit(limit);

    const { data: courses, error } = await query;
    if (error) throw error;

    const list = (courses as any[] || []).map((c: any) => ({
      ...c,
      _count: {
        lessons: includeLessons
          ? (c.lessons || []).length
          : c.lessons?.[0]?.count ?? 0,
      },
      ...(includeLessons ? {} : { lessons: undefined }),
    }));
    return NextResponse.json({ courses: list });
  } catch (error) {
    console.error('Courses error:', error);
    return NextResponse.json({ error: 'Failed to fetch courses' }, { status: 500 });
  }
}
