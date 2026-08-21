'use client';

import { useState, useCallback, useRef } from 'react';
import { toast } from './toast';
import {
  Plus, Pencil, Trash2, GraduationCap, ArrowRight, Video, Clock, Lock, BookOpen, UploadCloud, Shield,
} from 'lucide-react';
import {
  PrimaryButton, GhostButton, Modal, ConfirmDialog, SectionHeader, EmptyState,
  ListLoading, LevelBadge, Toggle, LangInput, ImageField, FormRow, inputClass,
} from './ui';
import { adminFetch, fieldOf, useAdminData } from './api';
import { Course, Lesson, LEVELS } from './types';

const emptyCourse = {
  titleAr: '', titleDe: '', titleEn: '',
  descriptionAr: '', descriptionDe: '', descriptionEn: '',
  level: 'A1', imageUrl: null, order: 0, isActive: true,
};

export default function CoursesSection({
  token,
  locale,
}: {
  token: string;
  locale: string;
}) {
  const { data: items, loading: listLoading, refresh } = useAdminData<Course>('/api/admin/courses', token, 'courses');
  const courses = items || [];
  const [managing, setManaging] = useState<Course | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Course | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const openCreate = () => { setEditing(null); setFormOpen(true); };
  const openEdit = (c: Course) => { setEditing(c); setFormOpen(true); };

  const handleDelete = async () => {
    if (!deleteId) return;
    setSaving(true);
    try {
      await adminFetch(`/api/admin/courses/${deleteId}`, token, { method: 'DELETE' });
      toast.success('تم حذف الدورة');
      setDeleteId(null);
      refresh();
    } catch (e: any) {
      toast.error(e.message || 'فشل الحذف');
    } finally { setSaving(false); }
  };

  if (managing) {
    return <LessonsManager course={managing} token={token} locale={locale} onBack={() => setManaging(null)} />;
  }

  return (
    <div>
      <SectionHeader
        title="الدورات"
        subtitle="إدارة الدورات التعليمية والدروس والفيديوهات"
        action={<PrimaryButton icon={Plus} onClick={openCreate}>إضافة دورة</PrimaryButton>}
      />

      {listLoading ? <ListLoading /> : courses.length === 0 ? (
        <EmptyState icon={BookOpen} text="لا توجد دورات بعد" />
      ) : (
        <div className="space-y-3">
          {courses.map((c) => (
            <div key={c.id} className="card-bold p-5 flex items-center justify-between gap-4 border-2 hover:border-brand-orange/30 transition-all">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5">
                  <LevelBadge level={c.level} />
                  <span className={`w-2.5 h-2.5 rounded-full ${c.isActive ? 'bg-green-500' : 'bg-gray-300'}`} />
                  <span className="text-[11px] font-bold text-muted-foreground">
                    {c.isActive ? 'منشورة' : 'مخفية'}
                  </span>
                </div>
                <p className="text-sm font-bold text-foreground truncate">{fieldOf(c as any, 'title', locale)}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {c._count?.lessons || 0} درس · {c._count?.enrollments || 0} مشترك
                </p>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => setManaging(c)} title="إدارة الدروس"
                  className="p-2.5 text-muted-foreground hover:text-brand-orange rounded-xl hover:bg-brand-orange/5 transition-all">
                  <GraduationCap className="w-4 h-4" />
                </button>
                <button onClick={() => openEdit(c)} title="تعديل"
                  className="p-2.5 text-muted-foreground hover:text-brand-orange rounded-xl hover:bg-brand-orange/5 transition-all">
                  <Pencil className="w-4 h-4" />
                </button>
                <button onClick={() => setDeleteId(c.id)} title="حذف"
                  className="p-2.5 text-muted-foreground hover:text-red-500 rounded-xl hover:bg-red-50 dark:hover:bg-red-950 transition-all">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={formOpen} onClose={() => setFormOpen(false)} title={editing ? 'تعديل الدورة' : 'إضافة دورة'}>
        <CourseForm
          course={editing}
          locale={locale}
          saving={saving}
          onSave={async (data) => {
            setSaving(true);
            try {
              const url = editing ? `/api/admin/courses/${editing.id}` : '/api/admin/courses';
              await adminFetch(url, token, { method: editing ? 'PUT' : 'POST', body: JSON.stringify(data) });
              toast.success(editing ? 'تم تحديث الدورة' : 'تمت إضافة الدورة');
              setFormOpen(false);
              refresh();
            } catch (e: any) { toast.error(e.message || 'فشل الحفظ'); }
            finally { setSaving(false); }
          }}
          onClose={() => setFormOpen(false)}
        />
      </Modal>

      <ConfirmDialog open={!!deleteId} message="هل أنت متأكد من حذف هذه الدورة وكل دروسها؟" onConfirm={handleDelete} onCancel={() => setDeleteId(null)} loading={saving} />
    </div>
  );
}

function CourseForm({ course, locale, saving, onSave, onClose }: {
  course: Course | null;
  locale: string;
  saving: boolean;
  onSave: (data: any) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState<any>(() => ({
    ...emptyCourse,
    ...(course || {}),
    imageUrl: course?.imageUrl ?? null,
  }));

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); onSave(form); }}
      className="space-y-5"
    >
      <LangInput label="عنوان الدورة" form={form} field="title" onChange={setForm} required />
      <LangInput label="الوصف" form={form} field="description" onChange={setForm} textarea rows={2} />

      <div className="grid grid-cols-2 gap-4">
        <FormRow label="المستوى">
          <select value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value })} className={inputClass}>
            {LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
          </select>
        </FormRow>
        <FormRow label="الترتيب">
          <input type="number" value={form.order} onChange={(e) => setForm({ ...form, order: parseInt(e.target.value) || 0 })} className={inputClass} />
        </FormRow>
      </div>

      <FormRow label="صورة الدورة">
        <ImageField value={form.imageUrl} onChange={(v) => setForm({ ...form, imageUrl: v })} placeholder="رابط صورة الغلاف" />
      </FormRow>

      <Toggle checked={form.isActive} onChange={() => setForm({ ...form, isActive: !form.isActive })} labels={['دورة منشورة', 'دورة مخفية']} />

      <div className="flex gap-3 justify-end pt-2">
        <GhostButton onClick={onClose} disabled={saving}>إلغاء</GhostButton>
        <PrimaryButton type="submit" disabled={saving}>{saving ? 'جارٍ الحفظ…' : 'حفظ'}</PrimaryButton>
      </div>
    </form>
  );
}

