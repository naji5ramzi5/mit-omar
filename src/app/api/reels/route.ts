import { supabase } from '@/lib/supabase';
import { verifyAdmin } from '@/lib/admin-auth';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const { data: reels, error } = await supabase
      .from('reels')
      .select('*')
      .eq('status', 'published')
      .order('displayOrder', { ascending: true });

    if (error) throw error;
    return NextResponse.json({ reels });
  } catch {
    return NextResponse.json({ reels: [] });
  }
}

export async function POST(req: Request) {
  try {
    const adminId = await verifyAdmin(req);
    if (!adminId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { titleAr, titleDe, titleEn, descriptionAr, descriptionDe, descriptionEn, videoUrl, videoId, thumbnail, duration, status, displayOrder } = body;

    if (!videoUrl) {
      return NextResponse.json({ error: 'videoUrl is required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('reels')
      .insert({
        titleAr: titleAr || '',
        titleDe: titleDe || '',
        titleEn: titleEn || '',
        descriptionAr: descriptionAr || null,
        descriptionDe: descriptionDe || null,
        descriptionEn: descriptionEn || null,
        videoUrl,
        videoId: videoId || null,
        thumbnail: thumbnail || null,
        duration: duration || 0,
        status: status === 'published' ? 'published' : 'draft',
        displayOrder: Number(displayOrder) || 0,
      })
      .select()
      .single();

    if (error) {
      console.error('Reel create error:', error);
      return NextResponse.json({ error: 'Failed to create reel' }, { status: 500 });
    }

    return NextResponse.json({ reel: data });
  } catch (error) {
    console.error('Reel create error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const adminId = await verifyAdmin(req);
    if (!adminId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id, ...updates } = await req.json();
    if (!id) return NextResponse.json({ error: 'Reel ID is required' }, { status: 400 });

    const { data, error } = await supabase
      .from('reels')
      .update({ ...updates, updatedAt: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Reel update error:', error);
      return NextResponse.json({ error: 'Failed to update reel' }, { status: 500 });
    }

    return NextResponse.json({ reel: data });
  } catch (error) {
    console.error('Reel update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const adminId = await verifyAdmin(req);
    if (!adminId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Reel ID is required' }, { status: 400 });

    const { error } = await supabase.from('reels').delete().eq('id', id);

    if (error) {
      console.error('Reel delete error:', error);
      return NextResponse.json({ error: 'Failed to delete reel' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Reel delete error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}