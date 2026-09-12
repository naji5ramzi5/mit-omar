import { supabaseAdmin } from '@/lib/supabase';
import { decodeUserId } from '@/lib/admin-auth';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const listId = searchParams.get('listId');
    const lessonId = searchParams.get('lessonId');

    if (!listId && !lessonId) {
      return NextResponse.json({ error: 'listId or lessonId is required' }, { status: 400 });
    }

    const userId = decodeUserId(req);

    // 1. If fetching for a specific lesson: verify access permissions
    if (lessonId) {
      const { data: lesson } = await supabaseAdmin
        .from('lessons')
        .select('id, courseId, isFree')
        .eq('id', lessonId)
        .maybeSingle();

      if (!lesson) {
        return NextResponse.json({ error: 'الدرس غير موجود' }, { status: 404 });
      }

      // If lesson is paid, enforce active enrollment
      if (!lesson.isFree) {
        if (!userId) {
          return NextResponse.json(
            { error: 'unauthorized', message: 'يجب تسجيل الدخول للوصول إلى بطاقات هذا الدرس' },
            { status: 401 }
          );
        }

        const { data: enrollment } = await supabaseAdmin
          .from('enrollments')
          .select('isActive, expiresAt')
          .eq('userId', userId)
          .eq('courseId', lesson.courseId)
          .maybeSingle();

        if (!enrollment || !enrollment.isActive) {
          return NextResponse.json(
            { error: 'not_enrolled', message: 'بطاقات هذا الدرس تتطلب كود تفعيل نشطاً للكورس' },
            { status: 403 }
          );
        }

        if (enrollment.expiresAt && new Date(enrollment.expiresAt).getTime() <= Date.now()) {
          return NextResponse.json(
            { error: 'access_expired', message: 'انتهت صلاحية الوصول إلى هذا الكورس' },
            { status: 403 }
          );
        }
      }

      // Query words specifically attached to this lesson
      const { data: words, error } = await supabaseAdmin
        .from('words')
        .select('*')
        .eq('lessonId', lessonId)
        .eq('published', true)
        .order('order', { ascending: true });

      if (error) {
        // If lessonId column not yet created in DB schema cache, return empty cards
        if (error.code === 'PGRST204') {
          return NextResponse.json({ cards: [] });
        }
        throw error;
      }

      const cards = (words || []).map((w: any) => ({
        id: w.id,
        wordDe: w.wordDe,
        wordAr: w.wordAr,
        wordEn: w.wordEn,
        exampleDe: w.exampleDe || '',
        exampleAr: w.example_ar || w.exampleAr || '',
        exampleEn: w.example_en || w.exampleEn || '',
        audioUrl: w.audio_url || null,
        imageUrl: w.imageUrl || null,
        order: w.order ?? 0,
      }));

      return NextResponse.json({ cards });
    }

    // 2. Otherwise: fetch published words for the word list
    const { data: words, error } = await supabaseAdmin
      .from('words')
      .select('id, wordDe, wordAr, wordEn, exampleDe, example_ar, example_en, audio_url, published, order')
      .eq('listId', listId)
      .eq('published', true)
      .order('order', { ascending: true });

    if (error) throw error;
    if (!words?.length) return NextResponse.json({ cards: [] });

    // Map to clean shape
    const allCards = words.map((w: any) => ({
      id: w.id,
      wordDe: w.wordDe,
      wordAr: w.wordAr,
      wordEn: w.wordEn,
      exampleDe: w.exampleDe || '',
      exampleAr: w.example_ar || w.exampleAr || '',
      exampleEn: w.example_en || w.exampleEn || '',
      audioUrl: w.audio_url || null,
    }));

    // For authenticated users: filter to spaced-repetition due cards if list view
    if (userId) {
      const { data: progress } = await supabaseAdmin
        .from('word_progress')
        .select('wordId, due')
        .eq('userId', userId)
        .lte('due', new Date().toISOString());

      if (progress?.length) {
        const dueSet = new Set(progress.map((p) => p.wordId));
        const dueCards = allCards.filter((c) => dueSet.has(c.id));
        if (dueCards.length > 0) {
          return NextResponse.json({ cards: dueCards });
        }
      }
    }

    return NextResponse.json({ cards: allCards.slice(0, 50) });
  } catch (error) {
    console.error('Flashcards fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch flashcards' }, { status: 500 });
  }
}