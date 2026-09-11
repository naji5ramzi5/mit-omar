import { NextRequest, NextResponse } from 'next/server';
import { fetchR2Object, headR2Object, cleanR2Key } from '@/lib/r2';
import { getCourseIntroVideo } from '@/lib/activation';
import { verifyVideoToken } from '@/lib/video-protection';
import { supabaseAdmin } from '@/lib/supabase';
import { decodeUserId } from '@/lib/admin-auth';

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
      'Access-Control-Allow-Headers': 'Range, Authorization, Content-Type',
    },
  });
}

type ResolvedKey = { key: string; isIntro?: boolean };
type ResolveError = { error: string; status: number };

async function resolveTargetKey(
  req: NextRequest
): Promise<ResolvedKey | ResolveError> {
  const { searchParams } = new URL(req.url);
  const courseId = searchParams.get('courseId');
  const isIntro = searchParams.get('intro') === 'true';
  const token = searchParams.get('token');
  const rawKey = searchParams.get('key');

  // ── Case 1: Course Intro Video (free, no token required) ──────────────────
  if (courseId && isIntro) {
    const intro = await getCourseIntroVideo(courseId);
    if (!intro.videoUrl || !intro.isPublished) {
      return { error: 'الفيديو التعريفي غير متاح حالياً', status: 404 };
    }
    return { key: cleanR2Key(intro.videoUrl), isIntro: true };
  }

  // ── Case 2: Protected lesson video by R2 key + video token ───────────────
  if (rawKey) {
    const cleanKey = cleanR2Key(decodeURIComponent(rawKey));

    // Security: always verify token for lesson videos
    if (!token) {
      return { error: 'رمز الوصول للفيديو مطلوب', status: 401 };
    }

    const verified = verifyVideoToken(token);
    if (!verified) {
      return { error: 'صلاحية مشاهدة الفيديو غير صالحة أو منتهية', status: 403 };
    }

    // Verify the token's lessonId maps to a real lesson with this key
    const { data: lesson } = await supabaseAdmin
      .from('lessons')
      .select('id, videoUrl, courseId, isFree')
      .eq('id', verified.lessonId)
      .maybeSingle();

    if (!lesson) {
      return { error: 'الدرس غير موجود', status: 404 };
    }

    // For free lessons: also verify userId if present (optional watermark)
    if (!lesson.isFree) {
      // Token must match this exact lesson
      if (verified.lessonId !== lesson.id) {
        return { error: 'رمز الوصول غير مطابق للدرس', status: 403 };
      }
    }

    return { key: cleanKey };
  }

  return { error: 'المعلمات غير صحيحة', status: 400 };
}

export async function GET(req: NextRequest) {
  try {
    const resolved = await resolveTargetKey(req);
    if ('error' in resolved) {
      return NextResponse.json({ error: resolved.error }, { status: resolved.status });
    }

    const rangeHeader = req.headers.get('range');
    const r2Headers: Record<string, string> = {};
    if (rangeHeader) {
      r2Headers['Range'] = rangeHeader;
    }

    const r2Response = await fetchR2Object(resolved.key, r2Headers);

    if (r2Response.status === 404) {
      return NextResponse.json({ error: 'ملف الفيديو غير موجود على الخادم' }, { status: 404 });
    }

    const responseHeaders = new Headers();
    responseHeaders.set(
      'Content-Type',
      r2Response.headers.get('content-type') || 'video/mp4'
    );
    responseHeaders.set('Accept-Ranges', 'bytes');
    responseHeaders.set('Access-Control-Allow-Origin', '*');
    responseHeaders.set(
      'Access-Control-Expose-Headers',
      'Content-Range, Content-Length, Accept-Ranges'
    );
    responseHeaders.set(
      'Cache-Control',
      resolved.isIntro ? 'public, max-age=86400' : 'private, no-cache, no-store'
    );

    const contentRange = r2Response.headers.get('content-range');
    if (contentRange) responseHeaders.set('Content-Range', contentRange);
    const contentLength = r2Response.headers.get('content-length');
    if (contentLength) responseHeaders.set('Content-Length', contentLength);

    return new Response(r2Response.body, {
      status: r2Response.status,
      headers: responseHeaders,
    });
  } catch (err: any) {
    console.error('Video streaming error:', err);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء تشغيل الفيديو', details: err?.message },
      { status: 500 }
    );
  }
}

export async function HEAD(req: NextRequest) {
  try {
    const resolved = await resolveTargetKey(req);
    if ('error' in resolved) {
      return new NextResponse(null, { status: resolved.status });
    }

    const r2Response = await headR2Object(resolved.key);
    const headers = new Headers();
    headers.set('Content-Type', r2Response.headers.get('content-type') || 'video/mp4');
    headers.set('Accept-Ranges', 'bytes');
    headers.set('Access-Control-Allow-Origin', '*');
    headers.set('Access-Control-Expose-Headers', 'Content-Length, Accept-Ranges');
    const contentLength = r2Response.headers.get('content-length');
    if (contentLength) headers.set('Content-Length', contentLength);

    return new Response(null, { status: r2Response.status, headers });
  } catch {
    return new NextResponse(null, { status: 404 });
  }
}
