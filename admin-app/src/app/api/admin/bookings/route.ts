import { verifyAdmin } from '@/lib/admin-auth';
import { supabaseAdmin } from '@/lib/supabase';
import { NextResponse } from 'next/server';

const VALID_STATUSES = ['pending', 'confirmed', 'rejected', 'completed', 'cancelled'];

const STATUS_AR: Record<string, string> = {
  pending: 'قيد الانتظار',
  confirmed: 'تم تأكيد الحجز',
  rejected: 'تم رفض الحجز',
  completed: 'مكتمل',
  cancelled: 'ملغي',
};

export async function GET(req: Request) {
  try {
    const userId = await verifyAdmin(req);
    if (!userId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { data: bookings, error } = await supabaseAdmin
      .from('online_lesson_bookings')
      .select('*')
      .order('createdAt', { ascending: false });

    if (error) throw error;
    return NextResponse.json({ bookings: bookings || [] });
  } catch (error) {
    console.error('Admin bookings GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch bookings' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const userId = await verifyAdmin(req);
    if (!userId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { id, status, notes } = await req.json();
    if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });
    if (status && !VALID_STATUSES.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const { data: existing } = await supabaseAdmin
      .from('online_lesson_bookings')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    const { data, error } = await supabaseAdmin
      .from('online_lesson_bookings')
      .update({
        ...(status ? { status } : {}),
        ...(notes !== undefined ? { notes } : {}),
      })
      .eq('id', id)
      .select('*');

    if (error) throw error;

    // Send student notification upon status change
    if (existing && status && existing.status !== status) {
      const studentName = existing.studentName || 'عزيزنا الطالب';
      const statusLabel = STATUS_AR[status] || status;

      try {
        if (existing.userId) {
          await supabaseAdmin.from('notifications').insert({
            userId: existing.userId,
            titleAr: `تحديث حالة حجز الدرس: ${statusLabel}`,
            titleDe: `Statusaktualisierung Buchung: ${status}`,
            titleEn: `Booking status update: ${status}`,
            messageAr: `مرحباً ${studentName}، تم تحديث حالة حجز درسك الأونلاين إلى: ${statusLabel}.`,
            messageDe: `Hallo ${studentName}, der Status Ihrer Buchung wurde aktualisiert: ${status}.`,
            messageEn: `Hello ${studentName}, your booking status has been updated: ${status}.`,
            type: 'booking',
            targetType: 'user',
            isRead: false,
            createdAt: new Date().toISOString(),
          });
        }
      } catch (notifErr) {
        console.error('Failed to notify student of booking update:', notifErr);
      }
    }

    return NextResponse.json({ bookings: data || [] });
  } catch (error) {
    console.error('Admin bookings PATCH error:', error);
    return NextResponse.json({ error: 'Failed to update booking' }, { status: 500 });
  }
}