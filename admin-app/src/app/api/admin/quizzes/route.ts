import { supabaseAdmin } from '@/lib/supabase';
import { verifyAdmin } from '@/lib/admin-auth';
import { DEFAULT_GOETHE_SECTIONS } from '@/lib/quiz-engine';
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

    // Fetch quiz_meta from siteSettings
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
          quizAttempts: q.quizAttempts?.[0]?.count ?? 0,
        },
        durationMinutes: meta.durationMinutes ?? 30,
        passingScore: meta.passingScore ?? 60,
        allowedAttempts: meta.allowedAttempts ?? 0,
        showDetailedResults: meta.showDetailedResults ?? true,
        instructionsAr: meta.instructionsAr || '',
        instructionsDe: meta.instructionsDe || '',
        sections: meta.sections || [],
        examType: meta.examType || 'general',
      };
    });

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
    const {
      level, titleAr, titleDe, titleEn,
      descriptionAr, descriptionDe, descriptionEn,
      isActive,
      durationMinutes, passingScore, allowedAttempts,
      showDetailedResults, instructionsAr, instructionsDe,
      sections, examType,
    } = body;

    if (!level || !titleAr) {
      return NextResponse.json({ error: 'العنوان والمستوى حقول مطلوبة' }, { status: 400 });
    }

    const { data: quiz, error } = await supabaseAdmin
      .from('quizzes')
      .insert({
        level,
        titleAr,
        titleDe: titleDe || titleAr,
        titleEn: titleEn || titleAr,
        descriptionAr: descriptionAr || null,
        descriptionDe: descriptionDe || null,
        descriptionEn: descriptionEn || null,
        isActive: isActive ?? true,
      })
      .select()
      .single();

    if (error) throw error;

    // Save extended exam metadata
    const metaPayload = {
      quizId: quiz.id,
      durationMinutes: durationMinutes !== undefined ? Number(durationMinutes) : 30,
      passingScore: passingScore !== undefined ? Number(passingScore) : 60,
      allowedAttempts: allowedAttempts !== undefined ? Number(allowedAttempts) : 0,
      showDetailedResults: showDetailedResults ?? true,
      instructionsAr: instructionsAr || '',
      instructionsDe: instructionsDe || '',
      sections: sections && sections.length > 0 ? sections : DEFAULT_GOETHE_SECTIONS,
      examType: examType || 'general',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await supabaseAdmin.from('siteSettings').upsert({
      key: `quiz_meta_${quiz.id}`,
      value: JSON.stringify(metaPayload),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }, { onConflict: 'key' });

    return NextResponse.json({
      quiz: {
        ...quiz,
        ...metaPayload,
      },
    }, { status: 201 });
  } catch (error) {
    console.error('Admin create quiz error:', error);
    return NextResponse.json({ error: 'Failed to create quiz' }, { status: 500 });
  }
}
