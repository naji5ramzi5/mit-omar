import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const settings = await db.siteSetting.findMany({
      where: { key: { startsWith: 'stats_' } },
    });

    const stats: Record<string, number> = {};
    for (const s of settings) {
      stats[s.key.replace('stats_', '')] = parseInt(s.value || '0');
    }

    // Ensure defaults
    return NextResponse.json({
      students: stats.students || 500,
      years: stats.years || 8,
      courses: stats.courses || 20,
      lessons: stats.lessons || 1000,
    });
  } catch (error) {
    return NextResponse.json({
      students: 500,
      years: 8,
      courses: 20,
      lessons: 1000,
    });
  }
}
