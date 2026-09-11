'use client';

import { useState, useCallback, useEffect } from 'react';
import { toast } from './toast';
import VideoPreviewModal from '@/components/VideoPreviewModal';
import {
  Plus, Pencil, Trash2, GraduationCap, ArrowRight, Video, Clock, Lock, BookOpen,
  ChevronRight, Eye, Layers, Search, ArrowUp, ArrowDown, Sparkles, CheckCircle2,
  FolderTree, Play, PlayCircle, Film
} from 'lucide-react';
import {
  PrimaryButton, GhostButton, Modal, ConfirmDialog, SectionHeader, EmptyState,
  ListLoading, LevelBadge, Toggle, LangInput, FormRow, inputClass,
} from './ui';
import { ImageUploader, VideoUploader, resolveAdminMediaUrl } from './media-uploaders';
import { adminFetch, fieldOf, useAdminData } from './api';
import { Course, CourseLevel, Lesson, LEVELS } from './types';

const emptyCourse: Partial<Course> = {
  titleAr: '', titleDe: '', titleEn: '',
  descriptionAr: '', descriptionDe: '', descriptionEn: '',
  level: 'A1', imageUrl: null, order: 0, isActive: true,
};

/* ========================================================================= */
/* 1. COURSES SECTION (Top Level: Courses Overview)                         */
/* ========================================================================= */
export default function CoursesSection({
  token,
  locale,
}: {
  token: string;
  locale: string;
}) {
  const { data: items, loading: listLoading, refresh } = useAdminData<Course>('/api/admin/courses', token, 'courses');
  const courses = items || [];

  // Navigation states
  const [managingCourse, setManagingCourse] = useState<Course | null>(null);
  const [managingLevel, setManagingLevel] = useState<CourseLevel | null>(null);

  // Course modals
  const [formOpen, setFormOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [deleteCourseId, setDeleteCourseId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Video preview
  const [previewVideoUrl, setPreviewVideoUrl] = useState<string | null>(null);

  const openCreateCourse = () => { setEditingCourse(null); setFormOpen(true); };
  const openEditCourse = async (c: Course) => {
    try {
      const res = await adminFetch<{ course: any }>(`/api/admin/courses/${c.id}`, token);
      setEditingCourse(res.course || c);
    } catch {
      setEditingCourse(c);
    }
    setFormOpen(true);
  };

  const handleDeleteCourse = async () => {
    if (!deleteCourseId) return;
    setSaving(true);
    try {
      await adminFetch(`/api/admin/courses/${deleteCourseId}`, token, { method: 'DELETE' });
      toast.success('تم حذف الدورة بنجاح');
      setDeleteCourseId(null);
      refresh();
    } catch (e: any) {
      toast.error(e.message || 'فشل حذف الدورة');
    } finally {
      setSaving(false);
    }
  };

  // Tier 3: Lessons Manager
  if (managingCourse && managingLevel) {
    return (
      <LevelLessonsManager
        course={managingCourse}
        level={managingLevel}
        token={token}
        locale={locale}
        onBack={() => setManagingLevel(null)}
        onBackToCourses={() => {
          setManagingLevel(null);
          setManagingCourse(null);
        }}
        onLevelUpdated={(updated) => setManagingLevel(updated)}
      />
    );
  }

  // Tier 2: Levels Manager
  if (managingCourse) {
    return (
      <CourseLevelsManager
        course={managingCourse}
        token={token}
        locale={locale}
        onBack={() => setManagingCourse(null)}
        onManageLevel={(lvl) => setManagingLevel(lvl)}
        onCourseUpdated={(updated) => {
          setManagingCourse(updated);
          refresh();
        }}
      />
    );
  }

  // Filtered courses
  const filteredCourses = courses.filter((c) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (c.titleAr && c.titleAr.toLowerCase().includes(q)) ||
      (c.titleDe && c.titleDe.toLowerCase().includes(q)) ||
      (c.titleEn && c.titleEn.toLowerCase().includes(q))
    );
  });

  // Tier 1: Courses Overview
  return (
    <div className="space-y-6">
      <SectionHeader
        title="الدورات التعليمية"
        subtitle="إدارة المسارات التعليمية والمستويات والدروس والفيديوهات"
        action={<PrimaryButton icon={Plus} onClick={openCreateCourse}>إضافة دورة جديدة</PrimaryButton>}
      />

      {/* Search and stats bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-card border border-border">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-muted-foreground absolute start-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="بحث عن دورة بالاسم…"
            className={`${inputClass} ps-10 text-xs`}
          />
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="font-bold text-foreground">{courses.length}</span> دورات مسجلة
        </div>
      </div>

      {listLoading ? (
        <ListLoading />
      ) : filteredCourses.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          text={searchQuery ? 'لا توجد دورات مطابقة للبحث' : 'لا توجد دورات بعد، انقر على إضافة دورة للبدء'}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredCourses.map((c) => (
            <div
              key={c.id}
              className="card-bold p-5 flex flex-col justify-between border-2 hover:border-brand-orange/40 transition-all group"
            >
              <div>
                {/* Course Header & Cover */}
                <div className="flex items-start gap-4">
                  {c.imageUrl ? (
                    <div className="w-20 h-16 rounded-xl overflow-hidden bg-secondary shrink-0 border border-border">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={resolveAdminMediaUrl(c.imageUrl)}
                        alt=""
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        onError={(e) => ((e.target as HTMLImageElement).style.visibility = 'hidden')}
                      />
                    </div>
                  ) : (
                    <div className="w-20 h-16 rounded-xl bg-brand-orange/10 flex items-center justify-center shrink-0 border border-brand-orange/20">
                      <BookOpen className="w-7 h-7 text-brand-orange" />
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <span className={`w-2.5 h-2.5 rounded-full ${c.isActive ? 'bg-green-500' : 'bg-gray-300'}`} />
                      <span className="text-[11px] font-bold text-muted-foreground">
                        {c.isActive ? 'دورة منشورة' : 'مخفية'}
                      </span>
                      {c.introVideo?.videoUrl && (
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950 text-emerald-600 font-bold border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                          <Film className="w-2.5 h-2.5" /> فيديو تعريفي
                        </span>
                      )}
                    </div>
                    <h3 className="text-base font-black text-foreground truncate">
                      {fieldOf(c as any, 'title', locale)}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                      {fieldOf(c as any, 'description', locale) || 'لا يوجد وصف مضاف'}
                    </p>
                  </div>
                </div>

                {/* Badges / Stats */}
                <div className="flex items-center gap-3 mt-4 pt-3 border-t border-border/60 text-xs">
                  <span className="px-2.5 py-1 rounded-lg bg-secondary font-bold text-foreground flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-brand-orange" />
                    {c._count?.levels ?? 1} مستويات
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-secondary font-bold text-foreground flex items-center gap-1.5">
                    <Video className="w-3.5 h-3.5 text-brand-red" />
                    {c._count?.lessons ?? 0} درس
                  </span>
                  <span className="text-[11px] text-muted-foreground ms-auto">
                    {c._count?.enrollments ?? 0} مشترك
                  </span>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="flex items-center justify-between gap-2 mt-5 pt-3 border-t border-border">
                <PrimaryButton
                  icon={FolderTree}
                  onClick={() => setManagingCourse(c)}
                  className="text-xs py-2 px-4 shadow-none"
                >
                  إدارة المستويات والدروس
                </PrimaryButton>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEditCourse(c)}
                    title="تعديل بيانات الدورة"
                    className="p-2 text-muted-foreground hover:text-brand-orange rounded-xl hover:bg-brand-orange/5 transition-all"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setDeleteCourseId(c.id)}
                    title="حذف الدورة"
                    className="p-2 text-muted-foreground hover:text-red-500 rounded-xl hover:bg-red-50 dark:hover:bg-red-950 transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Course Create/Edit Modal */}
      <Modal open={formOpen} onClose={() => setFormOpen(false)} title={editingCourse ? 'تعديل الدورة' : 'إضافة دورة جديدة'} size="lg">
        <CourseForm
          course={editingCourse}
          locale={locale}
          token={token}
          saving={saving}
          onSave={async (data) => {
            setSaving(true);
            try {
              const url = editingCourse ? `/api/admin/courses/${editingCourse.id}` : '/api/admin/courses';
              await adminFetch(url, token, { method: editingCourse ? 'PUT' : 'POST', body: JSON.stringify(data) });
              toast.success(editingCourse ? 'تم تحديث الدورة' : 'تمت إضافة الدورة بنجاح');
              setFormOpen(false);
              refresh();
            } catch (e: any) {
              toast.error(e.message || 'فشل حفظ الدورة');
            } finally {
              setSaving(false);
            }
          }}
          onClose={() => setFormOpen(false)}
        />
      </Modal>

      {/* Course Delete Confirmation */}
      <ConfirmDialog
        open={!!deleteCourseId}
        message="تحذير: هل أنت متأكد من حذف هذه الدورة بالكامل؟ سيتم حذف جميع المستويات والدروس التابعة لها."
        onConfirm={handleDeleteCourse}
        onCancel={() => setDeleteCourseId(null)}
        loading={saving}
      />
    </div>
  );
}

