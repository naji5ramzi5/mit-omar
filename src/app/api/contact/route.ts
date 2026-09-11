import { supabaseAdmin } from '@/lib/supabase';
import { NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(req: Request) {
  try {
    const { name, email, subject, message } = await req.json();
    if (!name || !email || !subject || !message) {
      return NextResponse.json({ error: 'جميع الحقول مطلوبة' }, { status: 400 });
    }

    const contactId = crypto.randomUUID();
    const now = new Date().toISOString();

    const contactRecord = {
      id: contactId,
      name: name.trim(),
      email: email.trim(),
      subject: subject.trim(),
      message: message.trim(),
      isRead: false,
      createdAt: now,
    };

    // 1. Permanently store in siteSettings as structured contact record
    try {
      await supabaseAdmin.from('siteSettings').upsert({
        key: `contact_msg_${contactId}`,
        value: JSON.stringify(contactRecord),
        createdAt: now,
        updatedAt: now,
      }, { onConflict: 'key' });
    } catch (saveErr) {
      console.error('Failed to save contact in siteSettings:', saveErr);
    }

    // 2. Try inserting into contacts table if exists
    try {
      await supabaseAdmin.from('contacts').insert({
        id: contactId,
        name: contactRecord.name,
        email: contactRecord.email,
        subject: contactRecord.subject,
        message: contactRecord.message,
        createdAt: now,
      });
    } catch {
      // ignore schema fallback
    }

    // 3. Create an immediate admin notification in dashboard
    try {
      await supabaseAdmin.from('notifications').insert({
        titleAr: `رسالة تواصل جديدة من: ${name}`,
        titleDe: `Neue Kontaktnachricht von: ${name}`,
        titleEn: `New contact message from: ${name}`,
        messageAr: `الموضوع: ${subject}\nالبريد: ${email}\nالرسالة: ${message}`,
        messageDe: `Betreff: ${subject}\nE-Mail: ${email}\nNachricht: ${message}`,
        messageEn: `Subject: ${subject}\nEmail: ${email}\nMessage: ${message}`,
        type: 'contact',
        targetType: 'admin',
        isRead: false,
        createdAt: now,
      });
    } catch (notifErr) {
      console.error('Failed to create contact notification:', notifErr);
    }

    return NextResponse.json({ success: true, message: 'تم إرسال رسالتك بنجاح' });
  } catch (error) {
    console.error('Contact submit error:', error);
    return NextResponse.json({ error: 'فشل في إرسال الرسالة، يرجى المحاولة لاحقاً' }, { status: 500 });
  }
}
