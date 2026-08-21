import { verifyAdmin } from '@/lib/admin-auth';
import { supabaseAdmin } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  try {
    const userId = await verifyAdmin(req);
    if (!userId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    const { data, error } = await supabaseAdmin
      .from('word_lists')
      .select('*')
      .order('order', { ascending: true });
    if (error) throw error;
    return NextResponse.json({ lists: data || [] });
  } catch (e) {
    console.error('admin flashcards lists GET', e);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const userId = await verifyAdmin(req);
    if (!userId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    const body = await req.json();
    const { level, titleAr, titleDe, titleEn, order } = body;
    if (!titleAr || !level) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    const { data, error } = await supabaseAdmin
      .from('word_lists')
      .insert({ level, titleAr, titleDe, titleEn, order: order ?? 0 })
      .select()
      .single();
    if (error) throw error;
    return NextResponse.json({ list: data });
  } catch (e) {
    console.error('admin flashcards lists POST', e);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
