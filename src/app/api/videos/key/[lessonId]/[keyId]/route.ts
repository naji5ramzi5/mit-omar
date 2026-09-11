import { createHash } from 'crypto';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { verifyVideoToken } from '@/lib/video-protection';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ lessonId: string; keyId: string }> }
) {
  try {
    const { lessonId, keyId } = await params;
    
    // Verify video token from query param
    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token');
    if (!token) {
      return NextResponse.json({ error: 'Token required' }, { status: 401 });
    }
    
    const tokenData = verifyVideoToken(token);
    if (!tokenData || tokenData.lessonId !== lessonId) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 403 });
    }
    
    // Verify user has access
    const userId = tokenData.userId;
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
        .eq('userId', userId)
        .eq('courseId', lesson.courseId)
        .eq('isActive', true)
        .maybeSingle();
      
      if (!enrollment || (enrollment.expiresAt && new Date(enrollment.expiresAt) < new Date())) {
        return NextResponse.json({ error: 'Not enrolled' }, { status: 403 });
      }
    }
    
    // Generate or retrieve AES key for this lesson/keyId
    // In production, store keys in Redis/DB with TTL
    const keySeed = `${lessonId}:${keyId}:${process.env.VIDEO_AES_SECRET || 'dmo-aes-secret'}`;
    const key = createHash('sha256').update(keySeed).digest().slice(0, 16);
    
    return new NextResponse(key, {
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Length': '16',
        'Cache-Control': 'private, max-age=3600, immutable',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
      },
    });
  } catch (error) {
    console.error('Video key error:', error);
    return NextResponse.json({ error: 'Failed to retrieve key' }, { status: 500 });
  }
}