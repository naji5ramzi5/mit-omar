import { supabaseAdmin } from '@/lib/supabase';
import { verifyAdmin } from '@/lib/admin-auth';
import { NextResponse } from 'next/server';
import webpush from 'web-push';

export async function POST(req: Request) {
  try {
    const userId = await verifyAdmin(req);
    if (!userId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { title, message, url } = await req.json();
    if (!title) return NextResponse.json({ error: 'title is required' }, { status: 400 });

    const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    const privateKey = process.env.VAPID_PRIVATE_KEY;
    if (!publicKey || !privateKey) {
      return NextResponse.json({ error: 'VAPID keys not configured' }, { status: 500 });
    }

    webpush.setVapidDetails('mailto:admin@deutsch-mit-omar.com', publicKey, privateKey);

    const { data: subscriptions } = await supabaseAdmin
      .from('push_subscriptions')
      .select('endpoint, keys');

    const payload = JSON.stringify({ title, message: message || '', url: url || '/' });
    let sent = 0;
    let failed = 0;

    interface PushSub {
      endpoint: string;
      keys: { p256dh: string; auth: string };
    }

    const results = await Promise.allSettled(
      (subscriptions || []).map((sub) =>
        webpush.sendNotification(
          sub as PushSub,
          payload,
        ),
      ),
    );

    results.forEach((r) => {
      if (r.status === 'fulfilled') sent += 1;
      else failed += 1;
    });

    return NextResponse.json({ success: true, sent, failed, total: (subscriptions || []).length });
  } catch (error) {
    console.error('Push send error:', error);
    return NextResponse.json({ error: 'Failed to send push' }, { status: 500 });
  }
}