import { supabaseAdmin } from '@/lib/supabase';
import { verifyAdmin, decodeUserId } from '@/lib/admin-auth';
import { NextResponse } from 'next/server';

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

    const { data: subscribers, error } = await supabaseAdmin
      .from('subscribers')
      .select('*')
      .order('createdAt', { ascending: false });

    if (error) return NextResponse.json({ error: 'Failed to fetch subscribers' }, { status: 500 });

    return NextResponse.json({ subscribers: subscribers || [] });
  } catch (error) {
    console.error('Subscribers error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const userId = await verifyAdmin(req);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await req.json();
    if (!id) return NextResponse.json({ error: 'Subscriber id required' }, { status: 400 });

    const { error } = await supabaseAdmin
      .from('subscribers')
      .delete()
      .eq('id', id);

    if (error) return NextResponse.json({ error: 'Failed to delete subscriber' }, { status: 500 });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete subscriber error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
