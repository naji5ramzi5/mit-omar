import { supabase } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const { data: quizzes, error } = await supabase
      .from('quizzes')
      .select('*, questions(count), quizAttempts(count)')
      .eq('isActive', true)
      .order('level', { ascending: true });

    if (error) throw error;
    const normalized = (quizzes as any[] || []).map((q) => ({
      ...q,
      questions: undefined,
      quizAttempts: undefined,
      _count: {
        questions: q.questions?.[0]?.count ?? 0,
        attempts: q.quizAttempts?.[0]?.count ?? 0,
      },
    }));
    return NextResponse.json({ quizzes: normalized });
  } catch (error) {
    console.error('Quizzes error:', error);
    return NextResponse.json({ error: 'Failed to fetch quizzes' }, { status: 500 });
  }
}
