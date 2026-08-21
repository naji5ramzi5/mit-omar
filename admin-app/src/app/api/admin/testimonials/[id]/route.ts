import { supabaseAdmin } from '@/lib/supabase';
import { verifyAdmin } from '@/lib/admin-auth';
import { NextResponse } from 'next/server';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await verifyAdmin(req);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const body = await req.json();
    const { nameAr, nameDe, nameEn, roleAr, roleDe, roleEn, textAr, textDe, textEn, level, rating, avatar, isActive, order } = body;

    const updateData: Record<string, unknown> = {};
    if (nameAr !== undefined) updateData.nameAr = nameAr;
    if (nameDe !== undefined) updateData.nameDe = nameDe;
    if (nameEn !== undefined) updateData.nameEn = nameEn;
    if (roleAr !== undefined) updateData.roleAr = roleAr || null;
    if (roleDe !== undefined) updateData.roleDe = roleDe || null;
    if (roleEn !== undefined) updateData.roleEn = roleEn || null;
    if (textAr !== undefined) updateData.textAr = textAr;
    if (textDe !== undefined) updateData.textDe = textDe;
    if (textEn !== undefined) updateData.textEn = textEn;
    if (level !== undefined) updateData.level = level || null;
    if (rating !== undefined) updateData.rating = rating;
    if (avatar !== undefined) updateData.avatar = avatar || null;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (order !== undefined) updateData.order = order;

    const { data: testimonial, error } = await supabaseAdmin
      .from('testimonials')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ testimonial });
  } catch (error) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await verifyAdmin(req);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const { error } = await supabaseAdmin.from('testimonials').delete().eq('id', id);
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
