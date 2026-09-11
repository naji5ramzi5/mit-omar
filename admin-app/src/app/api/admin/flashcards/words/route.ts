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
    
    // Map to frontend-friendly fields
    const words = (data || []).map((w: any) => ({
      ...w,
      audioUrl: w.audio_url || null,
      exampleAr: w.example_ar || '',
      exampleEn: w.example_en || '',
    }));

    return NextResponse.json({ words });
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

    const insertPayload: Record<string, any> = {
      listId,
      wordDe,
      wordAr: wordAr || '',
      wordEn: wordEn || '',
      exampleDe: exampleDe || '',
      example_ar: exampleAr || body.example_ar || null,
      example_en: exampleEn || body.example_en || null,
      audio_url: audioUrl || body.audio_url || null,
      order: order ?? 0,
      published: published !== false,
    };

    const { data, error } = await supabaseAdmin
      .from('words')
      .insert(insertPayload)
      .select()
      .single();
    if (error) throw error;
    
    const word = {
      ...data,
      audioUrl: data.audio_url || null,
      exampleAr: data.example_ar || '',
      exampleEn: data.example_en || '',
    };

    return NextResponse.json({ word });
  } catch (e) {
    console.error('admin flashcards words POST', e);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
