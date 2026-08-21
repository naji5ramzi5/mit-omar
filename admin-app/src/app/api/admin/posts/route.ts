import { supabaseAdmin } from '@/lib/supabase';
import { verifyAdmin } from '@/lib/admin-auth';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  try {
    const userId = await verifyAdmin(req);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: posts, error } = await supabaseAdmin
      .from('posts')
      .select('*')
      .order('createdAt', { ascending: false });

    if (error) throw error;
    return NextResponse.json({ posts });
  } catch (error) {
    console.error('Admin posts error:', error);
    return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const userId = await verifyAdmin(req);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { titleAr, titleDe, titleEn, contentAr, contentDe, contentEn, excerptAr, excerptDe, excerptEn, category, imageUrl, isPublished } = body;

    if (!titleAr || !titleDe || !titleEn) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { data: post, error } = await supabaseAdmin
      .from('posts')
      .insert({
        titleAr, titleDe, titleEn,
        contentAr: contentAr || null,
        contentDe: contentDe || null,
        contentEn: contentEn || null,
        excerptAr: excerptAr || null,
        excerptDe: excerptDe || null,
        excerptEn: excerptEn || null,
        category: category || null,
        imageUrl: imageUrl || null,
        isPublished: isPublished ?? false,
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ post }, { status: 201 });
  } catch (error) {
    console.error('Admin create post error:', error);
    return NextResponse.json({ error: 'Failed to create post' }, { status: 500 });
  }
}
