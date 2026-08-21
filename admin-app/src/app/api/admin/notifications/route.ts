import { supabaseAdmin } from '@/lib/supabase';
import { decodeUserId } from '@/lib/admin-auth';
import { NextResponse } from 'next/server';

interface CreateNotificationData {
  userId?: string;
  targetType: 'single' | 'all';
  titleAr: string;
  titleDe: string;
  titleEn: string;
  messageAr?: string;
  messageDe?: string;
  messageEn?: string;
  type?: string;
}

export async function GET(req: Request) {
  try {
    const userId = decodeUserId(req);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: user } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', userId)
      .single();

    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { data: notifications, error } = await supabaseAdmin
      .from('notifications')
      .select('*')
      .order('createdAt', { ascending: false });

    if (error) throw error;
    return NextResponse.json({ notifications });
  } catch (error) {
    console.error('Admin fetch notifications error:', error);
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const userId = decodeUserId(req);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: user } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', userId)
      .single();

    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await req.json();
    if (!id) return NextResponse.json({ error: 'Notification ID is required' }, { status: 400 });

    const { error } = await supabaseAdmin.from('notifications').delete().eq('id', id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Admin delete notification error:', error);
    return NextResponse.json({ error: 'Failed to delete notification' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const userId = decodeUserId(req);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: user } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', userId)
      .single();

    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const data: CreateNotificationData = await req.json();

    // Validate required fields
    if (!data.titleAr || !data.titleDe || !data.titleEn) {
      return NextResponse.json({ error: 'All title fields are required' }, { status: 400 });
    }

    // Build notification data — the notifications table has no targetType column;
    // "all" targets use userId = null and every user sees null-user notifications.
    const notificationData = {
      userId: data.targetType === 'all' ? null : data.userId,
      titleAr: data.titleAr,
      titleDe: data.titleDe,
      titleEn: data.titleEn,
      messageAr: data.messageAr || null,
      messageDe: data.messageDe || null,
      messageEn: data.messageEn || null,
      type: data.type || 'info',
      isRead: false,
      createdAt: new Date().toISOString(),
    };

    // If targeting single user, set userId; if all, userId will be null and RLS will handle it
    if (data.targetType === 'single' && !data.userId) {
      return NextResponse.json({ error: 'User ID required for single target' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('notifications')
      .insert([notificationData]);

    if (error) {
      console.error('Create notification error:', error);
      return NextResponse.json({ error: 'Failed to create notification' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Create notification error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}