import { supabaseAdmin } from '@/lib/supabase';
import { verifyAdmin } from '@/lib/admin-auth';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  try {
    const userId = await verifyAdmin(req);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const quizId = searchParams.get('quizId');
    const level = searchParams.get('level');
    const resultFilter = searchParams.get('result'); // 'pass' | 'fail'
    const studentSearch = searchParams.get('search');

    let query = supabaseAdmin
      .from('quizAttempts')
      .select(`
        id,
        score,
        totalQuestions,
        answers,
        completedAt,
        userId,
        quizId,
        users (id, name, email),
        quizzes (id, titleAr, titleDe, level)
      `)
      .order('completedAt', { ascending: false });

    if (quizId) {
      query = query.eq('quizId', quizId);
    }

    const { data: attempts, error } = await query;
    if (error) throw error;

    let normalized = (attempts || []).map((att: any) => {
      const answersObj = typeof att.answers === 'string' ? JSON.parse(att.answers || '{}') : (att.answers || {});
      const evalData = answersObj.evaluation || {};
      const percentage = evalData.percentage ?? (att.totalQuestions > 0 ? Math.round((att.score / att.totalQuestions) * 100) : 0);
      const passed = evalData.passed ?? (percentage >= (evalData.passingScore ?? 60));

      return {
        id: att.id,
        studentName: att.users?.name || 'طالب',
        studentEmail: att.users?.email || '',
        quizTitle: att.quizzes?.titleAr || 'اختبار',
        quizLevel: att.quizzes?.level || 'A1',
        score: att.score,
        totalQuestions: att.totalQuestions,
        percentage,
        passed,
        passingScore: evalData.passingScore ?? 60,
        durationSeconds: answersObj.durationSeconds || 0,
        attemptNumber: answersObj.attemptNumber || 1,
        completedAt: att.completedAt,
        sectionScores: evalData.sectionScores || [],
      };
    });

    if (level) {
      normalized = normalized.filter(a => a.quizLevel === level);
    }

    if (resultFilter === 'pass') {
      normalized = normalized.filter(a => a.passed);
    } else if (resultFilter === 'fail') {
      normalized = normalized.filter(a => !a.passed);
    }

    if (studentSearch) {
      const term = studentSearch.toLowerCase();
      normalized = normalized.filter(a =>
        a.studentName.toLowerCase().includes(term) ||
        a.studentEmail.toLowerCase().includes(term) ||
        a.quizTitle.toLowerCase().includes(term)
      );
    }

    return NextResponse.json({ results: normalized });
  } catch (error) {
    console.error('Admin quiz results error:', error);
    return NextResponse.json({ error: 'Failed to fetch quiz results' }, { status: 500 });
  }
}
