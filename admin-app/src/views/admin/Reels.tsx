'use client';

import { useState } from 'react';
import { Plus, Pencil, Trash2, Clapperboard, ArrowUp, ArrowDown, Play } from 'lucide-react';
import {
  PrimaryButton, GhostButton, Modal, ConfirmDialog, SectionHeader, EmptyState, ListLoading,
  Toggle, LangInput, ImageField, FormRow, inputClass,
} from './ui';
import { adminFetch, fieldOf, useAdminData } from './api';
import { toast } from './toast';

interface Reel {
  id: string;
  titleAr: string;
  titleDe: string;
  titleEn: string;
  descriptionAr?: string | null;
  descriptionDe?: string | null;
  descriptionEn?: string | null;
  videoUrl: string;
  videoId?: string | null;
  thumbnail?: string | null;
  duration?: number;
  status: string;
  displayOrder: number;
}

const emptyReel = {
  titleAr: '', titleDe: '', titleEn: '',
  descriptionAr: '', descriptionDe: '', descriptionEn: '',
  videoUrl: '', videoId: '', thumbnail: '',
  duration: 0, status: 'draft', displayOrder: 0,
};

export default function ReelsSection({
  token,
  locale,
}: {
  token: string;
  locale: string;
}) {
  const { data: items, loading: listLoading, refresh } = useAdminData<Reel>('/api/admin/reels', token, 'reels');
  const reels = items || [];
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Reel | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleDelete = async () => {
    if (!deleteId) return;
    setSaving(true);
    try {
      await adminFetch(`/api/admin/reels/${deleteId}`, token, { method: 'DELETE' });
      toast.success('تم حذف الفيديو');
      setDeleteId(null);
      refresh();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (reel: Reel) => {
    const next = reel.status === 'published' ? 'draft' : 'published';
    try {
      await adminFetch(`/api/admin/reels/${reel.id}`, token, { method: 'PUT', body: JSON.stringify({ status: next }) });
      toast.success(next === 'published' ? 'تم نشر الفيديو' : 'تم إلغاء النشر');
      refresh();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const move = async (index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= reels.length) return;
    const a = reels[index];
    const b = reels[target];
    try {
      await Promise.all([
        adminFetch(`/api/admin/reels/${a.id}`, token, { method: 'PUT', body: JSON.stringify({ displayOrder: b.displayOrder }) }),
        adminFetch(`/api/admin/reels/${b.id}`, token, { method: 'PUT', body: JSON.stringify({ displayOrder: a.displayOrder }) }),
      ]);
      refresh();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  return (
    <div>
      <SectionHeader
        title="الفيديوهات التعليمية"
        subtitle="إدارة الفيديوهات العمودية (Reels) التي تظهر في الصفحة الرئيسية"
        action={<PrimaryButton icon={Plus} onClick={() => { setEditing(null); setFormOpen(true); }}>إضافة فيديو</PrimaryButton>}
      />

      {listLoading ? <ListLoading /> : reels.length === 0 ? (
        <EmptyState icon={Clapperboard} text="لا توجد فيديوهات — أضف فيديو لبدء العرض في الصفحة الرئيسية" />
      ) : (
        <div className="space-y-3">
          {reels.map((reel, i) => (
            <div key={reel.id} className="card-bold p-5 flex items-center justify-between gap-4 border-2 hover:border-brand-orange/30 transition-all">
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <div className="w-12 h-20 rounded-xl overflow-hidden bg-secondary shrink-0 border border-border relative flex items-center justify-center">
                  {reel.thumbnail ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={reel.thumbnail} alt="" className="w-full h-full object-cover" onError={(e) => ((e.target as HTMLImageElement).style.visibility = 'hidden')} />
                  ) : (
                    <Play className="w-4 h-4 text-muted-foreground" />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`w-2.5 h-2.5 rounded-full ${reel.status === 'published' ? 'bg-green-500' : 'bg-gray-300'}`} />
                    <p className="text-sm font-bold text-foreground truncate">{fieldOf(reel as any, 'title', locale)}</p>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {reel.status === 'published' ? 'منشور' : 'مسودة'} · الترتيب {reel.displayOrder}
                    {reel.duration ? ` · ${Math.floor(reel.duration / 60)}:${(reel.duration % 60).toString().padStart(2, '0')}` : ''}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => move(i, -1)} disabled={i === 0} className="p-2.5 text-muted-foreground hover:text-brand-orange rounded-xl hover:bg-brand-orange/5 transition-all disabled:opacity-30"><ArrowUp className="w-4 h-4" /></button>
                <button onClick={() => move(i, 1)} disabled={i === reels.length - 1} className="p-2.5 text-muted-foreground hover:text-brand-orange rounded-xl hover:bg-brand-orange/5 transition-all disabled:opacity-30"><ArrowDown className="w-4 h-4" /></button>
                <Toggle checked={reel.status === 'published'} onChange={() => toggleStatus(reel)} labels={['منشور', 'مسودة']} />
                <button onClick={() => { setEditing(reel); setFormOpen(true); }} className="p-2.5 text-muted-foreground hover:text-brand-orange rounded-xl hover:bg-brand-orange/5 transition-all"><Pencil className="w-4 h-4" /></button>
                <button onClick={() => setDeleteId(reel.id)} className="p-2.5 text-muted-foreground hover:text-red-500 rounded-xl hover:bg-red-50 dark:hover:bg-red-950 transition-all"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={formOpen} onClose={() => setFormOpen(false)} title={editing ? 'تعديل الفيديو' : 'إضافة فيديو'} size="xl">
        <ReelForm
          reel={editing}
          saving={saving}
          onSave={async (data) => {
            setSaving(true);
            try {
              const url = editing ? `/api/admin/reels/${editing.id}` : '/api/admin/reels';
              await adminFetch(url, token, { method: editing ? 'PUT' : 'POST', body: JSON.stringify(data) });
              toast.success(editing ? 'تم تحديث الفيديو' : 'تمت إضافة الفيديو');
              setFormOpen(false);
              refresh();
            } catch (e: any) {
              toast.error(e.message);
            } finally {
              setSaving(false);
            }
          }}
          onClose={() => setFormOpen(false)}
        />
      </Modal>

      <ConfirmDialog open={!!deleteId} message="هل أنت متأكد من حذف هذا الفيديو؟" onConfirm={handleDelete} onCancel={() => setDeleteId(null)} loading={saving} />
    </div>
  );
}

function ReelForm({ reel, saving, onSave, onClose }: {
  reel: Reel | null;
  saving: boolean;
  onSave: (data: any) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState<any>(() => ({ ...emptyReel, ...(reel || {}) }));

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSave(form); }} className="space-y-5">
      <LangInput label="العنوان" form={form} field="title" onChange={setForm} required />
      <LangInput label="الوصف" form={form} field="description" onChange={setForm} textarea rows={2} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormRow label="رابط الفيديو (URL) *">
          <input type="text" required value={form.videoUrl || ''} onChange={(e) => setForm({ ...form, videoUrl: e.target.value })} placeholder="https://youtube.com/watch?v=… أو رابط mp4" className={inputClass} />
        </FormRow>
        <FormRow label="معرّف يوتيوب (اختياري)">
          <input type="text" value={form.videoId || ''} onChange={(e) => setForm({ ...form, videoId: e.target.value })} placeholder="dQw4w9WgXcQ" className={inputClass} />
        </FormRow>
      </div>

      <FormRow label="صورة مصغرة (Thumbnail)">
        <ImageField value={form.thumbnail || null} onChange={(v) => setForm({ ...form, thumbnail: v })} placeholder="رابط الصورة المصغرة (اختياري)" />
      </FormRow>

      <div className="grid grid-cols-2 gap-4">
        <FormRow label="المدة (بالثواني)">
          <input type="number" min={0} value={form.duration || 0} onChange={(e) => setForm({ ...form, duration: parseInt(e.target.value) || 0 })} className={inputClass} />
        </FormRow>
        <div className="flex items-end">
          <Toggle checked={form.status === 'published'} onChange={() => setForm({ ...form, status: form.status === 'published' ? 'draft' : 'published' })} labels={['منشور فوراً', 'مسودة']} />
        </div>
      </div>

      <div className="flex gap-3 justify-end pt-2">
        <GhostButton onClick={onClose} disabled={saving}>إلغاء</GhostButton>
        <PrimaryButton type="submit" disabled={saving}>{saving ? 'جارٍ الحفظ…' : 'حفظ'}</PrimaryButton>
      </div>
    </form>
  );
}