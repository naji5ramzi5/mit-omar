import { supabaseAdmin } from '@/lib/supabase';
import { verifyAdmin } from '@/lib/admin-auth';
import { validateExcelQuestions } from '@/lib/excel-quiz-importer';
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

  const option1 = data.options?.[0]?.textAr || '';
  const option2 = data.options?.[1]?.textAr || '';
  const option3 = data.options?.[2]?.textAr || '';
  const option4 = data.options?.[3]?.textAr || '';

  let correctOpt = 1;
  if (data.correctAnswers?.[0]) {
    const parsed = parseInt(data.correctAnswers[0], 10);
    if (!isNaN(parsed) && parsed >= 1 && parsed <= 4) correctOpt = parsed;
  }

  return {
    quizId,
    textAr: data.promptAr || '',
    textDe: JSON.stringify(meta),
    textEn: data.promptEn || '',
    imageUrl: data.imageUrl || null,
    option1Ar: option1,
    option1De: '',
    option1En: '',
    option2Ar: option2,
    option2De: '',
    option2En: '',
    option3Ar: option3,
    option3De: '',
    option3En: '',
    option4Ar: option4,
    option4De: '',
    option4En: '',
    correctOption: correctOpt,
    order: data.order ?? 0,
  };
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await verifyAdmin(req);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const action = formData.get('action') as string; // 'validate' or 'import'

    if (!file) {
      return NextResponse.json({ error: 'ملف الإكسل مطلوب' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const report = validateExcelQuestions(arrayBuffer);

    // If only preview/validate requested, return report
    if (action !== 'import') {
      return NextResponse.json({
        report: {
          totalRows: report.totalRows,
          validRowsCount: report.validRowsCount,
          errorRowsCount: report.errorRowsCount,
          rows: report.rows,
        },
      });
    }

    // If import confirmed, insert valid questions
    if (report.validQuestions.length === 0) {
      return NextResponse.json({ error: 'لا توجد أسئلة صالحة للاستيراد في هذا الملف' }, { status: 400 });
    }

    // Get current question count to set correct starting order
    const { count } = await supabaseAdmin
      .from('questions')
      .select('id', { count: 'exact', head: true })
      .eq('quizId', id);

    let startOrder = count || 0;

    const rowsToInsert = report.validQuestions.map((q, idx) => {
      startOrder++;
      return packQuestionToRow(id, { ...q, order: startOrder });
    });

    const { data: inserted, error: insertErr } = await supabaseAdmin
      .from('questions')
      .insert(rowsToInsert)
      .select();

    if (insertErr) throw insertErr;

    return NextResponse.json({
      success: true,
      importedCount: inserted?.length || rowsToInsert.length,
      report: {
        totalRows: report.totalRows,
        validRowsCount: report.validRowsCount,
        errorRowsCount: report.errorRowsCount,
      },
    });
  } catch (error: any) {
    console.error('Admin Excel import error:', error);
    return NextResponse.json({ error: error.message || 'فشل في قراءة أو استيراد ملف الإكسل' }, { status: 500 });
  }
}
