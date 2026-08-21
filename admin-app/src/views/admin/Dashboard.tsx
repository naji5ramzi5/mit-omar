'use client';

import { ArrowLeft, Users, BookOpen, FileText, GraduationCap, Image as ImageIcon, Star, Megaphone, Mail, Eye, CalendarRange, CalendarDays, BarChart3, ListChecks, Send, ClipboardCheck, CheckCircle2 } from 'lucide-react';
import { StatCard, LevelBadge } from './ui';
import type { AdminStats } from './types';

const WEEKDAYS = ['أحد', 'اثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'];

export default function DashboardSection({
  stats,
  teacherName,
  onNavigate,
}: {
  stats: AdminStats | null;
  teacherName: string;
  onNavigate: (section: string) => void;
}) {
  const cards = [
    { label: 'الطلاب', value: stats?.totalStudents || 0, icon: Users, gradient: 'from-blue-500 to-indigo-600', key: 'students' },
    { label: 'الدورات', value: stats?.totalCourses || 0, icon: BookOpen, gradient: 'from-brand-orange to-brand-red', key: 'courses' },
    { label: 'المقالات', value: stats?.totalPosts || 0, icon: FileText, gradient: 'from-amber-500 to-orange-600', key: 'posts' },
    { label: 'الاشتراكات النشطة', value: stats?.activeEnrollments || 0, icon: GraduationCap, gradient: 'from-emerald-500 to-green-600', key: 'students' },
    { label: 'المشتركون', value: stats?.totalSubscribers || 0, icon: Mail, gradient: 'from-pink-500 to-rose-600', key: 'subscribers' },
  ] as const;

  const visitorCards = [
    { label: 'زوار اليوم', value: stats?.visits?.today || 0, icon: Eye, gradient: 'from-sky-500 to-cyan-600' },
    { label: 'زوار الأسبوع', value: stats?.visits?.week || 0, icon: CalendarDays, gradient: 'from-violet-500 to-purple-600' },
    { label: 'زوار الشهر', value: stats?.visits?.month || 0, icon: CalendarRange, gradient: 'from-teal-500 to-emerald-600' },
    { label: 'إجمالي الزوار', value: stats?.visits?.total || 0, icon: BarChart3, gradient: 'from-slate-600 to-slate-800' },
  ] as const;

  const learningCards = [
    { label: 'اشتراكات هذا الشهر', value: stats?.enrollmentsThisMonth || 0, icon: GraduationCap, gradient: 'from-orange-500 to-amber-600', hint: '' },
    { label: 'محاولات الاختبارات', value: stats?.quizStats?.attempts || 0, icon: ClipboardCheck, gradient: 'from-blue-500 to-indigo-600', hint: `متوسط النتيجة ${stats?.quizStats?.avgScore || 0}%` },
    { label: 'دروس مكتملة', value: stats?.lessonProgress ? `${stats.lessonProgress.completed}/${stats.lessonProgress.total}` : '0/0', icon: CheckCircle2, gradient: 'from-emerald-500 to-green-600', hint: `نسبة الإكمال ${stats?.lessonProgress?.rate || 0}%` },
    { label: 'إرسال إشعار', value: 'Push', icon: Send, gradient: 'from-rose-500 to-pink-600', hint: 'لإشعارات المتصفح' },
  ] as const;

  const last14 = stats?.visits?.last14 || [];
  const maxCount = Math.max(1, ...last14.map((d) => d.count));

  const quick = [
    { label: 'إدارة الدورات', icon: BookOpen, key: 'courses' },
    { label: 'الاختبارات', icon: GraduationCap, key: 'quizzes' },
    { label: 'البانرات', icon: ImageIcon, key: 'banners' },
    { label: 'آراء الطلاب', icon: Star, key: 'testimonials' },
    { label: 'المقالات', icon: FileText, key: 'posts' },
    { label: 'المشتركون', icon: Mail, key: 'subscribers' },
    { label: 'الإعدادات', icon: Megaphone, key: 'settings' },
  ] as const;

  return (
    <div className="space-y-8">
      {/* Welcome hero */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-l from-brand-orange to-brand-red p-8 text-white shadow-glow">
        <div className="absolute -top-10 -left-10 w-40 h-40 rounded-full bg-white/10" />
        <div className="absolute -bottom-12 -right-8 w-52 h-52 rounded-full bg-white/10" />
        <div className="relative flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center text-2xl font-black shrink-0">
            {teacherName?.charAt(0) || 'O'}
          </div>
          <div>
            <p className="text-sm/relaxed opacity-90">مرحباً بك في لوحة التحكم</p>
            <h2 className="text-2xl font-black">الأستاذ {teacherName || 'عمر'}</h2>
            <p className="text-sm opacity-90 mt-1">أدر محتوى منصة «دويتش مع عمر» بكل سهولة</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {cards.map((c) => (
          <StatCard key={c.label} label={c.label} value={c.value} icon={c.icon} gradient={c.gradient} />
        ))}
      </div>

      {/* Visitors */}
      <div>
        <h3 className="text-sm font-black text-foreground mb-4 flex items-center gap-2">
          <Eye className="w-4 h-4 text-brand-orange" />
          زوار الموقع
        </h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {visitorCards.map((c) => (
            <StatCard key={c.label} label={c.label} value={c.value} icon={c.icon} gradient={c.gradient} />
          ))}
        </div>

        {last14.length > 0 && (
          <div className="card-bold p-5 border-2 mt-4">
            <p className="text-xs font-black text-muted-foreground mb-4">آخر 14 يوماً</p>
            <div className="flex items-end gap-1.5 h-24">
              {last14.map((d) => {
                const date = new Date(d.day);
                return (
                  <div key={d.day} className="flex-1 flex flex-col items-center gap-1.5 group" title={`${d.count} زائر`}>
                    <span className="text-[9px] font-black text-brand-orange opacity-0 group-hover:opacity-100 transition-opacity">{d.count}</span>
                    <div
                      className="w-full rounded-t-md bg-gradient-to-t from-brand-orange/70 to-brand-orange/30 group-hover:from-brand-orange group-hover:to-brand-red transition-all"
                      style={{ height: `${Math.max(4, (d.count / maxCount) * 100)}%` }}
                    />
                    <span className="text-[9px] font-bold text-muted-foreground">{WEEKDAYS[date.getDay()]}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Learning activity */}
      <div>
        <h3 className="text-sm font-black text-foreground mb-4 flex items-center gap-2">
          <ListChecks className="w-4 h-4 text-brand-orange" />
          نشاط التعلم
        </h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {learningCards.map((c) => (
            <button
              key={c.label}
              onClick={c.label === 'إرسال إشعار' ? () => onNavigate('notifications') : undefined}
              className={c.label === 'إرسال إشعار' ? 'text-left' : ''}
            >
              <StatCard label={c.label} value={c.value} icon={c.icon} gradient={c.gradient} hint={c.hint} />
            </button>
          ))}
        </div>
      </div>

      {/* Quick links */}
      <div>
        <h3 className="text-sm font-black text-foreground mb-4">وصول سريع</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {quick.map((q) => (
            <button
              key={q.key}
              onClick={() => onNavigate(q.key)}
              className="card-bold p-5 border-2 flex items-center gap-3 text-right hover:border-brand-orange/40 hover:-translate-y-0.5 transition-all duration-300 group"
            >
              <div className="w-11 h-11 rounded-xl bg-brand-orange/10 flex items-center justify-center text-brand-orange group-hover:bg-brand-orange group-hover:text-white transition-all">
                <q.icon className="w-5 h-5" />
              </div>
              <span className="font-bold text-foreground">{q.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
