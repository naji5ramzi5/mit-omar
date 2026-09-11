import { verifyAdmin } from '@/lib/admin-auth';
import { getR2PresignedPut } from '@/lib/r2';
import { NextResponse } from 'next/server';

const ALLOWED_EXT: Record<string, string> = {
  'video/mp4': 'mp4',
  'video/webm': 'webm',
  'video/ogg': 'ogv',
  'video/quicktime': 'mov',
  'audio/mpeg': 'mp3',
  'audio/mp3': 'mp3',
  'audio/wav': 'wav',
  'audio/x-wav': 'wav',
  'audio/ogg': 'ogg',
  'audio/m4a': 'm4a',
  'audio/x-m4a': 'm4a',
  'audio/aac': 'aac',
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

export async function POST(req: Request) {
  try {
    const userId = await verifyAdmin(req);
    if (!userId) return NextResponse.json({ error: 'غير مصرح بالدخول' }, { status: 403 });

    const { filename, contentType } = await req.json();
    const ext = ALLOWED_EXT[contentType];
    if (!ext || !filename) {
      return NextResponse.json({ error: 'نوع الملف غير مدعوم أو الاسم غير محدد' }, { status: 400 });
    }

    const safeName = filename
      .replace(/[^\w.\-]+/g, '-')
      .replace(/\.[^.]+$/, '')
      .slice(0, 80) || 'file';

    const prefix = contentType.startsWith('video/') ? 'videos' : contentType.startsWith('audio/') ? 'audio' : 'images';
    const key = `${prefix}/${Date.now()}-${safeName}.${ext}`;
    const uploadUrl = await getR2PresignedPut(key, contentType);
    if (!uploadUrl) {
      return NextResponse.json({ error: 'خدمة التخزين السحابي R2 غير مهيأة' }, { status: 500 });
    }

    return NextResponse.json({ uploadUrl, key: `r2:${key}`, pureKey: key });
  } catch (error) {
    console.error('R2 upload URL error:', error);
    return NextResponse.json({ error: 'فشل إنشاء رابط الرفع المباشر' }, { status: 500 });
  }
}