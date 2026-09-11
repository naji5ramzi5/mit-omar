import { supabaseAdmin } from '@/lib/supabase';
import { decodeUserId } from '@/lib/admin-auth';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const listId = searchParams.get('listId');
    if (!listId) return NextResponse.json({ error: 'listId is required' }, { status: 400 });

    const userId = decodeUserId(req);

    // Fetch all published words for this list, ordered
    // Note: in Supabase Postgres schema, example columns are exampleDe, example_ar, example_en, audio_url
    const { data: words, error } = await supabaseAdmin
      .from('words')
      .select('id, wordDe, wordAr, wordEn, exampleDe, example_ar, example_en, audio_url, published, order')
      .eq('listId', listId)
      .eq('published', true)          // Always filter to published only
      .order('order', { ascending: true });

    if (error) throw error;
    if (!words?.length) return NextResponse.json({ cards: [] });

    // Map to clean shape
    const allCards = words.map((w: any) => ({
      id: w.id,
      wordDe: w.wordDe,
      wordAr: w.wordAr,
      wordEn: w.wordEn,
      exampleDe: w.exampleDe || '',
      exampleAr: w.example_ar || w.exampleAr || '',
      exampleEn: w.example_en || w.exampleEn || '',
      audioUrl: w.audio_url || null,
    }));

    // For authenticated users: filter to spaced-repetition due cards
    if (userId) {
      const { data: progress } = await supabaseAdmin
        .from('word_progress')
        .select('wordId, due')
        .eq('userId', userId)
        .lte('due', new Date().toISOString());

      if (progress?.length) {
        const dueSet = new Set(progress.map((p) => p.wordId));
        const dueCards = allCards.filter((c) => dueSet.has(c.id));
        if (dueCards.length > 0) {
          return NextResponse.json({ cards: dueCards });
        }
      }
    }

    // Return up to 50 cards (was 15 — too restrictive)
    return NextResponse.json({ cards: allCards.slice(0, 50) });
  } catch (error) {
    console.error('Flashcards fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch flashcards' }, { status: 500 });
  }
}