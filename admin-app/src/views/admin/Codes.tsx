'use client';

import { useState, useMemo } from 'react';
import { toast } from './toast';
import {
  KeyRound, Plus, Trash2, RefreshCw, CalendarClock, Copy, CheckCircle2,
  Clock, Users, Ban, Sparkles, Filter, ExternalLink
} from 'lucide-react';
import {
  ConfirmDialog, EmptyState, Modal, PrimaryButton, GhostButton, SectionHeader, inputClass,
} from './ui';
import { adminFetch, useAdminData } from './api';
import type { ActivationCode, Course } from './types';

const DURATION_PRESETS = [
  { label: '7 أيام', days: 7 },
  { label: '14 يوماً', days: 14 },
  { label: 'شهر (30 يوماً)', days: 30 },
  { label: 'شهران (60 يوماً)', days: 60 },
  { label: '3 أشهر (90 يوماً)', days: 90 },
];

export default function CodesPage({
  token,
}: {
  token: string;
}) {
  const { data: codesData, refresh: refreshCodes } = useAdminData<any>('/api/admin/codes', token, 'codes');
  const localCodes = codesData || [];
  const { data: coursesData } = useAdminData<Course>('/api/admin/courses', token, 'courses');
  const courses = coursesData || [];

  const [query, setQuery] = useState('');
  const [selectedCourseId, setSelectedCourseId] = useState<string>('all');
  const [filter, setFilter] = useState<'all' | 'unused' | 'used' | 'expired' | 'revoked'>('all');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [extending, setExtending] = useState<string | null>(null);
  const [revoking, setRevoking] = useState<string | null>(null);

  // Generate modal states
  const [showGen, setShowGen] = useState(false);
  const [form, setForm] = useState({
    courseId: '',
    count: '5',
    preset: '30',
    customDays: '',
    maxUses: '1',
    customCode: '',
    notes: '',
  });
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState<any[]>([]);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);

  const now = Date.now();

  const getStatus = (c: any): 'unused' | 'used' | 'expired' | 'revoked' => {
    if (c.status === 'revoked') return 'revoked';
    if (c.isUsed && c.maxUses <= 1) return 'used';
    if (c.studentEnrollment?.expiresAt && new Date(c.studentEnrollment.expiresAt).getTime() < now) return 'expired';
    if (c.expiresAt && new Date(c.expiresAt).getTime() < now) return 'expired';
    if (c.usedCount >= (c.maxUses || 1)) return 'used';
    return 'unused';
  };

  const syncCodes = refreshCodes;

  const filtered = useMemo(() => {
    return localCodes.filter((c: any) => {
      if (selectedCourseId !== 'all' && c.courseId !== selectedCourseId) return false;
      const status = getStatus(c);
      if (filter !== 'all' && status !== filter) return false;
      const q = query.trim().toLowerCase();
      if (!q) return true;
      const title = c.course?.titleAr || c.course?.titleDe || '';
      const userName = c.user?.name || c.user?.email || '';
      return (
        c.code.toLowerCase().includes(q) ||
        title.toLowerCase().includes(q) ||
        userName.toLowerCase().includes(q)
      );
    });
  }, [localCodes, filter, selectedCourseId, query, now]);

  const totals = useMemo(() => ({
    total: localCodes.length,
    unused: localCodes.filter((c: any) => getStatus(c) === 'unused').length,
    used: localCodes.filter((c: any) => getStatus(c) === 'used').length,
    expired: localCodes.filter((c: any) => getStatus(c) === 'expired').length,
    revoked: localCodes.filter((c: any) => getStatus(c) === 'revoked').length,
  }), [localCodes, now]);

  const daysInput = () => {
    const p = DURATION_PRESETS.find((x) => String(x.days) === form.preset);
    return p ? p.days : Math.max(parseInt(form.customDays) || 30, 1);
  };

  const generate = async () => {
    if (!form.courseId) {
      toast.error('يرجى اختيار الدورة أولاً');
      return;
    }
    setGenerating(true);
    try {
      const res = await adminFetch<{ codes: any[] }>('/api/admin/codes', token, {
        method: 'POST',
        body: JSON.stringify({
          courseId: form.courseId,
          count: form.customCode ? 1 : form.count,
          durationDays: daysInput(),
          maxUses: parseInt(form.maxUses) || 1,
          customCode: form.customCode ? form.customCode.trim() : undefined,
          notes: form.notes || undefined,
        }),
      });
      setGenerated(res.codes || []);
      await syncCodes();
      toast.success(`تم توليد ${res.codes?.length || 0} كود بنجاح`);
    } catch (e: any) {
      toast.error(e.message || 'فشل التوليد');
    } finally {
      setGenerating(false);
    }
  };

  const remove = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await adminFetch(`/api/admin/codes?id=${deleteId}`, token, { method: 'DELETE' });
      setDeleteId(null);
      await syncCodes();
      toast.success('تم حذف الكود');
    } catch (e: any) {
      toast.error(e.message || 'فشل الحذف');
    } finally {
      setDeleting(false);
    }
  };

  const revoke = async (id: string) => {
    setRevoking(id);
    try {
      await adminFetch('/api/admin/codes', token, {
        method: 'PATCH',
        body: JSON.stringify({ id, action: 'revoke' }),
      });
      await syncCodes();
      toast.success('تم إبطال الكود وإيقاف صلاحية الدورة فوراً');
    } catch (e: any) {
      toast.error(e.message || 'فشل الإبطال');
    } finally {
      setRevoking(null);
    }
  };

  const extend = async (id: string, days: number = 30) => {
    setExtending(id);
    try {
      await adminFetch('/api/admin/codes', token, {
        method: 'PATCH',
        body: JSON.stringify({ id, action: 'extend', days }),
      });
      await syncCodes();
      toast.success(`تم تمديد الصلاحية بمقدار ${days} يوماً`);
    } catch (e: any) {
      toast.error(e.message || 'فشل التمديد');
    } finally {
      setExtending(null);
    }
  };

  const copyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      toast.success(`تم نسخ الكود: ${code}`);
      setTimeout(() => setCopiedCode(null), 1500);
    } catch { /* ignore */ }
  };

  const copyAll = async () => {
    try {
      await navigator.clipboard.writeText(generated.map((c) => c.code).join('\n'));
      setCopiedAll(true);
      toast.success('تم نسخ جميع الأكواد');
      setTimeout(() => setCopiedAll(false), 1500);
    } catch { /* ignore */ }
  };

  return (
    <div>
      <SectionHeader
        title="أكواد تفعيل الدورات"
        subtitle="إدارة وتوليد أكواد مخصصة لكل دورة مع صلاحية زمنية محسوبة وتتبع الطلاب"
        action={
          <PrimaryButton icon={Plus} onClick={() => { setGenerated([]); setShowGen(true); }}>
            توليد أكواد تفعيل
          </PrimaryButton>
        }
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'إجمالي الأكواد', value: totals.total, cls: 'from-slate-600 to-slate-800', icon: KeyRound },
          { label: 'متاحة للاستخدام', value: totals.unused, cls: 'from-emerald-500 to-green-600', icon: Clock },
          { label: 'نشطة لدى طلاب', value: totals.used, cls: 'from-blue-500 to-indigo-600', icon: Users },
          { label: 'منتهية أو ملغية', value: totals.expired + totals.revoked, cls: 'from-amber-500 to-red-600', icon: CalendarClock },
        ].map((s) => (
          <div key={s.label} className="card-bold p-5 border-2">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center mb-3 shadow-md ${s.cls}`}>
              <s.icon className="w-5 h-5 text-white" />
            </div>
            <p className="text-2xl font-black text-foreground leading-none">{s.value}</p>
            <p className="text-xs font-bold text-muted-foreground mt-2">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters and Search Bar */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <input
          className={inputClass + ' max-w-xs'}
          placeholder="بحث بالكود أو الكورس أو الطالب…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />

        {/* Filter by Course */}
        <select
          value={selectedCourseId}
          onChange={(e) => setSelectedCourseId(e.target.value)}
          className={inputClass + ' max-w-[200px] text-xs font-bold'}
        >
          <option value="all">كل الدورات</option>
          {courses.map((c) => (
            <option key={c.id} value={c.id}>{c.titleAr} ({c.level})</option>
          ))}
        </select>

        {/* Status Filters */}
        <div className="flex gap-1.5 flex-wrap">
          {([
            { key: 'all', label: 'الكل' },
            { key: 'unused', label: 'متاحة' },
            { key: 'used', label: 'نشطة' },
            { key: 'expired', label: 'منتهية' },
            { key: 'revoked', label: 'ملغية' },
          ] as const).map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl border-2 transition-all ${
                filter === f.key
                  ? 'bg-brand-orange text-white border-transparent shadow-sm'
                  : 'border-border text-muted-foreground hover:border-brand-orange/40'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Codes List */}
      {filtered.length === 0 ? (
        <EmptyState icon={KeyRound} text="لا توجد أكواد مطابقة للفلاتر المحددة" />
      ) : (
        <div className="space-y-3">
          {filtered.map((c: any) => {
            const status = getStatus(c);
            const enrollmentExp = c.studentEnrollment?.expiresAt
              ? new Date(c.studentEnrollment.expiresAt)
              : null;
            const isCopying = copiedCode === c.code;

            return (
              <div key={c.id} className="card-bold p-4 border-2 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3.5 min-w-0 flex-1">
                  <div className="w-10 h-10 rounded-xl bg-brand-orange/10 flex items-center justify-center shrink-0">
                    <KeyRound className="w-5 h-5 text-brand-orange" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-mono text-base font-black text-foreground tracking-wider" dir="ltr">
                        {c.code}
                      </p>
                      <button
                        onClick={() => copyCode(c.code)}
                        className="p-1 text-muted-foreground hover:text-brand-orange transition-colors"
                        title="نسخ الكود"
                      >
                        {isCopying ? <CheckCircle2 className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>

                    <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground flex-wrap">
                      <span className="font-bold text-foreground">
                        {c.course?.titleAr || c.course?.titleDe || 'دورة غير محددة'}
                      </span>
                      {c.course?.level && (
                        <span className="px-1.5 py-0.2 bg-secondary text-[10px] font-bold rounded">
                          {c.course.level}
                        </span>
                      )}
                      <span>·</span>
                      <span className="flex items-center gap-1 font-semibold text-brand-orange">
                        <Clock className="w-3 h-3" /> {c.durationDays || 30} يوماً
                      </span>
                    </div>
                  </div>
                </div>

                {/* Status & Student Details */}
                <div className="flex items-center gap-4 flex-wrap">
                  <div>
                    {status === 'unused' && (
                      <span className="text-[11px] font-black px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900">
                        🟢 متاح للتفعيل
                      </span>
                    )}
                    {status === 'used' && (
                      <span className="text-[11px] font-black px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900">
                        🔵 نشط لدى طالب
                      </span>
                    )}
                    {status === 'expired' && (
                      <span className="text-[11px] font-black px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-900">
                        ⌛ منتهي الصلاحية
                      </span>
                    )}
                    {status === 'revoked' && (
                      <span className="text-[11px] font-black px-2.5 py-1 rounded-lg bg-red-50 dark:bg-red-950/40 text-red-500 border border-red-200 dark:border-red-900">
                        🔴 تم الإلغاء
                      </span>
                    )}
                  </div>

                  {c.user && (
                    <div className="text-xs text-muted-foreground min-w-[140px]">
                      <p className="font-bold text-foreground truncate flex items-center gap-1">
                        <Users className="w-3 h-3 text-brand-orange" /> {c.user.name}
                      </p>
                      {enrollmentExp && (
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          ينتهي: {enrollmentExp.toLocaleDateString('ar-EG')}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    {status !== 'revoked' && (
                      <button
                        onClick={() => extend(c.id, 30)}
                        disabled={extending === c.id}
                        className="px-2.5 py-1.5 text-xs font-bold text-brand-orange hover:bg-brand-orange/10 rounded-xl transition-all flex items-center gap-1"
                        title="تمديد 30 يوماً"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${extending === c.id ? 'animate-spin' : ''}`} />
                        +30 يوم
                      </button>
                    )}

                    {status !== 'revoked' && (
                      <button
                        onClick={() => revoke(c.id)}
                        disabled={revoking === c.id}
                        className="p-2 text-muted-foreground hover:text-amber-500 rounded-xl hover:bg-amber-50 dark:hover:bg-amber-950/30 transition-all"
                        title="إلغاء الصلاحية (Revoke)"
                      >
                        <Ban className="w-4 h-4" />
                      </button>
                    )}

                    <button
                      onClick={() => setDeleteId(c.id)}
                      className="p-2 text-muted-foreground hover:text-red-500 rounded-xl hover:bg-red-50 dark:hover:bg-red-950 transition-all"
                      title="حذف الكود"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Code Generation Modal */}
      <Modal open={showGen} onClose={() => setShowGen(false)} title="توليد أكواد تفعيل جديدة" size="lg">
        <div className="space-y-5">
          <div className="p-4 rounded-2xl bg-brand-orange/5 border border-brand-orange/20">
            <h4 className="text-sm font-bold text-foreground mb-1">أكواد تفعيل الدورات المقيدة بالمدة</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              كل كود يتم توليده يرتبط بدورة محددة وبمدة صلاحية (تبدأ من لحظة تفعيل الطالب للكود). لا يمكن استخدام الكود لتفعيل دورة أخرى.
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-foreground block">اختر الدورة المستهدفة <span className="text-red-500">*</span></label>
            <select
              value={form.courseId}
              onChange={(e) => setForm({ ...form, courseId: e.target.value })}
              className={inputClass}
            >
              <option value="">-- اختر الدورة التي سيفتحها الكود --</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>{c.titleAr} ({c.level})</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-foreground block">مدة الصلاحية بعد التفعيل</label>
              <select
                value={form.preset}
                onChange={(e) => setForm({ ...form, preset: e.target.value })}
                className={inputClass}
              >
                {DURATION_PRESETS.map((p) => (
                  <option key={p.days} value={p.days}>{p.label}</option>
                ))}
                <option value="custom">-- مدة مخصصة بالأيام --</option>
              </select>
            </div>

            {form.preset === 'custom' ? (
              <div className="space-y-2">
                <label className="text-xs font-bold text-foreground block">عدد الأيام المخصصة</label>
                <input
                  type="number"
                  min={1}
                  value={form.customDays}
                  onChange={(e) => setForm({ ...form, customDays: e.target.value })}
                  className={inputClass}
                  placeholder="مثال: 45 يوماً"
                />
              </div>
            ) : (
              <div className="space-y-2">
                <label className="text-xs font-bold text-foreground block">سياسة الاستخدام</label>
                <select
                  value={form.maxUses}
                  onChange={(e) => setForm({ ...form, maxUses: e.target.value })}
                  className={inputClass}
                >
                  <option value="1">استخدام فردي (طالب واحد فقط - موصى به)</option>
                  <option value="5">استخدام متعدد (حتى 5 طلاب)</option>
                  <option value="10">استخدام متعدد (حتى 10 طلاب)</option>
                  <option value="50">مجموعة دراسية (حتى 50 طالب)</option>
                </select>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-foreground block">
                كود مخصص (اختياري)
              </label>
              <input
                type="text"
                value={form.customCode}
                onChange={(e) => setForm({ ...form, customCode: e.target.value.toUpperCase() })}
                className={inputClass}
                placeholder="مثال: OMAR-VIP-A1"
                dir="ltr"
              />
              <p className="text-[10px] text-muted-foreground">اتركه فارغاً للتوليد الآلي: OMAR-LEVEL-XXXX</p>
            </div>

            {!form.customCode && (
              <div className="space-y-2">
                <label className="text-xs font-bold text-foreground block">عدد الأكواد المراد توليدها</label>
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={form.count}
                  onChange={(e) => setForm({ ...form, count: e.target.value })}
                  className={inputClass}
                />
              </div>
            )}
          </div>

          <div className="flex gap-3 justify-end pt-3 border-t border-border">
            <GhostButton onClick={() => setShowGen(false)} disabled={generating}>إلغاء</GhostButton>
            <PrimaryButton onClick={generate} disabled={generating}>
              {generating ? 'جارٍ التوليد…' : form.customCode ? 'إنشاء الكود المخصص' : `توليد ${form.count || 1} كود`}
            </PrimaryButton>
          </div>

          {generated.length > 0 && (
            <div className="mt-4 rounded-2xl border-2 border-emerald-200 dark:border-emerald-900/50 bg-emerald-50 dark:bg-emerald-950/20 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-black text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" /> تم توليد {generated.length} كود بنجاح
                </p>
                <button
                  onClick={copyAll}
                  className="text-xs font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1 hover:underline"
                >
                  <Copy className="w-3.5 h-3.5" /> {copiedAll ? 'تم النسخ بنجاح' : 'نسخ جميع الأكواد'}
                </button>
              </div>
              <textarea
                readOnly
                dir="ltr"
                value={generated.map((c) => c.code).join('\n')}
                className="w-full h-28 font-mono text-xs p-3 rounded-xl bg-white dark:bg-card border border-emerald-200 dark:border-emerald-900/50 text-foreground resize-none"
              />
            </div>
          )}
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteId}
        message="هل أنت متأكد من حذف هذا الكود؟ لن يتمكن أي طالب من استخدامه بعد الحذف."
        onConfirm={remove}
        onCancel={() => setDeleteId(null)}
        loading={deleting}
      />
    </div>
  );
}