'use client';

import { useState } from 'react';
import { toast } from './toast';
import { Plus, Pencil, Trash2, Star, Quote } from 'lucide-react';
import {
  PrimaryButton, GhostButton, Modal, ConfirmDialog, SectionHeader, EmptyState, ListLoading,
  Toggle, LangInput, ImageField, FormRow, inputClass, LevelBadge,
} from './ui';
import { adminFetch, fieldOf, useAdminData } from './api';
import { Testimonial, LEVELS } from './types';

const emptyTestimonial = {
  nameAr: '', nameDe: '', nameEn: '',
  roleAr: '', roleDe: '', roleEn: '',
  textAr: '', textDe: '', textEn: '',
  level: 'A1', rating: 5, avatar: null, isActive: true, order: 0,
};

export default function TestimonialsSection({
  token, locale,
}: {
  token: string;
  locale: string;
}) {
  const { data: items, loading: listLoading, refresh } = useAdminData<Testimonial>('/api/admin/testimonials', token, 'testimonials');
  const testimonials = items || [];
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Testimonial | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleDelete = async () => {
    if (!deleteId) return;
    setSaving(true);
    try {
      await adminFetch(`/api/admin/testimonials/${deleteId}`, token, { method: 'DELETE' });
      toast.success('تم حذف الرأي');
      setDeleteId(null);
      refresh();
    } catch (e: any) { toast.error(e.message); }
    finally { setSaving(false); }
  };

  return (
    <div>
      <SectionHeader
        title="آراء الطلاب"
        subtitle="إدارة الشهادات والتقييمات التي تظهر في الموقع"
        action={<PrimaryButton icon={Plus} onClick={() => { setEditing(null); setFormOpen(true); }}>إضافة رأي</PrimaryButton>}
      />

      {listLoading ? <ListLoading /> : testimonials.length === 0 ? (
        <EmptyState icon={Quote} text="لا توجد آراء بعد" />
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {testimonials.map((t) => (
            <div key={t.id} className="card-bold p-5 border-2 hover:border-brand-orange/30 transition-all">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-11 h-11 rounded-full overflow-hidden bg-secondary border border-border shrink-0">
                    {t.avatar && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={t.avatar} alt="" className="w-full h-full object-cover" onError={(e) => ((e.target as HTMLImageElement).style.visibility = 'hidden')} />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-foreground truncate">{fieldOf(t as any, 'name', locale)}</p>
                    <p className="text-xs text-muted-foreground truncate">{fieldOf(t as any, 'role', locale)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => { setEditing(t); setFormOpen(true); }} className="p-2 text-muted-foreground hover:text-brand-orange rounded-xl hover:bg-brand-orange/5 transition-all"><Pencil className="w-4 h-4" /></button>
                  <button onClick={() => setDeleteId(t.id)} className="p-2 text-muted-foreground hover:text-red-500 rounded-xl hover:bg-red-50 dark:hover:bg-red-950 transition-all"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
              <p className="text-sm text-muted-foreground line-clamp-3 mb-3">{fieldOf(t as any, 'text', locale)}</p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className={`w-3.5 h-3.5 ${i < t.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-300'}`} />
                  ))}
                </div>
                <LevelBadge level={t.level || 'B1'} />
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={formOpen} onClose={() => setFormOpen(false)} title={editing ? 'تعديل الرأي' : 'إضافة رأي'}>
        <TestimonialForm testimonial={editing} locale={locale} saving={saving}
          onSave={async (data) => {
            setSaving(true);
            try {
              const url = editing ? `/api/admin/testimonials/${editing.id}` : '/api/admin/testimonials';
              await adminFetch(url, token, { method: editing ? 'PUT' : 'POST', body: JSON.stringify(data) });
              toast.success(editing ? 'تم تحديث الرأي' : 'تمت إضافة الرأي');
              setFormOpen(false);
              refresh();
            } catch (e: any) { toast.error(e.message); }
            finally { setSaving(false); }
          }}
          onClose={() => setFormOpen(false)}
        />
      </Modal>

      <ConfirmDialog open={!!deleteId} message="هل أنت متأكد من حذف هذا الرأي؟" onConfirm={handleDelete} onCancel={() => setDeleteId(null)} loading={saving} />
    </div>
  );
}

function TestimonialForm({ testimonial, locale, saving, onSave, onClose }: any) {
  const [form, setForm] = useState<any>(() => ({ ...emptyTestimonial, ...(testimonial || {}) }));
  const [rating, setRating] = useState(testimonial?.rating || 5);

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSave({ ...form, rating }); }} className="space-y-5">
      <LangInput label="الاسم" form={form} field="name" onChange={setForm} required />
      <LangInput label="الدور / الوظيفة" form={form} field="role" onChange={setForm} />
      <LangInput label="نص الرأي" form={form} field="text" onChange={setForm} textarea rows={3} required />

      <FormRow label="صورة الشخصية">
        <ImageField value={form.avatar} onChange={(v) => setForm({ ...form, avatar: v })} placeholder="رابط الصورة" />
      </FormRow>

      <div className="grid grid-cols-3 gap-4">
        <FormRow label="المستوى">
          <select value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value })} className={inputClass}>
            {LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
          </select>
        </FormRow>
        <FormRow label="الترتيب">
          <input type="number" value={form.order} onChange={(e) => setForm({ ...form, order: parseInt(e.target.value) || 0 })} className={inputClass} />
        </FormRow>
        <div className="flex items-end">
          <Toggle checked={form.isActive} onChange={() => setForm({ ...form, isActive: !form.isActive })} labels={['ظاهر', 'مخفي']} />
        </div>
      </div>

      <FormRow label="التقييم">
        <div className="flex items-center gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <button type="button" key={i} onClick={() => setRating(i + 1)}>
              <Star className={`w-7 h-7 ${(i + 1) <= rating ? 'text-amber-400 fill-amber-400' : 'text-gray-300'} transition-colors`} />
            </button>
          ))}
        </div>
      </FormRow>

      <div className="flex gap-3 justify-end pt-2">
        <GhostButton onClick={onClose} disabled={saving}>إلغاء</GhostButton>
        <PrimaryButton type="submit" disabled={saving}>{saving ? 'جارٍ الحفظ…' : 'حفظ'}</PrimaryButton>
      </div>
    </form>
  );
}
