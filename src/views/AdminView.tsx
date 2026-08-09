'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, BookOpen, FileText, BarChart3, Settings, Plus, Pencil, Trash2, Eye, X, Save } from 'lucide-react';
import { useAppStore } from '@/stores/app-store';
import { useAuthStore } from '@/stores/auth-store';
import { t } from '@/lib/i18n';

type AdminTab = 'dashboard' | 'courses' | 'posts' | 'students' | 'banners' | 'settings';

interface AdminCourse {
  id: string;
  titleAr: string; titleDe: string; titleEn: string;
  descriptionAr: string; descriptionDe: string; descriptionEn: string;
  level: string;
  imageUrl?: string;
  isActive: boolean;
  _count?: { lessons: number; enrollments: number };
}

interface AdminPost {
  id: string;
  titleAr: string; titleDe: string; titleEn: string;
  category?: string;
  isPublished: boolean;
  createdAt: string;
  _count?: { enrollments: number };
}

interface AdminStudent {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  _count?: { enrollments: number };
}

interface AdminStats {
  totalStudents: number;
  totalCourses: number;
  totalPosts: number;
  totalEnrollments: number;
  activeEnrollments: number;
}

const tabs: { key: AdminTab; icon: React.ElementType; labelKey: string }[] = [
  { key: 'dashboard', icon: BarChart3, labelKey: 'admin_dashboard' },
  { key: 'courses', icon: BookOpen, labelKey: 'admin_courses' },
  { key: 'posts', icon: FileText, labelKey: 'admin_posts' },
  { key: 'students', icon: Users, labelKey: 'admin_students' },
  { key: 'banners', icon: Eye, labelKey: 'admin_banners' },
  { key: 'settings', icon: Settings, labelKey: 'admin_settings' },
];

