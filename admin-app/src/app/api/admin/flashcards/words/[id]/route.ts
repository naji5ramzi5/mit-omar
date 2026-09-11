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
    if (body.order !== undefined) updatePayload.order = body.order;
    if (body.published !== undefined) updatePayload.published = body.published;

    const { data, error } = await supabaseAdmin
      .from('words')
      .update(updatePayload)
      .eq('id', id)
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
    console.error('admin flashcards words PUT', e);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
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
  } catch (e) {
    console.error('admin flashcards words DELETE', e);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
