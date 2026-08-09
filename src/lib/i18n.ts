export type Locale = 'ar' | 'de' | 'en';

export const locales: Locale[] = ['ar', 'de', 'en'];

export const localeNames: Record<Locale, string> = {
  ar: 'العربية',
  de: 'Deutsch',
  en: 'English',
};

export const localeDirections: Record<Locale, 'rtl' | 'ltr'> = {
  ar: 'rtl',
  de: 'ltr',
  en: 'ltr',
};

export type TranslationKeys = typeof translations.en;

export const translations = {
  ar: {
    // Nav
    nav_home: 'الرئيسية',
    nav_about: 'عن عمر',
    nav_courses: 'الدورات',
    nav_posts: 'الأخبار والمقالات',
    nav_contact: 'تواصل معنا',
    nav_login: 'تسجيل الدخول',
    nav_admin: 'لوحة التحكم',
    nav_logout: 'تسجيل الخروج',
    nav_my_courses: 'دوراتي',
    nav_notifications: 'الإشعارات',
    nav_profile: 'الملف الشخصي',
    language: 'اللغة',

    // Hero Carousel
    carousel_1_label: 'تعلم الألمانية',
    carousel_1_title: 'تعلم الألمانية. اكتشف برلين.',
    carousel_1_desc: 'رحلة تعليمية فريدة تجمع بين اللغة والثقافة الألمانية',
    carousel_2_label: 'ثقافة',
    carousel_2_title: 'ثقافة. لغة. مستقبل.',
    carousel_2_desc: 'تعلم الألمانية بأسلوب عصري يجمع بين الأصالة والحداثة',
    carousel_3_label: 'مستقبلك',
    carousel_3_title: 'ابدأ رحلتك نحو اللغة الألمانية',
    carousel_3_desc: 'من المبتدئ إلى المتقدم، خطوة بخطوة مع عمر',
    carousel_4_label: 'برلين',
    carousel_4_title: 'أحلامك تبدأ بلغة جديدة',
    carousel_4_desc: 'انضم إلى مئات الطلاب الذين يتعلمون الألمانية مع عمر',

    // Hero
    hero_headline: 'تعلم الألمانية مع عمر',
    hero_subheadline: 'مدرس لغة ألمانية محترف',
    hero_desc: 'اكتشف أسلوباً تعليمياً فريداً يجمع بين الخبرة المهنية والحماس الشخصي. دورات مصممة بعناية تأخذك من المستوى المبتدئ إلى الاحتراف.',
    hero_cta_primary: 'استكشف الدورات',
    hero_cta_secondary: 'عن عمر',
    hero_experience_badge: 'سنوات من الخبرة',

    // Stats
    stats_students: 'طالب',
    stats_years: 'سنوات خبرة',
    stats_courses: 'دورة',
    stats_lessons: 'درس',

    // About
    about_title: 'عن عمر',
    about_badge: 'مدرس لغة ألمانية',
    about_bio_1: 'عمر هو مدرس لغة ألمانية محترف يتمتع بخبرة واسعة في تعليم اللغة الألمانية للطلاب العرب. يجمع بين المعرفة العميقة باللغة والثقافة الألمانية وفهم احتياجات الطلاب العرب.',
    about_bio_2: 'منهجه التعليمي يقوم على التفاعل والممارسة الفعلية، مع التركيز على بناء أساس قوي في القواعد والمفردات والمحادثة اليومية.',
    about_bio_3: 'يؤمن عمر بأن تعلم اللغة يجب أن يكون تجربة ممتعة ومحفزة، ولهذا يصمم كل دورة بعناية فائقة لضمان أفضل تجربة تعليمية.',
    about_qualification: 'المؤهلات والخبرة',
    about_qual_1: 'خبرة واسعة في تعليم اللغة الألمانية',
    about_qual_2: 'منهج تعليمي مبتكر ومخصص',
    about_qual_3: 'تركيز على التطبيق العملي والمحادثة',
    about_qual_4: 'دعم مستمر للطلاب',

    // Courses
    courses_title: 'الدورات',
    courses_subtitle: 'دورات مصممة بعناية لكل مستوى',
    courses_lessons: 'درس',
    courses_duration: 'ساعة',
    courses_view_details: 'عرض التفاصيل',
    courses_all_levels: 'جميع المستويات',
    courses_no_courses: 'لا توجد دورات حالياً',
    courses_level_all: 'الكل',

    // Course Detail
    course_about: 'عن الدورة',
    course_what_you_get: 'ما ستحصل عليه',
    course_content: 'محتوى الدورة',
    course_activate: 'تفعيل الدورة',
    course_lessons_count: 'درس',
    course_total_duration: 'مدة إجمالية',
    course_level: 'المستوى',
    course_locked: 'مقفل',
    course_free: 'مجاني',
    course_completed: 'مكتمل',
    course_in_progress: 'قيد التعلم',
    course_start_watching: 'ابدأ المشاهدة',
    course_continue: 'متابعة',
    course_back: 'العودة للدورات',

    // Activate
    activate_title: 'تفعيل دورتك',
    activate_desc: 'أدخل رمز الوصول الذي قدمه لك عمر لتفعيل الدورة.',
    activate_input: 'أدخل رمز الدورة',
    activate_button: 'تفعيل الدورة',
    activate_success_title: 'تم التفعيل بنجاح!',
    activate_success_course: 'اسم الدورة',
    activate_success_date: 'تاريخ التفعيل',
    activate_success_expiry: 'تاريخ الانتهاء',
    activate_success_status: 'حالة الوصول',
    activate_active: 'نشط',
    activate_expired: 'منتهي',
    activate_invalid: 'رمز التفعيل غير صالح',
    activate_already: 'أنت مسجل بالفعل في هذه الدورة',

    // Student
    student_title: 'دوراتي',
    student_active: 'الدورات النشطة',
    student_expired: 'الدورات المنتهية',
    student_no_active: 'لا توجد دورات نشطة',
    student_no_expired: 'لا توجد دورات منتهية',
    student_activate_new: 'تفعيل دورة جديدة',
    student_continue_watching: 'متابعة المشاهدة',

    // Video Player
    video_watermark: 'حساب الطالب',
    video_lesson_info: 'معلومات الدرس',
    video_lessons_list: 'قائمة الدروس',
    video_duration: 'المدة',

    // Posts
    posts_title: 'الأخبار والمقالات',
    posts_subtitle: 'آخر الأخبار والمقالات التعليمية',
    posts_read_more: 'اقرأ المزيد',
    posts_back: 'العودة',
    posts_no_posts: 'لا توجد مقالات حالياً',
    posts_all: 'الكل',

    // Auth
    login_title: 'تسجيل الدخول',
    login_subtitle: 'مرحباً بك مجدداً',
    login_email: 'البريد الإلكتروني',
    login_password: 'كلمة المرور',
    login_remember: 'تذكرني',
    login_forgot: 'نسيت كلمة المرور؟',
    login_button: 'تسجيل الدخول',
    login_no_account: 'ليس لديك حساب؟',
    login_register: 'إنشاء حساب',
    login_error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة',

    register_title: 'إنشاء حساب',
    register_subtitle: 'انضم إلى منصة تعلم الألمانية',
    register_name: 'الاسم الكامل',
    register_email: 'البريد الإلكتروني',
    register_password: 'كلمة المرور',
    register_confirm: 'تأكيد كلمة المرور',
    register_button: 'إنشاء الحساب',
    register_has_account: 'لديك حساب بالفعل؟',
    register_login: 'تسجيل الدخول',
    register_error_email: 'هذا البريد الإلكتروني مسجل بالفعل',
    register_error_password: 'كلمات المرور غير متطابقة',
    register_success: 'تم إنشاء الحساب بنجاح',

    // Contact
    contact_title: 'تواصل معنا',
    contact_subtitle: 'نسعد بتواصلك معنا',
    contact_name: 'الاسم',
    contact_email: 'البريد الإلكتروني',
    contact_subject: 'الموضوع',
    contact_message: 'الرسالة',
    contact_send: 'إرسال الرسالة',
    contact_success: 'تم إرسال رسالتك بنجاح',

    // Notifications
    notifications_title: 'الإشعارات',
    notifications_empty: 'لا توجد إشعارات',
    notifications_mark_all: 'تحديد الكل كمقروء',
    notifications_new_course: 'دورة جديدة',
    notifications_new_lesson: 'درس جديد',
    notifications_announcement: 'إعلان',

    // Footer
    footer_description: 'منصة تعليمية احترافية لتعلم اللغة الألمانية مع عمر.',
    footer_navigation: 'التنقل',
    footer_quick_links: 'روابط سريعة',
    footer_follow_us: 'تابعنا',
    footer_rights: 'جميع الحقوق محفوظة',

    // Admin
    admin_dashboard: 'لوحة التحكم',
    admin_courses: 'إدارة الدورات',
    admin_posts: 'إدارة المقالات',
    admin_students: 'الطلاب',
    admin_banners: 'إدارة البانرات',
    admin_settings: 'الإعدادات',
    admin_stats: 'الإحصائيات',
    admin_save: 'حفظ',
    admin_cancel: 'إلغاء',
    admin_delete: 'حذف',
    admin_edit: 'تعديل',
    admin_add: 'إضافة',
    admin_create: 'إنشاء',
    admin_back: 'العودة',

    // Common
    common_loading: 'جاري التحميل...',
    common_error: 'حدث خطأ',
    common_retry: 'إعادة المحاولة',
    common_no_results: 'لا توجد نتائج',
    common_min: 'دقيقة',
    common_hour: 'ساعة',
    common_hours: 'ساعات',
    common_free: 'مجاني',
    common_or: 'أو',
  },
  de: {
    // Nav
    nav_home: 'Startseite',
    nav_about: 'Über Omar',
    nav_courses: 'Kurse',
    nav_posts: 'Nachrichten & Artikel',
    nav_contact: 'Kontakt',
    nav_login: 'Anmelden',
    nav_admin: 'Admin-Dashboard',
    nav_logout: 'Abmelden',
    nav_my_courses: 'Meine Kurse',
    nav_notifications: 'Benachrichtigungen',
    nav_profile: 'Profil',
    language: 'Sprache',

    // Hero Carousel
    carousel_1_label: 'Deutsch lernen',
    carousel_1_title: 'Deutsch lernen. Berlin entdecken.',
    carousel_1_desc: 'Eine einzigartige Lernreise, die Sprache und deutsche Kultur verbindet',
    carousel_2_label: 'Kultur',
    carousel_2_title: 'Kultur. Sprache. Zukunft.',
    carousel_2_desc: 'Lernen Sie Deutsch auf moderne Weise, die Tradition und Innovation vereint',
    carousel_3_label: 'Ihre Zukunft',
    carousel_3_title: 'Beginnen Sie Ihre Reise zur deutschen Sprache',
    carousel_3_desc: 'Von Anfänger bis Fortgeschritten – Schritt für Schritt mit Omar',
    carousel_4_label: 'Berlin',
    carousel_4_title: 'Ihre Träume beginnen mit einer neuen Sprache',
    carousel_4_desc: 'Schließen Sie sich Hunderten von Schülern an, die mit Omar Deutsch lernen',

    // Hero
    hero_headline: 'Lerne Deutsch mit Omar',
    hero_subheadline: 'Professioneller Deutschlehrer',
    hero_desc: 'Entdecken Sie eine einzigartige Lehrmethode, die professionelle Erfahrung mit persönlichem Engagement verbindet. Sorgfältig gestaltete Kurse, die Sie vom Anfänger zum Profi führen.',
    hero_cta_primary: 'Kurse entdecken',
    hero_cta_secondary: 'Über Omar',
    hero_experience_badge: 'Jahre Erfahrung',

    // Stats
    stats_students: 'Schüler',
    stats_years: 'Jahre Erfahrung',
    stats_courses: 'Kurse',
    stats_lessons: 'Lektionen',

    // About
    about_title: 'Über Omar',
    about_badge: 'Deutschlehrer',
    about_bio_1: 'Omar ist ein professioneller Deutschlehrer mit umfangreicher Erfahrung in der Vermittlung der deutschen Sprache an arabische Schüler. Er verbindet tiefe Kenntnisse der deutschen Sprache und Kultur mit dem Verständnis für die Bedürfnisse arabischer Lernender.',
    about_bio_2: 'Sein Lehransatz basiert auf Interaktion und praktischer Anwendung, mit Fokus auf den Aufbau eines starken Fundaments in Grammatik, Wortschatz und Alltagskommunikation.',
    about_bio_3: 'Omar glaubt, dass Sprachlernen eine angenehme und motivierende Erfahrung sein sollte. Deshalb gestaltet er jeden Kurs mit größter Sorgfalt für das beste Lernerlebnis.',
    about_qualification: 'Qualifikationen & Erfahrung',
    about_qual_1: 'Umfangreiche Erfahrung im Deutschunterricht',
    about_qual_2: 'Innovativer und maßgeschneiderter Lehransatz',
    about_qual_3: 'Fokus auf praktische Anwendung und Konversation',
    about_qual_4: 'Kontinuierliche Schülerbetreuung',

    // Courses
    courses_title: 'Kurse',
    courses_subtitle: 'Sorgfältig gestaltete Kurse für jedes Niveau',
    courses_lessons: 'Lektionen',
    courses_duration: 'Stunden',
    courses_view_details: 'Details ansehen',
    courses_all_levels: 'Alle Niveaus',
    courses_no_courses: 'Derzeit keine Kurse verfügbar',
    courses_level_all: 'Alle',

    // Course Detail
    course_about: 'Über den Kurs',
    course_what_you_get: 'Was Sie erhalten',
    course_content: 'Kursinhalte',
    course_activate: 'Kurs aktivieren',
    course_lessons_count: 'Lektionen',
    course_total_duration: 'Gesamtdauer',
    course_level: 'Niveau',
    course_locked: 'Gesperrt',
    course_free: 'Kostenlos',
    course_completed: 'Abgeschlossen',
    course_in_progress: 'In Bearbeitung',
    course_start_watching: 'Ansehen starten',
    course_continue: 'Fortsetzen',
    course_back: 'Zurück zu Kursen',

    // Activate
    activate_title: 'Ihren Kurs aktivieren',
    activate_desc: 'Geben Sie den Zugangscode ein, den Omar Ihnen zur Verfügung gestellt hat.',
    activate_input: 'Geben Sie Ihren Kurscode ein',
    activate_button: 'Kurs aktivieren',
    activate_success_title: 'Erfolgreich aktiviert!',
    activate_success_course: 'Kursname',
    activate_success_date: 'Aktivierungsdatum',
    activate_success_expiry: 'Ablaufdatum',
    activate_success_status: 'Zugangsstatus',
    activate_active: 'Aktiv',
    activate_expired: 'Abgelaufen',
    activate_invalid: 'Ungültiger Aktivierungscode',
    activate_already: 'Sie sind bereits in diesem Kurs angemeldet',

    // Student
    student_title: 'Meine Kurse',
    student_active: 'Aktive Kurse',
    student_expired: 'Abgelaufene Kurse',
    student_no_active: 'Keine aktiven Kurse',
    student_no_expired: 'Keine abgelaufenen Kurse',
    student_activate_new: 'Neuen Kurs aktivieren',
    student_continue_watching: 'Weiter ansehen',

    // Video Player
    video_watermark: 'Schülerkonto',
    video_lesson_info: 'Lektionsinformationen',
    video_lessons_list: 'Lektionsliste',
    video_duration: 'Dauer',

    // Posts
    posts_title: 'Nachrichten & Artikel',
    posts_subtitle: 'Neueste Nachrichten und Lernartikel',
    posts_read_more: 'Weiterlesen',
    posts_back: 'Zurück',
    posts_no_posts: 'Derzeit keine Artikel verfügbar',
    posts_all: 'Alle',

    // Auth
    login_title: 'Anmelden',
    login_subtitle: 'Willkommen zurück',
    login_email: 'E-Mail-Adresse',
    login_password: 'Passwort',
    login_remember: 'Angemeldet bleiben',
    login_forgot: 'Passwort vergessen?',
    login_button: 'Anmelden',
    login_no_account: 'Noch kein Konto?',
    login_register: 'Konto erstellen',
    login_error: 'E-Mail oder Passwort falsch',

    register_title: 'Konto erstellen',
    register_subtitle: 'Treten Sie der Deutsch-Lernplattform bei',
    register_name: 'Vollständiger Name',
    register_email: 'E-Mail-Adresse',
    register_password: 'Passwort',
    register_confirm: 'Passwort bestätigen',
    register_button: 'Konto erstellen',
    register_has_account: 'Bereits ein Konto?',
    register_login: 'Anmelden',
    register_error_email: 'Diese E-Mail ist bereits registriert',
    register_error_password: 'Passwörter stimmen nicht überein',
    register_success: 'Konto erfolgreich erstellt',

    // Contact
    contact_title: 'Kontakt',
    contact_subtitle: 'Wir freuen uns über Ihre Nachricht',
    contact_name: 'Name',
    contact_email: 'E-Mail',
    contact_subject: 'Betreff',
    contact_message: 'Nachricht',
    contact_send: 'Nachricht senden',
    contact_success: 'Nachricht erfolgreich gesendet',

    // Notifications
    notifications_title: 'Benachrichtigungen',
    notifications_empty: 'Keine Benachrichtigungen',
    notifications_mark_all: 'Alle als gelesen markieren',
    notifications_new_course: 'Neuer Kurs',
    notifications_new_lesson: 'Neue Lektion',
    notifications_announcement: 'Ankündigung',

    // Footer
    footer_description: 'Eine professionelle Lernplattform für Deutsch mit Omar.',
    footer_navigation: 'Navigation',
    footer_quick_links: 'Schnelllinks',
    footer_follow_us: 'Folgen Sie uns',
    footer_rights: 'Alle Rechte vorbehalten',

    // Admin
    admin_dashboard: 'Dashboard',
    admin_courses: 'Kursverwaltung',
    admin_posts: 'Artikelverwaltung',
    admin_students: 'Schüler',
    admin_banners: 'Banner-Verwaltung',
    admin_settings: 'Einstellungen',
    admin_stats: 'Statistiken',
    admin_save: 'Speichern',
    admin_cancel: 'Abbrechen',
    admin_delete: 'Löschen',
    admin_edit: 'Bearbeiten',
    admin_add: 'Hinzufügen',
    admin_create: 'Erstellen',
    admin_back: 'Zurück',

    // Common
    common_loading: 'Laden...',
    common_error: 'Ein Fehler ist aufgetreten',
    common_retry: 'Erneut versuchen',
    common_no_results: 'Keine Ergebnisse',
    common_min: 'Minute',
    common_hour: 'Stunde',
    common_hours: 'Stunden',
    common_free: 'Kostenlos',
    common_or: 'oder',
  },
  en: {
    // Nav
    nav_home: 'Home',
    nav_about: 'About Omar',
    nav_courses: 'Courses',
    nav_posts: 'News & Articles',
    nav_contact: 'Contact',
    nav_login: 'Student Login',
    nav_admin: 'Admin Dashboard',
    nav_logout: 'Logout',
    nav_my_courses: 'My Courses',
    nav_notifications: 'Notifications',
    nav_profile: 'Profile',
    language: 'Language',

    // Hero Carousel
    carousel_1_label: 'Learn German',
    carousel_1_title: 'Learn German. Discover Berlin.',
    carousel_1_desc: 'A unique learning journey that combines language and German culture',
    carousel_2_label: 'Culture',
    carousel_2_title: 'Culture. Language. Future.',
    carousel_2_desc: 'Learn German in a modern way that blends tradition with innovation',
    carousel_3_label: 'Your Future',
    carousel_3_title: 'Start Your Journey to German Language',
    carousel_3_desc: 'From beginner to advanced, step by step with Omar',
    carousel_4_label: 'Berlin',
    carousel_4_title: 'Your Dreams Begin with a New Language',
    carousel_4_desc: 'Join hundreds of students learning German with Omar',

    // Hero
    hero_headline: 'Learn German With Omar',
    hero_subheadline: 'Professional German Language Teacher',
    hero_desc: 'Discover a unique teaching approach that combines professional expertise with personal passion. Carefully designed courses that take you from beginner to professional.',
    hero_cta_primary: 'Explore Courses',
    hero_cta_secondary: 'About Omar',
    hero_experience_badge: 'Years of Experience',

    // Stats
    stats_students: 'Students',
    stats_years: 'Years Experience',
    stats_courses: 'Courses',
    stats_lessons: 'Lessons',

    // About
    about_title: 'About Omar',
    about_badge: 'German Language Instructor',
    about_bio_1: 'Omar is a professional German language teacher with extensive experience in teaching German to Arabic-speaking students. He combines deep knowledge of German language and culture with an understanding of Arabic students\' needs.',
    about_bio_2: 'His teaching approach is based on interaction and practical application, focusing on building a strong foundation in grammar, vocabulary, and everyday conversation.',
    about_bio_3: 'Omar believes that language learning should be an enjoyable and motivating experience. That\'s why he designs every course with utmost care to ensure the best learning experience.',
    about_qualification: 'Qualifications & Experience',
    about_qual_1: 'Extensive experience in teaching German',
    about_qual_2: 'Innovative and customized teaching approach',
    about_qual_3: 'Focus on practical application and conversation',
    about_qual_4: 'Continuous student support',

    // Courses
    courses_title: 'Courses',
    courses_subtitle: 'Carefully designed courses for every level',
    courses_lessons: 'lessons',
    courses_duration: 'hours',
    courses_view_details: 'View Details',
    courses_all_levels: 'All Levels',
    courses_no_courses: 'No courses available at the moment',
    courses_level_all: 'All',

    // Course Detail
    course_about: 'About the Course',
    course_what_you_get: 'What You\'ll Get',
    course_content: 'Course Content',
    course_activate: 'Activate Course',
    course_lessons_count: 'Lessons',
    course_total_duration: 'Total Duration',
    course_level: 'Level',
    course_locked: 'Locked',
    course_free: 'Free',
    course_completed: 'Completed',
    course_in_progress: 'In Progress',
    course_start_watching: 'Start Watching',
    course_continue: 'Continue',
    course_back: 'Back to Courses',

    // Activate
    activate_title: 'Activate Your Course',
    activate_desc: 'Enter the access code provided by Omar to activate the course.',
    activate_input: 'Enter your course code',
    activate_button: 'Activate Course',
    activate_success_title: 'Successfully Activated!',
    activate_success_course: 'Course Name',
    activate_success_date: 'Activation Date',
    activate_success_expiry: 'Expiry Date',
    activate_success_status: 'Access Status',
    activate_active: 'Active',
    activate_expired: 'Expired',
    activate_invalid: 'Invalid activation code',
    activate_already: 'You are already enrolled in this course',

    // Student
    student_title: 'My Courses',
    student_active: 'Active Courses',
    student_expired: 'Expired Courses',
    student_no_active: 'No active courses',
    student_no_expired: 'No expired courses',
    student_activate_new: 'Activate New Course',
    student_continue_watching: 'Continue Watching',

    // Video Player
    video_watermark: 'Student Account',
    video_lesson_info: 'Lesson Information',
    video_lessons_list: 'Lessons List',
    video_duration: 'Duration',

    // Posts
    posts_title: 'News & Articles',
    posts_subtitle: 'Latest news and educational articles',
    posts_read_more: 'Read More',
    posts_back: 'Back',
    posts_no_posts: 'No articles available at the moment',
    posts_all: 'All',

    // Auth
    login_title: 'Sign In',
    login_subtitle: 'Welcome back',
    login_email: 'Email',
    login_password: 'Password',
    login_remember: 'Remember me',
    login_forgot: 'Forgot password?',
    login_button: 'Sign In',
    login_no_account: "Don't have an account?",
    login_register: 'Create account',
    login_error: 'Invalid email or password',

    register_title: 'Create Account',
    register_subtitle: 'Join the German learning platform',
    register_name: 'Full Name',
    register_email: 'Email',
    register_password: 'Password',
    register_confirm: 'Confirm Password',
    register_button: 'Create Account',
    register_has_account: 'Already have an account?',
    register_login: 'Sign in',
    register_error_email: 'This email is already registered',
    register_error_password: 'Passwords do not match',
    register_success: 'Account created successfully',

    // Contact
    contact_title: 'Contact Us',
    contact_subtitle: 'We\'d love to hear from you',
    contact_name: 'Name',
    contact_email: 'Email',
    contact_subject: 'Subject',
    contact_message: 'Message',
    contact_send: 'Send Message',
    contact_success: 'Message sent successfully',

    // Notifications
    notifications_title: 'Notifications',
    notifications_empty: 'No notifications',
    notifications_mark_all: 'Mark all as read',
    notifications_new_course: 'New Course',
    notifications_new_lesson: 'New Lesson',
    notifications_announcement: 'Announcement',

    // Footer
    footer_description: 'A professional learning platform for German with Omar.',
    footer_navigation: 'Navigation',
    footer_quick_links: 'Quick Links',
    footer_follow_us: 'Follow Us',
    footer_rights: 'All rights reserved',

    // Admin
    admin_dashboard: 'Dashboard',
    admin_courses: 'Course Management',
    admin_posts: 'Post Management',
    admin_students: 'Students',
    admin_banners: 'Banner Management',
    admin_settings: 'Settings',
    admin_stats: 'Statistics',
    admin_save: 'Save',
    admin_cancel: 'Cancel',
    admin_delete: 'Delete',
    admin_edit: 'Edit',
    admin_add: 'Add',
    admin_create: 'Create',
    admin_back: 'Back',

    // Common
    common_loading: 'Loading...',
    common_error: 'An error occurred',
    common_retry: 'Try again',
    common_no_results: 'No results',
    common_min: 'min',
    common_hour: 'hour',
    common_hours: 'hours',
    common_free: 'Free',
    common_or: 'or',
  },
} as const;

export function t(locale: Locale, key: keyof TranslationKeys): string {
  return translations[locale][key] || translations.en[key] || key;
}

export function getLocalizedField<T extends Record<string, unknown>>(
  obj: T | null | undefined,
  field: string,
  locale: Locale
): string {
  if (!obj) return '';
  const key = `${field}${locale.charAt(0).toUpperCase()}${locale.slice(1)}` as keyof T;
  return (obj[key] as string) || '';
}
