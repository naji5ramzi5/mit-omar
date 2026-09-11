import { supabaseAdmin } from '@/lib/supabase';
import { verifyAdmin } from '@/lib/admin-auth';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  try {
    const userId = await verifyAdmin(req);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: testimonials, error } = await supabaseAdmin
      .from('testimonials')
      .select('*')
      .order('order', { ascending: true });

    if (error) throw error;
    return NextResponse.json({ testimonials });
  } catch (error) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const userId = await verifyAdmin(req);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { nameAr, nameDe, nameEn, roleAr, roleDe, roleEn, textAr, textDe, textEn, level, rating, avatar, isActive, order } = body;

    const finalNameAr = nameAr || nameDe || nameEn;
    const finalNameDe = nameDe || nameAr || nameEn;
    const finalNameEn = nameEn || nameDe || nameAr;

    const finalTextAr = textAr || textDe || textEn;
    const finalTextDe = textDe || textAr || finalTextAr;
    const finalTextEn = textEn || textDe || finalTextAr;

    if (!finalNameAr || !finalTextAr) {
      return NextResponse.json({ error: 'يرجى إدخال الاسم ونص الرأي' }, { status: 400 });
    }

    const { data: testimonial, error } = await supabaseAdmin
      .from('testimonials')
      .insert({
        nameAr: finalNameAr,
        nameDe: finalNameDe,
        nameEn: finalNameEn,
        roleAr: roleAr || null,
        roleDe: roleDe || null,
        roleEn: roleEn || null,
        textAr: finalTextAr,
        textDe: finalTextDe,
        textEn: finalTextEn,
        level: level || null,
        rating: rating ?? 5,
        avatar: avatar || null,
        isActive: isActive ?? true,
        order: order ?? 0,
      })
      .select()
      .single();


    if (error) throw error;
    return NextResponse.json({ testimonial }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
