import { supabaseAdmin } from '@/lib/supabase';
import { verifyAdmin } from '@/lib/admin-auth';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  try {
    const userId = await verifyAdmin(req);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: reels, error } = await supabaseAdmin
      .from('reels')
      .select('*')
      .order('displayOrder', { ascending: true });

    if (error) throw error;
    return NextResponse.json({ reels });
  } catch (error) {
    console.error('Admin reels error:', error);
    return NextResponse.json({ error: 'Failed to fetch reels' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const userId = await verifyAdmin(req);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { titleAr, titleDe, titleEn, descriptionAr, descriptionDe, descriptionEn, videoUrl, videoId, thumbnail, duration, status, displayOrder } = body;

    if (!titleAr || !videoUrl) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { data: reel, error } = await supabaseAdmin
      .from('reels')
      .insert({
        titleAr, titleDe: titleDe || '', titleEn: titleEn || '',
        descriptionAr: descriptionAr || null,
        descriptionDe: descriptionDe || null,
        descriptionEn: descriptionEn || null,
        videoUrl,
        videoId: videoId || null,
        thumbnail: thumbnail || null,
        duration: duration || 0,
        status: status === 'published' ? 'published' : 'draft',
        displayOrder: displayOrder ?? 0,
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ reel }, { status: 201 });
  } catch (error) {
    console.error('Admin create reel error:', error);
    return NextResponse.json({ error: 'Failed to create reel' }, { status: 500 });
  }
}