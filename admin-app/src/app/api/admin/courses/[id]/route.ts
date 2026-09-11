import { supabaseAdmin } from '@/lib/supabase';
import { verifyAdmin } from '@/lib/admin-auth';
import { getCourseIntroVideo, saveCourseIntroVideo } from '@/lib/activation';
import { NextResponse } from 'next/server';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await verifyAdmin(req);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const { data: course, error } = await supabaseAdmin
      .from('courses')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !course) return NextResponse.json({ error: 'Course not found' }, { status: 404 });

    const introVideo = await getCourseIntroVideo(id);
    return NextResponse.json({ course: { ...course, introVideo } });
  } catch (error) {
    console.error('Admin get course error:', error);
    return NextResponse.json({ error: 'Failed to fetch course' }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await verifyAdmin(req);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const body = await req.json();
    const {
      titleAr, titleDe, titleEn, descriptionAr, descriptionDe, descriptionEn,
      level, imageUrl, order, isActive,
      introVideoUrl, introVideoDuration, isIntroPublished
    } = body;

    const updateData: Record<string, unknown> = {};
    if (titleAr !== undefined) updateData.titleAr = titleAr;
    if (titleDe !== undefined) updateData.titleDe = titleDe;
    if (titleEn !== undefined) updateData.titleEn = titleEn;
    if (descriptionAr !== undefined) updateData.descriptionAr = descriptionAr || null;
    if (descriptionDe !== undefined) updateData.descriptionDe = descriptionDe || null;
    if (descriptionEn !== undefined) updateData.descriptionEn = descriptionEn || null;
    if (level !== undefined) updateData.level = level;
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl || null;
    if (order !== undefined) updateData.order = order;
    if (isActive !== undefined) updateData.isActive = isActive;
    updateData.updatedAt = new Date().toISOString();

    if (introVideoUrl !== undefined || introVideoDuration !== undefined || isIntroPublished !== undefined) {
      await saveCourseIntroVideo(id, {
        videoUrl: introVideoUrl,
        duration: introVideoDuration,
        isPublished: isIntroPublished,
      });
    }

    const { data: course, error } = await supabaseAdmin
      .from('courses')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    const introVideo = await getCourseIntroVideo(id);
    return NextResponse.json({ course: { ...course, introVideo } });
  } catch (error) {
    console.error('Admin update course error:', error);
    return NextResponse.json({ error: 'Failed to update course' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await verifyAdmin(req);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const { error } = await supabaseAdmin.from('courses').delete().eq('id', id);
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Admin delete course error:', error);
    return NextResponse.json({ error: 'Failed to delete course' }, { status: 500 });
  }
}
