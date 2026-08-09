'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Bell, Check, CheckCheck, BookOpen, Megaphone, Video } from 'lucide-react';
import { useAppStore } from '@/stores/app-store';
import { useAuthStore } from '@/stores/auth-store';
import { t } from '@/lib/i18n';
import { format } from 'date-fns';
import { ar, de, enUS } from 'date-fns/locale';

interface Notification {
  id: string;
  titleAr: string; titleDe: string; titleEn: string;
  messageAr?: string; messageDe?: string; messageEn?: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

const typeIcons: Record<string, React.ElementType> = {
  course: BookOpen,
  lesson: Video,
  announcement: Megaphone,
  info: Bell,
};

export default function NotificationsView() {
  const { locale } = useAppStore();
  const { token, isAuthenticated, setUnreadCount } = useAuthStore();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const dateLocale = locale === 'ar' ? ar : locale === 'de' ? de : enUS;

  const getField = (obj: Record<string, unknown>, field: string) => {
    const localeKey = locale.charAt(0).toUpperCase() + locale.slice(1);
    return (obj[`${field}${localeKey}`] as string) || '';
  };

  useEffect(() => {
    if (!isAuthenticated()) return;
    fetch('/api/notifications', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => {
        setNotifications(data.notifications || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [isAuthenticated, token]);

  const markAsRead = async (id: string) => {
    try {
      await fetch(`/api/notifications`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ notificationIds: [id] }),
      });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch { /* ignore */ }
  };

  const markAllRead = async () => {
    try {
      await fetch('/api/notifications/mark-all', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch { /* ignore */ }
  };

  if (!isAuthenticated()) {
    return (
      <div className="pt-20 pb-20 container-bold text-center text-muted-foreground">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-brand-orange/10 flex items-center justify-center">
          <Bell className="w-8 h-8 text-brand-orange" />
        </div>
        <p className="text-lg">{t(locale, 'notifications_empty')}</p>
      </div>
    );
  }

  return (
    <div className="pt-8 pb-20">
      <div className="container-bold max-w-2xl">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl sm:text-3xl font-black text-foreground">{t(locale, 'notifications_title')}</h1>
          {notifications.some(n => !n.isRead) && (
            <button onClick={markAllRead} className="btn-bold-ghost text-xs flex items-center gap-1.5">
              <CheckCheck className="w-4 h-4" /> {t(locale, 'notifications_mark_all')}
            </button>
          )}
        </div>

        {loading ? (
          <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-20 skeleton-bold rounded-2xl" />)}</div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-brand-orange/10 flex items-center justify-center">
              <Bell className="w-8 h-8 text-brand-orange" />
            </div>
            <p className="text-muted-foreground text-lg">{t(locale, 'notifications_empty')}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((notif, i) => {
              const Icon = typeIcons[notif.type] || Bell;
              return (
                <motion.div
                  key={notif.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => !notif.isRead && markAsRead(notif.id)}
                  className={`card-bold p-5 flex items-start gap-4 cursor-pointer transition-all border-2 ${!notif.isRead ? 'border-brand-orange/20 bg-brand-orange/[0.02]' : 'border-transparent'}`}
                >
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${!notif.isRead ? 'bg-gradient-to-br from-brand-orange/10 to-brand-red/10' : 'bg-secondary'}`}>
                    <Icon className={`w-5 h-5 ${!notif.isRead ? 'text-brand-orange' : 'text-muted-foreground'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={`text-sm ${!notif.isRead ? 'font-bold text-foreground' : 'text-foreground'}`}>{getField(notif as unknown as Record<string, unknown>, 'title')}</p>
                      {!notif.isRead && <div className="w-2.5 h-2.5 bg-brand-orange rounded-full shrink-0 mt-1.5" />}
                    </div>
                    {getField(notif as unknown as Record<string, unknown>, 'message') && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{getField(notif as unknown as Record<string, unknown>, 'message')}</p>
                    )}
                    <p className="text-[10px] text-muted-foreground/60 mt-1.5">{format(new Date(notif.createdAt), 'd MMM yyyy, HH:mm', { locale: dateLocale })}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
