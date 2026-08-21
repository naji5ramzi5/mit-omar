import { supabase, supabaseAdmin } from '@/lib/supabase';
import { decodeUserId } from '@/lib/admin-auth';
import { NextResponse } from 'next/server';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const includeLessons = searchParams.get('includeLessons') === 'true';
    const withProgress = searchParams.get('withProgress') === 'true';

    const userId = decodeUserId(req);

    const { data: course, error } = await supabase
      .from('courses')
      .select(includeLessons ? '*, lessons(*)' : '*')
      .eq('id', id)
      .single();

    if (error || !course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    let enrollment: { isActive: boolean; expiresAt: string | null; activatedAt: string | null } | null = null;
    if (userId) {
      const { data } = await supabaseAdmin
        .from('enrollments')
        .select('isActive, expiresAt, activatedAt')
        .eq('userId', userId)
        .eq('courseId', id)
        .single();

      enrollment = data ? {
        ...data,
        expiresAt: data.expiresAt || null,
        activatedAt: data.activatedAt,
        isActive: data.isActive && (!data.expiresAt || new Date(data.expiresAt) > new Date()),
      } : null;
    }

    const courseData = course as any;

    // If withProgress and userId, add progress to lessons
    let lessons = courseData.lessons;
    if (includeLessons && withProgress && userId && lessons) {
      const { data: progressData } = await supabaseAdmin
        .from('lessonProgress')
        .select('lessonId, completed')
        .eq('userId', userId);

      const progressMap = new Map((progressData || []).map((p) => [p.lessonId, p.completed]));
      lessons = lessons.map((l: Record<string, unknown>) => ({
        ...l,
        progress: progressMap.has(l.id as string) ? { completed: progressMap.get(l.id as string) } : undefined,
      }));
    }

    return NextResponse.json({
      course: {
        ...courseData,
        ...(lessons ? { lessons } : {}),
        enrollment,
      },
    });
  } catch (error) {
    console.error('Course detail error:', error);
    return NextResponse.json({ error: 'Failed to fetch course' }, { status: 500 });
  }
}
