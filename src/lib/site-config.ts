// ============================================================
// ⚙️ ملف إعدادات التواصل الموحد
// عدّل القيم هنا فقط — وستظهر تلقائيًا في الفوتر ونافذة التواصل العائمة.
// اترك أي حقل فارغًا '' لإخفاء الزر/الأيقونة المقابلة.
// ============================================================

export const CONTACT_EMAIL = 'info@deutschmitomar.com';

/** رقم واتساب بدون + — مثال: '9647701234567' */
export const WHATSAPP_NUMBER = '';

/** اسم مستخدم تيليجرام بدون @ — مثال: 'deutsch_mit_omar' */
export const TELEGRAM_USERNAME = '';

/** روابط السوشيال ميديا — اسم المفتاح يحدد الأيقونة */
export const SOCIAL_LINKS: { name: 'Instagram' | 'Facebook' | 'Youtube' | 'Twitter'; url: string }[] = [
  // مثال: { name: 'Instagram', url: 'https://instagram.com/deutsch.mit.omar' },
];

export const WHATSAPP_URL = WHATSAPP_NUMBER ? `https://wa.me/${WHATSAPP_NUMBER}` : '';
export const TELEGRAM_URL = TELEGRAM_USERNAME ? `https://t.me/${TELEGRAM_USERNAME}` : '';