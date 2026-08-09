import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import { hash } from 'bcryptjs';

export async function POST() {
  try {
    // Clean existing data
    await db.lessonProgress.deleteMany();
    await db.enrollment.deleteMany();
    await db.notification.deleteMany();
    await db.lesson.deleteMany();
    await db.course.deleteMany();
    await db.post.deleteMany();
    await db.banner.deleteMany();
    await db.user.deleteMany();
    await db.siteSetting.deleteMany();

    // Create admin user
    const adminPassword = await hash('admin123', 12);
    const admin = await db.user.create({
      data: {
        id: 'admin-001',
        name: 'Omar',
        email: 'admin@deutschmitomar.com',
        password: adminPassword,
        role: 'admin',
        locale: 'ar',
      },
    });

    // Create a demo student
    const studentPassword = await hash('student123', 12);
    const student = await db.user.create({
      data: {
        id: 'student-001',
        name: 'أحمد محمد',
        email: 'ahmed@example.com',
        password: studentPassword,
        role: 'student',
        locale: 'ar',
      },
    });

    // Create courses
    const courseA1 = await db.course.create({
      data: {
        id: 'course-a1',
        titleAr: 'الألمانية للمبتدئين A1',
        titleDe: 'Deutsch für Anfänger A1',
        titleEn: 'German for Beginners A1',
        descriptionAr: 'دورة شاملة للمبتدئين تبدأ من الصفر وتأخذك خطوة بخطوة لإتقان أساسيات اللغة الألمانية. ستتعلم التحيات، التعارف، الأرقام، الوقت، والكثير من المفردات والقواعد الأساسية.',
        descriptionDe: 'Ein umfassender Kurs für Anfänger, der Sie von Grund auf Schritt für Schritt zu den Grundlagen der deutschen Sprache führt. Sie lernen Begrüßungen, Vorstellungen, Zahlen, Uhrzeiten und viele Vokabeln und Grundgrammatik.',
        descriptionEn: 'A comprehensive course for beginners that takes you from zero, step by step, to mastering German basics. You will learn greetings, introductions, numbers, time, and many basic vocabulary and grammar rules.',
        level: 'A1',
        imageUrl: '/images/berlin/brandenburg-gate.png',
        order: 1,
        isActive: true,
      },
    });

    const courseA2 = await db.course.create({
      data: {
        id: 'course-a2',
        titleAr: 'الألمانية المتوسطة A2',
        titleDe: 'Deutsch Fortgeschritten A2',
        titleEn: 'German Intermediate A2',
        descriptionAr: 'تعمق في اللغة الألمانية مع هذه الدورة المتوسطة. ستتعامل مع مواضيع يومية أعمق وتطوير مهارات المحادثة والقراءة والكتابة بشكل ملحوظ.',
        descriptionDe: 'Vertiefen Sie Ihre Deutschkenntnisse mit diesem Mittelstufenkurs. Sie werden alltäglichere Themen behandeln und Ihre Konversations-, Lese- und Schreibfähigkeiten spürbar verbessern.',
        descriptionEn: 'Deepen your German with this intermediate course. You will deal with deeper everyday topics and noticeably improve your conversation, reading, and writing skills.',
        level: 'A2',
        imageUrl: '/images/berlin/reichstag.png',
        order: 2,
        isActive: true,
      },
    });

    const courseB1 = await db.course.create({
      data: {
        id: 'course-b1',
        titleAr: 'الألمانية المتقدمة B1',
        titleDe: 'Deutsch Aufbaustufe B1',
        titleEn: 'German Advanced B1',
        descriptionAr: 'دورة متقدمة تأخذك إلى مستوى B1 حيث يمكنك التعبير عن آرائك بوضوح والتعامل مع معظم المواقف اليومية باللغة الألمانية.',
        descriptionDe: 'Ein Fortgeschrittenenkurs, der Sie auf das Niveau B1 bringt, wo Sie Ihre Meinungen klar ausdrücken und mit den meisten Alltagssituationen auf Deutsch umgehen können.',
        descriptionEn: 'An advanced course that takes you to B1 level where you can clearly express your opinions and handle most everyday situations in German.',
        level: 'B1',
        imageUrl: '/images/berlin/skyline.png',
        order: 3,
        isActive: true,
      },
    });

    const courseB2 = await db.course.create({
      data: {
        id: 'course-b2',
        titleAr: 'الألمانية العليا B2',
        titleDe: 'Deutsch Oberstufe B2',
        titleEn: 'German Upper B2',
        descriptionAr: 'دورة متقدمة للمستوى B2 تركز على فهم النصوص المعقدة والمشاركة في المناقشات التخصصية والتعبير بكفاءة عالية.',
        descriptionDe: 'Ein Fortgeschrittenenkurs für das Niveau B2 mit Fokus auf das Verstehen komplexer Texte und die Teilnahme an fachlichen Diskussionen.',
        descriptionEn: 'An advanced course for B2 level focusing on understanding complex texts and participating in specialized discussions with high proficiency.',
        level: 'B2',
        imageUrl: '/images/berlin/cathedral.png',
        order: 4,
        isActive: true,
      },
    });

    const courseC1 = await db.course.create({
      data: {
        id: 'course-c1',
        titleAr: 'الألمانية الاحترافية C1',
        titleDe: 'Deutsch Professionell C1',
        titleEn: 'German Professional C1',
        descriptionAr: 'دورة احترافية للمستوى C1 للطلاب الذين يرغبون في إتقان اللغة الألمانية بشكل كامل والتعامل مع السياقات الأكاديمية والمهنية.',
        descriptionDe: 'Ein professioneller Kurs für das Niveau C1 für Schüler, die die deutsche Sprache vollständig beherrschen und akademische sowie berufliche Kontexte bewältigen möchten.',
        descriptionEn: 'A professional C1 course for students who want to fully master German and handle academic and professional contexts.',
        level: 'C1',
        imageUrl: '/images/berlin/brandenburg-gate.png',
        order: 5,
        isActive: true,
      },
    });

    // Create lessons for A1
    const a1Lessons = [
      { titleAr: 'التحيات والتعارف', titleDe: 'Begrüßungen und Vorstellungen', titleEn: 'Greetings and Introductions', duration: 25, order: 1, isFree: true, descriptionAr: 'في هذا الدرس ستتعلم التحيات الأساسية وكيف تقدم نفسك باللغة الألمانية.', descriptionDe: 'In dieser Lektion lernen Sie grundlegende Begrüßungen und stellen sich auf Deutsch vor.', descriptionEn: 'In this lesson you will learn basic greetings and introduce yourself in German.' },
      { titleAr: 'الأرقام والعدّ', titleDe: 'Zahlen und Zählen', titleEn: 'Numbers and Counting', duration: 20, order: 2, isFree: true, descriptionAr: 'تعلم الأرقام من 1 إلى 1000 وكيفية استخدامها في الحياة اليومية.', descriptionDe: 'Lernen Sie die Zahlen von 1 bis 1000 und deren Verwendung im Alltag.', descriptionEn: 'Learn numbers from 1 to 1000 and how to use them in daily life.' },
      { titleAr: 'العائلة والأقارب', titleDe: 'Familie und Verwandte', titleEn: 'Family and Relatives', duration: 30, order: 3, isFree: false, descriptionAr: 'تعرّف على مفردات العائلة وكيف تتحدث عن أسرتك.', descriptionDe: 'Lernen Sie den Familienwortschatz und sprechen Sie über Ihre Familie.', descriptionEn: 'Learn family vocabulary and talk about your family.' },
      { titleAr: 'الطعام والمشروبات', titleDe: 'Essen und Trinken', titleEn: 'Food and Drinks', duration: 28, order: 4, isFree: false, descriptionAr: 'مفردات الطعام والمشروبات وكيفية الطلب في المطعم.', descriptionDe: 'Wortschatz zu Essen und Trinken und Bestellen im Restaurant.', descriptionEn: 'Food and drink vocabulary and how to order in a restaurant.' },
      { titleAr: 'الأوقات واليوم', titleDe: 'Uhrzeiten und Tagesablauf', titleEn: 'Time and Daily Routine', duration: 22, order: 5, isFree: false, descriptionAr: 'تعلم كيف تعبر عن الوقت وتصف يومك بالألمانية.', descriptionDe: 'Lernen Sie, die Uhrzeit anzugeben und Ihren Tag auf Deutsch zu beschreiben.', descriptionEn: 'Learn to express time and describe your day in German.' },
      { titleAr: 'القواعد الأساسية - الأفعال', titleDe: 'Grundgrammatik - Verben', titleEn: 'Basic Grammar - Verbs', duration: 35, order: 6, isFree: false, descriptionAr: 'أساسيات الأفعال الألمانية والتصريف في الزمن الحاضر.', descriptionDe: 'Grundlagen deutscher Verben und Konjugation im Präsens.', descriptionEn: 'Basics of German verbs and conjugation in the present tense.' },
      { titleAr: 'في المدينة', titleDe: 'In der Stadt', titleEn: 'In the City', duration: 27, order: 7, isFree: false, descriptionAr: 'مفردات المدينة والاتجاهات والتنقل.', descriptionDe: 'Stadtwortschatz, Wegbeschreibungen und Fortbewegung.', descriptionEn: 'City vocabulary, directions, and getting around.' },
      { titleAr: 'الملابس والتسوق', titleDe: 'Kleidung und Einkaufen', titleEn: 'Clothes and Shopping', duration: 24, order: 8, isFree: false, descriptionAr: 'تعلم أسماء الملابس والعبارات المستخدمة في التسوق.', descriptionDe: 'Lernen Sie Kleidungsstücke und Einkaufsphrasen.', descriptionEn: 'Learn clothing names and shopping phrases.' },
    ];

    for (const lesson of a1Lessons) {
      await db.lesson.create({
        data: {
          id: `a1-lesson-${lesson.order}`,
          courseId: courseA1.id,
          ...lesson,
        },
      });
    }

    // Create lessons for A2
    const a2Lessons = [
      { titleAr: 'قواعد الصفة', titleDe: 'Adjektivdeklination', titleEn: 'Adjective Declension', duration: 35, order: 1, isFree: true, descriptionAr: 'تعلم إعراب الصفات في الحالات الأربع.', descriptionDe: 'Lernen Sie die Adjektivdeklination in den vier Fällen.', descriptionEn: 'Learn adjective declension in the four cases.' },
      { titleAr: 'الأزمنة الماضية', titleDe: 'Vergangenheitszeiten', titleEn: 'Past Tenses', duration: 40, order: 2, isFree: false, descriptionAr: 'الماضي البسيط (Präteritum) والماضي التام (Perfekt).', descriptionDe: 'Präteritum und Perfekt.', descriptionEn: 'Simple past (Präteritum) and perfect tense (Perfekt).' },
      { titleAr: 'الصحة والجسم', titleDe: 'Gesundheit und Körper', titleEn: 'Health and Body', duration: 28, order: 3, isFree: false, descriptionAr: 'مفردات الصحة والجسم والزيارة للطبيب.', descriptionDe: 'Gesundheitswortschatz und Arztbesuch.', descriptionEn: 'Health vocabulary and visiting the doctor.' },
      { titleAr: 'السفر والنقل', titleDe: 'Reisen und Transport', titleEn: 'Travel and Transport', duration: 32, order: 4, isFree: false, descriptionAr: 'كيف تحجز تذكرة وتتحدث عن السفر.', descriptionDe: 'Ticketbuchung und über Reisen sprechen.', descriptionEn: 'How to book a ticket and talk about travel.' },
      { titleAr: 'العمل والمهنة', titleDe: 'Arbeit und Beruf', titleEn: 'Work and Profession', duration: 30, order: 5, isFree: false, descriptionAr: 'مفردات العمل والتوظيف وكتابة سيرة ذاتية.', descriptionDe: 'Arbeitswortschatz und Lebenslauf.', descriptionEn: 'Work vocabulary and writing a resume.' },
    ];

    for (const lesson of a2Lessons) {
      await db.lesson.create({
        data: {
          id: `a2-lesson-${lesson.order}`,
          courseId: courseA2.id,
          ...lesson,
        },
      });
    }

    // Create lessons for B1
    const b1Lessons = [
      { titleAr: 'الجمل الشرطية', titleDe: 'Bedingungssätze', titleEn: 'Conditional Sentences', duration: 38, order: 1, isFree: true, descriptionAr: 'إذا، لو، بشرط - تعلم بناء الجمل الشرطية.', descriptionDe: 'Wenn, falls, unter der Bedingung - Konditionalsätze.', descriptionEn: 'If, provided that - learn to build conditional sentences.' },
      { titleAr: 'الكلام المنقول', titleDe: 'Indirekte Rede', titleEn: 'Reported Speech', duration: 35, order: 2, isFree: false, descriptionAr: 'كيف تنقل ما قاله شخص آخر.', descriptionDe: 'Wie man wiedergibt, was jemand gesagt hat.', descriptionEn: 'How to relay what someone else said.' },
      { titleAr: 'الربط بين الجمل', titleDe: 'Satzverbindungen', titleEn: 'Sentence Connections', duration: 30, order: 3, isFree: false, descriptionAr: 'استخدام حروف الربط وأدوات الاتصال.', descriptionDe: 'Verwendung von Konjunktionen und Bindewörtern.', descriptionEn: 'Using conjunctions and connectors.' },
      { titleAr: 'الثقافة والمجتمع', titleDe: 'Kultur und Gesellschaft', titleEn: 'Culture and Society', duration: 33, order: 4, isFree: false, descriptionAr: 'نقاشات حول المواضيع الثقافية والأجتماعية.', descriptionDe: 'Diskussionen über kulturelle und gesellschaftliche Themen.', descriptionEn: 'Discussions on cultural and social topics.' },
    ];

    for (const lesson of b1Lessons) {
      await db.lesson.create({
        data: {
          id: `b1-lesson-${lesson.order}`,
          courseId: courseB1.id,
          ...lesson,
        },
      });
    }

    // B2 and C1 get fewer lessons
    for (let i = 1; i <= 4; i++) {
      await db.lesson.create({
        data: {
          id: `b2-lesson-${i}`,
          courseId: courseB2.id,
          titleAr: `درس B2 - ${i}`,
          titleDe: `B2 Lektion ${i}`,
          titleEn: `B2 Lesson ${i}`,
          descriptionAr: `درس متقدم في المستوى B2`,
          descriptionDe: `Fortgeschrittene Lektion auf B2-Niveau`,
          descriptionEn: `Advanced lesson at B2 level`,
          duration: 30 + i * 5,
          order: i,
          isFree: i === 1,
        },
      });
    }

    for (let i = 1; i <= 3; i++) {
      await db.lesson.create({
        data: {
          id: `c1-lesson-${i}`,
          courseId: courseC1.id,
          titleAr: `درس C1 - ${i}`,
          titleDe: `C1 Lektion ${i}`,
          titleEn: `C1 Lesson ${i}`,
          descriptionAr: `درس احترافي في المستوى C1`,
          descriptionDe: `Professionelle Lektion auf C1-Niveau`,
          descriptionEn: `Professional lesson at C1 level`,
          duration: 35 + i * 5,
          order: i,
          isFree: i === 1,
        },
      });
    }

    // Create posts
    await db.post.createMany({
      data: [
        {
          id: 'post-1',
          titleAr: 'أهمية تعلم اللغة الألمانية في 2024',
          titleDe: 'Die Bedeutung des Deutschlernens 2024',
          titleEn: 'The Importance of Learning German in 2024',
          contentAr: 'تعلم اللغة الألمانية يفتح أبواباً عديدة للفرص الأكاديمية والمهنية. ألمانيا هي أكبر اقتصاد في أوروبا وتقدم فرص عمل ممتازة للخريجين الناطقين بالألمانية.',
          contentDe: 'Das Deutschlernen öffnet viele Türen für akademische und berufliche Möglichkeiten. Deutschland ist die größte Volkswirtschaft Europas und bietet hervorragende Karrierechancen.',
          contentEn: 'Learning German opens many doors for academic and professional opportunities. Germany is the largest economy in Europe and offers excellent career prospects for German-speaking graduates.',
          excerptAr: 'اكتشف لماذا يزداد الاهتمام بتعلم الألمانية حول العالم.',
          excerptDe: 'Entdecken Sie, warum das Interesse am Deutschlernen weltweit steigt.',
          excerptEn: 'Discover why interest in learning German is growing worldwide.',
          category: 'education',
          imageUrl: '/images/berlin/brandenburg-gate.png',
          isPublished: true,
        },
        {
          id: 'post-2',
          titleAr: 'نصائح لاجتياز امتحان B1 بنجاح',
          titleDe: 'Tipps für die erfolgreiche B1-Prüfung',
          titleEn: 'Tips for Passing the B1 Exam Successfully',
          contentAr: 'امتحان B1 هو خطوة مهمة في رحلتك لتعلم الألمانية. إليك أهم النصائح للتحضير الجيد: التدرب اليومي على المحادثة، حل امتحانات سابقة، والتعرض المستمر للغة.',
          contentDe: 'Die B1-Prüfung ist ein wichtiger Schritt auf Ihrer Deutschlernreise. Hier sind die wichtigsten Tipps für eine gute Vorbereitung.',
          contentEn: 'The B1 exam is an important step in your German learning journey. Here are the top tips for good preparation.',
          excerptAr: 'دليلك الشامل للتحضير لامتحان المستوى B1.',
          excerptDe: 'Ihr umfassender Leitfaden zur B1-Prüfungsvorbereitung.',
          excerptEn: 'Your comprehensive guide to B1 exam preparation.',
          category: 'exams',
          imageUrl: '/images/berlin/reichstag.png',
          isPublished: true,
        },
        {
          id: 'post-3',
          titleAr: 'الحياة في برلين: دليل الطلاب العرب',
          titleDe: 'Leben in Berlin: Ein Leitfaden für arabische Studenten',
          titleEn: 'Life in Berlin: A Guide for Arab Students',
          contentAr: 'برلين مدينة متنوعة وحيوية تضم مجتمعاً عربياً نشطاً. في هذا الدليل نستعرض أهم المعلومات التي يحتاجها الطالب العربي للعيش والدراسة في برلين.',
          contentDe: 'Berlin ist eine vielfältige und lebendige Stadt mit einer aktiven arabischen Gemeinschaft. Dieser Leitfaden zeigt die wichtigsten Informationen.',
          contentEn: 'Berlin is a diverse and vibrant city with an active Arab community. This guide covers the essential information Arab students need.',
          excerptAr: 'كل ما تحتاج معرفته قبل السفر للدراسة في برلين.',
          excerptDe: 'Alles, was Sie wissen müssen, bevor Sie zum Studieren nach Berlin reisen.',
          excerptEn: 'Everything you need to know before traveling to study in Berlin.',
          category: 'lifestyle',
          imageUrl: '/images/berlin/skyline.png',
          isPublished: true,
        },
        {
          id: 'post-4',
          titleAr: 'الفرق بين Präteritum و Perfekt',
          titleDe: 'Der Unterschied zwischen Präteritum und Perfekt',
          titleEn: 'The Difference Between Präteritum and Perfekt',
          contentAr: 'من أكثر المواضيع إرباكاً لطلاب اللغة الألمانية هو الفرق بين زمني الماضي. Präteritum يستخدم أكثر في الكتابة الرسمية بينما Perfekt هو الأكثر استخداماً في المحادثة اليومية.',
          contentDe: 'Eines der verwirrendsten Themen für Deutschlerner ist der Unterschied zwischen den beiden Vergangenheitszeiten.',
          contentEn: 'One of the most confusing topics for German learners is the difference between the two past tenses.',
          excerptAr: 'شرح مبسط لأشكال الماضي في اللغة الألمانية.',
          excerptDe: 'Einfache Erklärung der Vergangenheitsformen im Deutschen.',
          excerptEn: 'Simple explanation of past tense forms in German.',
          category: 'grammar',
          imageUrl: '/images/berlin/cathedral.png',
          isPublished: true,
        },
      ],
    });

    // Create banners
    await db.banner.createMany({
      data: [
        {
          id: 'banner-1',
          titleAr: 'تعلم الألمانية',
          titleDe: 'Deutsch lernen',
          titleEn: 'Learn German',
          descriptionAr: 'رحلة تعليمية فريدة تجمع بين اللغة والثقافة الألمانية',
          descriptionDe: 'Eine einzigartige Lernreise, die Sprache und Kultur verbindet',
          descriptionEn: 'A unique learning journey combining language and culture',
          imageUrl: '/images/berlin/brandenburg-gate.png',
          labelAr: 'تعلم الألمانية',
          labelDe: 'Deutsch lernen',
          labelEn: 'Learn German',
          order: 1,
          isActive: true,
        },
        {
          id: 'banner-2',
          titleAr: 'ثقافة. لغة. مستقبل.',
          titleDe: 'Kultur. Sprache. Zukunft.',
          titleEn: 'Culture. Language. Future.',
          descriptionAr: 'تعلم الألمانية بأسلوب عصري يجمع بين الأصالة والحداثة',
          descriptionDe: 'Lernen Sie Deutsch auf moderne Weise',
          descriptionEn: 'Learn German in a modern way',
          imageUrl: '/images/berlin/reichstag.png',
          labelAr: 'ثقافة',
          labelDe: 'Kultur',
          labelEn: 'Culture',
          order: 2,
          isActive: true,
        },
        {
          id: 'banner-3',
          titleAr: 'ابدأ رحلتك نحو اللغة الألمانية',
          titleDe: 'Beginnen Sie Ihre Reise zur deutschen Sprache',
          titleEn: 'Start Your Journey to German Language',
          descriptionAr: 'من المبتدئ إلى المتقدم، خطوة بخطوة مع عمر',
          descriptionDe: 'Von Anfänger bis Fortgeschritten – Schritt für Schritt mit Omar',
          descriptionEn: 'From beginner to advanced, step by step with Omar',
          imageUrl: '/images/berlin/skyline.png',
          labelAr: 'مستقبلك',
          labelDe: 'Ihre Zukunft',
          labelEn: 'Your Future',
          order: 3,
          isActive: true,
        },
        {
          id: 'banner-4',
          titleAr: 'أحلامك تبدأ بلغة جديدة',
          titleDe: 'Ihre Träume beginnen mit einer neuen Sprache',
          titleEn: 'Your Dreams Begin with a New Language',
          descriptionAr: 'انضم إلى مئات الطلاب الذين يتعلمون الألمانية مع عمر',
          descriptionDe: 'Schließen Sie sich Hunderten von Schülern an',
          descriptionEn: 'Join hundreds of students learning with Omar',
          imageUrl: '/images/berlin/cathedral.png',
          labelAr: 'برلين',
          labelDe: 'Berlin',
          labelEn: 'Berlin',
          order: 4,
          isActive: true,
        },
      ],
    });

    // Create notifications for the demo student
    await db.notification.createMany({
      data: [
        {
          id: 'notif-1',
          userId: student.id,
          titleAr: 'دورة جديدة متاحة',
          titleDe: 'Neuer Kurs verfügbar',
          titleEn: 'New Course Available',
          messageAr: 'تم إضافة دورة جديدة: الألمانية الاحترافية C1',
          messageDe: 'Ein neuer Kurs wurde hinzugefügt: Deutsch Professionell C1',
          messageEn: 'A new course has been added: German Professional C1',
          type: 'course',
          isRead: false,
        },
        {
          id: 'notif-2',
          userId: student.id,
          titleAr: 'إعلان جديد',
          titleDe: 'Neue Ankündigung',
          titleEn: 'New Announcement',
          messageAr: 'مرحباً بكم في منصة Deutsch mit Omar! نحن سعداء بوجودكم معنا.',
          messageDe: 'Willkommen auf der Plattform Deutsch mit Omar! Wir freuen uns, Sie hier zu haben.',
          messageEn: 'Welcome to the Deutsch mit Omar platform! We are happy to have you here.',
          type: 'announcement',
          isRead: false,
        },
      ],
    });

    // Enroll demo student in A1 course with code
    const thirtyDays = new Date();
    thirtyDays.setDate(thirtyDays.getDate() + 30);
    await db.enrollment.create({
      data: {
        userId: student.id,
        courseId: courseA1.id,
        code: 'OMAR-A1-2024',
        activatedAt: new Date(),
        expiresAt: thirtyDays,
        isActive: true,
      },
    });

    // Create some lesson progress for the demo student
    await db.lessonProgress.create({
      data: {
        userId: student.id,
        lessonId: 'a1-lesson-1',
        completed: true,
        watchedSeconds: 1500,
        lastWatchedAt: new Date(),
      },
    });
    await db.lessonProgress.create({
      data: {
        userId: student.id,
        lessonId: 'a1-lesson-2',
        completed: true,
        watchedSeconds: 1200,
        lastWatchedAt: new Date(),
      },
    });
    await db.lessonProgress.create({
      data: {
        userId: student.id,
        lessonId: 'a1-lesson-3',
        completed: false,
        watchedSeconds: 600,
        lastWatchedAt: new Date(),
      },
    });

    // Create activation codes for all courses
    const courses = [courseA1, courseA2, courseB1, courseB2, courseC1];
    const codes = ['FREE-A1', 'FREE-A2', 'FREE-B1', 'FREE-B2', 'FREE-C1'];
    for (let i = 0; i < courses.length; i++) {
      await db.siteSetting.create({
        data: {
          key: `activation_code_${courses[i].id}`,
          value: codes[i],
        },
      });
    }

    // Stats settings
    await db.siteSetting.createMany({
      data: [
        { key: 'stats_students', value: '500' },
        { key: 'stats_years', value: '8' },
        { key: 'stats_courses', value: '15' },
        { key: 'stats_lessons', value: '200' },
      ],
    });

    return NextResponse.json({ success: true, message: 'Database seeded successfully' });
  } catch (error) {
    console.error('Seed error:', error);
    return NextResponse.json({ success: false, error: 'Seed failed' }, { status: 500 });
  }
}
