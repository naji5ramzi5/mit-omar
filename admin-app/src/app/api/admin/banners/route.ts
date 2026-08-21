import { supabaseAdmin } from '@/lib/supabase';
import { verifyAdmin } from '@/lib/admin-auth';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  try {
    const userId = await verifyAdmin(req);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: banners, error } = await supabaseAdmin
      .from('banners')
      .select('*')
      .order('order', { ascending: true });

    if (error) throw error;
    return NextResponse.json({ banners });
  } catch (error) {
    console.error('Admin banners error:', error);
    return NextResponse.json({ error: 'Failed to fetch banners' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const userId = await verifyAdmin(req);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { titleAr, titleDe, titleEn, descriptionAr, descriptionDe, descriptionEn, imageUrl, link, pageSlug, labelAr, labelDe, labelEn, order, isActive } = body;

    if (!titleAr || !titleDe || !titleEn) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { data: banner, error } = await supabaseAdmin
      .from('banners')
      .insert({
        titleAr, titleDe, titleEn,
        descriptionAr: descriptionAr || null,
        descriptionDe: descriptionDe || null,
        descriptionEn: descriptionEn || null,
        imageUrl: imageUrl || null,
        link: link || null,
        pageSlug: pageSlug || null,
        labelAr: labelAr || null,
        labelDe: labelDe || null,
        labelEn: labelEn || null,
        order: order ?? 0,
        isActive: isActive ?? true,
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ banner }, { status: 201 });
  } catch (error) {
    console.error('Admin create banner error:', error);
    return NextResponse.json({ error: 'Failed to create banner' }, { status: 500 });
  }
}
