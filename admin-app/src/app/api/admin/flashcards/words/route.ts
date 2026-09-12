import { verifyAdmin } from '@/lib/admin-auth';
import { supabaseAdmin } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  try {
    const userId = await verifyAdmin(req);
    if (!userId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    const { searchParams } = new URL(req.url);
    const listId = searchParams.get('listId');
    const lessonId = searchParams.get('lessonId');

    let query = supabaseAdmin.from('words').select('*').order('order', { ascending: true });
    if (lessonId) {
      query = query.eq('lessonId', lessonId);
    } else if (listId) {
      query = query.eq('listId', listId);
    }

    const { data, error } = await query;
    if (error) {
      // If error is PGRST204 on lessonId (not yet migrated), fallback to empty or listId
      if (lessonId && error.code === 'PGRST204') {
        return NextResponse.json({ words: [] });
      }
      throw error;
    }
    
    // Map to frontend-friendly fields
    const words = (data || []).map((w: any) => ({
      ...w,
      audioUrl: w.audio_url || null,
      imageUrl: w.imageUrl || null,
      exampleAr: w.example_ar || '',
      exampleEn: w.example_en || '',
      lessonId: w.lessonId || null,
      listId: w.listId || null,
    }));

    return NextResponse.json({ words });
  } catch (e: any) {
    console.error('admin flashcards words GET', e);
    return NextResponse.json({ error: e?.message || 'Failed' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const userId = await verifyAdmin(req);
    if (!userId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    const body = await req.json();
    let { listId, lessonId, wordDe, wordAr, wordEn, exampleDe, exampleAr, exampleEn, audioUrl, imageUrl, order, published } = body;
    if (!wordDe) return NextResponse.json({ error: 'Missing wordDe' }, { status: 400 });

    // If listId is missing (e.g. creating from inside a lesson before migration), find or create a default listId
    if (!listId) {
      const { data: defaultLists } = await supabaseAdmin.from('word_lists').select('id').limit(1);
      if (defaultLists && defaultLists.length > 0) {
        listId = defaultLists[0].id;
      }
    }

    const insertPayload: Record<string, any> = {
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

    if (listId) insertPayload.listId = listId;
    if (lessonId) insertPayload.lessonId = lessonId;
    if (imageUrl) insertPayload.imageUrl = imageUrl;

    let resData: any = null;
    let resError: any = null;

    const attempt1 = await supabaseAdmin
      .from('words')
      .insert(insertPayload)
      .select()
      .single();

    if (attempt1.error && attempt1.error.code === 'PGRST204') {
      // Schema cache fallback: if imageUrl or lessonId don't exist yet, retry without them
      const safePayload = { ...insertPayload };
      delete safePayload.imageUrl;
      delete safePayload.lessonId;
      const attempt2 = await supabaseAdmin
        .from('words')
        .insert(safePayload)
        .select()
        .single();
      resData = attempt2.data;
      resError = attempt2.error;
    } else {
      resData = attempt1.data;
      resError = attempt1.error;
    }

    if (resError) throw resError;
    
    const word = {
      ...resData,
      audioUrl: resData.audio_url || null,
      imageUrl: resData.imageUrl || null,
      exampleAr: resData.example_ar || '',
      exampleEn: resData.example_en || '',
      lessonId: resData.lessonId || null,
      listId: resData.listId || null,
    };

    return NextResponse.json({ word });
  } catch (e: any) {
    console.error('admin flashcards words POST', e);
    return NextResponse.json({ error: e?.message || 'Failed' }, { status: 500 });
  }
}
