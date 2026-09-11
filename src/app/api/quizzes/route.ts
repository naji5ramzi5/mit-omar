import { supabase, supabaseAdmin } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const { data: quizzes, error } = await supabase
      .from('quizzes')
      .select('*, questions(count), quizAttempts(count)')
      .eq('isActive', true)
      .order('level', { ascending: true });

    if (error) throw error;

    // Fetch quiz metadata
    const { data: metas } = await supabaseAdmin
      .from('siteSettings')
      .select('key, value')
      .ilike('key', 'quiz_meta_%');

    const metaMap = new Map<string, any>();
    (metas || []).forEach(m => {
      try {
        const qId = m.key.replace('quiz_meta_', '');
        metaMap.set(qId, JSON.parse(m.value));
      } catch {}
    });

    const normalized = (quizzes as any[] || []).map((q) => {
      const meta = metaMap.get(q.id) || {};
      return {
        ...q,
        questions: undefined,
        quizAttempts: undefined,
        _count: {
          questions: q.questions?.[0]?.count ?? 0,
          attempts: q.quizAttempts?.[0]?.count ?? 0,
        },
        durationMinutes: meta.durationMinutes ?? 30,
        passingScore: meta.passingScore ?? 60,
        sectionsCount: meta.sections?.length || 0,
      };
    });

    return NextResponse.json({ quizzes: normalized });
  } catch (error) {
    console.error('Quizzes error:', error);
    return NextResponse.json({ error: 'Failed to fetch quizzes' }, { status: 500 });
  }
}
