import { supabase, supabaseAdmin } from '@/lib/supabase';
import { decodeUserId } from '@/lib/admin-auth';
import { getCourseIntroVideo } from '@/lib/activation';
import { NextResponse } from 'next/server';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const includeLessons = searchParams.get('includeLessons') === 'true';
    const withProgress = searchParams.get('withProgress') === 'true';

    const userId = decodeUserId(req);

    // ── Run course fetch + enrollment + intro video in parallel ─────────────
    const [courseResult, enrollmentResult, introVideo] = await Promise.all([
      supabase
        .from('courses')
        .select(
          includeLessons
            ? '*, lessons(id, levelId, titleAr, titleDe, titleEn, descriptionAr, descriptionDe, descriptionEn, duration, "order", isFree, videoUrl)'
            : '*'
        )
        .eq('id', id)
        .single(),

      userId
        ? supabaseAdmin
            .from('enrollments')
            .select('isActive, expiresAt, activatedAt')
            .eq('userId', userId)
            .eq('courseId', id)
            .maybeSingle()
        : Promise.resolve({ data: null, error: null }),

      getCourseIntroVideo(id),
    ]);

    const { data: course, error } = courseResult;
    if (error || !course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    // ── Build enrollment status ──────────────────────────────────────────────
    let enrollment: {
      isActive: boolean;
      expiresAt: string | null;
      activatedAt: string | null;
      isExpired: boolean;
    } | null = null;

    const enrollData = enrollmentResult.data;
    if (enrollData) {
      const isPastExpiry = !!(
        enrollData.expiresAt && new Date(enrollData.expiresAt).getTime() <= Date.now()
      );
      enrollment = {
        isActive: !!enrollData.isActive && !isPastExpiry,
        expiresAt: enrollData.expiresAt || null,
        activatedAt: enrollData.activatedAt,
        isExpired: isPastExpiry,
      };
    }

    const courseData = course as any;

    // ── Fetch levels from course_levels ──────────────────────────────────────
    let levels: any[] = [];
    try {
      const { data: levelRows } = await supabaseAdmin
        .from('course_levels')
        .select('*')
        .eq('courseId', id)
        .eq('isActive', true)
        .order('order', { ascending: true });

      if (levelRows && levelRows.length > 0) {
        levels = levelRows;
      }
    } catch {
      // Graceful fallback if table not yet migrated
    }

    // ── Sort lessons ─────────────────────────────────────────────────────────
    let lessons: any[] = courseData.lessons || [];
    if (Array.isArray(lessons)) {
      lessons.sort((a, b) => (a.order || 0) - (b.order || 0));
    }

    // ── Add progress to lessons (only if needed) ─────────────────────────────
    if (includeLessons && withProgress && userId && lessons.length > 0) {
      const { data: progressData } = await supabaseAdmin
        .from('lessonProgress')
        .select('lessonId, completed')
        .eq('userId', userId);

      const progressMap = new Map(
        (progressData || []).map((p) => [p.lessonId, p.completed])
      );
      lessons = lessons.map((l: Record<string, unknown>) => ({
        ...l,
        progress: progressMap.has(l.id as string)
          ? { completed: progressMap.get(l.id as string) }
          : undefined,
      }));
    }

    // ── Resolve intro video URL ──────────────────────────────────────────────
    let resolvedIntroUrl: string | null = null;
    if (introVideo.isPublished && introVideo.videoUrl) {
      resolvedIntroUrl = `/api/videos/stream?courseId=${encodeURIComponent(id)}&intro=true`;
    }

    // ── Sanitize lessons: hide videoUrl for paid lessons ────────────────────
    const sanitizedLessons: any[] = Array.isArray(lessons)
      ? lessons.map((l: any) => ({
          ...l,
          videoUrl: l.isFree ? l.videoUrl : undefined,
        }))
      : [];

    // ── Group lessons into levels ───────────────────────────────────────────
    let structuredLevels: any[] = [];
    if (levels.length > 0) {
      structuredLevels = levels.map((lvl) => {
        const lvlLessons = sanitizedLessons.filter((l) => l.levelId === lvl.id);
        return {
          ...lvl,
          lessons: lvlLessons,
          _count: { lessons: lvlLessons.length },
        };
      });

      // Catch any lessons that have no levelId or unmapped levelId and assign to first level
      const unassignedLessons = sanitizedLessons.filter(
        (l) => !l.levelId || !levels.some((lvl) => lvl.id === l.levelId)
      );
      if (unassignedLessons.length > 0 && structuredLevels.length > 0) {
        structuredLevels[0].lessons = [...structuredLevels[0].lessons, ...unassignedLessons];
        structuredLevels[0]._count.lessons = structuredLevels[0].lessons.length;
      }
    } else {
      // Fallback: create synthesized level so UI always has uniform levels array
      const defaultName = courseData.level || 'A1';
      structuredLevels = [
        {
          id: 'default-' + id,
          courseId: id,
          name: defaultName,
          titleAr: 'المستوى ' + defaultName,
          titleDe: 'Stufe ' + defaultName,
          titleEn: 'Level ' + defaultName,
          order: 0,
          isActive: true,
          lessons: sanitizedLessons,
          _count: { lessons: sanitizedLessons.length },
        },
      ];
    }

    const response = NextResponse.json({
      course: {
        ...courseData,
        introVideo: introVideo.isPublished
          ? { ...introVideo, resolvedUrl: resolvedIntroUrl }
          : null,
        lessons: sanitizedLessons,
        levels: structuredLevels,
        enrollment,
      },
    });

    // Cache public (non-enrolled) course data briefly
    if (!userId) {
      response.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
    } else {
      response.headers.set('Cache-Control', 'private, max-age=30');
    }

    return response;
  } catch (error) {
    console.error('Course detail error:', error);
    return NextResponse.json({ error: 'Failed to fetch course' }, { status: 500 });
  }
}
