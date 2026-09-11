import { supabaseAdmin } from '@/lib/supabase';
import { verifyAdmin } from '@/lib/admin-auth';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  try {
    const userId = await verifyAdmin(req);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const messages: any[] = [];

    // 1. Fetch from siteSettings keys starting with contact_msg_
    try {
      const { data: settingsData } = await supabaseAdmin
        .from('siteSettings')
        .select('key, value, createdAt')
        .ilike('key', 'contact_msg_%')
        .order('createdAt', { ascending: false });

      if (settingsData && settingsData.length > 0) {
        for (const item of settingsData) {
          try {
            const parsed = JSON.parse(item.value);
            messages.push({
              id: parsed.id || item.key.replace('contact_msg_', ''),
              name: parsed.name || 'زائر',
              email: parsed.email || '',
              subject: parsed.subject || 'رسالة تواصل',
              message: parsed.message || '',
              isRead: !!parsed.isRead,
              createdAt: parsed.createdAt || item.createdAt,
            });
          } catch {
            // ignore JSON parse error
          }
        }
      }
    } catch {
      // fallback
    }

    // 2. Also check if there are contact notifications in notifications table
    try {
      const { data: notifs } = await supabaseAdmin
        .from('notifications')
        .select('*')
        .eq('type', 'contact')
        .order('createdAt', { ascending: false });

      if (notifs && notifs.length > 0) {
        for (const n of notifs) {
          const id = n.id;
          if (!messages.some(m => m.id === id || (m.createdAt === n.createdAt && m.name === n.titleAr.replace('رسالة تواصل جديدة من: ', '')))) {
            const titleMatch = (n.titleAr || '').replace('رسالة تواصل جديدة: ', '').replace('رسالة تواصل جديدة من: ', '');
            messages.push({
              id: n.id,
              name: titleMatch || 'زائر',
              email: '',
              subject: n.titleAr || 'رسالة تواصل',
              message: n.messageAr || '',
              isRead: !!n.isRead,
              createdAt: n.createdAt,
              isFromNotification: true,
            });
          }
        }
      }
    } catch {
      // ignore
    }

    // Sort messages newest first
    messages.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json({ messages });
  } catch (error) {
    console.error('Admin contacts error:', error);
    return NextResponse.json({ error: 'Failed to fetch contact messages' }, { status: 500 });
  }
}
