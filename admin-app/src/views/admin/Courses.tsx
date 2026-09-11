'use client';

import { useState, useCallback, useRef } from 'react';
import { toast } from './toast';
import VideoPreviewModal from '@/components/VideoPreviewModal';
import {
  Plus, Pencil, Trash2, GraduationCap, ArrowRight, Video, Clock, Lock, BookOpen, UploadCloud, Shield, Eye,
} from 'lucide-react';
import {
  PrimaryButton, GhostButton, Modal, ConfirmDialog, SectionHeader, EmptyState,
  ListLoading, LevelBadge, Toggle, LangInput, ImageField, FormRow, inputClass,
} from './ui';
import { ImageUploader, VideoUploader, resolveAdminMediaUrl } from './media-uploaders';
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
  const openEdit = async (c: Course) => {
    try {
      const res = await adminFetch<{ course: any }>(`/api/admin/courses/${c.id}`, token);
      setEditing(res.course || c);
    } catch {
      setEditing(c);
    }
    setFormOpen(true);
  };

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
              <div className="flex items-center gap-4 flex-1 min-w-0">
                {c.imageUrl && (
                  <div className="w-16 h-12 rounded-xl overflow-hidden bg-secondary shrink-0 border border-border">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={resolveAdminMediaUrl(c.imageUrl)} alt="" className="w-full h-full object-cover" onError={(e) => ((e.target as HTMLImageElement).style.visibility = 'hidden')} />
                  </div>
                )}
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

      <Modal open={formOpen} onClose={() => setFormOpen(false)} title={editing ? 'تعديل الدورة' : 'إضافة دورة'} size="lg">
        <CourseForm
          course={editing}
          locale={locale}
          token={token}
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

function CourseForm({ course, locale, token, saving, onSave, onClose }: {
  course: Course | null;
  locale: string;
  token: string;
  saving: boolean;
  onSave: (data: any) => void;
  onClose: () => void;
}) {
  const [activeTab, setActiveTab] = useState<'info' | 'intro'>('info');
  const [form, setForm] = useState<any>(() => ({
    ...emptyCourse,
    ...(course || {}),
    imageUrl: course?.imageUrl ?? null,
    introVideoUrl: (course as any)?.introVideo?.videoUrl ?? null,
    introVideoDuration: (course as any)?.introVideo?.duration ?? 0,
    isIntroPublished: (course as any)?.introVideo?.isPublished ?? true,
  }));

  return (
    <div className="space-y-5">
      {/* Navigation tabs */}
      <div className="flex border-b border-border gap-2 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('info')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'info'
              ? 'bg-brand-orange text-white shadow-sm'
              : 'text-muted-foreground hover:bg-secondary'
          }`}
        >
          بيانات الدورة الأساسية
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('intro')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeTab === 'intro'
              ? 'bg-brand-orange text-white shadow-sm'
              : 'text-muted-foreground hover:bg-secondary'
          }`}
        >
          <Video className="w-3.5 h-3.5" />
          الفيديو التعريفي المجاني
          {form.introVideoUrl && <span className="w-2 h-2 rounded-full bg-emerald-400" />}
        </button>
      </div>

      <form onSubmit={(e) => { e.preventDefault(); onSave(form); }} className="space-y-5">
        {activeTab === 'info' && (
          <div className="space-y-5">
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

            <FormRow label="صورة غلاف الدورة">
              <ImageUploader
                value={form.imageUrl}
                onChange={(url) => setForm({ ...form, imageUrl: url })}
                placeholder="انقر لرفع غلاف الدورة من الكمبيوتر أو اسحبه هنا"
                aspectRatio="16/9"
                token={token}
              />
            </FormRow>

            <Toggle checked={form.isActive} onChange={() => setForm({ ...form, isActive: !form.isActive })} labels={['دورة منشورة', 'دورة مخفية']} />
          </div>
        )}

        {activeTab === 'intro' && (
          <div className="space-y-5">
            <div className="p-4 rounded-2xl bg-brand-orange/5 border border-brand-orange/20">
              <h4 className="text-sm font-bold text-foreground mb-1">الفيديو التعريفي المجاني للدورة (Course Trailer)</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                هذا الفيديو متاح مجاناً لكافة زوار المنصة في صفحة تفاصيل الدورة، لمشاهدة مقدمة الدورة وتفاصيلها دون الحاجة لأي كود تفعيل.
              </p>
            </div>

            <FormRow label="فيديو تعريفي للدورة">
              <VideoUploader
                value={form.introVideoUrl}
                onChange={(url, meta) => {
                  setForm((prev: any) => ({
                    ...prev,
                    introVideoUrl: url,
                    introVideoDuration: meta?.duration ? Math.round(meta.duration * 60) : prev.introVideoDuration,
                  }));
                }}
                placeholder="انقر لرفع الفيديو التعريفي من الكمبيوتر أو اسحبه هنا"
                isReel={false}
                token={token}
              />
            </FormRow>

            <div className="p-4 rounded-2xl bg-secondary/50 border border-border flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-foreground">حالة ظهور الفيديو التعريفي</p>
                <p className="text-[11px] text-muted-foreground">عند التفعيل، يظهر زر "مشاهدة الفيديو التعريفي" في صفحة الدورة للزوار</p>
              </div>
              <Toggle
                checked={form.isIntroPublished ?? true}
                onChange={() => setForm({ ...form, isIntroPublished: !(form.isIntroPublished ?? true) })}
                labels={['منشور للزوار', 'مخفي']}
              />
            </div>
          </div>
        )}

        <div className="flex gap-3 justify-end pt-3 border-t border-border">
          <GhostButton onClick={onClose} disabled={saving}>إلغاء</GhostButton>
          <PrimaryButton type="submit" disabled={saving}>{saving ? 'جارٍ الحفظ…' : 'حفظ الدورة'}</PrimaryButton>
        </div>
      </form>
    </div>
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
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewLessonId, setPreviewLessonId] = useState<string | null>(null);
  const [previewToken, setPreviewToken] = useState<string | undefined>();
  const [previewUserName, setPreviewUserName] = useState<string>('');
  const [showPreview, setShowPreview] = useState<string | null>(null);

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
      await adminFetch(`/api/admin/courses/${course.id}/lessons?id=${deleteId}`, token, { method: 'DELETE' });
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
                    {l.isFree ? (
                      <span className="text-[11px] px-2.5 py-0.5 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-black border border-emerald-300 dark:border-emerald-800 flex items-center gap-1">
                        🟢 الدرس المجاني للدورة
                      </span>
                    ) : (
                      <span className="text-[11px] px-2 py-0.5 rounded-lg bg-secondary text-muted-foreground font-semibold flex items-center gap-1">
                        🔒 مدفوع
                      </span>
                    )}
                    {l.videoUrl && <span className="text-xs text-muted-foreground truncate max-w-[140px] flex items-center gap-1"><Video className="w-3 h-3" />{l.videoUrl}</span>}
                  </div>
                </div>
              </div>