export default function AdminView() {
  const { locale } = useAppStore();
  const { token, isAdmin } = useAuthStore();
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [courses, setCourses] = useState<AdminCourse[]>([]);
  const [posts, setPosts] = useState<AdminPost[]>([]);
  const [students, setStudents] = useState<AdminStudent[]>([]);
  const [loading, setLoading] = useState(true);

  const getField = (obj: Record<string, unknown>, field: string) => {
    const localeKey = locale.charAt(0).toUpperCase() + locale.slice(1);
    return (obj[`${field}${localeKey}`] as string) || '';
  };

  useEffect(() => {
    if (!isAdmin()) return;
    const headers = { Authorization: `Bearer ${token}` };
    Promise.all([
      fetch('/api/admin/stats', { headers }).then(r => r.json()),
      fetch('/api/courses?includeLessons=false&limit=100', { headers }).then(r => r.json()),
      fetch('/api/posts?limit=100', { headers }).then(r => r.json()),
      fetch('/api/admin/students', { headers }).then(r => r.json()),
    ]).then(([s, c, p, st]) => {
      setStats(s.stats || null);
      setCourses(c.courses || []);
      setPosts(p.posts || []);
      setStudents(st.students || []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (!isAdmin()) {
    return (
      <div className="pt-20 pb-20 container-bold text-center text-muted-foreground">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-red-50 flex items-center justify-center">
          <Settings className="w-8 h-8 text-red-400" />
        </div>
        <p className="text-lg">Access denied</p>
      </div>
    );
  }

  return (
    <div className="pt-8 pb-20">
      <div className="container-bold">
        <h1 className="text-2xl sm:text-3xl font-black text-foreground mb-8">{t(locale, 'nav_admin')}</h1>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Tabs */}
          <nav className="lg:w-56 shrink-0">
            <div className="flex lg:flex-col gap-1.5 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0">
              {tabs.map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-2.5 px-4 py-3 text-sm font-bold rounded-xl transition-all duration-300 whitespace-nowrap ${
                    activeTab === tab.key
                      ? 'bg-gradient-to-r from-brand-orange to-brand-red text-white shadow-glow'
                      : 'text-muted-foreground hover:text-foreground hover:bg-brand-orange/5'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {t(locale, tab.labelKey as keyof typeof import('@/lib/i18n').translations.en)}
                </button>
              ))}
            </div>
          </nav>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {loading ? (
              <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-16 skeleton-bold rounded-xl" />)}</div>
            ) : (
              <motion.div key={activeTab} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                {activeTab === 'dashboard' && (
                  <DashboardTab stats={stats} locale={locale} />
                )}
                {activeTab === 'courses' && (
                  <CoursesTab courses={courses} locale={locale} getField={getField} />
                )}
                {activeTab === 'posts' && (
                  <PostsTab posts={posts} locale={locale} getField={getField} />
                )}
                {activeTab === 'students' && (
                  <StudentsTab students={students} locale={locale} />
                )}
                {activeTab === 'banners' && <BannersTab locale={locale} />}
                {activeTab === 'settings' && <SettingsTab locale={locale} />}
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function DashboardTab({ stats, locale }: { stats: AdminStats | null; locale: string }) {
  const cards = [
    { label: t(locale, 'admin_students'), value: stats?.totalStudents || 0, icon: Users, gradient: 'from-blue-500 to-blue-600' },
    { label: t(locale, 'admin_courses'), value: stats?.totalCourses || 0, icon: BookOpen, gradient: 'from-brand-orange to-brand-red' },
    { label: t(locale, 'admin_posts'), value: stats?.totalPosts || 0, icon: FileText, gradient: 'from-amber-500 to-amber-600' },
    { label: t(locale, 'nav_my_courses'), value: stats?.activeEnrollments || 0, icon: BarChart3, gradient: 'from-green-500 to-green-600' },
  ];
  return (
    <div>
      <h2 className="text-lg font-bold text-foreground mb-5">{t(locale, 'admin_stats')}</h2>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card, i) => (
          <div key={i} className="card-bold p-6 border-2">
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${card.gradient} flex items-center justify-center mb-4 shadow-lg`}>
              <card.icon className="w-5 h-5 text-white" />
            </div>
            <p className="text-3xl font-black text-foreground">{card.value}</p>
            <p className="text-xs font-semibold text-muted-foreground mt-1 uppercase tracking-wider">{card.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function CoursesTab({ courses, locale, getField }: { courses: AdminCourse[]; locale: string; getField: (o: Record<string, unknown>, f: string) => string }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-bold text-foreground">{t(locale, 'admin_courses')}</h2>
        <span className="text-sm font-medium text-muted-foreground bg-brand-orange/10 px-3 py-1 rounded-lg">{courses.length} {t(locale, 'nav_courses')}</span>
      </div>
      <div className="space-y-3">
        {courses.map(course => (
          <div key={course.id} className="card-bold p-5 flex items-center justify-between gap-4 border-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="level-badge text-[10px]">{course.level}</span>
                <span className={`w-2.5 h-2.5 rounded-full ${course.isActive ? 'bg-green-500' : 'bg-gray-300'}`} />
              </div>
              <p className="text-sm font-bold text-foreground truncate">{getField(course as unknown as Record<string, unknown>, 'title')}</p>
              <p className="text-xs text-muted-foreground font-medium">{course._count?.lessons || 0} {t(locale, 'courses_lessons')} · {course._count?.enrollments || 0} enrolled</p>
            </div>
            <div className="flex items-center gap-1">
              <button className="p-2.5 text-muted-foreground hover:text-brand-orange rounded-xl hover:bg-brand-orange/5 transition-all"><Pencil className="w-4 h-4" /></button>
              <button className="p-2.5 text-muted-foreground hover:text-red-500 rounded-xl hover:bg-red-50 transition-all"><Trash2 className="w-4 h-4" /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PostsTab({ posts, locale, getField }: { posts: AdminPost[]; locale: string; getField: (o: Record<string, unknown>, f: string) => string }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-bold text-foreground">{t(locale, 'admin_posts')}</h2>
        <span className="text-sm font-medium text-muted-foreground bg-brand-orange/10 px-3 py-1 rounded-lg">{posts.length} posts</span>
      </div>
      <div className="space-y-3">
        {posts.map(post => (
          <div key={post.id} className="card-bold p-5 flex items-center justify-between gap-4 border-2">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-foreground truncate">{getField(post as unknown as Record<string, unknown>, 'title')}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-muted-foreground font-medium">{post.category}</span>
                <span className={`text-xs px-2 py-0.5 rounded-lg font-bold ${post.isPublished ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                  {post.isPublished ? 'Published' : 'Draft'}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button className="p-2.5 text-muted-foreground hover:text-brand-orange rounded-xl hover:bg-brand-orange/5 transition-all"><Pencil className="w-4 h-4" /></button>
              <button className="p-2.5 text-muted-foreground hover:text-red-500 rounded-xl hover:bg-red-50 transition-all"><Trash2 className="w-4 h-4" /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function StudentsTab({ students, locale }: { students: AdminStudent[]; locale: string }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-bold text-foreground">{t(locale, 'admin_students')}</h2>
        <span className="text-sm font-medium text-muted-foreground bg-brand-orange/10 px-3 py-1 rounded-lg">{students.length} students</span>
      </div>
      <div className="space-y-3">
        {students.map(student => (
          <div key={student.id} className="card-bold p-5 flex items-center justify-between gap-4 border-2">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-orange to-brand-red text-white flex items-center justify-center text-sm font-bold shrink-0">
                {student.name.charAt(0)}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-foreground truncate">{student.name}</p>
                <p className="text-xs text-muted-foreground truncate">{student.email}</p>
              </div>
            </div>
            <span className="text-xs font-semibold text-muted-foreground bg-secondary px-3 py-1 rounded-lg">{student._count?.enrollments || 0} courses</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function BannersTab({ locale }: { locale: string }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-bold text-foreground">{t(locale, 'admin_banners')}</h2>
      </div>
      <div className="card-bold p-10 text-center border-2">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-brand-orange/10 flex items-center justify-center">
          <Eye className="w-8 h-8 text-brand-orange" />
        </div>
        <p className="text-muted-foreground">Banner management will be available in the next update.</p>
      </div>
    </div>
  );
}

function SettingsTab({ locale }: { locale: string }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-bold text-foreground">{t(locale, 'admin_settings')}</h2>
      </div>
      <div className="card-bold p-10 text-center border-2">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-brand-orange/10 flex items-center justify-center">
          <Settings className="w-8 h-8 text-brand-orange" />
        </div>
        <p className="text-muted-foreground">Settings management will be available in the next update.</p>
      </div>
    </div>
  );
}
