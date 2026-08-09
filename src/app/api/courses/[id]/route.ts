import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const includeLessons = searchParams.get('includeLessons') === 'true';
    const withProgress = searchParams.get('withProgress') === 'true';

    const authHeader = req.headers.get('Authorization');
    let userId: string | null = null;
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.replace('Bearer ', '');
      const decoded = Buffer.from(token, 'base64').toString('utf-8');
      userId = decoded.split(':')[0];
    }

    const course = await db.course.findUnique({
      where: { id },
      include: includeLessons
        ? {
            lessons: {
              select: {
                id: true, titleAr: true, titleDe: true, titleEn: true,
                descriptionAr: true, descriptionDe: true, descriptionEn: true,
                duration: true, order: true, isFree: true, videoUrl: true,
                ...(withProgress && userId ? {
                  progress: { where: { userId }, select: { completed: true } },
                } : {}),
              },
              orderBy: { order: 'asc' },
            },
          }
        : undefined,
    });

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    let enrollment = null;
    if (userId) {
      enrollment = await db.enrollment.findUnique({
        where: { userId_courseId: { userId, courseId: id } },
        select: { isActive: true, expiresAt: true, activatedAt: true },
      });
    }

    // Transform lessons to include progress
    const lessons = includeLessons && course.lessons
      ? course.lessons.map(l => ({
          ...l,
          progress: (l as Record<string, unknown>).progress
            ? { completed: ((l as Record<string, unknown>).progress as Array<{ completed: boolean }>).some(p => p.completed) }
            : undefined,
        }))
      : undefined;

    return NextResponse.json({
      course: {
        ...course,
        ...(lessons ? { lessons } : {}),
        enrollment: enrollment ? {
          ...enrollment,
          expiresAt: enrollment.expiresAt?.toISOString() || null,
          activatedAt: enrollment.activatedAt.toISOString(),
          isActive: enrollment.isActive && (!enrollment.expiresAt || new Date(enrollment.expiresAt) > new Date()),
        } : null,
      },
    });
  } catch (error) {
    console.error('Course detail error:', error);
    return NextResponse.json({ error: 'Failed to fetch course' }, { status: 500 });
  }
}
