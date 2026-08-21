import { supabaseAdmin } from '@/lib/supabase';
import { decodeUserId } from '@/lib/admin-auth';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const listId = searchParams.get('listId');
    if (!listId) return NextResponse.json({ error: 'listId is required' }, { status: 400 });

    const userId = decodeUserId(req);

    const { data: words, error } = await supabaseAdmin
      .from('words')
      .select('id, wordDe, wordAr, wordEn, exampleDe, exampleAr, exampleEn, audioUrl:audio_url, published, "order"')
      .eq('listId', listId)
      .order('order', { ascending: true });

    if (error) throw error;
    if (!words?.length) return NextResponse.json({ cards: [] });

    let dueIds: string[] | null = null;
    if (userId) {
      const { data: progress } = await supabaseAdmin
        .from('word_progress')
        .select('wordId')
        .eq('userId', userId)
        .lte('due', new Date().toISOString());

      if (progress?.length) dueIds = progress.map((p) => p.wordId);
    }

    let cards = words.map((w: any) => ({
      id: w.id,
      wordDe: w.wordDe,
      wordAr: w.wordAr,
      wordEn: w.wordEn,
      exampleDe: w.exampleDe,
      exampleAr: w.exampleAr,
      exampleEn: w.exampleEn,
      audioUrl: w.audioUrl || null,
    }));

    if (dueIds) {
      const dueSet = new Set(dueIds);
      const dueCards = cards.filter((c: any) => dueSet.has(c.id));
      if (dueCards.length > 0) cards = dueCards;
    } else {
      cards = cards.filter((c: any) => c.published !== false);
    }

    return NextResponse.json({ cards: cards.slice(0, 15) });
  } catch (error) {
    console.error('Flashcards fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch flashcards' }, { status: 500 });
  }
}