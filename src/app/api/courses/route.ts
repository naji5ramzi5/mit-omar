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

    // ── Enrolled courses (student dashboard) ─────────────────────────────────
    if (enrolled && userId) {
      // Single query with join — no N+1
      const { data: enrollments } = await supabaseAdmin
        .from('enrollments')
        .select('*, course:courses(id, titleAr, titleDe, titleEn, level, imageUrl, order)')
        .eq('userId', userId)
        .order('activatedAt', { ascending: false });

      if (!enrollments?.length) {
        return NextResponse.json({ enrollments: [] });
      }

      // Fetch all lessons for enrolled courses in a single query
      const courseIds = enrollments.map((e: any) => e.courseId);
      const { data: allLessons } = await supabaseAdmin
        .from('lessons')
        .select('id, courseId, "order", duration, isFree')
        .in('courseId', courseIds)
        .order('order', { ascending: true });

      // Fetch all progress for this user in a single query
      const { data: allProgress } = await supabaseAdmin
        .from('lessonProgress')
        .select('lessonId, completed')
        .eq('userId', userId);

      const progressMap = new Map((allProgress || []).map((p) => [p.lessonId, p.completed]));

      const result = (enrollments as any[]).map((e) => {
        const courseLessons = (allLessons || []).filter((l: any) => l.courseId === e.courseId);
        const completedLessons = courseLessons.filter((l: any) => progressMap.get(l.id)).length;
        const nextLesson = courseLessons.find((l: any) => !progressMap.get(l.id));

        return {
          id: e.id,
          course: e.course,
          activatedAt: e.activatedAt,
          expiresAt: e.expiresAt || null,
          isActive: e.isActive && (!e.expiresAt || new Date(e.expiresAt) > new Date()),
          _count: { lessons: courseLessons.length },
          completedLessons,
          nextLessonId: nextLesson?.id || null,
        };
      });

      return NextResponse.json({ enrollments: result });
    }

    // ── Public courses list ───────────────────────────────────────────────────
    // Only select lesson fields actually needed (avoid SELECT * on lessons)
    const lessonsSelect = includeLessons
      ? 'lessons(id, titleAr, titleDe, titleEn, duration, "order", isFree)'
      : 'lessons(count)';

    const { data: courses, error } = await supabase
      .from('courses')
      .select(`*, ${lessonsSelect}`)
      .eq('isActive', true)
      .order('order', { ascending: true })
      .limit(limit);

    if (error) throw error;

    // Try fetching levels count from course_levels
    let levelCountMap = new Map<string, number>();
    try {
      const { data: levelRows } = await supabaseAdmin
        .from('course_levels')
        .select('courseId')
        .eq('isActive', true);
      if (levelRows) {
        for (const row of levelRows) {
          levelCountMap.set(row.courseId, (levelCountMap.get(row.courseId) || 0) + 1);
        }
      }
    } catch {
      // Fallback
    }

    const list = (courses as any[] || []).map((c: any) => ({
      ...c,
      _count: {
        levels: levelCountMap.get(c.id) ?? (c.level ? 1 : 0),
        lessons: includeLessons
          ? (c.lessons || []).length
          : c.lessons?.[0]?.count ?? 0,
      },
      lessons: includeLessons && c.lessons ? c.lessons : undefined,
    }));

    const response = NextResponse.json({ courses: list });
    response.headers.set('Cache-Control', 'public, s-maxage=120, stale-while-revalidate=600');
    return response;
  } catch (error) {
    console.error('Courses error:', error);
    return NextResponse.json({ error: 'Failed to fetch courses' }, { status: 500 });
  }
}
