'use client';

import { useState, useMemo } from 'react';
import { toast } from './toast';
import { KeyRound, Plus, Trash2, RefreshCw, CalendarClock, Copy, CheckCircle2, Clock, Users } from 'lucide-react';
import {
  ConfirmDialog, EmptyState, Modal, PrimaryButton, GhostButton, SectionHeader, inputClass,
} from './ui';
import { adminFetch, useAdminData } from './api';
import type { ActivationCode, Course } from './types';

const PRESETS = [
  { label: 'شهر (30 يوم)', days: 30 },
  { label: '3 أشهر (90 يوم)', days: 90 },
  { label: '6 أشهر (180 يوم)', days: 180 },
  { label: 'سنة (365 يوم)', days: 365 },
];

export default function CodesPage({
  token,
}: {
  token: string;
}) {
  const { data: codesData, refresh: refreshCodes } = useAdminData<ActivationCode>('/api/admin/codes', token, 'codes');
  const localCodes = codesData || [];
  const { data: coursesData, refresh: refreshCourses } = useAdminData<Course>('/api/admin/courses', token, 'courses');
  const courses = coursesData || [];
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'unused' | 'used' | 'expired'>('all');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [extending, setExtending] = useState<string | null>(null);

  const [showGen, setShowGen] = useState(false);
  const [form, setForm] = useState({ courseId: '', count: '5', preset: '90', customDays: '' });
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState<ActivationCode[]>([]);
  const [copied, setCopied] = useState(false);

  const now = Date.now();

  const getStatus = (c: ActivationCode): 'used' | 'expired' | 'unused' => {
    if (c.isUsed) return 'used';
    if (c.expiresAt && new Date(c.expiresAt).getTime() < now) return 'expired';
    return 'unused';
  };

  const syncCodes = refreshCodes;

  const filtered = useMemo(() => {
    return localCodes.filter((c) => {
      if (filter !== 'all' && getStatus(c) !== filter) return false;
      const q = query.trim().toLowerCase();
      if (!q) return true;
      const title = c.course?.titleAr || c.course?.titleDe || '';
      return c.code.toLowerCase().includes(q) || title.toLowerCase().includes(q);
    });
  }, [localCodes, filter, query, now]);

  const totals = useMemo(() => ({
    total: localCodes.length,
    unused: localCodes.filter((c) => getStatus(c) === 'unused').length,
    used: localCodes.filter((c) => getStatus(c) === 'used').length,
    expired: localCodes.filter((c) => getStatus(c) === 'expired').length,
  }), [localCodes, now]);

  const daysInput = () => {
    const p = PRESETS.find((x) => String(x.days) === form.preset);
    return p ? p.days : Math.max(parseInt(form.customDays) || 30, 1);
  };

  const generate = async () => {
    if (!form.courseId) { toast.error('اختر الدورة أولاً'); return; }
    setGenerating(true);
    try {
      const res = await adminFetch<{ codes: ActivationCode[] }>('/api/admin/codes', token, {
        method: 'POST',
        body: JSON.stringify({ courseId: form.courseId, count: form.count, durationDays: daysInput() }),
      });
      setGenerated(res.codes || []);
      await syncCodes();
      toast.success(`تم توليد ${res.codes?.length || 0} كود`);
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
      await Promise.all([syncCodes(), refreshCourses()]);
      toast.success('تم حذف الكود');
    } catch (e: any) {
      toast.error(e.message || 'فشل الحذف');
    } finally {
      setDeleting(false);
    }
  };

  const extend = async (id: string) => {
    setExtending(id);
    try {
      const res = await adminFetch<{ codes: ActivationCode[] }>('/api/admin/codes', token, {
        method: 'PATCH',
        body: JSON.stringify({ id, days: 30 }),
      });
      await syncCodes();
      toast.success('تم تمديد الكود 30 يوماً');
      void res;
    } catch (e: any) {
      toast.error(e.message || 'فشل التمديد');
    } finally {
      setExtending(null);
    }
  };

  const copyAll = async () => {
    try {
      await navigator.clipboard.writeText(generated.map((c) => c.code).join('\n'));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch { /* ignore */ }
  };

  return (
    <div>
      <SectionHeader
        title="أكواد التفعيل"
        subtitle="توليد أكواد وصول لكل دورة مع مدة صلاحية — عند انتهائها يختفي الكورس من الطالب"
        action={<PrimaryButton icon={Plus} onClick={() => { setGenerated([]); setShowGen(true); }}>توليد أكواد</PrimaryButton>}
      />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'إجمالي الأكواد', value: totals.total, cls: 'from-slate-600 to-slate-800' },
          { label: 'متاحة', value: totals.unused, cls: 'from-emerald-500 to-green-600' },
          { label: 'مستخدمة', value: totals.used, cls: 'from-blue-500 to-indigo-600' },
          { label: 'منتهية', value: totals.expired, cls: 'from-red-500 to-rose-600' },
        ].map((s) => (
          <div key={s.label} className="card-bold p-5 border-2">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center mb-3 shadow-lg ${s.cls}`}>
              {s.label === 'متاحة' ? <Clock className="w-5 h-5 text-white" /> : s.label === 'مستخدمة' ? <Users className="w-5 h-5 text-white" /> : s.label === 'منتهية' ? <CalendarClock className="w-5 h-5 text-white" /> : <KeyRound className="w-5 h-5 text-white" />}
            </div>
            <p className="text-2xl font-black text-foreground leading-none">{s.value}</p>
            <p className="text-xs font-bold text-muted-foreground mt-2">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <input
          className={inputClass + ' max-w-xs'}
          placeholder="بحث بالكود أو اسم الكورس…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div className="flex gap-1.5">
          {([
            { key: 'all', label: 'الكل' },
            { key: 'unused', label: 'متاحة' },
            { key: 'used', label: 'مستخدمة' },
            { key: 'expired', label: 'منتهية' },
          ] as const).map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-3.5 py-2 text-xs font-bold rounded-xl border-2 transition-all ${filter === f.key ? 'bg-gradient-to-r from-brand-orange to-brand-red text-white border-transparent shadow-glow' : 'border-border text-muted-foreground hover:border-brand-orange/40'}`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <EmptyState icon={KeyRound} text="لا توجد أكواد مطابقة" />
      ) : (
        <div className="space-y-2.5">
          {filtered.map((c) => {
            const status = getStatus(c);
            const exp = c.expiresAt ? new Date(c.expiresAt) : null;
            return (
              <div key={c.id} className="card-bold p-4 border-2 flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-brand-orange/10 flex items-center justify-center shrink-0">
                    <KeyRound className="w-4.5 h-4.5 text-brand-orange" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-mono text-sm font-black text-foreground tracking-wider" dir="ltr">{c.code}</p>
                    <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                      {c.course?.titleAr || c.course?.titleDe || 'كورس محذوف'}
                      {c.course?.level ? ` • ${c.course.level}` : ''}
                    </p>
                  </div>
                </div>
                <span className={`text-[10px] font-black px-2.5 py-1 rounded-lg ${status === 'unused' ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400' : status === 'used' ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400' : 'bg-red-50 dark:bg-red-950/40 text-red-500'}`}>
                  {status === 'unused' ? 'متاحة' : status === 'used' ? 'مستخدمة' : 'منتهية'}
                </span>
                <div className="text-[11px] text-muted-foreground min-w-[110px]">
                  {status === 'used' && c.user ? (
                    <p className="truncate"><Users className="w-3 h-3 inline me-1" />{c.user.name}</p>
                  ) : (
                    <p className="flex items-center gap-1"><CalendarClock className="w-3 h-3" />{exp ? exp.toLocaleDateString('ar-EG') : '—'}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {status !== 'used' && (
                    <button onClick={() => extend(c.id)} disabled={!!extending} className="p-2 text-xs font-bold text-brand-orange hover:bg-brand-orange/10 rounded-lg transition-all flex items-center gap-1">
                      <RefreshCw className={`w-3.5 h-3.5 ${extending === c.id ? 'animate-spin' : ''}`} /> تمديد 30 يوم
                    </button>
                  )}
                  <button onClick={() => setDeleteId(c.id)} className="p-2 text-muted-foreground hover:text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-950 transition-all">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Generate modal */}
      <Modal open={showGen} onClose={() => setShowGen(false)} title="توليد أكواد تفعيل" size="lg">
        <div className="space-y-5">
          <div className="space-y-2">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">الدورة</label>
            <select value={form.courseId} onChange={(e) => setForm({ ...form, courseId: e.target.value })} className={inputClass}>
              <option value="">-- اختر الدورة --</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>{c.titleAr} ({c.level})</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">عدد الأكواد</label>
              <input type="number" min={1} max={200} value={form.count} onChange={(e) => setForm({ ...form, count: e.target.value })} className={inputClass} />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">مدة الصلاحية</label>
              <select value={form.preset} onChange={(e) => setForm({ ...form, preset: e.target.value })} className={inputClass}>
                <option value="">-- مدة مخصصة --</option>
                {PRESETS.map((p) => (
                  <option key={p.days} value={p.days}>{p.label}</option>
                ))}
              </select>
            </div>
          </div>
          {!PRESETS.some((p) => String(p.days) === form.preset) && (
            <div className="space-y-2">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">المدة بالأيام</label>
              <input type="number" min={1} value={form.customDays} onChange={(e) => setForm({ ...form, customDays: e.target.value })} className={inputClass} placeholder="مثال: 120" />
            </div>
          )}
          <div className="flex gap-3 justify-end">
            <GhostButton onClick={() => setShowGen(false)} disabled={generating}>إلغاء</GhostButton>
            <PrimaryButton onClick={generate} disabled={generating}>
              {generating ? 'جارٍ التوليد…' : `توليد ${form.count || 0} كود`}
            </PrimaryButton>
          </div>

          {generated.length > 0 && (
            <div className="mt-4 rounded-2xl border-2 border-emerald-200 dark:border-emerald-900/50 bg-emerald-50 dark:bg-emerald-950/20 p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-black text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" /> تم توليد {generated.length} كود
                </p>
                <button onClick={copyAll} className="text-xs font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1 hover:underline">
                  <Copy className="w-3.5 h-3.5" /> {copied ? 'تم النسخ' : 'نسخ الكل'}
                </button>
              </div>
              <textarea
                readOnly
                dir="ltr"
                value={generated.map((c) => c.code).join('\n')}
                className="w-full h-32 font-mono text-xs p-3 rounded-xl bg-white dark:bg-card border border-emerald-200 dark:border-emerald-900/50 text-foreground resize-none"
              />
            </div>
          )}
        </div>
      </Modal>

      <ConfirmDialog open={!!deleteId} message="هل أنت متأكد من حذف هذا الكود؟" onConfirm={remove} onCancel={() => setDeleteId(null)} loading={deleting} />
    </div>
  );
}