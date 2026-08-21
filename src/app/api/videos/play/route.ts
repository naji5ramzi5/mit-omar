import { supabaseAdmin } from '@/lib/supabase';
import { decodeUserId } from '@/lib/admin-auth';
import { getR2SignedUrl, isR2Key } from '@/lib/r2';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const lessonId = searchParams.get('lessonId');
    if (!lessonId) return NextResponse.json({ error: 'lessonId is required' }, { status: 400 });

    const { data: lesson } = await supabaseAdmin
      .from('lessons')
      .select('id, videoUrl, videoId, isFree, courseId')
      .eq('id', lessonId)
      .maybeSingle();

    if (!lesson?.videoUrl || lesson.videoUrl === '') {
      return NextResponse.json({ error: 'No video for this lesson' }, { status: 404 });
    }

    // Free lessons stream without a token; paid lessons require an active enrollment
    if (!lesson.isFree) {
      const userId = decodeUserId(req);
      if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

      const { data: enrollment } = await supabaseAdmin
        .from('enrollments')
        .select('isActive, expiresAt')
        .eq('userId', userId)
        .eq('courseId', lesson.courseId)
        .eq('isActive', true)
        .maybeSingle();

      if (!enrollment || (enrollment.expiresAt && new Date(enrollment.expiresAt) < new Date())) {
        return NextResponse.json({ error: 'Not enrolled' }, { status: 403 });
      }
    }

    let url: string | null = lesson.videoUrl;
    if (isR2Key(lesson.videoUrl)) {
      url = await getR2SignedUrl(lesson.videoUrl);
      if (!url) return NextResponse.json({ error: 'Storage not configured' }, { status: 500 });
    }

    return NextResponse.json({
      url,
      lessonId: lesson.id,
      external: !isR2Key(lesson.videoUrl),
    });
  } catch (error) {
    console.error('Video play error:', error);
    return NextResponse.json({ error: 'Failed to resolve video' }, { status: 500 });
  }
}