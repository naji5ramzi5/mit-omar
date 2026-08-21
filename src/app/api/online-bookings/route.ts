import { supabaseAdmin, supabase } from '@/lib/supabase';
import { decodeUserId } from '@/lib/admin-auth';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { studentName, phoneNumber, level, preferredDate } = await req.json();

    // Validate required fields
    if (!studentName || !phoneNumber || !level || !preferredDate) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }

    // Validate phone number format (basic check)
    if (!/^\+?[0-9\s-]{8,}$/.test(phoneNumber)) {
      return NextResponse.json({ error: 'Invalid phone number format' }, { status: 400 });
    }

    const { error } = await supabase
      .from('online_lesson_bookings')
      .insert({ studentName, phoneNumber, level, preferredDate, teacherName: 'الأستاذ Omar', status: 'pending' });

    if (error) {
      console.error('Booking creation error:', error);
      return NextResponse.json({ error: 'Failed to create booking' }, { status: 500 });
    }

    return NextResponse.json({ success: true, status: 'pending' });
  } catch (error) {
    console.error('Online booking error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
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

    const { data: bookings, error } = await supabaseAdmin
      .from('online_lesson_bookings')
      .select('*')
      .order('createdAt', { ascending: false });

    if (error) return NextResponse.json({ error: 'Failed to fetch bookings' }, { status: 500 });

    return NextResponse.json({ bookings });
  } catch (error) {
    console.error('Online bookings fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
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

    const { id, status, notes } = await req.json();
    
    if (!id || !status) {
      return NextResponse.json({ error: 'Booking ID and status are required' }, { status: 400 });
    }

    // Validate status value
    const validStatuses = ['pending', 'confirmed', 'rejected', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status value' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('online_lesson_bookings')
      .update({ status, notes }) 
      .eq('id', id);

    if (error) return NextResponse.json({ error: 'Failed to update booking' }, { status: 500 });

    return NextResponse.json({ success: true, status });
  } catch (error) {
    console.error('Booking update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}