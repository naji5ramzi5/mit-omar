import { supabaseAdmin } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const { data: lists, error } = await supabaseAdmin
      .from('word_lists')
      .select('id, level, titleAr, titleDe, titleEn, "order", words(count)')
      .order('order', { ascending: true });

    if (error) throw error;
    return NextResponse.json({ lists });
  } catch (error) {
    console.error('Flashcards lists error:', error);
    return NextResponse.json({ error: 'Failed to fetch lists' }, { status: 500 });
  }
}