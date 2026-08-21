import { supabaseAdmin } from '@/lib/supabase';
import { decodeUserId } from '@/lib/admin-auth';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const userId = decodeUserId(req);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { quizId, score, totalQuestions, answers } = body;

    if (!quizId || score === undefined || !totalQuestions) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { data: attempt, error } = await supabaseAdmin
      .from('quizAttempts')
      .insert({
        userId,
        quizId,
        score,
        totalQuestions,
        answers: answers ? JSON.stringify(answers) : null,
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ attempt }, { status: 201 });
  } catch (error) {
    console.error('Quiz attempt error:', error);
    return NextResponse.json({ error: 'Failed to save attempt' }, { status: 500 });
  }
}
