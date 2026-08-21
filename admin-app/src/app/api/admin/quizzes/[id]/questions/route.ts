import { supabaseAdmin } from '@/lib/supabase';
import { verifyAdmin } from '@/lib/admin-auth';
import { NextResponse } from 'next/server';

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
    return NextResponse.json({ questions });
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
    const { textAr, textDe, textEn, option1Ar, option1De, option1En, option2Ar, option2De, option2En, option3Ar, option3De, option3En, option4Ar, option4De, option4En, correctOption, order } = body;

    if (!textAr || !textDe || !textEn || !correctOption) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { data: question, error } = await supabaseAdmin
      .from('questions')
      .insert({
        quizId: id,
        textAr, textDe, textEn,
        option1Ar, option1De, option1En,
        option2Ar, option2De, option2En,
        option3Ar, option3De, option3En,
        option4Ar, option4De, option4En,
        correctOption,
        order: order ?? 0,
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ question }, { status: 201 });
  } catch (error) {
    console.error('Admin create question error:', error);
    return NextResponse.json({ error: 'Failed to create question' }, { status: 500 });
  }
}
