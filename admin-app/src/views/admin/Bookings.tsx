'use client';

import { useState, useMemo } from 'react';
import { toast } from './toast';
import { CalendarDays, Phone, User, GraduationCap, Check, X, CheckCircle2, Ban, Search } from 'lucide-react';
import { EmptyState, ListLoading, SectionHeader, inputClass } from './ui';
import { adminFetch, useAdminData } from './api';
import type { Booking } from './types';

const STATUS_META: Record<string, { label: string; cls: string }> = {
  pending: { label: 'قيد الانتظار', cls: 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400' },
  confirmed: { label: 'مؤكد', cls: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400' },
  rejected: { label: 'مرفوض', cls: 'bg-red-50 dark:bg-red-950/40 text-red-500' },
  completed: { label: 'مكتمل', cls: 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400' },
  cancelled: { label: 'ملغي', cls: 'bg-slate-100 dark:bg-slate-800 text-muted-foreground' },
};

export default function BookingsPage({ token }: { token: string }) {
  const { data: items, loading: listLoading, refresh } = useAdminData<Booking>('/api/admin/bookings', token, 'bookings');
  const bookings = items || [];
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [updating, setUpdating] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return bookings.filter((b) => {
      if (filter !== 'all' && b.status !== filter) return false;
      if (!q) return true;
      return b.studentName.toLowerCase().includes(q) || b.phoneNumber.includes(q);
    });
  }, [bookings, filter, query]);

  const counts = useMemo(() => ({
    all: bookings.length,
    pending: bookings.filter((b) => b.status === 'pending').length,
    confirmed: bookings.filter((b) => b.status === 'confirmed').length,
    completed: bookings.filter((b) => b.status === 'completed').length,
  }), [bookings]);

  const setStatus = async (b: Booking, status: string) => {
    setUpdating(b.id);
    try {
      await adminFetch<{ bookings: Booking[] }>('/api/admin/bookings', token, {
        method: 'PATCH',
        body: JSON.stringify({ id: b.id, status }),
      });
      await refresh();
      toast.success(`تم تحديث الحالة: ${STATUS_META[status]?.label || status}`);
    } catch (e: any) {
      toast.error(e.message || 'فشل التحديث');
    } finally {
      setUpdating(null);
    }
  };

  return (
    <div>
      <SectionHeader
        title="حجوزات الأونلاين"
        subtitle="طلبات حجز الدروس عبر موقع الطالب — تأكيد أو رفض مباشرة"
      />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { key: 'all', label: 'إجمالي الطلبات', cls: 'from-slate-600 to-slate-800' },
          { key: 'pending', label: 'قيد الانتظار', cls: 'from-amber-500 to-orange-600' },
          { key: 'confirmed', label: 'مؤكدة', cls: 'from-emerald-500 to-green-600' },
          { key: 'completed', label: 'مكتملة', cls: 'from-blue-500 to-indigo-600' },
        ].map((s) => (
          <div key={s.key} className="card-bold p-5 border-2">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center mb-3 shadow-lg ${s.cls}`}>
              <CalendarDays className="w-5 h-5 text-white" />
            </div>
            <p className="text-2xl font-black text-foreground leading-none">{counts[s.key]}</p>
            <p className="text-xs font-bold text-muted-foreground mt-2">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative max-w-xs flex-1">
          <Search className="w-4 h-4 absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            className={inputClass + ' ps-9 w-full'}
            placeholder="بحث بالاسم أو رقم الهاتف…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {(['all', 'pending', 'confirmed', 'rejected', 'completed', 'cancelled'] as const).map((k) => (
            <button
              key={k}
              onClick={() => setFilter(k)}
              className={`px-3.5 py-2 text-xs font-bold rounded-xl border-2 transition-all ${filter === k ? 'bg-gradient-to-r from-brand-orange to-brand-red text-white border-transparent shadow-glow' : 'border-border text-muted-foreground hover:border-brand-orange/40'}`}
            >
              {STATUS_META[k]?.label || 'الكل'}
            </button>
          ))}
        </div>
      </div>

      {listLoading ? <ListLoading /> : filtered.length === 0 ? (
        <EmptyState icon={CalendarDays} text="لا توجد حجوزات مطابقة" />
      ) : (
        <div className="space-y-3">
          {filtered.map((b) => {
            const meta = STATUS_META[b.status] || STATUS_META.pending;
            return (
              <div key={b.id} className="card-bold p-4 border-2">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-brand-orange/10 flex items-center justify-center shrink-0">
                      <User className="w-4.5 h-4.5 text-brand-orange" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-black text-foreground">{b.studentName}</p>
                      <p className="text-[11px] text-muted-foreground flex items-center gap-2 mt-0.5 flex-wrap">
                        <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{b.phoneNumber}</span>
                        <span className="flex items-center gap-1"><GraduationCap className="w-3 h-3" />المستوى {b.level}</span>
                        <span className="flex items-center gap-1"><CalendarDays className="w-3 h-3" />{new Date(b.preferredDate).toLocaleDateString('ar-EG')}</span>
                      </p>
                      {b.notes && <p className="text-[11px] text-muted-foreground mt-1">ملاحظات: {b.notes}</p>}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className={`text-[10px] font-black px-2.5 py-1 rounded-lg ${meta.cls}`}>{meta.label}</span>
                    <p className="text-[10px] text-muted-foreground">{new Date(b.createdAt).toLocaleDateString('ar-EG')}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border/60">
                  {b.status === 'pending' && (
                    <>
                      <ActionBtn color="emerald" icon={Check} label="تأكيد" loading={updating === b.id} onClick={() => setStatus(b, 'confirmed')} />
                      <ActionBtn color="red" icon={X} label="رفض" loading={updating === b.id} onClick={() => setStatus(b, 'rejected')} />
                    </>
                  )}
                  {b.status === 'confirmed' && (
                    <>
                      <ActionBtn color="blue" icon={CheckCircle2} label="إكمال" loading={updating === b.id} onClick={() => setStatus(b, 'completed')} />
                      <ActionBtn color="red" icon={X} label="إلغاء" loading={updating === b.id} onClick={() => setStatus(b, 'cancelled')} />
                    </>
                  )}
                  {(b.status === 'rejected' || b.status === 'cancelled') && (
                    <ActionBtn color="emerald" icon={Check} label="إعادة تفعيل (تأكيد)" loading={updating === b.id} onClick={() => setStatus(b, 'pending')} />
                  )}
                  {b.status === 'completed' && (
                    <ActionBtn color="slate" icon={Ban} label="إلغاء" loading={updating === b.id} onClick={() => setStatus(b, 'cancelled')} />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ActionBtn({ color, icon: Icon, label, loading, onClick }: { color: string; icon: any; label: string; loading?: boolean; onClick: () => void }) {
  const map: Record<string, string> = {
    emerald: 'text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/50 hover:bg-emerald-50 dark:hover:bg-emerald-950/40',
    red: 'text-red-500 border-red-200 dark:border-red-900/50 hover:bg-red-50 dark:hover:bg-red-950/40',
    blue: 'text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-900/50 hover:bg-blue-50 dark:hover:bg-blue-950/40',
    slate: 'text-muted-foreground border-border hover:bg-accent',
  };
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className={`px-3 py-1.5 text-[11px] font-bold rounded-lg border-2 transition-all flex items-center gap-1.5 ${map[color]} disabled:opacity-50`}
    >
      <Icon className="w-3.5 h-3.5" /> {label}
    </button>
  );
}