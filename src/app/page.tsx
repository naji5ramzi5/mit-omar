'use client';

import { useEffect, lazy, Suspense } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { useAppStore } from '@/stores/app-store';
import { useAuthStore } from '@/stores/auth-store';

const HomeView = lazy(() => import('@/views/HomeView'));
const AboutView = lazy(() => import('@/views/AboutView'));
const CoursesView = lazy(() => import('@/views/CoursesView'));
const CourseDetailView = lazy(() => import('@/views/CourseDetailView'));
const PostsView = lazy(() => import('@/views/PostsView'));
const PostDetailView = lazy(() => import('@/views/PostDetailView'));
const ContactView = lazy(() => import('@/views/ContactView'));
const LoginView = lazy(() => import('@/views/LoginView'));
const RegisterView = lazy(() => import('@/views/RegisterView'));
const ActivateView = lazy(() => import('@/views/ActivateView'));
const StudentView = lazy(() => import('@/views/StudentView'));
const VideoLessonView = lazy(() => import('@/views/VideoLessonView'));
const NotificationsView = lazy(() => import('@/views/NotificationsView'));
const AdminView = lazy(() => import('@/views/AdminView'));

function ViewLoader() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-8 h-8 border-2 border-brand-orange/20 border-t-brand-orange rounded-full animate-spin" />
    </div>
  );
}

export default function AppShell() {
  const { view } = useAppStore();
  const { token, user, setLoading } = useAuthStore();

  useEffect(() => {
    // Restore auth state from localStorage
    const savedToken = localStorage.getItem('dmo-token');
    const savedUser = localStorage.getItem('dmo-user');
    if (savedToken && savedUser) {
      try {
        useAuthStore.setState({
          token: savedToken,
          user: JSON.parse(savedUser),
          isLoading: false,
        });
      } catch {
        localStorage.removeItem('dmo-token');
        localStorage.removeItem('dmo-user');
        setLoading(false);
      }
    } else {
      setLoading(false);
    }

    // Restore locale
    const savedLocale = localStorage.getItem('dmo-locale');
    if (savedLocale && ['ar', 'de', 'en'].includes(savedLocale)) {
      useAppStore.getState().setLocale(savedLocale as 'ar' | 'de' | 'en');
    }

    // Restore theme
    const savedTheme = localStorage.getItem('dmo-theme');
    if (savedTheme && ['light', 'dark', 'system'].includes(savedTheme)) {
      useAppStore.getState().setTheme(savedTheme as 'light' | 'dark' | 'system');
    }
  }, []);

  // Fetch unread notifications count
  useEffect(() => {
    if (!token) return;
    const fetchCount = async () => {
      try {
        const res = await fetch('/api/notifications?countOnly=true', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          useAuthStore.getState().setUnreadCount(data.count || 0);
        }
      } catch { /* ignore */ }
    };
    fetchCount();
    const interval = setInterval(fetchCount, 30000);
    return () => clearInterval(interval);
  }, [token]);

  const renderView = () => {
    switch (view) {
      case 'home': return <HomeView />;
      case 'about': return <AboutView />;
      case 'courses': return <CoursesView />;
      case 'course-detail': return <CourseDetailView />;
      case 'posts': return <PostsView />;
      case 'post-detail': return <PostDetailView />;
      case 'contact': return <ContactView />;
      case 'login': return <LoginView />;
      case 'register': return <RegisterView />;
      case 'activate': return <ActivateView />;
      case 'student': return <StudentView />;
      case 'video-lesson': return <VideoLessonView />;
      case 'notifications': return <NotificationsView />;
      case 'admin': return <AdminView />;
      default: return <HomeView />;
    }
  };

  const isFullPage = view === 'video-lesson';

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {!isFullPage && <Header />}
      <main className={isFullPage ? 'flex-1' : 'flex-1 pt-16 lg:pt-20'}>
        <Suspense fallback={<ViewLoader />}>
          <AnimatePresence mode="wait">
            <motion.div
              key={view}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
            >
              {renderView()}
            </motion.div>
          </AnimatePresence>
        </Suspense>
      </main>
      {!isFullPage && <Footer />}
    </div>
  );
}
