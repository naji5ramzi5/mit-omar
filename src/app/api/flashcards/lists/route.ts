import { supabaseAdmin } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Fetch lists with published word count
    const { data: lists, error } = await supabaseAdmin
      .from('word_lists')
      .select('id, level, titleAr, titleDe, titleEn, order, words(count)')
      .order('order', { ascending: true });

    if (error) throw error;

    // Only return lists that have at least one word (avoid empty lists appearing)
    const visibleLists = (lists || []).filter((l: any) => {
      const count = l.words?.[0]?.count ?? 0;
      return count > 0;
    }).map((l: any) => ({
      id: l.id,
      level: l.level,
      titleAr: l.titleAr,
      titleDe: l.titleDe,
      titleEn: l.titleEn,
      order: l.order,
      wordCount: l.words?.[0]?.count ?? 0,
    }));

    const response = NextResponse.json({ lists: visibleLists });
    response.headers.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');
    return response;
  } catch (error) {
    console.error('Flashcards lists error:', error);
    return NextResponse.json({ error: 'Failed to fetch lists' }, { status: 500 });
  }
}