/* ----------------------------- Lessons manager --------------------------- */
function LessonsManager({ course, token, locale, onBack }: {
  course: Course;
  token: string;
  locale: string;
  onBack: () => void;
}) {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Lesson | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminFetch<{ lessons: Lesson[] }>(`/api/admin/courses/${course.id}/lessons`, token);
      setLessons(data.lessons || []);
    } catch (e: any) { toast.error(e.message); }
    finally { setLoading(false); }
  }, [course.id, token]);

  const handleDelete = async () => {
    if (!deleteId) return;
    setSaving(true);
    try {
      await adminFetch(`/api/admin/courses/${course.id}/lessons/${deleteId}`, token, { method: 'DELETE' });
      toast.success('تم حذف الدرس');
      setDeleteId(null);
      load();
    } catch (e: any) { toast.error(e.message); }
    finally { setSaving(false); }
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onBack} className="p-2 hover:bg-secondary rounded-xl transition-all"><ArrowRight className="w-5 h-5" /></button>
        <div className="flex-1 min-w-0">
          <h2 className="text-xl font-black text-foreground truncate">{fieldOf(course as any, 'title', locale)}</h2>
          <p className="text-xs text-muted-foreground">{lessons.length} درس</p>
        </div>
        <PrimaryButton icon={Plus} onClick={() => { setEditing(null); setFormOpen(true); }}>إضافة درس</PrimaryButton>
      </div>

      {loading ? <ListLoading /> : lessons.length === 0 ? (
        <EmptyState icon={Video} text="لا توجد دروس بعد" />
      ) : (
        <div className="space-y-3">
          {lessons.map((l, idx) => (
            <div key={l.id} className="card-bold p-5 flex items-center justify-between gap-4 border-2">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <span className="w-9 h-9 rounded-xl bg-brand-orange/10 flex items-center justify-center text-sm font-black text-brand-orange shrink-0">{idx + 1}</span>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-foreground truncate">{fieldOf(l as any, 'title', locale)}</p>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="w-3 h-3" />{l.duration} د</span>
                    {l.isFree && <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-300 font-bold">مجاني</span>}
                    {l.videoUrl && <span className="text-xs text-muted-foreground truncate max-w-[140px] flex items-center gap-1"><Video className="w-3 h-3" />{l.videoUrl}</span>}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => { setEditing(l); setFormOpen(true); }} className="p-2.5 text-muted-foreground hover:text-brand-orange rounded-xl hover:bg-brand-orange/5 transition-all"><Pencil className="w-4 h-4" /></button>
                <button onClick={() => setDeleteId(l.id)} className="p-2.5 text-muted-foreground hover:text-red-500 rounded-xl hover:bg-red-50 dark:hover:bg-red-950 transition-all"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={formOpen} onClose={() => setFormOpen(false)} title={editing ? 'تعديل الدرس' : 'إضافة دررس'}>
        <LessonForm
          lesson={editing}
          locale={locale}
          token={token}
          saving={saving}
          onSave={async (data) => {
            setSaving(true);
            try {
              const url = editing ? `/api/admin/courses/${course.id}/lessons/${editing.id}` : `/api/admin/courses/${course.id}/lessons`;
              await adminFetch(url, token, { method: editing ? 'PUT' : 'POST', body: JSON.stringify(data) });
              toast.success(editing ? 'تم تحديث الدرس' : 'تمت إضافة الدرس');
              setFormOpen(false);
              load();
            } catch (e: any) { toast.error(e.message); }
            finally { setSaving(false); }
          }}
          onClose={() => setFormOpen(false)}
        />
      </Modal>

      <ConfirmDialog open={!!deleteId} message="هل أنت متأكد من حذف هذا الدرس؟" onConfirm={handleDelete} onCancel={() => setDeleteId(null)} loading={saving} />
    </div>
  );
}

const emptyLesson = {
  titleAr: '', titleDe: '', titleEn: '',
  descriptionAr: '', descriptionDe: '', descriptionEn: '',
  videoUrl: '', duration: 0, order: 0, isFree: false,
};

function LessonForm({ lesson, locale, saving, onSave, onClose, token }: {
  lesson: Lesson | null;
  locale: string;
  saving: boolean;
  onSave: (data: any) => void;
  onClose: () => void;
  token: string;
}) {
  const [form, setForm] = useState<any>(() => ({ ...emptyLesson, ...(lesson || {}) }));
  const [uploading, setUploading] = useState(false);
  const [uploadPct, setUploadPct] = useState(0);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const uploadToR2 = async (file: File) => {
    setUploading(true);
    setUploadPct(0);
    try {
      const res = await fetch('/api/admin/r2/upload-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ filename: file.name, contentType: file.type }),
      });
      if (!res.ok) throw new Error('upload-url failed');
      const { uploadUrl, key } = await res.json();

      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('PUT', uploadUrl);
        xhr.setRequestHeader('Content-Type', file.type);
        xhr.upload.onprogress = (e) => e.lengthComputable && setUploadPct(Math.round((e.loaded / e.total) * 100));
        xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(`upload failed ${xhr.status}`)));
        xhr.onerror = () => reject(new Error('network error'));
        xhr.send(file);
      });

      setForm((f: any) => ({ ...f, videoUrl: key }));
      toast.success('تم رفع الفيديو بنجاح — سيُشغَّل برابط محمي');
    } catch (e: any) {
      toast.error(e.message || 'فشل رفع الفيديو');
    } finally {
      setUploading(false);
      setUploadPct(0);
    }
  };

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSave(form); }} className="space-y-5">
      <LangInput label="عنوان الدرس" form={form} field="title" onChange={setForm} required />
      <LangInput label="الوصف" form={form} field="description" onChange={setForm} textarea rows={2} />
      <FormRow label="الفيديو — رفع إلى Cloudflare R2 (محمي) أو رابط خارجي">
        <input
          type="text"
          value={form.videoUrl || ''}
          onChange={(e) => setForm({ ...form, videoUrl: e.target.value || null })}
          placeholder="r2:videos/…  أو  https://…"
          className={inputClass}
          dir="ltr"
        />
        <div className="flex items-center gap-3 mt-2">
          <input
            ref={fileRef}
            type="file"
            accept="video/mp4,video/webm,video/ogg,video/quicktime"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadToR2(f); e.target.value = ''; }}
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading || saving}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl bg-gradient-to-r from-brand-orange to-brand-red text-white disabled:opacity-50"
          >
            <UploadCloud className="w-4 h-4" />
            {uploading ? `جارٍ الرفع… ${uploadPct}%` : 'رفع فيديو من الكمبيوتر'}
          </button>
          {form.videoUrl?.startsWith('r2:') && (
            <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
              <Shield className="w-3.5 h-3.5" /> رابط محمي (R2)
            </span>
          )}
        </div>
        {uploading && (
          <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden mt-2">
            <div className="h-full bg-gradient-to-r from-brand-orange to-brand-red transition-all" style={{ width: `${uploadPct}%` }} />
          </div>
        )}
      </FormRow>
      <div className="grid grid-cols-3 gap-4">
        <FormRow label="المدة (دقائق)">
          <input type="number" value={form.duration} onChange={(e) => setForm({ ...form, duration: parseInt(e.target.value) || 0 })} className={inputClass} />
        </FormRow>
        <FormRow label="الترتيب">
          <input type="number" value={form.order} onChange={(e) => setForm({ ...form, order: parseInt(e.target.value) || 0 })} className={inputClass} />
        </FormRow>
        <div className="flex items-end">
          <Toggle checked={form.isFree} onChange={() => setForm({ ...form, isFree: !form.isFree })} labels={['مجاني', 'مدفوع']} />
        </div>
      </div>
      <div className="flex gap-3 justify-end pt-2">
        <GhostButton onClick={onClose} disabled={saving}>إلغاء</GhostButton>
        <PrimaryButton type="submit" disabled={saving}>{saving ? 'جارٍ الحفظ…' : 'حفظ'}</PrimaryButton>
      </div>
    </form>
  );
}
