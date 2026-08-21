import { verifyAdmin } from '@/lib/admin-auth';
import { getR2PresignedPut } from '@/lib/r2';
import { NextResponse } from 'next/server';

const ALLOWED = {
  'video/mp4': 'mp4',
  'video/webm': 'webm',
  'video/ogg': 'ogv',
  'video/quicktime': 'mov',
} as const;

export async function POST(req: Request) {
  try {
    const userId = await verifyAdmin(req);
    if (!userId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { filename, contentType } = await req.json();
    const ext = ALLOWED[contentType as keyof typeof ALLOWED];
    if (!ext || !filename) {
      return NextResponse.json({ error: 'Unsupported file type' }, { status: 400 });
    }

    const safeName = filename
      .replace(/[^\w.\-]+/g, '-')
      .replace(/\.[^.]+$/, '')
      .slice(0, 80) || 'video';

    const key = `videos/${Date.now()}-${safeName}.${ext}`;
    const uploadUrl = await getR2PresignedPut(key, contentType);
    if (!uploadUrl) {
      return NextResponse.json({ error: 'R2 not configured' }, { status: 500 });
    }

    return NextResponse.json({ uploadUrl, key: `r2:${key}` });
  } catch (error) {
    console.error('R2 upload URL error:', error);
    return NextResponse.json({ error: 'Failed to create upload URL' }, { status: 500 });
  }
}