/* ========================================================================= */
/* 2. COURSE FORM MODAL (Title, Desc, Cover Image, Trailer Video)            */
/* ========================================================================= */
function CourseForm({
  course,
  locale,
  token,
  saving,
  onSave,
  onClose,
}: {
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
          الفيديو التعريفي المجاني للدورة
          {form.introVideoUrl && <span className="w-2 h-2 rounded-full bg-emerald-400" />}
        </button>
      </div>

      <form onSubmit={(e) => { e.preventDefault(); onSave(form); }} className="space-y-5">
        {activeTab === 'info' && (
          <div className="space-y-5">
            <LangInput label="عنوان الدورة (مثلاً: اللغة الألمانية الشاملة)" form={form} field="title" onChange={setForm} required />
            <LangInput label="وصف الدورة" form={form} field="description" onChange={setForm} textarea rows={2} />

            <div className="grid grid-cols-2 gap-4">
              <FormRow label="ترتيب العرض">
                <input
                  type="number"
                  value={form.order}
                  onChange={(e) => setForm({ ...form, order: parseInt(e.target.value) || 0 })}
                  className={inputClass}
                />
              </FormRow>
              <FormRow label="حالة الدورة">
                <div className="pt-2">
                  <Toggle
                    checked={form.isActive}
                    onChange={() => setForm({ ...form, isActive: !form.isActive })}
                    labels={['منشورة للطلاب', 'مخفية']}
                  />
                </div>
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
          </div>
        )}

        {activeTab === 'intro' && (
          <div className="space-y-5">
            <div className="p-4 rounded-2xl bg-brand-orange/5 border border-brand-orange/20">
              <h4 className="text-sm font-bold text-foreground mb-1">الفيديو التعريفي المجاني (Course Trailer)</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                هذا الفيديو متاح مجاناً لكافة زوار المنصة في صفحة تفاصيل الدورة، لمشاهدة مقدمة الدورة وتفاصيلها دون الحاجة لأي كود تفعيل.
              </p>
            </div>

            <FormRow label="الفيديو التعريفي للدورة">
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
                <p className="text-[11px] text-muted-foreground">عند التفعيل، يتاح زر "مشاهدة الفيديو التعريفي" في صفحة الدورة للزوار</p>
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

/* ========================================================================= */
/* 3. COURSE LEVELS MANAGER (Tier 2: Manage Levels Inside a Course)          */
/* ========================================================================= */
function CourseLevelsManager({
  course,
  token,
  locale,
  onBack,
  onManageLevel,
  onCourseUpdated,
}: {
  course: Course;
  token: string;
  locale: string;
  onBack: () => void;
  onManageLevel: (level: CourseLevel) => void;
  onCourseUpdated: (course: Course) => void;
}) {
  const [levels, setLevels] = useState<CourseLevel[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editingLevel, setEditingLevel] = useState<CourseLevel | null>(null);
  const [deleteLevelId, setDeleteLevelId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);

  const loadLevels = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminFetch<{ levels: CourseLevel[] }>(`/api/admin/courses/${course.id}/levels`, token);
      setLevels(data.levels || []);
    } catch (e: any) {
      toast.error(e.message || 'فشل جلب المستويات');
    } finally {
      setLoading(false);
    }
  }, [course.id, token]);

  useEffect(() => {
    loadLevels();
  }, [loadLevels]);

  const handleDeleteLevel = async () => {
    if (!deleteLevelId) return;
    setSaving(true);
    try {
      await adminFetch(`/api/admin/courses/${course.id}/levels/${deleteLevelId}`, token, { method: 'DELETE' });
      toast.success('تم حذف المستوى بنجاح');
      setDeleteLevelId(null);
      loadLevels();
    } catch (e: any) {
      toast.error(e.message || 'فشل حذف المستوى');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb Navigation Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2.5 hover:bg-secondary rounded-xl transition-all border border-border"
            title="العودة للدورات"
          >
            <ArrowRight className="w-5 h-5 text-foreground" />
          </button>
          <div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <span className="hover:text-foreground cursor-pointer" onClick={onBack}>الدورات</span>
              <ChevronRight className="w-3.5 h-3.5 rotate-180 rtl:rotate-0" />
              <span className="font-bold text-foreground truncate max-w-[200px]">
                {fieldOf(course as any, 'title', locale)}
              </span>
            </div>
            <h2 className="text-xl font-black text-foreground">المستويات التابعة للدورة</h2>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <PrimaryButton icon={Plus} onClick={() => { setEditingLevel(null); setFormOpen(true); }}>
            + إضافة مستوى جديد
          </PrimaryButton>
        </div>
      </div>

      {/* Course Overview Card */}
      <div className="card-bold p-5 bg-secondary/30 border-2 border-border flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {course.imageUrl && (
            <div className="w-16 h-12 rounded-xl overflow-hidden bg-secondary shrink-0 border border-border">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={resolveAdminMediaUrl(course.imageUrl)} alt="" className="w-full h-full object-cover" />
            </div>
          )}
          <div>
            <h3 className="text-base font-black text-foreground">{fieldOf(course as any, 'title', locale)}</h3>
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{fieldOf(course as any, 'description', locale)}</p>
          </div>
        </div>

        {course.introVideo?.videoUrl && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-brand-orange/10 border border-brand-orange/20 text-xs text-brand-orange font-bold">
            <Film className="w-4 h-4" />
            <span>الفيديو التعريفي مفعل ({Math.round(course.introVideo.duration / 60)} د)</span>
          </div>
        )}
      </div>

      {/* Levels List */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-foreground">قائمة المستويات ({levels.length})</h3>
          <p className="text-xs text-muted-foreground">يمكنك إضافة أي عدد من المستويات (A1, A2, B1...)</p>
        </div>

        {loading ? (
          <ListLoading />
        ) : levels.length === 0 ? (
          <EmptyState
            icon={Layers}
            text="لا توجد مستويات في هذه الدورة بعد. انقر على إضافة مستوى لإنشاء المستوى الأول (مثلاً: A1)"
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {levels.map((lvl, index) => (
              <div
                key={lvl.id}
                className="card-bold p-5 border-2 hover:border-brand-orange/40 transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="px-3 py-1 rounded-xl bg-brand-orange/10 text-brand-orange font-black text-sm border border-brand-orange/20">
                      {lvl.name || `المستوى ${index + 1}`}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${lvl.isActive ? 'bg-green-500' : 'bg-gray-300'}`} />
                      <span className="text-[11px] font-bold text-muted-foreground">
                        {lvl.isActive ? 'منشور' : 'مخفي'}
                      </span>
                    </div>
                  </div>

                  <h4 className="text-base font-bold text-foreground mb-1">
                    {fieldOf(lvl as any, 'title', locale) || lvl.name}
                  </h4>
                  <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed mb-4">
                    {fieldOf(lvl as any, 'description', locale) || 'لا يوجد وصف مضاف لهذا المستوى'}
                  </p>

                  <div className="flex items-center gap-2 text-xs text-muted-foreground font-semibold py-2 px-3 rounded-xl bg-secondary/50 border border-border/50">
                    <Video className="w-3.5 h-3.5 text-brand-orange" />
                    <span>{lvl._count?.lessons ?? 0} درس داخل هذا المستوى</span>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 mt-5 pt-3 border-t border-border">
                  <PrimaryButton
                    icon={GraduationCap}
                    onClick={() => onManageLevel(lvl)}
                    className="text-xs py-2 px-4 shadow-none flex-1"
                  >
                    إدارة الدروس ({lvl._count?.lessons ?? 0})
                  </PrimaryButton>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => { setEditingLevel(lvl); setFormOpen(true); }}
                      title="تعديل المستوى"
                      className="p-2 text-muted-foreground hover:text-brand-orange rounded-xl hover:bg-brand-orange/5 transition-all"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeleteLevelId(lvl.id)}
                      title="حذف المستوى"
                      className="p-2 text-muted-foreground hover:text-red-500 rounded-xl hover:bg-red-50 dark:hover:bg-red-950 transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Level Create/Edit Modal */}
      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editingLevel ? 'تعديل المستوى' : 'إضافة مستوى جديد'}
        size="md"
      >
        <LevelForm
          level={editingLevel}
          locale={locale}
          token={token}
          courseId={course.id}
          saving={saving}
          onSave={async (data) => {
            setSaving(true);
            try {
              const url = editingLevel
                ? `/api/admin/courses/${course.id}/levels/${editingLevel.id}`
                : `/api/admin/courses/${course.id}/levels`;
              await adminFetch(url, token, {
                method: editingLevel ? 'PUT' : 'POST',
                body: JSON.stringify(data),
              });
              toast.success(editingLevel ? 'تم تحديث المستوى' : 'تمت إضافة المستوى بنجاح');
              setFormOpen(false);
              loadLevels();
            } catch (e: any) {
              toast.error(e.message || 'فشل حفظ المستوى');
            } finally {
              setSaving(false);
            }
          }}
          onClose={() => setFormOpen(false)}
        />
      </Modal>

      {/* Level Delete Confirmation */}
      <ConfirmDialog
        open={!!deleteLevelId}
        message="تحذير: هل أنت متأكد من حذف هذا المستوى؟ سيتم حذف جميع الدروس التابعة له."
        onConfirm={handleDeleteLevel}
        onCancel={() => setDeleteLevelId(null)}
        loading={saving}
      />
    </div>
  );
}

/* ========================================================================= */
/* 4. LEVEL FORM MODAL (Name, Title, Desc, Image, Intro Video, Status)       */
/* ========================================================================= */
function LevelForm({
  level,
  locale,
  token,
  courseId,
  saving,
  onSave,
  onClose,
}: {
  level: CourseLevel | null;
  locale: string;
  token: string;
  courseId: string;
  saving: boolean;
  onSave: (data: any) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState<any>(() => ({
    name: level?.name || 'A1',
    titleAr: level?.titleAr || (level?.name ? `المستوى ${level.name}` : 'المستوى A1'),
    titleDe: level?.titleDe || (level?.name ? `Stufe ${level.name}` : 'Stufe A1'),
    titleEn: level?.titleEn || (level?.name ? `Level ${level.name}` : 'Level A1'),
    descriptionAr: level?.descriptionAr || '',
    descriptionDe: level?.descriptionDe || '',
    descriptionEn: level?.descriptionEn || '',
    imageUrl: level?.imageUrl || null,
    introVideoUrl: level?.introVideoUrl || null,
    order: level?.order || 0,
    isActive: level?.isActive ?? true,
  }));

  // Helper when name changes, auto-fill default titles if empty
  const handleNameChange = (val: string) => {
    const clean = val.trim().toUpperCase();
    setForm((prev: any) => ({
      ...prev,
      name: clean,
      titleAr: prev.titleAr && prev.titleAr !== `المستوى ${prev.name}` ? prev.titleAr : `المستوى ${clean}`,
      titleDe: prev.titleDe && prev.titleDe !== `Stufe ${prev.name}` ? prev.titleDe : `Stufe ${clean}`,
      titleEn: prev.titleEn && prev.titleEn !== `Level ${prev.name}` ? prev.titleEn : `Level ${clean}`,
    }));
  };

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSave(form); }} className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <FormRow label="معرّف المستوى (رمز قصير)">
          <input
            type="text"
            value={form.name}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder="مثال: A1 أو B2 أو المحادثة"
            required
            className={inputClass}
          />
        </FormRow>
        <FormRow label="الترتيب">
          <input
            type="number"
            value={form.order}
            onChange={(e) => setForm({ ...form, order: parseInt(e.target.value) || 0 })}
            className={inputClass}
          />
        </FormRow>
      </div>

      <LangInput label="عنوان المستوى" form={form} field="title" onChange={setForm} required />
      <LangInput label="وصف المستوى" form={form} field="description" onChange={setForm} textarea rows={2} />

      <FormRow label="فيديو تعريفي خاص بالمستوى (اختياري)">
        <VideoUploader
          value={form.introVideoUrl}
          onChange={(url) => setForm({ ...form, introVideoUrl: url })}
          placeholder="انقر لرفع فيديو تعريفي اختياري لهذا المستوى"
          isReel={false}
          token={token}
        />
      </FormRow>

      <div className="p-4 rounded-2xl bg-secondary/50 border border-border flex items-center justify-between">
        <div>
          <p className="text-xs font-bold text-foreground">حالة المستوى</p>
          <p className="text-[11px] text-muted-foreground">عند التفعيل، يظهر المستوى ودروسه للطلاب في صفحة الدورة</p>
        </div>
        <Toggle
          checked={form.isActive}
          onChange={() => setForm({ ...form, isActive: !form.isActive })}
          labels={['مستوى منشور', 'مخفي']}
        />
      </div>

      <div className="flex gap-3 justify-end pt-3 border-t border-border">
        <GhostButton onClick={onClose} disabled={saving}>إلغاء</GhostButton>
        <PrimaryButton type="submit" disabled={saving}>{saving ? 'جارٍ الحفظ…' : 'حفظ المستوى'}</PrimaryButton>
      </div>
    </form>
  );
}

/* ========================================================================= */
/* 5. LEVEL LESSONS MANAGER (Tier 3: Manage Lessons Inside a Specific Level)  */
/* ========================================================================= */
function LevelLessonsManager({
  course,
  level,
  token,
  locale,
  onBack,
  onBackToCourses,
  onLevelUpdated,
}: {
  course: Course;
  level: CourseLevel;
  token: string;
  locale: string;
  onBack: () => void;
  onBackToCourses: () => void;
  onLevelUpdated: (updated: CourseLevel) => void;
}) {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [deleteLessonId, setDeleteLessonId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Video preview modal
  const [previewLessonId, setPreviewLessonId] = useState<string | null>(null);
  const [previewVideoSrc, setPreviewVideoSrc] = useState<string | null>(null);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);

  const loadLessons = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminFetch<{ lessons: Lesson[] }>(
        `/api/admin/courses/${course.id}/levels/${level.id}/lessons`,
        token
      );
      setLessons(data.lessons || []);
    } catch (e: any) {
      toast.error(e.message || 'فشل جلب الدروس');
    } finally {
      setLoading(false);
    }
  }, [course.id, level.id, token]);

  useEffect(() => {
    loadLessons();
  }, [loadLessons]);

  const handleDeleteLesson = async () => {
    if (!deleteLessonId) return;
    setSaving(true);
    try {
      await adminFetch(
        `/api/admin/courses/${course.id}/levels/${level.id}/lessons?id=${deleteLessonId}`,
        token,
        { method: 'DELETE' }
      );
      toast.success('تم حذف الدرس بنجاح');
      setDeleteLessonId(null);
      loadLessons();
    } catch (e: any) {
      toast.error(e.message || 'فشل حذف الدرس');
    } finally {
      setSaving(false);
    }
  };

  const handleMoveLesson = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= lessons.length) return;

    const newLessons = [...lessons];
    const temp = newLessons[index];
    newLessons[index] = newLessons[targetIndex];
    newLessons[targetIndex] = temp;

    // Update order numbers
    const orders = newLessons.map((l, i) => ({ id: l.id, order: i + 1 }));
    setLessons(newLessons);

    try {
      await adminFetch(`/api/admin/courses/${course.id}/levels/${level.id}/lessons`, token, {
        method: 'PUT',
        body: JSON.stringify({ orders }),
      });
      toast.success('تم تحديث الترتيب');
    } catch (e: any) {
      toast.error(e.message || 'فشل تحديث الترتيب');
      loadLessons();
    }
  };

  const openPreview = (lesson: Lesson) => {
    setPreviewLessonId(lesson.id);
    setPreviewModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumbs Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2.5 hover:bg-secondary rounded-xl transition-all border border-border"
            title="العودة للمستويات"
          >
            <ArrowRight className="w-5 h-5 text-foreground" />
          </button>
          <div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1 flex-wrap">
              <span className="hover:text-foreground cursor-pointer" onClick={onBackToCourses}>الدورات</span>
              <ChevronRight className="w-3.5 h-3.5 rotate-180 rtl:rotate-0" />
              <span className="hover:text-foreground cursor-pointer" onClick={onBack}>
                {fieldOf(course as any, 'title', locale)}
              </span>
              <ChevronRight className="w-3.5 h-3.5 rotate-180 rtl:rotate-0" />
              <span className="font-bold text-foreground">
                {fieldOf(level as any, 'title', locale) || level.name}
              </span>
            </div>
            <h2 className="text-xl font-black text-foreground">
              دروس {fieldOf(level as any, 'title', locale) || level.name}
            </h2>
          </div>
        </div>

        <PrimaryButton
          icon={Plus}
          onClick={() => { setEditingLesson(null); setFormOpen(true); }}
        >
          + إضافة درس جديد
        </PrimaryButton>
      </div>

      {/* Level Details Bar */}
      <div className="card-bold p-4 bg-secondary/30 border flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <span className="px-3 py-1 rounded-xl bg-brand-orange text-white font-black text-xs">
            {level.name}
          </span>
          <span className="text-xs text-muted-foreground">
            إجمالي الدروس المسجلة: <strong className="text-foreground">{lessons.length}</strong> درس
          </span>
        </div>

        {level.introVideoUrl && (
          <span className="text-xs px-2.5 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-700 font-bold flex items-center gap-1">
            <Film className="w-3.5 h-3.5" /> فيديو تعريفي للمستوى متوفر
          </span>
        )}
      </div>

      {/* Lessons List */}
      {loading ? (
        <ListLoading />
      ) : lessons.length === 0 ? (
        <EmptyState
          icon={Video}
          text="لا توجد دروس في هذا المستوى بعد. انقر على إضافة درس جديد لرفع أول فيديو."
        />
      ) : (
        <div className="space-y-3">
          {lessons.map((l, idx) => (
            <div
              key={l.id}
              className="card-bold p-4 sm:p-5 flex items-center justify-between gap-3 sm:gap-4 border-2 hover:border-brand-orange/30 transition-all group"
            >
              {/* Left Info */}
              <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                {/* Number Badge */}
                <span className="w-9 h-9 rounded-xl bg-brand-orange/10 flex items-center justify-center text-sm font-black text-brand-orange shrink-0 border border-brand-orange/20">
                  {idx + 1}
                </span>

                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-foreground truncate">
                    {fieldOf(l as any, 'title', locale)}
                  </p>
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    <span className="text-xs text-muted-foreground flex items-center gap-1 font-semibold">
                      <Clock className="w-3 h-3 text-brand-orange" /> {l.duration} دقيقة
                    </span>

                    {l.isFree ? (
                      <span className="text-[11px] px-2.5 py-0.5 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-black border border-emerald-300 dark:border-emerald-800 flex items-center gap-1">
                        🟢 الدرس المجاني للدورة
                      </span>
                    ) : (
                      <span className="text-[11px] px-2 py-0.5 rounded-lg bg-secondary text-muted-foreground font-semibold flex items-center gap-1">
                        🔒 محتوى مدفوع للمشتركين
                      </span>
                    )}

                    {l.videoUrl && (
                      <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                        <Video className="w-3 h-3 text-blue-500" />
                        فيديو مرفوع (R2)
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Reordering and Actions */}
              <div className="flex items-center gap-1 shrink-0">
                {/* Reorder Buttons */}
                <button
                  onClick={() => handleMoveLesson(idx, 'up')}
                  disabled={idx === 0}
                  title="تحريك لأعلى"
                  className="p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-secondary disabled:opacity-30 disabled:pointer-events-none transition-all"
                >
                  <ArrowUp className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleMoveLesson(idx, 'down')}
                  disabled={idx === lessons.length - 1}
                  title="تحريك لأسفل"
                  className="p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-secondary disabled:opacity-30 disabled:pointer-events-none transition-all"
                >
                  <ArrowDown className="w-4 h-4" />
                </button>

                {/* Preview Video */}
                {l.videoUrl && (
                  <button
                    onClick={() => openPreview(l)}
                    title="معاينة الفيديو"
                    className="p-2.5 text-muted-foreground hover:text-brand-orange rounded-xl hover:bg-brand-orange/5 transition-all"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                )}

                {/* Edit */}
                <button
                  onClick={() => { setEditingLesson(l); setFormOpen(true); }}
                  title="تعديل الدرس"
                  className="p-2.5 text-muted-foreground hover:text-brand-orange rounded-xl hover:bg-brand-orange/5 transition-all"
                >
                  <Pencil className="w-4 h-4" />
                </button>

                {/* Delete */}
                <button
                  onClick={() => setDeleteLessonId(l.id)}
                  title="حذف الدرس"
                  className="p-2.5 text-muted-foreground hover:text-red-500 rounded-xl hover:bg-red-50 dark:hover:bg-red-950 transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Lesson Create/Edit Modal */}
      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editingLesson ? 'تعديل الدرس' : 'إضافة درس جديد'}
        size="lg"
      >
        <LessonForm
          lesson={editingLesson}
          locale={locale}
          token={token}
          courseId={course.id}
          levelId={level.id}
          saving={saving}
          onSave={async (data) => {
            setSaving(true);
            try {
              const url = `/api/admin/courses/${course.id}/levels/${level.id}/lessons`;
              await adminFetch(url, token, {
                method: editingLesson ? 'PUT' : 'POST',
                body: JSON.stringify(editingLesson ? { ...data, id: editingLesson.id } : data),
              });
              toast.success(editingLesson ? 'تم تحديث الدرس بنجاح' : 'تمت إضافة الدرس بنجاح');
              setFormOpen(false);
              loadLessons();
            } catch (e: any) {
              toast.error(e.message || 'فشل حفظ الدرس');
            } finally {
              setSaving(false);
            }
          }}
          onClose={() => setFormOpen(false)}
        />
      </Modal>

      {/* Lesson Delete Confirmation */}
      <ConfirmDialog
        open={!!deleteLessonId}
        message="هل أنت متأكد من حذف هذا الدرس؟ سيتم حذف ملفات الفيديو المرتبطة به."
        onConfirm={handleDeleteLesson}
        onCancel={() => setDeleteLessonId(null)}
        loading={saving}
      />

      {/* Video Preview Modal */}
      <VideoPreviewModal
        lessonId={previewLessonId || ''}
        token={token}
        userName="Omar Admin"
        userId={previewLessonId ? 'admin_' + previewLessonId : undefined}
        onClose={() => {
          setPreviewModalOpen(false);
          setPreviewLessonId(null);
        }}
      />
    </div>
  );
}

/* ========================================================================= */
/* 6. LESSON FORM (R2 Video Uploader with Local Preview, Play/Pause/Seek)     */
/* ========================================================================= */
const emptyLesson: Partial<Lesson> = {
  titleAr: '', titleDe: '', titleEn: '',
  descriptionAr: '', descriptionDe: '', descriptionEn: '',
  videoUrl: '', duration: 0, order: 0, isFree: false,
};

function LessonForm({
  lesson,
  locale,
  token,
  courseId,
  levelId,
  saving,
  onSave,
  onClose,
}: {
  lesson: Lesson | null;
  locale: string;
  token: string;
  courseId: string;
  levelId: string;
  saving: boolean;
  onSave: (data: any) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState<any>(() => ({
    ...emptyLesson,
    ...(lesson || {}),
  }));

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSave(form); }} className="space-y-5">
      <LangInput label="عنوان الدرس" form={form} field="title" onChange={setForm} required />
      <LangInput label="وصف الدرس وملاحظات الشرح" form={form} field="description" onChange={setForm} textarea rows={2} />

      {/* Professional Video Uploader to R2 with local preview */}
      <FormRow label="فيديو الدرس (رفع سحابي R2)">
        <VideoUploader
          value={form.videoUrl}
          onChange={(url, meta) => {
            setForm((prev: any) => ({
              ...prev,
              videoUrl: url,
              duration: meta?.duration ? Math.round(meta.duration) : prev.duration,
            }));
          }}
          placeholder="انقر لاختيار فيديو الدرس من الكمبيوتر، أو اسحبه هنا"
          isReel={false}
          token={token}
        />
      </FormRow>

      <div className="grid grid-cols-2 gap-4">
        <FormRow label="مدة الدرس (بالدقائق)">
          <input
            type="number"
            value={form.duration}
            onChange={(e) => setForm({ ...form, duration: parseInt(e.target.value) || 0 })}
            className={inputClass}
            placeholder="مثال: 15"
          />
        </FormRow>
        <FormRow label="ترتيب الدرس في المستوى">
          <input
            type="number"
            value={form.order}
            onChange={(e) => setForm({ ...form, order: parseInt(e.target.value) || 0 })}
            className={inputClass}
          />
        </FormRow>
      </div>

      {/* Free / Paid Policy */}
      <div className="p-4 rounded-2xl bg-secondary/50 border border-border flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold text-foreground">نوع الدرس (سياسة الوصول)</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            تدعم المنصة <strong>درساً مجانياً واحداً فقط</strong> لكل دورة لتمكين الطلاب من تجربة الشرح قبل التفعيل.
          </p>
        </div>
        <Toggle
          checked={form.isFree}
          onChange={() => setForm({ ...form, isFree: !form.isFree })}
          labels={['🟢 درس مجاني', '🔒 درس مدفوع']}
        />
      </div>

      <div className="flex gap-3 justify-end pt-2 border-t border-border">
        <GhostButton onClick={onClose} disabled={saving}>إلغاء</GhostButton>
        <PrimaryButton type="submit" disabled={saving}>{saving ? 'جارٍ الحفظ…' : 'حفظ الدرس'}</PrimaryButton>
      </div>
    </form>
  );
}