<div className="flex items-center gap-1">
                  <button onClick={() => setShowPreview(l.id)} className="p-2.5 text-muted-foreground hover:text-brand-orange rounded-xl hover:bg-brand-orange/5 transition-all" title="معاينة الفيديو">
                    <Eye className="w-4 h-4" />
                  </button>
                  <button onClick={() => setEditing(l)} className="p-2.5 text-muted-foreground hover:text-brand-orange rounded-xl hover:bg-brand-orange/5 transition-all"><Pencil className="w-4 h-4" /></button>
                  <button onClick={() => setDeleteId(l.id)} className="p-2.5 text-muted-foreground hover:text-red-500 rounded-xl hover:bg-red-50 dark:hover:bg-red-950 transition-all"><Trash2 className="w-4 h-4" /></button>
                </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={formOpen} onClose={() => setFormOpen(false)} title={editing ? 'تعديل الدرس' : 'إضافة درس'}>
        <LessonForm
          lesson={editing}
          locale={locale}
          token={token}
          saving={saving}
          onSave={async (data) => {
            setSaving(true);
            try {
              const url = `/api/admin/courses/${course.id}/lessons`;
              await adminFetch(url, token, {
                method: editing ? 'PUT' : 'POST',
                body: JSON.stringify(editing ? { ...data, lessonId: editing.id } : data),
              });
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

      {/* Professional Video Preview Modal */}
      <VideoPreviewModal
        lessonId={previewLessonId || ''}
        token={token}
        userName={previewUserName}
        userId={previewLessonId ? 'admin_' + previewLessonId : undefined}
        onClose={() => {
          setShowPreviewModal(false);
          setPreviewLessonId(null);
          setPreviewToken(undefined);
          setPreviewUserName('');
        }}
      />
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

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSave(form); }} className="space-y-5">
      <LangInput label="عنوان الدرس" form={form} field="title" onChange={setForm} required />
      <LangInput label="الوصف" form={form} field="description" onChange={setForm} textarea rows={2} />
      
      <FormRow label="فيديو الدرس">
        <VideoUploader
          value={form.videoUrl}
          onChange={(url, meta) => {
            setForm((prev: any) => ({
              ...prev,
              videoUrl: url,
              duration: meta?.duration ? meta.duration : prev.duration,
            }));
          }}
          placeholder="انقر لرفع فيديو الدرس من الكمبيوتر أو اسحبه هنا"
          isReel={false}
          token={token}
        />
      </FormRow>
      <div className="grid grid-cols-2 gap-4">
        <FormRow label="المدة (دقائق)">
          <input type="number" value={form.duration} onChange={(e) => setForm({ ...form, duration: parseInt(e.target.value) || 0 })} className={inputClass} />
        </FormRow>
        <FormRow label="الترتيب">
          <input type="number" value={form.order} onChange={(e) => setForm({ ...form, order: parseInt(e.target.value) || 0 })} className={inputClass} />
        </FormRow>
      </div>

      <div className="p-4 rounded-2xl bg-secondary/50 border border-border flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold text-foreground">نوع الدرس (سياسة الوصول)</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            تدعم المنصة <strong>درساً مجانياً واحداً فقط</strong> لكل دورة. عند تعيين هذا الدرس كمجاني، سيتم قفل الدرس المجاني السابق تلقائياً.
          </p>
        </div>
        <Toggle
          checked={form.isFree}
          onChange={() => setForm({ ...form, isFree: !form.isFree })}
          labels={['🟢 درس مجاني', '🔒 درس مدفوع']}
        />
      </div>
      <div className="flex gap-3 justify-end pt-2">
        <GhostButton onClick={onClose} disabled={saving}>إلغاء</GhostButton>
        <PrimaryButton type="submit" disabled={saving}>{saving ? 'جارٍ الحفظ…' : 'حفظ'}</PrimaryButton>
      </div>
    </form>
  );
}
