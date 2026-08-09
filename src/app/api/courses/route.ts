import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const includeLessons = searchParams.get('includeLessons') === 'true';
    const withProgress = searchParams.get('withProgress') === 'true';
    const enrolled = searchParams.get('enrolled') === 'true';
    const limit = parseInt(searchParams.get('limit') || '100');

    const authHeader = req.headers.get('Authorization');
    let userId: string | null = null;
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.replace('Bearer ', '');
      const decoded = Buffer.from(token, 'base64').toString('utf-8');
      userId = decoded.split(':')[0];
    }

    // If enrolled, return user's enrollments with progress
    if (enrolled && userId) {
      const enrollments = await db.enrollment.findMany({
        where: { userId },
        include: {
          course: { select: { id: true, titleAr: true, titleDe: true, titleEn: true, level: true, imageUrl: true } },
        },
        orderBy: { activatedAt: 'desc' },
      });

      const result = await Promise.all(enrollments.map(async (e) => {
        const lessons = await db.lesson.findMany({
          where: { courseId: e.courseId },
          include: { progress: { where: { userId }, select: { completed: true } } },
          orderBy: { order: 'asc' },
        });
        const completedLessons = lessons.filter(l => l.progress.some(p => p.completed)).length;
        const nextLesson = lessons.find(l => !l.progress.some(p => p.completed));
        return {
          id: e.id,
          course: e.course,
          activatedAt: e.activatedAt.toISOString(),
          expiresAt: e.expiresAt?.toISOString() || null,
          isActive: e.isActive && (!e.expiresAt || new Date(e.expiresAt) > new Date()),
          _count: { lessons: lessons.length },
          completedLessons,
          nextLessonId: nextLesson?.id || null,
        };
      }));

      return NextResponse.json({ enrollments: result });
    }

    // Regular courses list
    const courses = await db.course.findMany({
      where: { isActive: true },
      include: includeLessons
        ? {
            lessons: {
              select: { id: true, titleAr: true, titleDe: true, titleEn: true, descriptionAr: true, descriptionDe: true, descriptionEn: true, duration: true, order: true, isFree: true, videoUrl: true },
              orderBy: { order: 'asc' },
            },
            _count: { select: { lessons: true } },
          }
        : { _count: { select: { lessons: true } } },
      orderBy: { order: 'asc' },
      take: limit,
    });

    return NextResponse.json({ courses });
  } catch (error) {
    console.error('Courses error:', error);
    return NextResponse.json({ error: 'Failed to fetch courses' }, { status: 500 });
  }
}
