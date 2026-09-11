import { supabaseAdmin } from '@/lib/supabase';
import { verifyAdmin } from '@/lib/admin-auth';
import { normalizeQuestion } from '@/lib/quiz-engine';
import { NextResponse } from 'next/server';

function packQuestionToRow(quizId: string, data: any) {
  const meta = {
    type: data.type || 'single_choice',
    sectionId: data.sectionId || 'general',
    sectionName: data.sectionName || 'عام',
    options: data.options || [],
    correctAnswers: data.correctAnswers || [],
    matchingPairs: data.matchingPairs || [],
    orderingItems: data.orderingItems || [],
    acceptedAnswers: data.acceptedAnswers || [],
    points: data.points ?? 1,
    audioUrl: data.audioUrl || null,
    imageUrl: data.imageUrl || null,
    explanationAr: data.explanationAr || '',
    explanationDe: data.explanationDe || '',
    promptDe: data.promptDe || '',
  };

  const option1 = data.options?.[0]?.textAr || data.option1Ar || '';
  const option2 = data.options?.[1]?.textAr || data.option2Ar || '';
  const option3 = data.options?.[2]?.textAr || data.option3Ar || '';
  const option4 = data.options?.[3]?.textAr || data.option4Ar || '';

  let correctOpt = 1;
  if (data.correctAnswers?.[0]) {
    const parsed = parseInt(data.correctAnswers[0], 10);
    if (!isNaN(parsed) && parsed >= 1 && parsed <= 4) correctOpt = parsed;
  } else if (data.correctOption) {
    correctOpt = parseInt(data.correctOption, 10) || 1;
  }

  return {
    quizId,
    textAr: data.promptAr || data.textAr || '',
    textDe: JSON.stringify(meta),
    textEn: data.promptEn || data.textEn || '',
    imageUrl: data.imageUrl || null,
    option1Ar: option1,
    option1De: data.options?.[0]?.textDe || data.option1De || '',
    option1En: data.option1En || '',
    option2Ar: option2,
    option2De: data.options?.[1]?.textDe || data.option2De || '',
    option2En: data.option2En || '',
    option3Ar: option3,
    option3De: data.options?.[2]?.textDe || data.option3De || '',
    option3En: data.option3En || '',
    option4Ar: option4,
    option4De: data.options?.[3]?.textDe || data.option4De || '',
    option4En: data.option4En || '',
    correctOption: correctOpt,
    order: data.order ?? 0,
  };
}

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await verifyAdmin(req);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const { data: questions, error } = await supabaseAdmin
      .from('questions')
      .select('*')
      .eq('quizId', id)
      .order('order', { ascending: true });

    if (error) throw error;

    const richQuestions = (questions || []).map(q => ({
      ...q,
      rich: normalizeQuestion(q),
    }));

    return NextResponse.json({ questions: richQuestions });
  } catch (error) {
    console.error('Admin questions error:', error);
    return NextResponse.json({ error: 'Failed to fetch questions' }, { status: 500 });
  }
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await verifyAdmin(req);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const body = await req.json();

    const promptText = body.promptAr || body.textAr;
    if (!promptText) {
      return NextResponse.json({ error: 'نص السؤال مطلوب' }, { status: 400 });
    }

    const rowData = packQuestionToRow(id, body);

    const { data: question, error } = await supabaseAdmin
      .from('questions')
      .insert(rowData)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      question: {
        ...question,
        rich: normalizeQuestion(question),
      },
    }, { status: 201 });
  } catch (error) {
    console.error('Admin create question error:', error);
    return NextResponse.json({ error: 'Failed to create question' }, { status: 500 });
  }
}
