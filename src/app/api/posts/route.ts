import { supabase } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '100');

    const { data: posts, error } = await supabase
      .from('posts')
      .select('*')
      .eq('isPublished', true)
      .order('createdAt', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return NextResponse.json({ posts });
  } catch (error) {
    console.error('Posts error:', error);
    return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 });
  }
}
