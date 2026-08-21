import { supabase } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const { data: banners, error } = await supabase
      .from('banners')
      .select('*')
      .eq('isActive', true)
      .order('order', { ascending: true });

    if (error) throw error;
    return NextResponse.json({ banners });
  } catch {
    return NextResponse.json({ banners: [] });
  }
}
