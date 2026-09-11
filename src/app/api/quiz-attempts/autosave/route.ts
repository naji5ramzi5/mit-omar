import { supabaseAdmin } from '@/lib/supabase';
import { decodeUserId } from '@/lib/admin-auth';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const userId = decodeUserId(req);
    const { quizId, answers, currentSectionId, timeRemainingSeconds } = await req.json();

    if (!quizId) {
      return NextResponse.json({ error: 'quizId is required' }, { status: 400 });
    }

    // If student is logged in, backup active attempt draft to siteSettings
    if (userId) {
      const draftKey = `exam_draft_${userId}_${quizId}`;
      await supabaseAdmin.from('siteSettings').upsert({
        key: draftKey,
        value: JSON.stringify({
          answers: answers || {},
          currentSectionId,
          timeRemainingSeconds,
          updatedAt: new Date().toISOString(),
        }),
        updatedAt: new Date().toISOString(),
      }, { onConflict: 'key' });
    }

    return NextResponse.json({ success: true, savedAt: new Date().toISOString() });
  } catch (error) {
    console.error('Quiz autosave error:', error);
    return NextResponse.json({ error: 'Failed to autosave' }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const userId = decodeUserId(req);
    const { searchParams } = new URL(req.url);
    const quizId = searchParams.get('quizId');

    if (!userId || !quizId) {
      return NextResponse.json({ draft: null });
    }

    const draftKey = `exam_draft_${userId}_${quizId}`;
    const { data } = await supabaseAdmin
      .from('siteSettings')
      .select('value')
      .eq('key', draftKey)
      .maybeSingle();

    if (data?.value) {
      return NextResponse.json({ draft: JSON.parse(data.value) });
    }

    return NextResponse.json({ draft: null });
  } catch {
    return NextResponse.json({ draft: null });
  }
}
