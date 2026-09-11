import { supabaseAdmin } from '@/lib/supabase';
import { decodeUserId } from '@/lib/admin-auth';
import { getR2SignedUrl, isR2Key } from '@/lib/r2';
import { issueVideoToken, VIDEO_SECURITY_CONFIG, generateWatermarkToken } from '@/lib/video-protection';
import { getCourseIntroVideo } from '@/lib/activation';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const lessonId = searchParams.get('lessonId');
    const courseId = searchParams.get('courseId');
    const isIntro = searchParams.get('intro') === 'true';

    // 1. Dedicated Free Introductory Video Route
    if (isIntro && courseId) {
      const intro = await getCourseIntroVideo(courseId);
      if (!intro.videoUrl || !intro.isPublished) {
        return NextResponse.json({ error: 'الفيديو التعريفي غير متاح حالياً' }, { status: 404 });
      }

      let introUrl: string | null = intro.videoUrl;
      const isR2 = isR2Key(intro.videoUrl);
      if (isR2) {
        introUrl = `/api/videos/stream?courseId=${encodeURIComponent(courseId)}&intro=true`;
      }

      return NextResponse.json({
        url: introUrl,
        isIntro: true,
        duration: intro.duration,
        title: 'الفيديو التعريفي للدورة',
      });
    }

    // 2. Course Lesson Video Route
    if (!lessonId) {
      return NextResponse.json({ error: 'معرّف الدرس مطلوب' }, { status: 400 });
    }

    const { data: lesson } = await supabaseAdmin
      .from('lessons')
      .select('id, videoUrl, videoId, isFree, courseId, titleAr')
      .eq('id', lessonId)
      .maybeSingle();

    if (!lesson) {
      return NextResponse.json({ error: 'الدرس غير موجود' }, { status: 404 });
    }

    let userId: string | null = null;

    // Verify enrollment for paid lessons before disclosing video status
    if (!lesson.isFree) {
      userId = decodeUserId(req);
      if (!userId) {
        return NextResponse.json(
          { error: 'unauthorized', message: 'يجب تسجيل الدخول لمشاهدة هذا الدرس' },
          { status: 401 }
        );
      }

      const { data: enrollment } = await supabaseAdmin
        .from('enrollments')
        .select('isActive, expiresAt')
        .eq('userId', userId)
        .eq('courseId', lesson.courseId)
        .maybeSingle();

      if (!enrollment) {
        return NextResponse.json(
          { error: 'not_enrolled', message: 'هذا الدرس يتطلب كود تفعيل' },
          { status: 403 }
        );
      }

      if (!enrollment.isActive) {
        return NextResponse.json(
          { error: 'access_revoked', message: 'تم إيقاف صلاحية الوصول إلى هذا الكورس' },
          { status: 403 }
        );
      }

      if (enrollment.expiresAt && new Date(enrollment.expiresAt).getTime() <= Date.now()) {
        return NextResponse.json(
          { error: 'access_expired', message: 'انتهت صلاحية الوصول إلى هذا الكورس' },
          { status: 403 }
        );
      }
    } else {
      // Free lesson: open to everyone, still extract user if available for personalized watermarking
      const freeUserId = decodeUserId(req);
      if (freeUserId) userId = freeUserId;
    }

    // Check if videoUrl is uploaded
    if (!lesson.videoUrl || lesson.videoUrl === '') {
      return NextResponse.json({ error: 'لا يوجد فيديو لهذا الدرس' }, { status: 404 });
    }

    // Issue short-lived video token for HLS key access and dynamic watermarking
    let videoToken: string | undefined;
    let watermarkToken: string | undefined;
    if (userId) {
      const vt = issueVideoToken({
        lessonId: lesson.id,
        userId,
        ip: req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? undefined,
        ua: req.headers.get('user-agent') ?? undefined,
      });
      videoToken = vt;
      watermarkToken = generateWatermarkToken(userId, lessonId);
    }

    // Resolve protected video URL
    let url: string | null = lesson.videoUrl;
    const isR2 = isR2Key(lesson.videoUrl);

    if (isR2) {
      const objectKey = lesson.videoUrl.replace(/^r2:\/*/, '');
      url = `/api/videos/stream?key=${encodeURIComponent(objectKey)}${videoToken ? `&token=${videoToken}` : ''}`;
    }

    return NextResponse.json({
      url,
      lessonId: lesson.id,
      isFree: !!lesson.isFree,
      external: !isR2,
      videoToken,
      watermarkToken,
      hlsConfig: {
        keyUri: videoToken ? `/api/videos/key/${lesson.id}/{keyId}?token=${videoToken}` : undefined,
        keyFormat: 'identity',
        keyFormatVersions: '1',
      },
    });
  } catch (error) {
    console.error('Video play route error:', error);
    return NextResponse.json({ error: 'Failed to resolve video' }, { status: 500 });
  }
}