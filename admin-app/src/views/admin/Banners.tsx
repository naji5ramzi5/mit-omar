'use client';

import { useState } from 'react';
import { toast } from './toast';
import { Plus, Pencil, Trash2, Image as ImageIcon, Link2 } from 'lucide-react';
import {
  PrimaryButton, GhostButton, Modal, ConfirmDialog, SectionHeader, EmptyState, ListLoading,
  Toggle, LangInput, ImageField, FormRow, inputClass,
} from './ui';
import { adminFetch, fieldOf, useAdminData } from './api';
import { Banner } from './types';

const emptyBanner = {
  titleAr: '', titleDe: '', titleEn: '',
  descriptionAr: '', descriptionDe: '', descriptionEn: '',
  imageUrl: null, link: null, pageSlug: null,
  labelAr: '', labelDe: '', labelEn: '',
  order: 0, isActive: true,
};

export default function BannersSection({
  token, locale,
}: {
  token: string;
  locale: string;
}) {
  const { data: items, loading: listLoading, refresh } = useAdminData<Banner>('/api/admin/banners', token, 'banners');
  const banners = items || [];
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Banner | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleDelete = async () => {
    if (!deleteId) return;
    setSaving(true);
    try {
      await adminFetch(`/api/admin/banners/${deleteId}`, token, { method: 'DELETE' });
      toast.success('تم حذف البانر');
      setDeleteId(null);
      refresh();
    } catch (e: any) { toast.error(e.message); }
    finally { setSaving(false); }
  };

  return (
    <div>
      <SectionHeader
        title="البانرات"
        subtitle="إدارة البانرات في الصفحة الرئيسية (صورة + عنوان + رابط)"
        action={<PrimaryButton icon={Plus} onClick={() => { setEditing(null); setFormOpen(true); }}>إضافة بانر</PrimaryButton>}
      />

      {listLoading ? <ListLoading /> : banners.length === 0 ? (
        <EmptyState icon={ImageIcon} text="لا توجد بانرات" />
      ) : (
        <div className="space-y-3">
          {banners.map((b) => (
            <div key={b.id} className="card-bold p-5 flex items-center justify-between gap-4 border-2 hover:border-brand-orange/30 transition-all">
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <div className="w-16 h-12 rounded-xl overflow-hidden bg-secondary shrink-0 border border-border">
                  {b.imageUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={b.imageUrl} alt="" className="w-full h-full object-cover" onError={(e) => ((e.target as HTMLImageElement).style.visibility = 'hidden')} />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`w-2.5 h-2.5 rounded-full ${b.isActive ? 'bg-green-500' : 'bg-gray-300'}`} />
                    <p className="text-sm font-bold text-foreground truncate">{fieldOf(b as any, 'title', locale)}</p>
                  </div>
                  {b.link && <p className="text-xs text-muted-foreground truncate flex items-center gap-1"><Link2 className="w-3 h-3" />{b.link}</p>}
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => { setEditing(b); setFormOpen(true); }} className="p-2.5 text-muted-foreground hover:text-brand-orange rounded-xl hover:bg-brand-orange/5 transition-all"><Pencil className="w-4 h-4" /></button>
                <button onClick={() => setDeleteId(b.id)} className="p-2.5 text-muted-foreground hover:text-red-500 rounded-xl hover:bg-red-50 dark:hover:bg-red-950 transition-all"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={formOpen} onClose={() => setFormOpen(false)} title={editing ? 'تعديل البانر' : 'إضافة بانر'}>
        <BannerForm
          banner={editing}
          locale={locale}
          saving={saving}
          onSave={async (data) => {
            setSaving(true);
            try {
              const url = editing ? `/api/admin/banners/${editing.id}` : '/api/admin/banners';
              await adminFetch(url, token, { method: editing ? 'PUT' : 'POST', body: JSON.stringify(data) });
              toast.success(editing ? 'تم تحديث البانر' : 'تمت إضافة البانر');
              setFormOpen(false);
              refresh();
            } catch (e: any) { toast.error(e.message); }
            finally { setSaving(false); }
          }}
          onClose={() => setFormOpen(false)}
        />
      </Modal>

      <ConfirmDialog open={!!deleteId} message="هل أنت متأكد من حذف هذا البانر؟" onConfirm={handleDelete} onCancel={() => setDeleteId(null)} loading={saving} />
    </div>
  );
}

function BannerForm({ banner, locale, saving, onSave, onClose }: {
  banner: Banner | null;
  locale: string;
  saving: boolean;
  onSave: (data: any) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState<any>(() => ({ ...emptyBanner, ...(banner || {}) }));

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSave(form); }} className="space-y-5">
      <LangInput label="العنوان" form={form} field="title" onChange={setForm} required />
      <LangInput label="الوصف" form={form} field="description" onChange={setForm} textarea rows={2} />
      <LangInput label="الكلمة المميزة (Label)" form={form} field="label" onChange={setForm} />

      <FormRow label="صورة البانر">
        <ImageField value={form.imageUrl} onChange={(v) => setForm({ ...form, imageUrl: v })} placeholder="رابط صورة البانر" />
      </FormRow>

      <div className="grid grid-cols-2 gap-4">
        <FormRow label="الرابط (URL) عند النقر">
          <input type="text" value={form.link || ''} onChange={(e) => setForm({ ...form, link: e.target.value || null })} placeholder="https://…" className={inputClass} />
        </FormRow>
        <FormRow label="صفحة داخلية (pageSlug)">
          <input type="text" value={form.pageSlug || ''} onChange={(e) => setForm({ ...form, pageSlug: e.target.value || null })} placeholder="مثال: about" className={inputClass} />
        </FormRow>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <FormRow label="الترتيب">
          <input type="number" value={form.order} onChange={(e) => setForm({ ...form, order: parseInt(e.target.value) || 0 })} className={inputClass} />
        </FormRow>
        <div className="flex items-end">
          <Toggle checked={form.isActive} onChange={() => setForm({ ...form, isActive: !form.isActive })} labels={['بار ظاهر', 'بار مخفي']} />
        </div>
      </div>

      <div className="flex gap-3 justify-end pt-2">
        <GhostButton onClick={onClose} disabled={saving}>إلغاء</GhostButton>
        <PrimaryButton type="submit" disabled={saving}>{saving ? 'جارٍ الحفظ…' : 'حفظ'}</PrimaryButton>
      </div>
    </form>
  );
}
