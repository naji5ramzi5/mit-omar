import { supabase, supabaseAdmin } from '@/lib/supabase';
import { NextResponse } from 'next/server';

/**
 * GET /api/home
 *
 * Consolidated endpoint for the homepage — returns all critical above-the-fold
 * data in a single round trip using parallel Supabase queries.
 *
 * Returns: { banners, courses, stats, settings }
 * Deferred (below fold) data is fetched separately: posts, testimonials, reels
 */
export async function GET() {
  try {
    const [
      { data: banners },
      { data: courses },
      { data: stats },
    ] = await Promise.all([
      // Banners — active only, ordered
      supabase
        .from('banners')
        .select('id, titleAr, titleDe, titleEn, descriptionAr, descriptionDe, descriptionEn, labelAr, labelDe, labelEn, imageUrl, "order"')
        .eq('isActive', true)
        .order('order', { ascending: true }),

      // Courses — with minimal lesson fields (just id, duration, isFree for stats)
      supabase
        .from('courses')
        .select('id, titleAr, titleDe, titleEn, descriptionAr, descriptionDe, descriptionEn, level, imageUrl, "order", lessons(id, duration, isFree)')
        .eq('isActive', true)
        .order('order', { ascending: true })
        .limit(20),

      // Stats from siteSettings
      supabaseAdmin
        .from('siteSettings')
        .select('key, value')
        .in('key', ['stats_students', 'stats_years', 'stats_courses', 'stats_lessons']),
    ]);

    // Parse stats
    const statsMap: Record<string, number> = {};
    for (const s of (stats || []) as any[]) {
      const n = parseInt(s.value || '');
      if (!isNaN(n)) statsMap[s.key] = n;
    }

    const courseList = (courses || []).map((c: any) => ({
      ...c,
      lessons: c.lessons || [],
    }));

    const response = NextResponse.json({
      banners: banners || [],
      courses: courseList,
      stats: {
        students: statsMap['stats_students'] || 12600,
        years: statsMap['stats_years'] || 8,
        courses: statsMap['stats_courses'] || courseList.length,
        lessons: statsMap['stats_lessons'] || 200,
      },
    });

    response.headers.set('Cache-Control', 'public, s-maxage=120, stale-while-revalidate=600');
    return response;
  } catch (error) {
    console.error('Home API error:', error);
    return NextResponse.json({ error: 'Failed to load homepage data' }, { status: 500 });
  }
}
