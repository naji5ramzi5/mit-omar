import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { verifyVideoToken } from '@/lib/video-protection';
import { getR2SignedUrl, isR2Key } from '@/lib/r2';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ lessonId: string }> }
) {
  try {
    const { lessonId } = await params;
    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token');
    const segment = searchParams.get('segment'); // segment number
    const playlist = searchParams.get('playlist'); // 'master' or 'media'

    // Verify token
    const tokenData = verifyVideoToken(token || '');
    if (!tokenData || tokenData.lessonId !== lessonId) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 403 });
    }

    const { data: lesson } = await supabaseAdmin
      .from('lessons')
      .select('id, videoUrl, videoId, isFree, courseId')
      .eq('id', lessonId)
      .maybeSingle();

    if (!lesson) {
      return NextResponse.json({ error: 'Lesson not found' }, { status: 404 });
    }

    if (!lesson.isFree) {
      const { data: enrollment } = await supabaseAdmin
        .from('enrollments')
        .select('isActive, expiresAt')
        .eq('userId', tokenData.userId)
        .eq('courseId', lesson.courseId)
        .eq('isActive', true)
        .maybeSingle();

      if (!enrollment || (enrollment.expiresAt && new Date(enrollment.expiresAt) < new Date())) {
        return NextResponse.json({ error: 'Not enrolled' }, { status: 403 });
      }
    }

    // Get video URL
    let videoUrl = lesson.videoUrl;
    if (!videoUrl) {
      return NextResponse.json({ error: 'No video' }, { status: 404 });
    }

    if (videoUrl.startsWith('r2:')) {
      const signedUrl = await getSignedUrl(videoUrl, 3600);
      if (!signedUrl) return NextResponse.json({ error: 'Storage error' }, { status: 500 });
      videoUrl = signedUrl;
    }

    // For now, return a redirect to the video URL with proper headers
    // In production, this would serve HLS segments with AES-128 encryption
    const response = NextResponse.redirect(videoUrl, 302);
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
    response.headers.set('Cache-Control', 'private, max-age=3600');
    
    return response;
  } catch (error) {
    console.error('HLS stream error:', error);
    return NextResponse.json({ error: 'Stream error' }, { status: 500 });
  }
}

async function getSignedUrl(key: string, expiresInSeconds = 3600): Promise<string | null> {
  const { getR2SignedUrl, isR2Key } = await import('@/lib/r2');
  if (isR2Key(key)) {
    return getR2SignedUrl(key, 3600);
  }
  return key;
}