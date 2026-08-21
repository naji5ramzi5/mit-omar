import { verifyAdmin } from '@/lib/admin-auth';
import { getR2PresignedPut } from '@/lib/r2';
import { NextResponse } from 'next/server';

const ALLOWED = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/x-wav', 'audio/ogg', 'audio/webm', 'audio/m4a', 'audio/mp4'];

export async function POST(req: Request) {
  try {
    const userId = await verifyAdmin(req);
    if (!userId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const form = await req.formData();
    const file = form.get('file');
    if (!(file instanceof File)) return NextResponse.json({ error: 'No file' }, { status: 400 });
    if (!ALLOWED.includes(file.type)) return NextResponse.json({ error: 'نوع ملف غير مدعوم' }, { status: 400 });

    const ext = file.name.split('.').pop()?.toLowerCase() || 'mp3';
    const safeName = (file.name.replace(/[^\w.\-]+/g, '-').replace(/\.[^.]+$/, '').slice(0, 60)) || 'audio';
    const key = `audio/${Date.now()}-${safeName}.${ext}`;

    const uploadUrl = await getR2PresignedPut(key, file.type);
    if (!uploadUrl) return NextResponse.json({ error: 'R2 غير مهيأ' }, { status: 500 });

    const buf = Buffer.from(await file.arrayBuffer());
    const put = await fetch(uploadUrl, {
      method: 'PUT',
      headers: { 'Content-Type': file.type },
      body: buf,
    });
    if (!put.ok) return NextResponse.json({ error: 'فشل الرفع إلى R2' }, { status: 500 });

    return NextResponse.json({ url: `r2:${key}` });
  } catch (e) {
    console.error('flashcards audio upload', e);
    return NextResponse.json({ error: 'فشل رفع الصوت' }, { status: 500 });
  }
}
