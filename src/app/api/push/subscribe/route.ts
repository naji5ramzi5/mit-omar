import { supabaseAdmin } from '@/lib/supabase';
import { decodeUserId } from '@/lib/admin-auth';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { subscription } = await req.json();
    if (!subscription?.endpoint) {
      return NextResponse.json({ error: 'Invalid subscription' }, { status: 400 });
    }

    const userId = decodeUserId(req) || null;

    const { data: existing } = await supabaseAdmin
      .from('push_subscriptions')
      .select('id')
      .eq('endpoint', subscription.endpoint)
      .maybeSingle();

    if (existing) {
      await supabaseAdmin.from('push_subscriptions').update({ userId }).eq('id', existing.id);
    } else {
      await supabaseAdmin.from('push_subscriptions').insert({
        userId,
        endpoint: subscription.endpoint,
        keys: subscription.keys || {},
      });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Push subscribe error:', error);
    return NextResponse.json({ error: 'Failed to save subscription' }, { status: 500 });
  }
}