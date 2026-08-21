import { supabaseAdmin } from '@/lib/supabase';
import { decodeUserId } from '@/lib/admin-auth';
import { NextResponse } from 'next/server';

interface ProgressRow {
  id?: string;
  ease?: number;
  interval?: number;
  reps?: number;
}

export async function POST(req: Request) {
  try {
    const userId = decodeUserId(req);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { wordId, grade } = await req.json();
    if (!wordId || ![0, 1, 2, 3].includes(grade)) {
      return NextResponse.json({ error: 'Invalid review' }, { status: 400 });
    }

    const { data: existing } = await supabaseAdmin
      .from('word_progress')
      .select('id, ease, interval, reps')
      .eq('userId', userId)
      .eq('wordId', wordId)
      .maybeSingle();

    let ease = 2.5;
    let intervalDays = 0;
    let reps = 0;
    if (existing) {
      ease = existing.ease || 2.5;
      intervalDays = existing.interval || 0;
      reps = existing.reps || 0;
    }

    let dueMs: number;
    if (grade === 0) {
      ease = Math.max(1.3, ease - 0.2);
      reps = 0;
      intervalDays = 0;
      dueMs = 10 * 60 * 1000;
    } else if (grade === 1) {
      ease = Math.max(1.3, ease - 0.15);
      intervalDays = intervalDays === 0 ? 1 : Math.max(1, Math.round(intervalDays * 1.2));
      reps += 1;
      dueMs = intervalDays * 24 * 60 * 60 * 1000;
    } else if (grade === 2) {
      intervalDays = reps === 0 ? 1 : Math.max(1, Math.round(intervalDays * ease));
      reps += 1;
      dueMs = intervalDays * 24 * 60 * 60 * 1000;
    } else {
      ease = Math.min(3.5, ease + 0.15);
      intervalDays = intervalDays === 0 ? 4 : Math.max(4, Math.round(intervalDays * ease * 1.3));
      reps += 1;
      dueMs = intervalDays * 24 * 60 * 60 * 1000;
    }

    const due = new Date(Date.now() + dueMs).toISOString();
    const now = new Date().toISOString();

    if (existing?.id) {
      await supabaseAdmin
        .from('word_progress')
        .update({ ease, interval: intervalDays, reps, due, lastReviewed: now })
        .eq('id', existing.id);
    } else {
      await supabaseAdmin
        .from('word_progress')
        .insert({ userId, wordId, ease, interval: intervalDays, reps, due, lastReviewed: now });
    }

    return NextResponse.json({ ok: true, due });
  } catch (error) {
    console.error('Flashcards review error:', error);
    return NextResponse.json({ error: 'Failed to save review' }, { status: 500 });
  }
}