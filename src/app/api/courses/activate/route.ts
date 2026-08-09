import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const token = authHeader.replace('Bearer ', '');
    const decoded = Buffer.from(token, 'base64').toString('utf-8');
    const userId = decoded.split(':')[0];

    const { code } = await req.json();
    if (!code) {
      return NextResponse.json({ error: 'Code is required' }, { status: 400 });
    }

    // Find course by activation code in SiteSetting
    let courseId: string | null = null;
    const settings = await db.siteSetting.findMany({
      where: { value: code.trim().toUpperCase() },
    });

    for (const setting of settings) {
      if (setting.key.startsWith('activation_code_')) {
        courseId = setting.key.replace('activation_code_', '');
        break;
      }
    }

    if (!courseId) {
      // Also check enrollment codes directly
      const course = await db.course.findFirst({
        where: { id: code.trim() },
      });
      if (course) {
        courseId = course.id;
      }
    }

    if (!courseId) {
      return NextResponse.json({ error: 'Invalid activation code' }, { status: 404 });
    }

    // Check if already enrolled
    const existing = await db.enrollment.findUnique({
      where: { userId_courseId: { userId, courseId } },
    });

    if (existing) {
      // Return existing enrollment
      const course = await db.course.findUnique({ where: { id: courseId } });
      return NextResponse.json({
        enrollment: {
          courseName: course ? (course as Record<string, unknown>)[`titleAr`] || course.titleDe : '',
          activatedAt: existing.activatedAt.toISOString(),
          expiresAt: existing.expiresAt?.toISOString() || null,
          isActive: existing.isActive,
        },
      });
    }

    // Create enrollment
    const course = await db.course.findUnique({ where: { id: courseId } });
    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + 3);

    const enrollment = await db.enrollment.create({
      data: {
        userId,
        courseId,
        code: code.trim(),
        activatedAt: new Date(),
        expiresAt,
        isActive: true,
      },
    });

    // Create a welcome notification
    await db.notification.create({
      data: {
        userId,
        titleAr: 'تم تفعيل دورة جديدة',
        titleDe: 'Neuer Kurs aktiviert',
        titleEn: 'New Course Activated',
        messageAr: `تم تفعيل دورة: ${course.titleAr}`,
        messageDe: `Kurs aktiviert: ${course.titleDe}`,
        messageEn: `Course activated: ${course.titleEn}`,
        type: 'course',
      },
    });

    return NextResponse.json({
      enrollment: {
        courseName: course.titleAr || course.titleDe,
        activatedAt: enrollment.activatedAt.toISOString(),
        expiresAt: enrollment.expiresAt?.toISOString() || null,
        isActive: true,
      },
    });
  } catch (error) {
    console.error('Activation error:', error);
    return NextResponse.json({ error: 'Failed to activate course' }, { status: 500 });
  }
}
