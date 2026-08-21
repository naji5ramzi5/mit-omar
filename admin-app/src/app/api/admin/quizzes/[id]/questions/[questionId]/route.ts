import { supabaseAdmin } from '@/lib/supabase';
import { verifyAdmin } from '@/lib/admin-auth';
import { NextResponse } from 'next/server';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string; questionId: string }> }) {
  try {
    const userId = await verifyAdmin(req);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { questionId } = await params;
    const body = await req.json();
    const { textAr, textDe, textEn, option1Ar, option1De, option1En, option2Ar, option2De, option2En, option3Ar, option3De, option3En, option4Ar, option4De, option4En, correctOption, order } = body;

    const updateData: Record<string, unknown> = {};
    if (textAr !== undefined) updateData.textAr = textAr;
    if (textDe !== undefined) updateData.textDe = textDe;
    if (textEn !== undefined) updateData.textEn = textEn;
    if (option1Ar !== undefined) updateData.option1Ar = option1Ar;
    if (option1De !== undefined) updateData.option1De = option1De;
    if (option1En !== undefined) updateData.option1En = option1En;
    if (option2Ar !== undefined) updateData.option2Ar = option2Ar;
    if (option2De !== undefined) updateData.option2De = option2De;
    if (option2En !== undefined) updateData.option2En = option2En;
    if (option3Ar !== undefined) updateData.option3Ar = option3Ar;
    if (option3De !== undefined) updateData.option3De = option3De;
    if (option3En !== undefined) updateData.option3En = option3En;
    if (option4Ar !== undefined) updateData.option4Ar = option4Ar;
    if (option4De !== undefined) updateData.option4De = option4De;
    if (option4En !== undefined) updateData.option4En = option4En;
    if (correctOption !== undefined) updateData.correctOption = correctOption;
    if (order !== undefined) updateData.order = order;

    const { data: question, error } = await supabaseAdmin
      .from('questions')
      .update(updateData)
      .eq('id', questionId)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ question });
  } catch (error) {
    console.error('Admin update question error:', error);
    return NextResponse.json({ error: 'Failed to update question' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string; questionId: string }> }) {
  try {
    const userId = await verifyAdmin(req);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { questionId } = await params;
    const { error } = await supabaseAdmin.from('questions').delete().eq('id', questionId);
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Admin delete question error:', error);
    return NextResponse.json({ error: 'Failed to delete question' }, { status: 500 });
  }
}
