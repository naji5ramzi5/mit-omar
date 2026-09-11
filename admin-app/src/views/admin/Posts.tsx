'use client';

import { useState } from 'react';
import { toast } from './toast';
import { Plus, Pencil, Trash2, FileText } from 'lucide-react';
import {
  PrimaryButton, GhostButton, Modal, ConfirmDialog, SectionHeader, EmptyState, ListLoading,
  Toggle, LangInput, ImageField, FormRow, inputClass,
} from './ui';
import { resolveAdminMediaUrl } from './media-uploaders';
import { adminFetch, fieldOf, useAdminData } from './api';
import { Post, POST_CATEGORIES } from './types';

const emptyPost = {
  titleAr: '', titleDe: '', titleEn: '',
  excerptAr: '', excerptDe: '', excerptEn: '',
  contentAr: '', contentDe: '', contentEn: '',
  category: 'education', imageUrl: null, isPublished: false,
};

export default function PostsSection({
  token, locale,
}: {
  token: string;
  locale: string;
}) {
  const { data: items, loading: listLoading, refresh } = useAdminData<Post>('/api/admin/posts', token, 'posts');
  const posts = items || [];
  const [filter, setFilter] = useState<'all' | 'published' | 'draft'>('all');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Post | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const filtered = posts.filter((p) =>
    filter === 'all' ? true : filter === 'published' ? p.isPublished : !p.isPublished);

  const handleDelete = async () => {
    if (!deleteId) return;
    setSaving(true);
    try {
      await adminFetch(`/api/admin/posts/${deleteId}`, token, { method: 'DELETE' });
      toast.success('تم حذف المقال');
      setDeleteId(null);
      refresh();
    } catch (e: any) { toast.error(e.message); }
    finally { setSaving(false); }
  };

  return (
    <div>
      <SectionHeader
        title="المقالات"
        subtitle="إدارة المقالات والأخبار والمدونة"
        action={<PrimaryButton icon={Plus} onClick={() => { setEditing(null); setFormOpen(true); }}>إضافة مقال</PrimaryButton>}
      />

      <div className="flex gap-2 mb-5">
        {([['all', 'الكل'], ['published', 'منشورة'], ['draft', 'مسودات']] as const).map(([k, label]) => (
          <button key={k} onClick={() => setFilter(k)}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${filter === k ? 'bg-brand-orange text-white' : 'bg-secondary text-muted-foreground hover:text-foreground'}`}>
            {label}
          </button>
        ))}
      </div>

      {listLoading ? <ListLoading /> : filtered.length === 0 ? (
        <EmptyState icon={FileText} text="لا توجد مقالات" />
      ) : (
        <div className="space-y-3">
          {filtered.map((p) => (
            <div key={p.id} className="card-bold p-5 flex items-center justify-between gap-4 border-2 hover:border-brand-orange/30 transition-all">
              <div className="flex items-center gap-4 flex-1 min-w-0">
                {p.imageUrl && (
                  <div className="w-16 h-12 rounded-xl overflow-hidden bg-secondary shrink-0 border border-border">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={resolveAdminMediaUrl(p.imageUrl)} alt="" className="w-full h-full object-cover" onError={(e) => ((e.target as HTMLImageElement).style.visibility = 'hidden')} />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-xs font-bold text-brand-orange bg-brand-orange/10 px-2 py-0.5 rounded-lg">{p.category}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-lg font-bold ${p.isPublished ? 'bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-300' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'}`}>
                      {p.isPublished ? 'منشورة' : 'مسودة'}
                    </span>
                  </div>
                  <p className="text-sm font-bold text-foreground truncate">{fieldOf(p as any, 'title', locale)}</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => { setEditing(p); setFormOpen(true); }} className="p-2.5 text-muted-foreground hover:text-brand-orange rounded-xl hover:bg-brand-orange/5 transition-all"><Pencil className="w-4 h-4" /></button>
                <button onClick={() => setDeleteId(p.id)} className="p-2.5 text-muted-foreground hover:text-red-500 rounded-xl hover:bg-red-50 dark:hover:bg-red-950 transition-all"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={formOpen} onClose={() => setFormOpen(false)} title={editing ? 'تعديل المقال' : 'إضافة مقال'} size="xl">
        <PostForm
          post={editing}
          locale={locale}
          saving={saving}
          onSave={async (data) => {
            setSaving(true);
            try {
              const url = editing ? `/api/admin/posts/${editing.id}` : '/api/admin/posts';
              await adminFetch(url, token, { method: editing ? 'PUT' : 'POST', body: JSON.stringify(data) });
              toast.success(editing ? 'تم تحديث المقال' : 'تمت إضافة المقال');
              setFormOpen(false);
              refresh();
            } catch (e: any) { toast.error(e.message); }
            finally { setSaving(false); }
          }}
          onClose={() => setFormOpen(false)}
        />
      </Modal>

      <ConfirmDialog open={!!deleteId} message="هل أنت متأكد من حذف هذا المقال؟" onConfirm={handleDelete} onCancel={() => setDeleteId(null)} loading={saving} />
    </div>
  );
}

function PostForm({ post, locale, saving, onSave, onClose }: {
  post: Post | null;
  locale: string;
  saving: boolean;
  onSave: (data: any) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState<any>(() => ({ ...emptyPost, ...(post || {}), imageUrl: post?.imageUrl ?? null }));

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSave(form); }} className="space-y-5">
      <LangInput label="العنوان" form={form} field="title" onChange={setForm} required />
      <LangInput label="المقتطف" form={form} field="excerpt" onChange={setForm} textarea rows={2} />
      <LangInput label="المحتوى" form={form} field="content" onChange={setForm} textarea rows={5} />

      <div className="grid grid-cols-2 gap-4">
        <FormRow label="التصنيف">
          <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className={inputClass}>
            {POST_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </FormRow>
        <div className="flex items-end">
          <Toggle checked={form.isPublished} onChange={() => setForm({ ...form, isPublished: !form.isPublished })} labels={['منشورة', 'مسودة']} />
        </div>
      </div>

      <FormRow label="صورة المقال">
        <ImageField value={form.imageUrl} onChange={(v) => setForm({ ...form, imageUrl: v })} placeholder="رابط صورة المقال" />
      </FormRow>

      <div className="flex gap-3 justify-end pt-2">
        <GhostButton onClick={onClose} disabled={saving}>إلغاء</GhostButton>
        <PrimaryButton type="submit" disabled={saving}>{saving ? 'جارٍ الحفظ…' : 'حفظ'}</PrimaryButton>
      </div>
    </form>
  );
}
