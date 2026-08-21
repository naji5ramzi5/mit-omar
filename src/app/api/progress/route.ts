import { supabaseAdmin } from '@/lib/supabase';
import { decodeUserId } from '@/lib/admin-auth';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const userId = decodeUserId(req);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { lessonId, completed, watchedSeconds } = await req.json();
    if (!lessonId) return NextResponse.json({ error: 'lessonId required' }, { status: 400 });

    // Check existing progress
    const { data: existing } = await supabaseAdmin
      .from('lessonProgress')
      .select('id')
      .eq('userId', userId)
      .eq('lessonId', lessonId)
      .single();

    if (existing) {
      const updateData: Record<string, unknown> = { lastWatchedAt: new Date().toISOString() };
      if (completed !== undefined) updateData.completed = completed;
      if (watchedSeconds !== undefined) updateData.watchedSeconds = watchedSeconds;

      await supabaseAdmin.from('lessonProgress').update(updateData).eq('id', existing.id);
    } else {
      await supabaseAdmin.from('lessonProgress').insert({
        userId,
        lessonId,
        completed: !!completed,
        watchedSeconds: watchedSeconds || 0,
        lastWatchedAt: new Date().toISOString(),
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Progress error:', error);
    return NextResponse.json({ error: 'Failed to update progress' }, { status: 500 });
  }
}
