import { supabaseAdmin } from '@/lib/supabase';
import { verifyAdmin } from '@/lib/admin-auth';
import { NextResponse } from 'next/server';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await verifyAdmin(req);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const body = await req.json();
    const { titleAr, titleDe, titleEn, contentAr, contentDe, contentEn, excerptAr, excerptDe, excerptEn, category, imageUrl, isPublished } = body;

    const updateData: Record<string, unknown> = {};
    if (titleAr !== undefined) updateData.titleAr = titleAr;
    if (titleDe !== undefined) updateData.titleDe = titleDe;
    if (titleEn !== undefined) updateData.titleEn = titleEn;
    if (contentAr !== undefined) updateData.contentAr = contentAr || null;
    if (contentDe !== undefined) updateData.contentDe = contentDe || null;
    if (contentEn !== undefined) updateData.contentEn = contentEn || null;
    if (excerptAr !== undefined) updateData.excerptAr = excerptAr || null;
    if (excerptDe !== undefined) updateData.excerptDe = excerptDe || null;
    if (excerptEn !== undefined) updateData.excerptEn = excerptEn || null;
    if (category !== undefined) updateData.category = category || null;
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl || null;
    if (isPublished !== undefined) updateData.isPublished = isPublished;
    updateData.updatedAt = new Date().toISOString();

    const { data: post, error } = await supabaseAdmin
      .from('posts')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ post });
  } catch (error) {
    console.error('Admin update post error:', error);
    return NextResponse.json({ error: 'Failed to update post' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await verifyAdmin(req);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const { error } = await supabaseAdmin.from('posts').delete().eq('id', id);
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Admin delete post error:', error);
    return NextResponse.json({ error: 'Failed to delete post' }, { status: 500 });
  }
}
