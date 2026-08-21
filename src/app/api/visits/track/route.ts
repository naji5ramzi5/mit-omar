import { supabaseAdmin } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { day } = await req.json();
    if (!day || typeof day !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(day)) {
      return NextResponse.json({ error: 'Invalid day' }, { status: 400 });
    }

    const { data: existing } = await supabaseAdmin
      .from('visits')
      .select('id, count')
      .eq('day', day)
      .maybeSingle();

    if (existing) {
      await supabaseAdmin
        .from('visits')
        .update({ count: (existing.count || 0) + 1, updated_at: new Date().toISOString() })
        .eq('id', existing.id);
    } else {
      await supabaseAdmin.from('visits').insert({ day, count: 1 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Visit track error:', error);
    return NextResponse.json({ error: 'Failed to track visit' }, { status: 500 });
  }
}