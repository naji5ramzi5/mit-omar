import { supabaseAdmin } from '@/lib/supabase';
import { decodeUserId } from '@/lib/admin-auth';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  try {
    const userId = decodeUserId(req);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: user } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', userId)
      .single();

    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const [studentsRes, coursesRes, postsRes, enrollmentsRes, activeEnrollmentsRes, subscribersRes] = await Promise.all([
      supabaseAdmin.from('users').select('id', { count: 'exact', head: true }).eq('role', 'student'),
      supabaseAdmin.from('courses').select('id', { count: 'exact', head: true }),
      supabaseAdmin.from('posts').select('id', { count: 'exact', head: true }),
      supabaseAdmin.from('enrollments').select('id', { count: 'exact', head: true }),
      supabaseAdmin.from('enrollments').select('id', { count: 'exact', head: true }).eq('isActive', true),
      supabaseAdmin.from('subscribers').select('id', { count: 'exact', head: true }).eq('isActive', true),
    ]);

    const now = new Date();
    const iso = (d: Date) => d.toISOString().slice(0, 10);

    const weekAgo = new Date(now); weekAgo.setDate(now.getDate() - 7);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [visitsTodayRes, visitsWeekRes, visitsMonthRes, visitsTotalRes, visits14Res, enrollmentsMonthRes, quizAttemptsRes, quizScoresRes, lessonsCompletedRes, lessonsTotalRes] = await Promise.all([
      supabaseAdmin.from('visits').select('count').eq('day', iso(now)).maybeSingle(),
      supabaseAdmin.from('visits').select('day,count').gte('day', iso(weekAgo)),
      supabaseAdmin.from('visits').select('day,count').gte('day', iso(monthStart)),
      supabaseAdmin.from('visits').select('day,count'),
      supabaseAdmin.from('visits').select('day,count').gte('day', iso(new Date(now.getTime() - 13 * 86400000))).order('day', { ascending: true }),
      supabaseAdmin.from('enrollments').select('id', { count: 'exact', head: true }).gte('createdAt', monthStart.toISOString()),
      supabaseAdmin.from('quizAttempts').select('id', { count: 'exact', head: true }),
      supabaseAdmin.from('quizAttempts').select('score,totalQuestions'),
      supabaseAdmin.from('lessonProgress').select('id', { count: 'exact', head: true }).eq('completed', true),
      supabaseAdmin.from('lessonProgress').select('id', { count: 'exact', head: true }),
    ]);

    const totalQuestions = (quizScoresRes.data || []).reduce((s, r) => s + (r.totalQuestions || 0), 0);
    const totalScore = (quizScoresRes.data || []).reduce((s, r) => s + (r.score || 0), 0);

    const sumVisits = (rows: Array<{ count: number }> | null) =>
      (rows || []).reduce((s, r) => s + (r.count || 0), 0);

    const visitsWeek = sumVisits(visitsWeekRes.data);
    const visitsMonth = sumVisits(visitsMonthRes.data);
    const visitsTotal = sumVisits(visitsTotalRes.data);

    return NextResponse.json({
      stats: {
        totalStudents: studentsRes.count || 0,
        totalCourses: coursesRes.count || 0,
        totalPosts: postsRes.count || 0,
        totalEnrollments: enrollmentsRes.count || 0,
        activeEnrollments: activeEnrollmentsRes.count || 0,
        totalSubscribers: subscribersRes.count || 0,
        visits: {
          today: visitsTodayRes.data?.count || 0,
          week: visitsWeek,
          month: visitsMonth,
          total: visitsTotal,
          last14: (visits14Res.data || []).map((r) => ({ day: r.day, count: r.count || 0 })),
        },
        enrollmentsThisMonth: enrollmentsMonthRes.count || 0,
        quizStats: {
          attempts: quizAttemptsRes.count || 0,
          avgScore: totalQuestions > 0 ? Math.round((totalScore / totalQuestions) * 100) : 0,
        },
        lessonProgress: {
          completed: lessonsCompletedRes.count || 0,
          total: lessonsTotalRes.count || 0,
          rate: (lessonsTotalRes.count || 0) > 0
            ? Math.round(((lessonsCompletedRes.count || 0) / (lessonsTotalRes.count || 0)) * 100)
            : 0,
        },
      },
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}
