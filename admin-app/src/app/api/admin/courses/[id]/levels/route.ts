import { supabaseAdmin } from '@/lib/supabase';
import { verifyAdmin } from '@/lib/admin-auth';
import { NextResponse } from 'next/server';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await verifyAdmin(req);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id: courseId } = await params;

    // Check if course exists
    const { data: course, error: courseErr } = await supabaseAdmin
      .from('courses')
      .select('id, level, titleAr, titleDe, titleEn')
      .eq('id', courseId)
      .single();

    if (courseErr || !course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    // Attempt to query course_levels
    const { data: levels, error } = await supabaseAdmin
      .from('course_levels')
      .select('*')
      .eq('courseId', courseId)
      .order('order', { ascending: true });

    if (error) {
      // If table doesn't exist yet or other query error, return synthesized default level
      console.warn('Could not query course_levels:', error.message);
      const { count } = await supabaseAdmin
        .from('lessons')
        .select('*', { count: 'exact', head: true })
        .eq('courseId', courseId);

      return NextResponse.json({
        levels: [
          {
            id: 'legacy-level-' + course.id,
            courseId: course.id,
            name: course.level || 'A1',
            titleAr: 'المستوى ' + (course.level || 'A1'),
            titleDe: 'Stufe ' + (course.level || 'A1'),
            titleEn: 'Level ' + (course.level || 'A1'),
            order: 0,
            isActive: true,
            _count: { lessons: count || 0 },
          },
        ],
      });
    }

    // If levels exist, fetch lesson count for each level
    const levelList = levels || [];

    // If no levels yet exist for this course, auto-create the initial level
    if (levelList.length === 0) {
      const defaultName = course.level || 'A1';
      const { data: newLevel } = await supabaseAdmin
        .from('course_levels')
        .insert({
          courseId,
          name: defaultName,
          titleAr: 'المستوى ' + defaultName,
          titleDe: 'Stufe ' + defaultName,
          titleEn: 'Level ' + defaultName,
          order: 0,
          isActive: true,
        })
        .select()
        .single();

      if (newLevel) {
        // Link any unassigned lessons to this new level
        await supabaseAdmin
          .from('lessons')
          .update({ levelId: newLevel.id })
          .eq('courseId', courseId)
          .is('levelId', null);

        const { count } = await supabaseAdmin
          .from('lessons')
          .select('*', { count: 'exact', head: true })
          .eq('courseId', courseId);

        return NextResponse.json({
          levels: [{ ...newLevel, _count: { lessons: count || 0 } }],
        });
      }
    }

    // Fetch lesson counts per level
    const { data: lessons } = await supabaseAdmin
      .from('lessons')
      .select('id, levelId, courseId')
      .eq('courseId', courseId);

    const lessonCountMap = new Map<string, number>();
    for (const l of lessons || []) {
      if (l.levelId) {
        lessonCountMap.set(l.levelId, (lessonCountMap.get(l.levelId) || 0) + 1);
      }
    }

    const normalized = levelList.map((lvl) => ({
      ...lvl,
      _count: {
        lessons: lessonCountMap.get(lvl.id) ?? 0,
      },
    }));

    return NextResponse.json({ levels: normalized });
  } catch (error) {
    console.error('Admin get course levels error:', error);
    return NextResponse.json({ error: 'Failed to fetch course levels' }, { status: 500 });
  }
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await verifyAdmin(req);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id: courseId } = await params;
    const body = await req.json();
    const {
      name,
      titleAr,
      titleDe,
      titleEn,
      descriptionAr,
      descriptionDe,
      descriptionEn,
      imageUrl,
      introVideoUrl,
      order,
      isActive,
    } = body;

    if (!name || !titleAr || !titleDe || !titleEn) {
      return NextResponse.json({ error: 'Missing required level fields' }, { status: 400 });
    }

    // Insert into course_levels
    const { data: level, error } = await supabaseAdmin
      .from('course_levels')
      .insert({
        courseId,
        name: name.trim().toUpperCase(),
        titleAr: titleAr.trim(),
        titleDe: titleDe.trim(),
        titleEn: titleEn.trim(),
        descriptionAr: descriptionAr || '',
        descriptionDe: descriptionDe || '',
        descriptionEn: descriptionEn || '',
        imageUrl: imageUrl || null,
        introVideoUrl: introVideoUrl || null,
        order: order ?? 0,
        isActive: isActive ?? true,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ level: { ...level, _count: { lessons: 0 } } }, { status: 201 });
  } catch (error) {
    console.error('Admin create course level error:', error);
    return NextResponse.json({ error: 'Failed to create course level' }, { status: 500 });
  }
}
