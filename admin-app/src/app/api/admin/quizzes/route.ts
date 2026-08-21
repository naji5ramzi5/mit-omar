import { supabaseAdmin } from '@/lib/supabase';
import { verifyAdmin } from '@/lib/admin-auth';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  try {
    const userId = await verifyAdmin(req);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: quizzes, error } = await supabaseAdmin
      .from('quizzes')
      .select('*, questions(count), quizAttempts(count)')
      .order('level', { ascending: true });

    if (error) throw error;
    const normalized = (quizzes as any[] || []).map((q) => ({
      ...q,
      questions: undefined,
      quizAttempts: undefined,
      _count: {
        questions: q.questions?.[0]?.count ?? 0,
        quizAttempts: q.quizAttempts?.[0]?.count ?? 0,
      },
    }));
    return NextResponse.json({ quizzes: normalized });
  } catch (error) {
    console.error('Admin quizzes error:', error);
    return NextResponse.json({ error: 'Failed to fetch quizzes' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const userId = await verifyAdmin(req);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { level, titleAr, titleDe, titleEn, descriptionAr, descriptionDe, descriptionEn, isActive } = body;

    if (!level || !titleAr || !titleDe || !titleEn) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { data: quiz, error } = await supabaseAdmin
      .from('quizzes')
      .insert({
        level,
        titleAr, titleDe, titleEn,
        descriptionAr: descriptionAr || null,
        descriptionDe: descriptionDe || null,
        descriptionEn: descriptionEn || null,
        isActive: isActive ?? true,
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ quiz }, { status: 201 });
  } catch (error) {
    console.error('Admin create quiz error:', error);
    return NextResponse.json({ error: 'Failed to create quiz' }, { status: 500 });
  }
}
