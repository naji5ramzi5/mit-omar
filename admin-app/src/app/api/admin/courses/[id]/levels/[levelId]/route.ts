import { supabaseAdmin } from '@/lib/supabase';
import { verifyAdmin } from '@/lib/admin-auth';
import { NextResponse } from 'next/server';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string; levelId: string }> }
) {
  try {
    const userId = await verifyAdmin(req);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id: courseId, levelId } = await params;

    const { data: level, error } = await supabaseAdmin
      .from('course_levels')
      .select('*')
      .eq('id', levelId)
      .eq('courseId', courseId)
      .single();

    if (error || !level) {
      return NextResponse.json({ error: 'Level not found' }, { status: 404 });
    }

    const { count } = await supabaseAdmin
      .from('lessons')
      .select('*', { count: 'exact', head: true })
      .eq('levelId', levelId);

    return NextResponse.json({ level: { ...level, _count: { lessons: count || 0 } } });
  } catch (error) {
    console.error('Admin get single level error:', error);
    return NextResponse.json({ error: 'Failed to fetch level' }, { status: 500 });
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string; levelId: string }> }
) {
  try {
    const userId = await verifyAdmin(req);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id: courseId, levelId } = await params;
    const body = await req.json();

    const {
      name,
      titleAr,
      titleDe,
      titleEn,
      descriptionAr,
      descriptionDe,
      descriptionEn,
      imageUrl,
      introVideoUrl,
      order,
      isActive,
    } = body;

    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name.trim().toUpperCase();
    if (titleAr !== undefined) updateData.titleAr = titleAr.trim();
    if (titleDe !== undefined) updateData.titleDe = titleDe.trim();
    if (titleEn !== undefined) updateData.titleEn = titleEn.trim();
    if (descriptionAr !== undefined) updateData.descriptionAr = descriptionAr || '';
    if (descriptionDe !== undefined) updateData.descriptionDe = descriptionDe || '';
    if (descriptionEn !== undefined) updateData.descriptionEn = descriptionEn || '';
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl || null;
    if (introVideoUrl !== undefined) updateData.introVideoUrl = introVideoUrl || null;
    if (order !== undefined) updateData.order = order;
    if (isActive !== undefined) updateData.isActive = isActive;
    updateData.updatedAt = new Date().toISOString();

    const { data: level, error } = await supabaseAdmin
      .from('course_levels')
      .update(updateData)
      .eq('id', levelId)
      .eq('courseId', courseId)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ level });
  } catch (error) {
    console.error('Admin update course level error:', error);
    return NextResponse.json({ error: 'Failed to update course level' }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string; levelId: string }> }
) {
  try {
    const userId = await verifyAdmin(req);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id: courseId, levelId } = await params;

    // Delete associated lessons explicitly to ensure cleanup
    await supabaseAdmin
      .from('lessons')
      .delete()
      .eq('levelId', levelId);

    // Delete the level
    const { error } = await supabaseAdmin
      .from('course_levels')
      .delete()
      .eq('id', levelId)
      .eq('courseId', courseId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Admin delete course level error:', error);
    return NextResponse.json({ error: 'Failed to delete course level' }, { status: 500 });
  }
}
