import { supabaseAdmin } from '@/lib/supabase';
import { verifyAdmin } from '@/lib/admin-auth';
import { NextResponse } from 'next/server';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await verifyAdmin(req);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const body = await req.json();
    const { titleAr, titleDe, titleEn, descriptionAr, descriptionDe, descriptionEn, videoUrl, videoId, thumbnail, duration, status, displayOrder } = body;

    const updateData: Record<string, unknown> = {};
    if (titleAr !== undefined) updateData.titleAr = titleAr;
    if (titleDe !== undefined) updateData.titleDe = titleDe;
    if (titleEn !== undefined) updateData.titleEn = titleEn;
    if (descriptionAr !== undefined) updateData.descriptionAr = descriptionAr || null;
    if (descriptionDe !== undefined) updateData.descriptionDe = descriptionDe || null;
    if (descriptionEn !== undefined) updateData.descriptionEn = descriptionEn || null;
    if (videoUrl !== undefined) updateData.videoUrl = videoUrl;
    if (videoId !== undefined) updateData.videoId = videoId || null;
    if (thumbnail !== undefined) updateData.thumbnail = thumbnail || null;
    if (duration !== undefined) updateData.duration = duration;
    if (status !== undefined) updateData.status = status === 'published' ? 'published' : 'draft';
    if (displayOrder !== undefined) updateData.displayOrder = displayOrder;
    updateData.updatedAt = new Date().toISOString();

    const { data: reel, error } = await supabaseAdmin
      .from('reels')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ reel });
  } catch (error) {
    console.error('Admin update reel error:', error);
    return NextResponse.json({ error: 'Failed to update reel' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await verifyAdmin(req);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;

    const { error } = await supabaseAdmin.from('reels').delete().eq('id', id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Admin delete reel error:', error);
    return NextResponse.json({ error: 'Failed to delete reel' }, { status: 500 });
  }
}