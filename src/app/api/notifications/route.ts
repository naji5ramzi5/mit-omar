import { supabase } from '@/lib/supabase';
import { decodeUserId } from '@/lib/admin-auth';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  try {
    const userId = decodeUserId(req);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const countOnly = searchParams.get('countOnly') === 'true';

    if (countOnly) {
      const { count } = await supabase
        .from('notifications')
        .select('id', { count: 'exact', head: true })
        .or(`userId.eq.${userId},userId.is.null`)
        .eq('isRead', false);

      return NextResponse.json({ count: count || 0 });
    }

    const { data: notifications, error } = await supabase
      .from('notifications')
      .select('*')
      .or(`userId.eq.${userId},userId.is.null`)
      .order('createdAt', { ascending: false });

    if (error) throw error;
    return NextResponse.json({ notifications });
  } catch (error) {
    console.error('Notifications error:', error);
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const userId = decodeUserId(req);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { notificationIds } = await req.json();
    if (!Array.isArray(notificationIds) || notificationIds.length === 0) {
      return NextResponse.json({ error: 'notificationIds required' }, { status: 400 });
    }

    const { error } = await supabase
      .from('notifications')
      .update({ isRead: true })
      .or(`userId.eq.${userId},userId.is.null`)
      .in('id', notificationIds);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Mark read error:', error);
    return NextResponse.json({ error: 'Failed to mark as read' }, { status: 500 });
  }
}
