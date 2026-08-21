import { supabaseAdmin } from '@/lib/supabase';
import { verifyAdmin } from '@/lib/admin-auth';
import { NextResponse } from 'next/server';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string; lessonId: string }> }) {
  try {
    const userId = await verifyAdmin(req);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { lessonId } = await params;
    const body = await req.json();
    const { titleAr, titleDe, titleEn, descriptionAr, descriptionDe, descriptionEn, videoUrl, duration, order, isFree } = body;

    const updateData: Record<string, unknown> = {};
    if (titleAr !== undefined) updateData.titleAr = titleAr;
    if (titleDe !== undefined) updateData.titleDe = titleDe;
    if (titleEn !== undefined) updateData.titleEn = titleEn;
    if (descriptionAr !== undefined) updateData.descriptionAr = descriptionAr || null;
    if (descriptionDe !== undefined) updateData.descriptionDe = descriptionDe || null;
    if (descriptionEn !== undefined) updateData.descriptionEn = descriptionEn || null;
    if (videoUrl !== undefined) updateData.videoUrl = videoUrl || null;
    if (duration !== undefined) updateData.duration = duration;
    if (order !== undefined) updateData.order = order;
    if (isFree !== undefined) updateData.isFree = isFree;
    updateData.updatedAt = new Date().toISOString();

    const { data: lesson, error } = await supabaseAdmin
      .from('lessons')
      .update(updateData)
      .eq('id', lessonId)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ lesson });
  } catch (error) {
    console.error('Admin update lesson error:', error);
    return NextResponse.json({ error: 'Failed to update lesson' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string; lessonId: string }> }) {
  try {
    const userId = await verifyAdmin(req);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { lessonId } = await params;
    const { error } = await supabaseAdmin.from('lessons').delete().eq('id', lessonId);
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Admin delete lesson error:', error);
    return NextResponse.json({ error: 'Failed to delete lesson' }, { status: 500 });
  }
}
