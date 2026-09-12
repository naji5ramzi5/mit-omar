import { verifyAdmin } from '@/lib/admin-auth';
import { supabaseAdmin } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await verifyAdmin(req);
    if (!userId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    const { id } = await params;
    const body = await req.json();

    const updatePayload: Record<string, any> = {};
    if (body.listId !== undefined) updatePayload.listId = body.listId;
    if (body.lessonId !== undefined) updatePayload.lessonId = body.lessonId;
    if (body.wordDe !== undefined) updatePayload.wordDe = body.wordDe;
    if (body.wordAr !== undefined) updatePayload.wordAr = body.wordAr;
    if (body.wordEn !== undefined) updatePayload.wordEn = body.wordEn;
    if (body.exampleDe !== undefined) updatePayload.exampleDe = body.exampleDe;
    if (body.exampleAr !== undefined || body.example_ar !== undefined) {
      updatePayload.example_ar = body.exampleAr ?? body.example_ar ?? null;
    }
    if (body.exampleEn !== undefined || body.example_en !== undefined) {
      updatePayload.example_en = body.exampleEn ?? body.example_en ?? null;
    }
    if (body.audioUrl !== undefined || body.audio_url !== undefined) {
      updatePayload.audio_url = body.audioUrl ?? body.audio_url ?? null;
    }
    if (body.imageUrl !== undefined || body.image_url !== undefined) {
      updatePayload.imageUrl = body.imageUrl ?? body.image_url ?? null;
    }
    if (body.order !== undefined) updatePayload.order = body.order;
    if (body.published !== undefined) updatePayload.published = body.published;

    let resData: any = null;
    let resError: any = null;

    // First attempt with full payload
    const attempt1 = await supabaseAdmin
      .from('words')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();

    if (attempt1.error && attempt1.error.code === 'PGRST204') {
      // Schema cache fallback: if imageUrl or lessonId don't exist in DB yet, omit them and retry
      const safePayload = { ...updatePayload };
      delete safePayload.imageUrl;
      delete safePayload.lessonId;
      const attempt2 = await supabaseAdmin
        .from('words')
        .update(safePayload)
        .eq('id', id)
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
    };

    return NextResponse.json({ word });
  } catch (e: any) {
    console.error('admin flashcards words PUT', e);
    return NextResponse.json({ error: e?.message || 'Failed' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await verifyAdmin(req);
    if (!userId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    const { id } = await params;
    const { error } = await supabaseAdmin.from('words').delete().eq('id', id);
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error('admin flashcards words DELETE', e);
    return NextResponse.json({ error: e?.message || 'Failed' }, { status: 500 });
  }
}
