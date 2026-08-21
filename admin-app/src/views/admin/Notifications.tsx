'use client';

import { useState, useEffect, useCallback } from 'react';
import { Bell, Plus, Loader2, Send } from 'lucide-react';
import { adminFetch } from './api';
import { toast } from './toast';
import { ConfirmDialog, EmptyState, GhostButton, ListLoading, Modal, PrimaryButton, SectionHeader, Toggle, inputClass, LangInput } from './ui';

interface AdminNotification {
  id: string;
  titleAr: string;
  titleDe: string;
  titleEn: string;
  targetType?: 'single' | 'all';
  type?: string;
  isRead?: boolean;
  createdAt?: string;
}

interface ReelTarget {
  id: string;
  name: string;
  email: string;
}

interface NotificationForm {
  titleAr: string;
  titleDe: string;
  titleEn: string;
  messageAr: string;
  messageDe: string;
  messageEn: string;
  type: string;
  targetType: 'single' | 'all';
  userId?: string;
}

const emptyForm: NotificationForm = {
  titleAr: '', titleDe: '', titleEn: '',
  messageAr: '', messageDe: '', messageEn: '',
  type: 'announcement',
  targetType: 'all',
  userId: undefined,
};

export default function NotificationSection({
  token,
  locale,
}: {
  token: string;
  locale: string;
}) {
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [students, setStudents] = useState<ReelTarget[]>([]);
  const [form, setForm] = useState<NotificationForm>(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [sending, setSending] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [pushForm, setPushForm] = useState({ title: '', message: '', url: '/' });
  const [pushing, setPushing] = useState(false);
  const [pushResult, setPushResult] = useState<{ sent: number; failed: number } | null>(null);

  const refresh = useCallback(async () => {
    if (!token) return;
    try {
      const res = await adminFetch<{ notifications: AdminNotification[] }>('/api/admin/notifications', token);
      setNotifications(res.notifications || []);
    } catch (e) {
      console.error('Notifications fetch error:', e);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (form.targetType !== 'single' || students.length > 0) return;
    adminFetch<{ students: ReelTarget[] }>('/api/admin/students', token)
      .then((d) => setStudents(d.students || []))
      .catch(() => {});
  }, [form.targetType, students.length, token]);

  const sendNotification = async () => {
    if (!form.titleAr || !form.titleDe || !form.titleEn) {
      toast.error('جميع حقول العناوين مطلوبة');
      return;
    }
    setSending(true);
    try {
      await adminFetch<{ success: boolean }>('/api/admin/notifications', token, {
        method: 'POST',
        body: JSON.stringify(form),
      });
      toast.success('تم إرسال الإشعار بنجاح');
      setForm(emptyForm);
      setShowForm(false);
      refresh();
    } catch (e: any) {
      toast.error(e.message || 'فشل إرسال الإشعار');
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await adminFetch<{ success: boolean }>('/api/admin/notifications', token, {
        method: 'DELETE',
        body: JSON.stringify({ id: deleteId }),
      });
      toast.success('تم حذف الإشعار');
      setDeleteId(null);
      refresh();
    } catch (e: any) {
      toast.error(e.message || 'فشل حذف الإشعار');
    } finally {
      setDeleting(false);
    }
  };

  const sendPush = async () => {
    if (!pushForm.title.trim()) {
      toast.error('عنوان الإشعار مطلوب');
      return;
    }
    setPushing(true);
    setPushResult(null);
    try {
      const res = await adminFetch<{ sent: number; failed: number; total: number }>('/api/admin/push', token, {
        method: 'POST',
        body: JSON.stringify(pushForm),
      });
      setPushResult({ sent: res.sent, failed: res.failed });
      toast.success(`تم إرسال الإشعار إلى ${res.sent} جهاز${res.failed ? ` (فشل ${res.failed})` : ''}`);
    } catch (e: any) {
      toast.error(e.message || 'فشل إرسال إشعار البوب');
    } finally {
      setPushing(false);
    }
  };

  const update = (patch: Partial<NotificationForm>) => setForm((prev) => ({ ...prev, ...patch }));

  return (
    <div>
      {/* Push notification sender */}
      <div className="card-bold p-6 border-2 mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-brand-orange to-brand-red flex items-center justify-center shrink-0">
            <Send className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-black text-foreground">إشعارات المتصفح (Push)</h3>
            <p className="text-xs text-muted-foreground mt-0.5">إرسال فوري لجميع الأجهزة المسجّلة — يظهر حتى لو كان الموقع مغلقاً</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <input
            className={inputClass}
            placeholder="العنوان *"
            value={pushForm.title}
            onChange={(e) => setPushForm((p) => ({ ...p, title: e.target.value }))}
          />
          <input
            className={inputClass}
            placeholder="الرسالة"
            value={pushForm.message}
            onChange={(e) => setPushForm((p) => ({ ...p, message: e.target.value }))}
          />
          <input
            className={inputClass}
            placeholder="الرابط عند النقر (اختياري)"
            value={pushForm.url}
            onChange={(e) => setPushForm((p) => ({ ...p, url: e.target.value || '/' }))}
          />
        </div>
        <div className="flex items-center gap-4">
          <PrimaryButton onClick={sendPush} disabled={pushing}>
            {pushing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            إرسال للجميع
          </PrimaryButton>
          {pushResult && (
            <span className="text-xs font-bold text-muted-foreground">
              تم الإرسال: <span className="text-emerald-600">{pushResult.sent}</span>
              {pushResult.failed > 0 && <> · فشل: <span className="text-red-500">{pushResult.failed}</span></>}
            </span>
          )}
        </div>
      </div>

      <SectionHeader
        title="الإشعارات"
        subtitle="إرسال إشعارات للطلاب (جميع المستخدمين أو مستخدم محدد)"
        action={<PrimaryButton icon={Plus} onClick={() => setShowForm(true)}>إرسال إشعار</PrimaryButton>}
      />

      <Modal open={showForm} onClose={() => setShowForm(false)} title="إرسال إشعار جديد" size="xl">
        <form onSubmit={(e) => { e.preventDefault(); sendNotification(); }} className="space-y-5">
          <LangInput label="العنوان" form={form as unknown as Record<string, any>} field="title" onChange={(f) => setForm(f as unknown as NotificationForm)} required />
          <LangInput label="الرسالة" form={form as unknown as Record<string, any>} field="message" onChange={(f) => setForm(f as unknown as NotificationForm)} textarea rows={2} />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">نوع الإشعار</label>
              <select value={form.type} onChange={(e) => update({ type: e.target.value })} className={inputClass}>
                <option value="announcement">إعلان عام</option>
                <option value="info">معلومة</option>
                <option value="success">نجاح</option>
                <option value="warning">تنبيه</option>
                <option value="error">خطأ</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">الجمهور المستهدف</label>
              <div className="flex gap-2">
                <Toggle checked={form.targetType === 'all'} onChange={() => update({ targetType: 'all', userId: undefined })} labels={['كل المستخدمين', 'كل المستخدمين']} />
                <Toggle checked={form.targetType === 'single'} onChange={() => update({ targetType: 'single' })} labels={['مستخدم محدد', 'مستخدم محدد']} />
              </div>
            </div>
          </div>

          {form.targetType === 'single' && (
            <div className="space-y-2">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">اختر المستخدم</label>
              <select value={form.userId || ''} onChange={(e) => update({ userId: e.target.value || undefined })} className={inputClass} required>
                <option value="">-- اختر مستخدماً --</option>
                {students.map((s) => (
                  <option key={s.id} value={s.id}>{s.name} ({s.email})</option>
                ))}
              </select>
            </div>
          )}

          <div className="flex gap-3 justify-end pt-2">
            <GhostButton onClick={() => setShowForm(false)} disabled={sending}>إلغاء</GhostButton>
            <PrimaryButton type="submit" disabled={sending}>
              {sending ? 'جارٍ الإرسال…' : 'إرسال الإشعار'}
            </PrimaryButton>
          </div>
        </form>
      </Modal>

      <ConfirmDialog open={!!deleteId} message="هل أنت متأكد من حذف هذا الإشعار؟" onConfirm={handleDelete} onCancel={() => setDeleteId(null)} loading={deleting} />

      {loading ? (
        <ListLoading />
      ) : notifications.length === 0 ? (
        <EmptyState icon={Bell} text="لا توجد إشعارات بعد" />
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => (
            <div key={n.id} className="card-bold p-5 flex items-center justify-between gap-4 border-2 hover:border-brand-orange/30 transition-all">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-11 h-11 rounded-xl bg-brand-orange/10 flex items-center justify-center shrink-0">
                  <Bell className="w-5 h-5 text-brand-orange" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-foreground truncate">{n.titleAr || n.titleDe || n.titleEn}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {n.createdAt ? new Date(n.createdAt).toLocaleDateString(locale === 'ar' ? 'ar-SA' : locale === 'de' ? 'de-DE' : 'en-US') : ''}
                    {n.targetType === 'all' ? ' · كل المستخدمين' : ' · مستخدم محدد'}
                  </p>
                </div>
              </div>
              <button onClick={() => setDeleteId(n.id)} className="p-2.5 text-muted-foreground hover:text-red-500 rounded-xl hover:bg-red-50 dark:hover:bg-red-950 transition-all text-xs font-bold">
                حذف
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}