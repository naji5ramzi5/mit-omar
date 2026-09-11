import { supabaseAdmin } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Fetch lists with word count
    const { data: lists, error } = await supabaseAdmin
      .from('word_lists')
      .select('id, level, titleAr, titleDe, titleEn, order, words(count)')
      .order('order', { ascending: true });

    if (error) throw error;

    const visibleLists = (lists || []).map((l: any) => {
      const count = l.words?.[0]?.count ?? 0;
      return {
        id: l.id,
        level: l.level,
        titleAr: l.titleAr,
        titleDe: l.titleDe,
        titleEn: l.titleEn,
        order: l.order,
        wordCount: count,
        words: l.words || [{ count }],
      };
    });

    const response = NextResponse.json({ lists: visibleLists });
    response.headers.set('Cache-Control', 'public, s-maxage=30, stale-while-revalidate=60');
    return response;
  } catch (error) {
    console.error('Flashcards lists error:', error);
    return NextResponse.json({ error: 'Failed to fetch lists' }, { status: 500 });
  }
}