import { supabaseAdmin } from '@/lib/supabase';
import { verifyAdmin } from '@/lib/admin-auth';
import { NextResponse } from 'next/server';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await verifyAdmin(req);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const { data: lessons, error } = await supabaseAdmin
      .from('lessons')
      .select('*')
      .eq('courseId', id)
      .order('order', { ascending: true });

    if (error) throw error;
    return NextResponse.json({ lessons });
  } catch (error) {
    console.error('Admin lessons error:', error);
    return NextResponse.json({ error: 'Failed to fetch lessons' }, { status: 500 });
  }
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await verifyAdmin(req);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const body = await req.json();
    const { titleAr, titleDe, titleEn, descriptionAr, descriptionDe, descriptionEn, videoUrl, duration, order, isFree } = body;

    if (!titleAr || !titleDe || !titleEn) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Enforce single free lesson per course invariant
    if (isFree === true) {
      await supabaseAdmin
        .from('lessons')
        .update({ isFree: false })
        .eq('courseId', id);
    }

    const { data: lesson, error } = await supabaseAdmin
      .from('lessons')
      .insert({
        courseId: id,
        titleAr, titleDe, titleEn,
        descriptionAr: descriptionAr || null,
        descriptionDe: descriptionDe || null,
        descriptionEn: descriptionEn || null,
        videoUrl: videoUrl || null,
        duration: duration ?? 0,
        order: order ?? 0,
        isFree: isFree ?? false,
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ lesson }, { status: 201 });
  } catch (error) {
    console.error('Admin create lesson error:', error);
    return NextResponse.json({ error: 'Failed to create lesson' }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await verifyAdmin(req);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const body = await req.json();
    const lessonId = body.id || body.lessonId || searchParams.get('lessonId');
    if (!lessonId) return NextResponse.json({ error: 'lessonId is required' }, { status: 400 });

    const { titleAr, titleDe, titleEn, descriptionAr, descriptionDe, descriptionEn, videoUrl, duration, order, isFree } = body;

    // Enforce single free lesson per course invariant
    if (isFree === true) {
      await supabaseAdmin
        .from('lessons')
        .update({ isFree: false })
        .eq('courseId', id);
    }

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

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
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
    console.error('Admin delete lesson error:', error);
    return NextResponse.json({ error: 'Failed to delete lesson' }, { status: 500 });
  }
}

