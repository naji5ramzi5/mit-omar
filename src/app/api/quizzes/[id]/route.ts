import { supabase, supabaseAdmin } from '@/lib/supabase';
import { decodeUserId } from '@/lib/admin-auth';
import { normalizeQuestion, sanitizeQuestionsForStudent, ExamMeta } from '@/lib/quiz-engine';
import { NextResponse } from 'next/server';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const userId = decodeUserId(req);

    const { data: quiz, error } = await supabase
      .from('quizzes')
      .select('*, questions(*)')
      .eq('id', id)
      .single();

    if (error || !quiz) {
      return NextResponse.json({ error: 'Quiz not found' }, { status: 404 });
    }

    // Fetch rich exam metadata from siteSettings
    let meta: Partial<ExamMeta> = {
      durationMinutes: 30,
      passingScore: 60,
      allowedAttempts: 0,
      showDetailedResults: true,
      sections: [],
      examType: 'general',
    };

    try {
      const { data: settingData } = await supabaseAdmin
        .from('siteSettings')
        .select('value')
        .eq('key', `quiz_meta_${id}`)
        .maybeSingle();

      if (settingData?.value) {
        meta = { ...meta, ...JSON.parse(settingData.value) };
      }
    } catch {
      // fallback
    }

    // Normalize and sanitize questions
    const rawQuestions = ((quiz as any).questions || []).sort((a: any, b: any) => (a.order || 0) - (b.order || 0));
    const normalizedQuestions = rawQuestions.map(normalizeQuestion);
    const sanitizedQuestions = sanitizeQuestionsForStudent(normalizedQuestions);

    // Calculate student attempt count if logged in
    let userAttemptsCount = 0;
    let canAttempt = true;
    if (userId) {
      const { count } = await supabaseAdmin
        .from('quizAttempts')
        .select('id', { count: 'exact', head: true })
        .eq('userId', userId)
        .eq('quizId', id);

      userAttemptsCount = count || 0;
      if (meta.allowedAttempts && meta.allowedAttempts > 0) {
        canAttempt = userAttemptsCount < meta.allowedAttempts;
      }
    }

    return NextResponse.json({
      quiz: {
        id: quiz.id,
        level: quiz.level,
        titleAr: quiz.titleAr,
        titleDe: quiz.titleDe,
        titleEn: quiz.titleEn,
        descriptionAr: quiz.descriptionAr,
        descriptionDe: quiz.descriptionDe,
        descriptionEn: quiz.descriptionEn,
        isActive: quiz.isActive,
        durationMinutes: meta.durationMinutes ?? 30,
        passingScore: meta.passingScore ?? 60,
        allowedAttempts: meta.allowedAttempts ?? 0,
        showDetailedResults: meta.showDetailedResults ?? true,
        instructionsAr: meta.instructionsAr || '',
        instructionsDe: meta.instructionsDe || '',
        sections: meta.sections || [],
        examType: meta.examType || 'general',
        questions: sanitizedQuestions,
        totalQuestions: sanitizedQuestions.length,
        totalPoints: normalizedQuestions.reduce((sum, q) => sum + q.points, 0),
        userAttemptsCount,
        canAttempt,
      },
    });
  } catch (error) {
    console.error('Quiz detail error:', error);
    return NextResponse.json({ error: 'Failed to fetch quiz' }, { status: 500 });
  }
}
