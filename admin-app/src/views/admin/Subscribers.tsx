'use client';

import { useState } from 'react';
import { toast } from './toast';
import { Mail, Trash2, Search } from 'lucide-react';
import {
  ConfirmDialog, EmptyState, ListLoading, SectionHeader, inputClass,
} from './ui';
import { adminFetch, useAdminData } from './api';
import { Subscriber } from './types';

export default function Subscribers({ token }: {
  token: string;
}) {
  const { data: items, refresh: refreshList } = useAdminData<Subscriber>('/api/admin/subscribers', token, 'subscribers');
  const subscribers = items || [];
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('');
  const [toDelete, setToDelete] = useState<Subscriber | null>(null);

  const filtered = subscribers.filter((s) =>
    s.email.toLowerCase().includes(query.toLowerCase()),
  );

  const remove = async () => {
    if (!toDelete) return;
    setLoading(true);
    try {
      await adminFetch<{ success: boolean }>('/api/admin/subscribers', token, {
        method: 'DELETE',
        body: JSON.stringify({ id: toDelete.id }),
      });
      toast.success('تم حذف المشترك');
      refreshList();
    } catch {
      toast.error('فشل حذف المشترك');
    } finally {
      setLoading(false);
      setToDelete(null);
    }
  };

  const activeCount = subscribers.filter((s) => s.isActive).length;

  return (
    <div className="space-y-6">
      <SectionHeader
        title="المشتركون في النشرة"
        subtitle={`${subscribers.length} مشترك • ${activeCount} نشط`}
        action={
          <button onClick={refreshList} className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-bold rounded-xl border-2 border-border bg-card hover:border-brand-orange/40 transition-colors">
            تحديث
          </button>
        }
      />

      <div className="relative">
        <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="ابحث بالبريد الإلكتروني..."
          className={`${inputClass} pr-11`}
        />
      </div>

      {loading ? (
        <ListLoading />
      ) : filtered.length === 0 ? (
        <EmptyState icon={Mail} text={query ? 'جرّب كلمة بحث أخرى' : 'لم يشترك أحد في النشرة بعد'} />
      ) : (
        <div className="card-bold border-2 divide-y divide-border overflow-hidden">
          {filtered.map((s) => (
            <div key={s.id} className="flex items-center gap-4 p-4 hover:bg-brand-orange/[0.03] transition-colors">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-brand-orange to-brand-red text-white flex items-center justify-center shrink-0">
                <Mail className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-foreground truncate">{s.email}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {new Date(s.createdAt).toLocaleDateString('ar')}
                </p>
              </div>
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${s.isActive ? 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400' : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'}`}>
                {s.isActive ? 'نشط' : 'غير نشط'}
              </span>
              <button
                onClick={() => setToDelete(s)}
                className="p-2 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-950 transition-colors"
                aria-label="حذف"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!toDelete}
        title="حذف المشترك"
        message={`هل أنت متأكد من حذف ${toDelete?.email}؟`}
        loading={loading}
        onConfirm={remove}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
}
