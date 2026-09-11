import { supabaseAdmin } from '@/lib/supabase';
import { verifyAdmin } from '@/lib/admin-auth';
import { NextResponse } from 'next/server';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await verifyAdmin(req);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const body = await req.json();
    const isRead = body.isRead !== undefined ? !!body.isRead : true;

    // Try updating in siteSettings
    const { data: existing } = await supabaseAdmin
      .from('siteSettings')
      .select('value')
      .eq('key', `contact_msg_${id}`)
      .maybeSingle();

    if (existing?.value) {
      const parsed = JSON.parse(existing.value);
      parsed.isRead = isRead;
      await supabaseAdmin.from('siteSettings').upsert({
        key: `contact_msg_${id}`,
        value: JSON.stringify(parsed),
        updatedAt: new Date().toISOString(),
      }, { onConflict: 'key' });
    }

    // Also try updating notification if exists
    try {
      await supabaseAdmin
        .from('notifications')
        .update({ isRead })
        .eq('id', id);
    } catch {
      // ignore
    }

    return NextResponse.json({ success: true, isRead });
  } catch (error) {
    console.error('Update contact message error:', error);
    return NextResponse.json({ error: 'Failed to update message' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await verifyAdmin(req);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;

    // Delete from siteSettings
    await supabaseAdmin
      .from('siteSettings')
      .delete()
      .eq('key', `contact_msg_${id}`);

    // Also delete from notifications if matches
    try {
      await supabaseAdmin
        .from('notifications')
        .delete()
        .eq('id', id);
    } catch {
      // ignore
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete contact message error:', error);
    return NextResponse.json({ error: 'Failed to delete message' }, { status: 500 });
  }
}
