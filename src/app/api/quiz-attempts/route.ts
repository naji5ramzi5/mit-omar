import { supabaseAdmin } from '@/lib/supabase';
import { decodeUserId } from '@/lib/admin-auth';
import { normalizeQuestion, evaluateExam, ExamMeta } from '@/lib/quiz-engine';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const userId = decodeUserId(req);
    const body = await req.json();
    const { quizId, answers, startedAt, durationSeconds } = body;

    if (!quizId) {
      return NextResponse.json({ error: 'معرف الاختبار مطلوب' }, { status: 400 });
    }

    // 1. Fetch questions from database
    const { data: rawQuestions, error: qErr } = await supabaseAdmin
      .from('questions')
      .select('*')
      .eq('quizId', quizId)
      .order('order', { ascending: true });

    if (qErr || !rawQuestions || rawQuestions.length === 0) {
      return NextResponse.json({ error: 'لم يتم العثور على أسئلة لهذا الاختبار' }, { status: 404 });
    }

    const normalizedQuestions = rawQuestions.map(normalizeQuestion);

    // 2. Fetch exam settings
    let meta: Partial<ExamMeta> = {
      durationMinutes: 30,
      passingScore: 60,
      allowedAttempts: 0,
      showDetailedResults: true,
      sections: [],
    };

    try {
      const { data: settingData } = await supabaseAdmin
        .from('siteSettings')
        .select('value')
        .eq('key', `quiz_meta_${quizId}`)
        .maybeSingle();

      if (settingData?.value) {
        meta = { ...meta, ...JSON.parse(settingData.value) };
      }
    } catch {
      // fallback
    }

    // 3. Enforce attempt limits if user is logged in
    let currentAttemptNumber = 1;
    if (userId) {
      const { count } = await supabaseAdmin
        .from('quizAttempts')
        .select('id', { count: 'exact', head: true })
        .eq('userId', userId)
        .eq('quizId', quizId);

      const existingAttempts = count || 0;
      currentAttemptNumber = existingAttempts + 1;

      if (meta.allowedAttempts && meta.allowedAttempts > 0 && existingAttempts >= meta.allowedAttempts) {
        return NextResponse.json(
          { error: 'لقد استنفدت الحد الأقصى للمحاولات المسموح بها لهذا الاختبار' },
          { status: 403 }
        );
      }
    }

    // 4. Server-side answer evaluation
    const evaluation = evaluateExam(normalizedQuestions, answers || {}, meta);

    // 5. Build attempt record payload
    const attemptPayload = {
      answers: answers || {},
      evaluation: {
        totalScore: evaluation.totalScore,
        maxScore: evaluation.maxScore,
        percentage: evaluation.percentage,
        passed: evaluation.passed,
        passingScore: evaluation.passingScore,
        sectionScores: evaluation.sectionScores,
        correctCount: evaluation.correctCount,
        incorrectCount: evaluation.incorrectCount,
      },
      durationSeconds: durationSeconds || 0,
      startedAt: startedAt || new Date().toISOString(),
      submittedAt: new Date().toISOString(),
      attemptNumber: currentAttemptNumber,
    };

    let savedAttemptId: string | null = null;
    if (userId) {
      const { data: inserted, error: insertErr } = await supabaseAdmin
        .from('quizAttempts')
        .insert({
          userId,
          quizId,
          score: evaluation.totalScore,
          totalQuestions: evaluation.totalQuestions,
          answers: attemptPayload,
        })
        .select('id')
        .single();

      if (!insertErr && inserted) {
        savedAttemptId = inserted.id;
      }
    }

    // 6. Detailed results visibility check
    const showDetails = meta.showDetailedResults ?? true;
    const clientResults = showDetails
      ? evaluation.questionResults
      : evaluation.questionResults?.map(qr => ({
          questionId: qr.questionId,
          isCorrect: qr.isCorrect,
          earnedPoints: qr.earnedPoints,
          maxPoints: qr.maxPoints,
          userAnswer: qr.userAnswer,
        }));

    return NextResponse.json({
      success: true,
      attemptId: savedAttemptId,
      attemptNumber: currentAttemptNumber,
      totalScore: evaluation.totalScore,
      maxScore: evaluation.maxScore,
      percentage: evaluation.percentage,
      passed: evaluation.passed,
      passingScore: evaluation.passingScore,
      correctCount: evaluation.correctCount,
      incorrectCount: evaluation.incorrectCount,
      totalQuestions: evaluation.totalQuestions,
      sectionScores: evaluation.sectionScores,
      questionResults: clientResults,
      showDetailedResults: showDetails,
    }, { status: 201 });
  } catch (error) {
    console.error('Quiz attempt evaluation error:', error);
    return NextResponse.json({ error: 'فشل في تصحيح الاختبار وحفظ المحاولة' }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const userId = decodeUserId(req);
    if (!userId) {
      return NextResponse.json({ attempts: [] });
    }

    const { searchParams } = new URL(req.url);
    const quizId = searchParams.get('quizId');

    let query = supabaseAdmin
      .from('quizAttempts')
      .select('id, quizId, score, totalQuestions, answers, completedAt')
      .eq('userId', userId)
      .order('completedAt', { ascending: false });

    if (quizId) {
      query = query.eq('quizId', quizId);
    }

    const { data: attempts, error } = await query;
    if (error) throw error;

    return NextResponse.json({ attempts: attempts || [] });
  } catch (error) {
    console.error('Quiz attempts fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch attempts' }, { status: 500 });
  }
}
