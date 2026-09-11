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

    // Fetch lessons for this level
    // If levelId starts with 'legacy-level-', fetch all lessons for the course
    let query = supabaseAdmin
      .from('lessons')
      .select('*')
      .eq('courseId', courseId);

    if (!levelId.startsWith('legacy-level-')) {
      query = query.eq('levelId', levelId);
    }

    const { data: lessons, error } = await query.order('order', { ascending: true });

    if (error) throw error;
    return NextResponse.json({ lessons: lessons || [] });
  } catch (error) {
    console.error('Admin get level lessons error:', error);
    return NextResponse.json({ error: 'Failed to fetch lessons' }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string; levelId: string }> }
) {
  try {
    const userId = await verifyAdmin(req);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id: courseId, levelId } = await params;
    const body = await req.json();

    // Check if this is a bulk reorder request
    if (Array.isArray(body.orders)) {
      for (const item of body.orders) {
        if (item.id && typeof item.order === 'number') {
          await supabaseAdmin
            .from('lessons')
            .update({ order: item.order })
            .eq('id', item.id);
        }
      }
      return NextResponse.json({ success: true });
    }

    const {
      titleAr,
      titleDe,
      titleEn,
      descriptionAr,
      descriptionDe,
      descriptionEn,
      videoUrl,
      duration,
      order,
      isFree,
    } = body;

    if (!titleAr || !titleDe || !titleEn) {
      return NextResponse.json({ error: 'Missing required lesson fields' }, { status: 400 });
    }

    // Determine actual levelId (null if legacy placeholder)
    const targetLevelId = levelId.startsWith('legacy-level-') ? null : levelId;

    // Enforce free lesson logic: if this lesson is set to free, un-free others in the course/level
    if (isFree === true) {
      await supabaseAdmin
        .from('lessons')
        .update({ isFree: false })
        .eq('courseId', courseId);
    }

    const insertPayload: Record<string, unknown> = {
      courseId,
      titleAr: titleAr.trim(),
      titleDe: titleDe.trim(),
      titleEn: titleEn.trim(),
      descriptionAr: descriptionAr || null,
      descriptionDe: descriptionDe || null,
      descriptionEn: descriptionEn || null,
      videoUrl: videoUrl || null,
      duration: duration ?? 0,
      order: order ?? 0,
      isFree: isFree ?? false,
    };

    if (targetLevelId) {
      insertPayload.levelId = targetLevelId;
    }

    const { data: lesson, error } = await supabaseAdmin
      .from('lessons')
      .insert(insertPayload)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ lesson }, { status: 201 });
  } catch (error) {
    console.error('Admin create level lesson error:', error);
    return NextResponse.json({ error: 'Failed to create lesson' }, { status: 500 });
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string; levelId: string }> }
) {
  try {
    const userId = await verifyAdmin(req);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id: courseId } = await params;
    const body = await req.json();

    // Check if bulk reorder
    if (Array.isArray(body.orders)) {
      for (const item of body.orders) {
        if (item.id && typeof item.order === 'number') {
          await supabaseAdmin
            .from('lessons')
            .update({ order: item.order })
            .eq('id', item.id);
        }
      }
      return NextResponse.json({ success: true });
    }

    const lessonId = body.id || body.lessonId;
    if (!lessonId) return NextResponse.json({ error: 'lessonId is required' }, { status: 400 });

    const {
      titleAr,
      titleDe,
      titleEn,
      descriptionAr,
      descriptionDe,
      descriptionEn,
      videoUrl,
      duration,
      order,
      isFree,
    } = body;

    if (isFree === true) {
      await supabaseAdmin
        .from('lessons')
        .update({ isFree: false })
        .eq('courseId', courseId);
    }

    const updateData: Record<string, unknown> = {};
    if (titleAr !== undefined) updateData.titleAr = titleAr.trim();
    if (titleDe !== undefined) updateData.titleDe = titleDe.trim();
    if (titleEn !== undefined) updateData.titleEn = titleEn.trim();
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
    console.error('Admin update level lesson error:', error);
    return NextResponse.json({ error: 'Failed to update lesson' }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string; levelId: string }> }
) {
  try {
    const userId = await verifyAdmin(req);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const lessonId = searchParams.get('id') || searchParams.get('lessonId');
    if (!lessonId) return NextResponse.json({ error: 'lessonId is required' }, { status: 400 });

    const { error } = await supabaseAdmin.from('lessons').delete().eq('id', lessonId);
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Admin delete level lesson error:', error);
    return NextResponse.json({ error: 'Failed to delete lesson' }, { status: 500 });
  }
}
