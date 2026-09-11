import { supabaseAdmin, supabase } from '@/lib/supabase';
import { decodeUserId } from '@/lib/admin-auth';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const studentUserId = decodeUserId(req);
    const { studentName, phoneNumber, level, preferredDate } = await req.json();

    // Validate required fields
    if (!studentName || !phoneNumber || !level || !preferredDate) {
      return NextResponse.json({ error: 'جميع الحقول مطلوبة' }, { status: 400 });
    }

    // Validate phone number format
    if (!/^\+?[0-9\s-]{8,}$/.test(phoneNumber)) {
      return NextResponse.json({ error: 'رقم الهاتف غير صالح' }, { status: 400 });
    }

    const { data: booking, error } = await supabaseAdmin
      .from('online_lesson_bookings')
      .insert({
        studentName,
        phoneNumber,
        level,
        preferredDate,
        teacherName: 'الأستاذ Omar',
        status: 'pending',
        userId: studentUserId || null,
        createdAt: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Booking creation error:', error);
      return NextResponse.json({ error: 'فشل في حفظ طلب الحجز' }, { status: 500 });
    }

    // 1. Notify Admin in Dashboard
    try {
      await supabaseAdmin.from('notifications').insert({
        titleAr: `حجز درس أونلاين جديد: ${studentName}`,
        titleDe: `Neue Online-Buchung: ${studentName}`,
        titleEn: `New online lesson booking: ${studentName}`,
        messageAr: `المستوى: ${level} | التاريخ المفضل: ${preferredDate}\nالهاتف: ${phoneNumber}`,
        messageDe: `Niveau: ${level} | Datum: ${preferredDate}\nTel: ${phoneNumber}`,
        messageEn: `Level: ${level} | Date: ${preferredDate}\nPhone: ${phoneNumber}`,
        type: 'booking',
        targetType: 'admin',
        isRead: false,
        createdAt: new Date().toISOString(),
      });
    } catch (notifErr) {
      console.error('Failed to create admin booking notification:', notifErr);
    }

    // 2. Notify Student if logged in
    if (studentUserId) {
      try {
        await supabaseAdmin.from('notifications').insert({
          userId: studentUserId,
          titleAr: `تم استلام طلب حجز الدرس بنجاح`,
          titleDe: `Buchungsanfrage erfolgreich erhalten`,
          titleEn: `Booking request received`,
          messageAr: `مرحباً ${studentName}، تم استلام طلب حجز درس المستوى ${level} بتاريخ ${preferredDate}. سنتواصل معك لتأكيد الموعد.`,
          messageDe: `Hallo ${studentName}, Ihre Buchung für ${level} wurde empfangen.`,
          messageEn: `Hello ${studentName}, your booking for ${level} has been received.`,
          type: 'booking',
          targetType: 'user',
          isRead: false,
          createdAt: new Date().toISOString(),
        });
      } catch (studentNotifErr) {
        console.error('Failed to notify student:', studentNotifErr);
      }
    }

    return NextResponse.json({ success: true, status: 'pending', booking });
  } catch (error) {
    console.error('Online booking error:', error);
    return NextResponse.json({ error: 'فشل في إنشاء الحجز' }, { status: 500 });
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