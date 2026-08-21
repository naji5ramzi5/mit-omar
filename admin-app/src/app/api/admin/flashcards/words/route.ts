import { verifyAdmin } from '@/lib/admin-auth';
import { supabaseAdmin } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  try {
    const userId = await verifyAdmin(req);
    if (!userId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    const { searchParams } = new URL(req.url);
    const listId = searchParams.get('listId');
    let query = supabaseAdmin.from('words').select('*').order('order', { ascending: true });
    if (listId) query = query.eq('listId', listId);
    const { data, error } = await query;
    if (error) throw error;
    return NextResponse.json({ words: data || [] });
  } catch (e) {
    console.error('admin flashcards words GET', e);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const userId = await verifyAdmin(req);
    if (!userId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    const body = await req.json();
    const { listId, wordDe, wordAr, wordEn, exampleDe, exampleAr, exampleEn, audioUrl, order, published } = body;
    if (!listId || !wordDe) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    const { data, error } = await supabaseAdmin
      .from('words')
      .insert({
        listId,
        wordDe,
        wordAr,
        wordEn,
        exampleDe,
        exampleAr,
        exampleEn,
        audioUrl: audioUrl || null,
        order: order ?? 0,
        published: published !== false,
      })
      .select()
      .single();
    if (error) throw error;
    return NextResponse.json({ word: data });
  } catch (e) {
    console.error('admin flashcards words POST', e);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
