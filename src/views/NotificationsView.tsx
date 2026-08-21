'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Bell, Check, CheckCheck, BookOpen, Megaphone, Video, BellRing } from 'lucide-react';
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
  const { token, isAuthenticated, unreadCount, setUnreadCount } = useAuthStore();
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
      setUnreadCount(Math.max(0, unreadCount - 1));
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

  const [pushState, setPushState] = useState<'idle' | 'enabled' | 'denied' | 'error'>('idle');
  const [pushBusy, setPushBusy] = useState(false);

  const checkPushState = useCallback(async () => {
    if (!('Notification' in window)) return;
    if (Notification.permission === 'granted') {
      setPushState('enabled');
      return;
    }
    if (Notification.permission === 'denied') {
      setPushState('denied');
      return;
    }
    const reg = await navigator.serviceWorker?.getRegistration();
    if (reg) {
      const sub = await reg.pushManager.getSubscription().catch(() => null);
      if (sub) setPushState('enabled');
    }
  }, []);

  useEffect(() => {
    void checkPushState();
  }, [checkPushState]);

  const enablePush = async () => {
    if (pushBusy) return;
    setPushBusy(true);
    try {
      if (!('Notification' in window) || !('PushManager' in window)) {
        setPushState('error');
        return;
      }
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        setPushState('denied');
        return;
      }

      const reg = await navigator.serviceWorker.ready;
      const keyRes = await fetch('/api/push/public-key');
      const { key } = await keyRes.json();
      if (!key) {
        setPushState('error');
        return;
      }
      const applicationServerKey = key.startsWith('{')
        ? (JSON.parse(key)) as ArrayBuffer
        : (function () {
            const padding = '='.repeat((4 - (key.length % 4)) % 4);
            const base64 = (key + padding).replace(/-/g, '+').replace(/_/g, '/');
            const raw = atob(base64);
            return Uint8Array.from(raw, (c) => c.charCodeAt(0)).buffer as ArrayBuffer;
          })();

      const subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey,
      });

      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ subscription: subscription.toJSON() }),
      });
      setPushState('enabled');
    } catch {
      setPushState('error');
    } finally {
      setPushBusy(false);
    }
  };

  if (!isAuthenticated()) {
    return (
      <div className="pt-20 pb-20 container-bold text-center text-muted-foreground">
        <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-brand-orange/10 flex items-center justify-center">
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
          <h1 className="font-display text-2xl sm:text-3xl font-black text-foreground">{t(locale, 'notifications_title')}</h1>
          {notifications.some(n => !n.isRead) && (
            <button onClick={markAllRead} className="btn-bold-ghost text-xs flex items-center gap-1.5">
              <CheckCheck className="w-4 h-4" /> {t(locale, 'notifications_mark_all')}
            </button>
          )}
        </div>

        {pushState !== 'enabled' && (
            <div className="card-bold p-4 flex items-center gap-3 mb-6 border-2 border-brand-orange/20 bg-brand-orange/[0.03]">
              <div className="w-11 h-11 rounded-xl bg-brand-orange/10 flex items-center justify-center shrink-0">
                <BellRing className="w-5 h-5 text-brand-orange" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-foreground">
                  {pushState === 'denied' ? t(locale, 'push_denied') : t(locale, 'push_enable')}
                </p>
                {pushState !== 'denied' && (
                  <p className="text-xs text-muted-foreground mt-0.5">{t(locale, 'push_enabled_msg')}</p>
                )}
              </div>
              {pushState !== 'denied' && (
                <button
                  onClick={enablePush}
                  disabled={pushBusy}
                  className="btn-bold text-xs shrink-0 disabled:opacity-50"
                >
                  {pushBusy ? (
                    <Check className="w-4 h-4 animate-pulse" />
                  ) : (
                    <BellRing className="w-4 h-4" />
                  )}
                  {t(locale, 'push_enable')}
                </button>
              )}
            </div>
          )}
          {pushState === 'enabled' && (
            <div className="card-bold p-4 flex items-center gap-3 mb-6 border-2 border-green-500/20 bg-green-500/[0.04]">
              <div className="w-11 h-11 rounded-xl bg-green-500/10 flex items-center justify-center shrink-0">
                <BellRing className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-foreground">{t(locale, 'push_enabled')}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{t(locale, 'push_enabled_msg')}</p>
              </div>
            </div>
          )}

        {loading ? (
          <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-20 skeleton-bold rounded-2xl" />)}</div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-brand-orange/10 flex items-center justify-center">
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
                  className={`card-bold p-5 flex items-start gap-4 cursor-pointer transition-all border ${!notif.isRead ? 'border-brand-orange/20 bg-brand-orange/[0.02]' : 'border-transparent'}`}
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
