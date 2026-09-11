import { supabaseAdmin } from '@/lib/supabase';
import { verifyAdmin } from '@/lib/admin-auth';
import { NextResponse } from 'next/server';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await verifyAdmin(req);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const { data: quiz, error } = await supabaseAdmin
      .from('quizzes')
      .select('*, questions(*)')
      .eq('id', id)
      .single();

    if (error || !quiz) {
      return NextResponse.json({ error: 'Quiz not found' }, { status: 404 });
    }

    let meta: any = {};
    const { data: metaSetting } = await supabaseAdmin
      .from('siteSettings')
      .select('value')
      .eq('key', `quiz_meta_${id}`)
      .maybeSingle();

    if (metaSetting?.value) {
      try {
        meta = JSON.parse(metaSetting.value);
      } catch {}
    }

    return NextResponse.json({
      quiz: {
        ...quiz,
        durationMinutes: meta.durationMinutes ?? 30,
        passingScore: meta.passingScore ?? 60,
        allowedAttempts: meta.allowedAttempts ?? 0,
        showDetailedResults: meta.showDetailedResults ?? true,
        instructionsAr: meta.instructionsAr || '',
        instructionsDe: meta.instructionsDe || '',
        sections: meta.sections || [],
        examType: meta.examType || 'general',
      },
    });
  } catch (error) {
    console.error('Admin get quiz error:', error);
    return NextResponse.json({ error: 'Failed to get quiz' }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await verifyAdmin(req);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const body = await req.json();
    const {
      level, titleAr, titleDe, titleEn,
      descriptionAr, descriptionDe, descriptionEn,
      isActive,
      durationMinutes, passingScore, allowedAttempts,
      showDetailedResults, instructionsAr, instructionsDe,
      sections, examType,
    } = body;

    const updateData: Record<string, unknown> = {};
    if (level !== undefined) updateData.level = level;
    if (titleAr !== undefined) updateData.titleAr = titleAr;
    if (titleDe !== undefined) updateData.titleDe = titleDe;
    if (titleEn !== undefined) updateData.titleEn = titleEn;
    if (descriptionAr !== undefined) updateData.descriptionAr = descriptionAr || null;
    if (descriptionDe !== undefined) updateData.descriptionDe = descriptionDe || null;
    if (descriptionEn !== undefined) updateData.descriptionEn = descriptionEn || null;
    if (isActive !== undefined) updateData.isActive = isActive;
    updateData.updatedAt = new Date().toISOString();

    const { data: quiz, error } = await supabaseAdmin
      .from('quizzes')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // Update extended exam metadata in siteSettings
    const { data: existingMetaSetting } = await supabaseAdmin
      .from('siteSettings')
      .select('value')
      .eq('key', `quiz_meta_${id}`)
      .maybeSingle();

    let metaPayload: any = {};
    if (existingMetaSetting?.value) {
      try { metaPayload = JSON.parse(existingMetaSetting.value); } catch {}
    }

    if (durationMinutes !== undefined) metaPayload.durationMinutes = Number(durationMinutes);
    if (passingScore !== undefined) metaPayload.passingScore = Number(passingScore);
    if (allowedAttempts !== undefined) metaPayload.allowedAttempts = Number(allowedAttempts);
    if (showDetailedResults !== undefined) metaPayload.showDetailedResults = showDetailedResults;
    if (instructionsAr !== undefined) metaPayload.instructionsAr = instructionsAr;
    if (instructionsDe !== undefined) metaPayload.instructionsDe = instructionsDe;
    if (sections !== undefined) metaPayload.sections = sections;
    if (examType !== undefined) metaPayload.examType = examType;
    metaPayload.updatedAt = new Date().toISOString();

    await supabaseAdmin.from('siteSettings').upsert({
      key: `quiz_meta_${id}`,
      value: JSON.stringify(metaPayload),
      updatedAt: new Date().toISOString(),
    }, { onConflict: 'key' });

    return NextResponse.json({
      quiz: {
        ...quiz,
        ...metaPayload,
      },
    });
  } catch (error) {
    console.error('Admin update quiz error:', error);
    return NextResponse.json({ error: 'Failed to update quiz' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await verifyAdmin(req);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;

    // Delete questions and attempts
    await supabaseAdmin.from('questions').delete().eq('quizId', id);
    await supabaseAdmin.from('quizAttempts').delete().eq('quizId', id);

    // Delete quiz
    const { error } = await supabaseAdmin.from('quizzes').delete().eq('id', id);
    if (error) throw error;

    // Delete meta from siteSettings
    await supabaseAdmin.from('siteSettings').delete().eq('key', `quiz_meta_${id}`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Admin delete quiz error:', error);
    return NextResponse.json({ error: 'Failed to delete quiz' }, { status: 500 });
  }
}
