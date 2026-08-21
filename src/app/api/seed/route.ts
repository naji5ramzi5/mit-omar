import { supabaseAdmin } from '@/lib/supabase';
import { NextResponse } from 'next/server';
import { hash } from 'bcryptjs';
import { verifyAdmin } from '@/lib/admin-auth';

export async function POST(req: Request) {
  try {
    const adminId = await verifyAdmin(req);
    if (!adminId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Clean existing data
    await supabaseAdmin.from('lessonProgress').delete().neq('id', '');
    await supabaseAdmin.from('enrollments').delete().neq('id', '');
    await supabaseAdmin.from('notifications').delete().neq('id', '');
    await supabaseAdmin.from('lessons').delete().neq('id', '');
    await supabaseAdmin.from('courses').delete().neq('id', '');
    await supabaseAdmin.from('posts').delete().neq('id', '');
    await supabaseAdmin.from('banners').delete().neq('id', '');
    await supabaseAdmin.from('users').delete().neq('id', '');
    await supabaseAdmin.from('siteSettings').delete().neq('id', '');

    // Create admin user
    const adminPassword = await hash('admin123', 12);
    const { data: admin } = await supabaseAdmin
      .from('users')
      .insert({
        id: 'admin-001',
        name: 'Omar',
        email: 'admin@deutschmitomar.com',
        password: adminPassword,
        role: 'admin',
        locale: 'ar',
      })
      .select()
      .single();

    // Create demo student
    const studentPassword = await hash('student123', 12);
    const { data: student } = await supabaseAdmin
      .from('users')
      .insert({
        id: 'student-001',
        name: 'أحمد محمد',
        email: 'ahmed@example.com',
        password: studentPassword,
        role: 'student',
        locale: 'ar',
      })
      .select()
      .single();

    // Create courses
    const coursesData = [
      {
        id: 'course-a1', titleAr: 'الألمانية للمبتدئين A1', titleDe: 'Deutsch für Anfänger A1', titleEn: 'German for Beginners A1',
        descriptionAr: 'دورة شاملة للمبتدئين تبدأ من الصفر وتأخذك خطوة بخطوة لإتقان أساسيات اللغة الألمانية.',
        descriptionDe: 'Ein umfassender Kurs für Anfänger.', descriptionEn: 'A comprehensive course for beginners.',
        level: 'A1', imageUrl: '/images/berlin/brandenburg-gate.png', order: 1, isActive: true,
      },
      {
        id: 'course-a2', titleAr: 'الألمانية المتوسطة A2', titleDe: 'Deutsch Fortgeschritten A2', titleEn: 'German Intermediate A2',
        descriptionAr: 'تعمق في اللغة الألمانية مع هذه الدورة المتوسطة.',
        descriptionDe: 'Vertiefen Sie Ihre Deutschkenntnisse.', descriptionEn: 'Deepen your German with this intermediate course.',
        level: 'A2', imageUrl: '/images/berlin/reichstag.png', order: 2, isActive: true,
      },
      {
        id: 'course-b1', titleAr: 'الألمانية المتقدمة B1', titleDe: 'Deutsch Aufbaustufe B1', titleEn: 'German Advanced B1',
        descriptionAr: 'دورة متقدمة تأخذك إلى مستوى B1.',
        descriptionDe: 'Ein Fortgeschrittenenkurs auf B1-Niveau.', descriptionEn: 'An advanced course to B1 level.',
        level: 'B1', imageUrl: '/images/berlin/skyline.png', order: 3, isActive: true,
      },
      {
        id: 'course-b2', titleAr: 'الألمانية العليا B2', titleDe: 'Deutsch Oberstufe B2', titleEn: 'German Upper B2',
        descriptionAr: 'دورة متقدمة للمستوى B2.',
        descriptionDe: 'Ein Fortgeschrittenenkurs für B2.', descriptionEn: 'An advanced course for B2 level.',
        level: 'B2', imageUrl: '/images/berlin/cathedral.png', order: 4, isActive: true,
      },
      {
        id: 'course-c1', titleAr: 'الألمانية الاحترافية C1', titleDe: 'Deutsch Professionell C1', titleEn: 'German Professional C1',
        descriptionAr: 'دورة احترافية للمستوى C1.',
        descriptionDe: 'Ein professioneller Kurs für C1.', descriptionEn: 'A professional C1 course.',
        level: 'C1', imageUrl: '/images/berlin/brandenburg-gate.png', order: 5, isActive: true,
      },
    ];

    for (const c of coursesData) {
      await supabaseAdmin.from('courses').insert(c);
    }

    // Create lessons for A1
    const a1Lessons = [
      { titleAr: 'التحيات والتعارف', titleDe: 'Begrüßungen und Vorstellungen', titleEn: 'Greetings and Introductions', duration: 25, order: 1, isFree: true, descriptionAr: 'في هذا الدرس ستتعلم التحيات الأساسية.', descriptionDe: 'Grundlegende Begrüßungen.', descriptionEn: 'Basic greetings.' },
      { titleAr: 'الأرقام والعدّ', titleDe: 'Zahlen und Zählen', titleEn: 'Numbers and Counting', duration: 20, order: 2, isFree: true, descriptionAr: 'تعلم الأرقام من 1 إلى 1000.', descriptionDe: 'Zahlen von 1 bis 1000.', descriptionEn: 'Numbers from 1 to 1000.' },
      { titleAr: 'العائلة والأقارب', titleDe: 'Familie und Verwandte', titleEn: 'Family and Relatives', duration: 30, order: 3, isFree: false, descriptionAr: 'تعرّف على مفردات العائلة.', descriptionDe: 'Familienwortschatz.', descriptionEn: 'Family vocabulary.' },
      { titleAr: 'الطعام والمشروبات', titleDe: 'Essen und Trinken', titleEn: 'Food and Drinks', duration: 28, order: 4, isFree: false, descriptionAr: 'مفردات الطعام والمشروبات.', descriptionDe: 'Essen und Trinken.', descriptionEn: 'Food and drinks.' },
      { titleAr: 'الأوقات واليوم', titleDe: 'Uhrzeiten und Tagesablauf', titleEn: 'Time and Daily Routine', duration: 22, order: 5, isFree: false, descriptionAr: 'تعلم كيف تعبر عن الوقت.', descriptionDe: 'Uhrzeiten angeben.', descriptionEn: 'Expressing time.' },
      { titleAr: 'القواعد الأساسية', titleDe: 'Grundgrammatik', titleEn: 'Basic Grammar', duration: 35, order: 6, isFree: false, descriptionAr: 'أساسيات الأفعال الألمانية.', descriptionDe: 'Grundlagen deutscher Verben.', descriptionEn: 'German verb basics.' },
      { titleAr: 'في المدينة', titleDe: 'In der Stadt', titleEn: 'In the City', duration: 27, order: 7, isFree: false, descriptionAr: 'مفردات المدينة والاتجاهات.', descriptionDe: 'Stadtwortschatz.', descriptionEn: 'City vocabulary.' },
      { titleAr: 'الملابس والتسوق', titleDe: 'Kleidung und Einkaufen', titleEn: 'Clothes and Shopping', duration: 24, order: 8, isFree: false, descriptionAr: 'أسماء الملابس والتسوق.', descriptionDe: 'Kleidung und Einkaufen.', descriptionEn: 'Clothes and shopping.' },
    ];

    for (const l of a1Lessons) {
      await supabaseAdmin.from('lessons').insert({ id: `a1-lesson-${l.order}`, courseId: 'course-a1', ...l });
    }

    // A2 lessons
    const a2Lessons = [
      { titleAr: 'قواعد الصفة', titleDe: 'Adjektivdeklination', titleEn: 'Adjective Declension', duration: 35, order: 1, isFree: true, descriptionAr: 'إعراب الصفات.', descriptionDe: 'Adjektivdeklination.', descriptionEn: 'Adjective declension.' },
      { titleAr: 'الأزمنة الماضية', titleDe: 'Vergangenheitszeiten', titleEn: 'Past Tenses', duration: 40, order: 2, isFree: false, descriptionAr: 'الماضي البسيط والتام.', descriptionDe: 'Präteritum und Perfekt.', descriptionEn: 'Simple past and perfect.' },
      { titleAr: 'الصحة والجسم', titleDe: 'Gesundheit und Körper', titleEn: 'Health and Body', duration: 28, order: 3, isFree: false, descriptionAr: 'مفردات الصحة.', descriptionDe: 'Gesundheitswortschatz.', descriptionEn: 'Health vocabulary.' },
      { titleAr: 'السفر والنقل', titleDe: 'Reisen und Transport', titleEn: 'Travel and Transport', duration: 32, order: 4, isFree: false, descriptionAr: 'كيف تحجز تذكرة.', descriptionDe: 'Ticketbuchung.', descriptionEn: 'Booking tickets.' },
      { titleAr: 'العمل والمهنة', titleDe: 'Arbeit und Beruf', titleEn: 'Work and Profession', duration: 30, order: 5, isFree: false, descriptionAr: 'مفردات العمل.', descriptionDe: 'Arbeitswortschatz.', descriptionEn: 'Work vocabulary.' },
    ];

    for (const l of a2Lessons) {
      await supabaseAdmin.from('lessons').insert({ id: `a2-lesson-${l.order}`, courseId: 'course-a2', ...l });
    }

    // B1 lessons
    const b1Lessons = [
      { titleAr: 'الجمل الشرطية', titleDe: 'Bedingungssätze', titleEn: 'Conditional Sentences', duration: 38, order: 1, isFree: true, descriptionAr: 'تعلم بناء الجمل الشرطية.', descriptionDe: 'Konditionalsätze.', descriptionEn: 'Conditional sentences.' },
      { titleAr: 'الكلام المنقول', titleDe: 'Indirekte Rede', titleEn: 'Reported Speech', duration: 35, order: 2, isFree: false, descriptionAr: 'نقل ما قاله شخص آخر.', descriptionDe: 'Indirekte Rede.', descriptionEn: 'Reported speech.' },
      { titleAr: 'الربط بين الجمل', titleDe: 'Satzverbindungen', titleEn: 'Sentence Connections', duration: 30, order: 3, isFree: false, descriptionAr: 'حروف الربط.', descriptionDe: 'Konjunktionen.', descriptionEn: 'Conjunctions.' },
      { titleAr: 'الثقافة والمجتمع', titleDe: 'Kultur und Gesellschaft', titleEn: 'Culture and Society', duration: 33, order: 4, isFree: false, descriptionAr: 'مواضيع ثقافية.', descriptionDe: 'Kulturelle Themen.', descriptionEn: 'Cultural topics.' },
    ];

    for (const l of b1Lessons) {
      await supabaseAdmin.from('lessons').insert({ id: `b1-lesson-${l.order}`, courseId: 'course-b1', ...l });
    }

    // B2 and C1 lessons
    for (let i = 1; i <= 4; i++) {
      await supabaseAdmin.from('lessons').insert({
        id: `b2-lesson-${i}`, courseId: 'course-b2',
        titleAr: `درس B2 - ${i}`, titleDe: `B2 Lektion ${i}`, titleEn: `B2 Lesson ${i}`,
        descriptionAr: 'درس متقدم', descriptionDe: 'Fortgeschrittene Lektion', descriptionEn: 'Advanced lesson',
        duration: 30 + i * 5, order: i, isFree: i === 1,
      });
    }

    for (let i = 1; i <= 3; i++) {
      await supabaseAdmin.from('lessons').insert({
        id: `c1-lesson-${i}`, courseId: 'course-c1',
        titleAr: `درس C1 - ${i}`, titleDe: `C1 Lektion ${i}`, titleEn: `C1 Lesson ${i}`,
        descriptionAr: 'درس احترافي', descriptionDe: 'Professionelle Lektion', descriptionEn: 'Professional lesson',
        duration: 35 + i * 5, order: i, isFree: i === 1,
      });
    }

    // Create posts
    await supabaseAdmin.from('posts').insert([
      {
        id: 'post-1', titleAr: 'أهمية تعلم اللغة الألمانية', titleDe: 'Die Bedeutung des Deutschlernens', titleEn: 'The Importance of Learning German',
        contentAr: 'تعلم اللغة الألمانية يفتح أبواباً عديدة.', contentDe: 'Das Deutschlernen öffnet viele Türen.', contentEn: 'Learning German opens many doors.',
        excerptAr: 'اكتشف لماذا يزداد الاهتمام.', excerptDe: 'Entdecken Sie das Interesse.', excerptEn: 'Discover the growing interest.',
        category: 'education', imageUrl: '/images/berlin/brandenburg-gate.png', isPublished: true,
      },
      {
        id: 'post-2', titleAr: 'نصائح لاجتياز امتحان B1', titleDe: 'Tipps für die B1-Prüfung', titleEn: 'Tips for B1 Exam',
        contentAr: 'امتحان B1 هو خطوة مهمة.', contentDe: 'Die B1-Prüfung ist wichtig.', contentEn: 'The B1 exam is important.',
        excerptAr: 'دليلك للتحضير.', excerptDe: 'Ihr Leitfaden.', excerptEn: 'Your guide.',
        category: 'exams', imageUrl: '/images/berlin/reichstag.png', isPublished: true,
      },
      {
        id: 'post-3', titleAr: 'الحياة في برلين', titleDe: 'Leben in Berlin', titleEn: 'Life in Berlin',
        contentAr: 'برلين مدينة متنوعة.', contentDe: 'Berlin ist vielfältig.', contentEn: 'Berlin is diverse.',
        excerptAr: 'كل ما تحتاج معرفته.', excerptDe: 'Alles was Sie wissen müssen.', excerptEn: 'Everything you need to know.',
        category: 'lifestyle', imageUrl: '/images/berlin/skyline.png', isPublished: true,
      },
      {
        id: 'post-4', titleAr: 'الفرق بين Präteritum و Perfekt', titleDe: 'Präteritum vs Perfekt', titleEn: 'Präteritum vs Perfekt',
        contentAr: 'من أكثر المواضيع إرباكاً.', contentDe: 'Verwirrendes Thema.', contentEn: 'Confusing topic.',
        excerptAr: 'شرح مبسط.', excerptDe: 'Einfache Erklärung.', excerptEn: 'Simple explanation.',
        category: 'grammar', imageUrl: '/images/berlin/cathedral.png', isPublished: true,
      },
    ]);

    // Create banners
    await supabaseAdmin.from('banners').insert([
      { id: 'banner-1', titleAr: 'تعلم الألمانية', titleDe: 'Deutsch lernen', titleEn: 'Learn German', descriptionAr: 'رحلة تعليمية فريدة', descriptionDe: 'Einzigartige Lernreise', descriptionEn: 'Unique learning journey', imageUrl: '/images/berlin/brandenburg-gate.png', labelAr: 'تعلم', labelDe: 'Lernen', labelEn: 'Learn', order: 1, isActive: true },
      { id: 'banner-2', titleAr: 'ثقافة. لغة. مستقبل.', titleDe: 'Kultur. Sprache. Zukunft.', titleEn: 'Culture. Language. Future.', descriptionAr: 'أسلوب عصري', descriptionDe: 'Moderne Weise', descriptionEn: 'Modern way', imageUrl: '/images/berlin/reichstag.png', labelAr: 'ثقافة', labelDe: 'Kultur', labelEn: 'Culture', order: 2, isActive: true },
      { id: 'banner-3', titleAr: 'ابدأ رحلتك', titleDe: 'Beginnen Sie Ihre Reise', titleEn: 'Start Your Journey', descriptionAr: 'من المبتدئ إلى المتقدم', descriptionDe: 'Von Anfänger bis Fortgeschritten', descriptionEn: 'From beginner to advanced', imageUrl: '/images/berlin/skyline.png', labelAr: 'مستقبلك', labelDe: 'Zukunft', labelEn: 'Future', order: 3, isActive: true },
      { id: 'banner-4', titleAr: 'أحلامك تبدأ بلغة جديدة', titleDe: 'Träume beginnen neu', titleEn: 'Dreams begin new', descriptionAr: 'انضم إلى مئات الطلاب', descriptionDe: 'Schließen Sie sich an', descriptionEn: 'Join hundreds', imageUrl: '/images/berlin/cathedral.png', labelAr: 'برلين', labelDe: 'Berlin', labelEn: 'Berlin', order: 4, isActive: true },
    ]);

    // Create notifications
    if (student) {
      await supabaseAdmin.from('notifications').insert([
        { userId: student.id, titleAr: 'دورة جديدة', titleDe: 'Neuer Kurs', titleEn: 'New Course', messageAr: 'تم إضافة دورة C1', messageDe: 'C1 Kurs hinzugefügt', messageEn: 'C1 course added', type: 'course', isRead: false },
        { userId: student.id, titleAr: 'إعلان', titleDe: 'Ankündigung', titleEn: 'Announcement', messageAr: 'مرحباً بكم!', messageDe: 'Willkommen!', messageEn: 'Welcome!', type: 'announcement', isRead: false },
      ]);
    }

    // Enrollments
    if (student) {
      const thirtyDays = new Date();
      thirtyDays.setDate(thirtyDays.getDate() + 30);
      await supabaseAdmin.from('enrollments').insert({
        userId: student.id, courseId: 'course-a1', code: 'OMAR-A1-2024',
        activatedAt: new Date().toISOString(), expiresAt: thirtyDays.toISOString(), isActive: true,
      });
    }

    // Lesson progress
    if (student) {
      await supabaseAdmin.from('lessonProgress').insert([
        { userId: student.id, lessonId: 'a1-lesson-1', completed: true, watchedSeconds: 1500, lastWatchedAt: new Date().toISOString() },
        { userId: student.id, lessonId: 'a1-lesson-2', completed: true, watchedSeconds: 1200, lastWatchedAt: new Date().toISOString() },
        { userId: student.id, lessonId: 'a1-lesson-3', completed: false, watchedSeconds: 600, lastWatchedAt: new Date().toISOString() },
      ]);
    }

    // Activation codes
    const codes = ['FREE-A1', 'FREE-A2', 'FREE-B1', 'FREE-B2', 'FREE-C1'];
    const courseIds = ['course-a1', 'course-a2', 'course-b1', 'course-b2', 'course-c1'];
    for (let i = 0; i < courseIds.length; i++) {
      await supabaseAdmin.from('siteSettings').upsert(
        { key: `activation_code_${courseIds[i]}`, value: codes[i] },
        { onConflict: 'key' }
      );
    }

    // Stats
    await supabaseAdmin.from('siteSettings').upsert([
      { key: 'stats_students', value: '500' },
      { key: 'stats_years', value: '8' },
      { key: 'stats_courses', value: '15' },
      { key: 'stats_lessons', value: '200' },
    ], { onConflict: 'key' });

    return NextResponse.json({ success: true, message: 'Database seeded successfully' });
  } catch (error) {
    console.error('Seed error:', error);
    return NextResponse.json({ success: false, error: 'Seed failed' }, { status: 500 });
  }
}
