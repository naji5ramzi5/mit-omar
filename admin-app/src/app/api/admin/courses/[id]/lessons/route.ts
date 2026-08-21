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
