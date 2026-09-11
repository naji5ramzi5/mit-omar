import { verifyAdmin } from '@/lib/admin-auth';
import { getR2Config } from '@/lib/r2';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { NextResponse } from 'next/server';

const ALLOWED: Record<string, { ext: string; type: 'image' | 'video' | 'audio' }> = {
  // Images
  'image/jpeg': { ext: 'jpg', type: 'image' },
  'image/png': { ext: 'png', type: 'image' },
  'image/webp': { ext: 'webp', type: 'image' },
  'image/gif': { ext: 'gif', type: 'image' },
  'image/svg+xml': { ext: 'svg', type: 'image' },
  // Videos
  'video/mp4': { ext: 'mp4', type: 'video' },
  'video/webm': { ext: 'webm', type: 'video' },
  'video/ogg': { ext: 'ogv', type: 'video' },
  'video/quicktime': { ext: 'mov', type: 'video' },
  // Audio
  'audio/mpeg': { ext: 'mp3', type: 'audio' },
  'audio/mp3': { ext: 'mp3', type: 'audio' },
  'audio/wav': { ext: 'wav', type: 'audio' },
  'audio/x-wav': { ext: 'wav', type: 'audio' },
  'audio/ogg': { ext: 'ogg', type: 'audio' },
  'audio/webm': { ext: 'webm', type: 'audio' },
  'audio/m4a': { ext: 'm4a', type: 'audio' },
  'audio/x-m4a': { ext: 'm4a', type: 'audio' },
  'audio/mp4': { ext: 'm4a', type: 'audio' },
  'audio/aac': { ext: 'aac', type: 'audio' },
};

export async function POST(req: Request) {
  try {
    const userId = await verifyAdmin(req);
    if (!userId) return NextResponse.json({ error: 'غير مصرح بالدخول' }, { status: 403 });

    const form = await req.formData();
    const file = form.get('file');
    const requestedType = form.get('type') as string | null; // 'video' | 'image' | 'audio'
    
    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'لم يتم اختيار أي ملف' }, { status: 400 });
    }

    let fileMeta = ALLOWED[file.type];
    if (!fileMeta) {
      const ext = file.name.split('.').pop()?.toLowerCase() || '';
      if (['mp4', 'webm', 'mov', 'm4v', 'ogv', 'mkv', 'avi', 'ts'].includes(ext)) {
        fileMeta = { ext: ext === 'mkv' || ext === 'avi' || ext === 'm4v' ? 'mp4' : ext, type: 'video' };
      } else if (['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg'].includes(ext)) {
        fileMeta = { ext: ext === 'jpeg' ? 'jpg' : ext, type: 'image' };
      } else if (['mp3', 'wav', 'ogg', 'm4a', 'aac'].includes(ext)) {
        fileMeta = { ext, type: 'audio' };
      }
    }

    if (!fileMeta) {
      return NextResponse.json({ 
        error: `نوع الملف غير مدعوم (${file.type || file.name}). يرجى اختيار ملف صالح.` 
      }, { status: 400 });
    }

    if (requestedType && fileMeta.type !== requestedType) {
      return NextResponse.json({ 
        error: `الملف المحدد ليس من نوع ${requestedType === 'video' ? 'فيديو' : requestedType === 'audio' ? 'صوت' : 'صورة'}` 
      }, { status: 400 });
    }

    const safeName = file.name
      .replace(/[^\w.\-]+/g, '-')
      .replace(/\.[^.]+$/, '')
      .slice(0, 80) || 'file';

    const prefix = fileMeta.type === 'video' ? 'videos' : fileMeta.type === 'audio' ? 'audio' : 'images';
    const key = `${prefix}/${Date.now()}-${safeName}.${fileMeta.ext}`;

    const cfg = getR2Config();
    if (!cfg) {
      return NextResponse.json({ error: 'خدمة التخزين السحابي R2 غير مهيأة' }, { status: 500 });
    }

    const buf = Buffer.from(await file.arrayBuffer());
    await cfg.client.send(new PutObjectCommand({
      Bucket: cfg.bucket,
      Key: key,
      Body: buf,
      ContentType: file.type,
    }));

    return NextResponse.json({ 
      url: `r2:${key}`, 
      key, 
      filename: file.name,
      size: file.size,
      type: fileMeta.type,
      success: true 
    });
  } catch (e: any) {
    console.error('R2 server upload error:', e);
    return NextResponse.json({ error: e.message || 'فشل رفع الملف إلى السحابة' }, { status: 500 });
  }
}

export const runtime = 'nodejs';
export const maxDuration = 300;