'use client';

import { useState, useCallback, useRef } from 'react';
import { toast } from './toast';
import {
  Plus, Pencil, Trash2, GraduationCap, FileText, ArrowRight, CheckCircle2,
  Image as ImageIcon, Upload, Download, Eye, Clock, Award, Layers, Volume2,
  HelpCircle, AlertCircle, Copy, Check, ChevronRight, ChevronLeft, RefreshCw,
  ListOrdered, Link as LinkIcon, FileSpreadsheet, X
} from 'lucide-react';
import {
  PrimaryButton, GhostButton, Modal, ConfirmDialog, SectionHeader, EmptyState, ListLoading,
  LevelBadge, Toggle, LangInput, ImageField, FormRow, inputClass,
} from './ui';
import { adminFetch, fieldOf, useAdminData } from './api';
import { Quiz, Question, LEVELS } from './types';
import {
  QuestionType, RichQuestion, DEFAULT_GOETHE_SECTIONS, ExamSection,
  evaluateExam, sanitizeQuestionsForStudent
} from '@/lib/quiz-engine';

const QUESTION_TYPES: { id: QuestionType; label: string; icon: any; hint: string }[] = [
  { id: 'single_choice', label: 'اختيار فردي (إجابة واحدة)', icon: CheckCircle2, hint: 'سؤال متعدد الخيارات مع إجابة صحيحة واحدة فقط' },
  { id: 'multiple_choice', label: 'اختيار متعدد (أكثر من إجابة)', icon: CheckCircle2, hint: 'سؤال مع إمكانية تحديد أكثر من إجابة صحيحة' },
  { id: 'true_false', label: 'صح / خطأ', icon: HelpCircle, hint: 'تحديد صحة العبارة (Richtig / Falsch)' },
  { id: 'fill_blank', label: 'ملء الفراغ', icon: FileText, hint: 'كتابة الكلمة أو المصطلح الناقص في الجملة' },
  { id: 'text', label: 'إجابة نصية / مقال', icon: FileText, hint: 'إجابة نصية حرة من الطالب' },
  { id: 'matching', label: 'توصيل / مطابقة', icon: LinkIcon, hint: 'مطابقة عناصر القائمة (أ) مع عناصر القائمة (ب)' },
  { id: 'ordering', label: 'ترتيب العناصر', icon: ListOrdered, hint: 'ترتيب جمل أو خطوات بالترتيب الصحيح' },
  { id: 'audio', label: 'سؤال استماع مع صوت', icon: Volume2, hint: 'استماع لملف صوتي ثم الإجابة على السؤال' },
  { id: 'image', label: 'سؤال مدعوم بصورة', icon: ImageIcon, hint: 'سؤال مع صورة توضيحية للمعاينة' },
];

export default function QuizzesSection({
  token, locale,
}: {
  token: string;
  locale: string;
}) {
  const { data: items, loading: listLoading, refresh } = useAdminData<Quiz>('/api/admin/quizzes', token, 'quizzes');
  const quizzes = items || [];
  const [managing, setManaging] = useState<Quiz | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Quiz | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [previewQuiz, setPreviewQuiz] = useState<Quiz | null>(null);

  const handleDelete = async () => {
    if (!deleteId) return;
    setSaving(true);
    try {
      await adminFetch(`/api/admin/quizzes/${deleteId}`, token, { method: 'DELETE' });
      toast.success('تم حذف الاختبار');
      setDeleteId(null);
      refresh();
    } catch (e: any) { toast.error(e.message); }
    finally { setSaving(false); }
  };

  if (managing) {
    return (
      <QuestionsManager
        quiz={managing}
        token={token}
        locale={locale}
        onBack={() => { setManaging(null); refresh(); }}
      />
    );
  }

  return (
    <div>
      <SectionHeader
        title="الاختبارات ونظام التقييم"
        subtitle="إدارة اختبارات تحديد المستوى ونماذج امتحانات Goethe والأقسام التفاعلية"
        action={
          <div className="flex items-center gap-2">
            <PrimaryButton icon={Plus} onClick={() => { setEditing(null); setFormOpen(true); }}>
              إنشاء اختبار جديد
            </PrimaryButton>
          </div>
        }
      />

      {listLoading ? <ListLoading /> : quizzes.length === 0 ? (
        <EmptyState icon={GraduationCap} text="لا توجد اختبارات مضافة حالياً" />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {quizzes.map((q) => (
            <div key={q.id} className="card-bold p-5 flex flex-col justify-between gap-4 border-2 hover:border-brand-orange/40 transition-all shadow-sm">
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <LevelBadge level={q.level} />
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${
                      q.isActive ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'
                    }`}>
                      {q.isActive ? 'منشور' : 'مسودة'}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground flex items-center gap-1 font-semibold">
                    <Clock className="w-3.5 h-3.5 text-brand-orange" />
                    {q.durationMinutes || 30} دقيقة
                  </span>
                </div>

                <h3 className="font-display font-bold text-base text-foreground mb-1 line-clamp-1">
                  {fieldOf(q as any, 'title', locale)}
                </h3>
                <p className="text-xs text-muted-foreground line-clamp-2 mb-4">
                  {fieldOf(q as any, 'description', locale) || 'اختبار تدريبي شامل ومصمم وفق معايير الإطار الأوروبي.'}
                </p>

                <div className="grid grid-cols-3 gap-2 py-2 px-3 bg-secondary/40 rounded-xl text-center text-xs">
                  <div>
                    <span className="text-muted-foreground block text-[10px]">الأسئلة</span>
                    <span className="font-bold text-foreground">{q._count?.questions || 0}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[10px]">النجاح</span>
                    <span className="font-bold text-emerald-600">{q.passingScore || 60}%</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[10px]">المحاولات</span>
                    <span className="font-bold text-foreground">{q._count?.quizAttempts || 0}</span>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-border flex items-center justify-between gap-2">
                <button
                  onClick={() => setManaging(q)}
                  className="flex-1 py-2 px-3 rounded-xl bg-brand-orange/10 hover:bg-brand-orange text-brand-orange hover:text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
                >
                  <FileText className="w-3.5 h-3.5" />
                  إدارة الأسئلة
                </button>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => { setEditing(q); setFormOpen(true); }}
                    title="تعديل الإعدادات"
                    className="p-2 text-muted-foreground hover:text-brand-orange rounded-xl hover:bg-brand-orange/5 transition-all"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setDeleteId(q.id)}
                    title="حذف"
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

      {/* Exam Create / Edit Modal Wizard */}
      <Modal open={formOpen} onClose={() => setFormOpen(false)} title={editing ? 'تعديل الاختبار' : 'إنشاء اختبار جديد'} size="xl">
        <QuizWizardForm
          quiz={editing}
          locale={locale}
          saving={saving}
          onSave={async (data) => {
            setSaving(true);
            try {
              const url = editing ? `/api/admin/quizzes/${editing.id}` : '/api/admin/quizzes';
              await adminFetch(url, token, { method: editing ? 'PUT' : 'POST', body: JSON.stringify(data) });
              toast.success(editing ? 'تم تحديث الاختبار بنجاح' : 'تم إنشاء الاختبار بنجاح');
              setFormOpen(false);
              refresh();
            } catch (e: any) { toast.error(e.message); }
            finally { setSaving(false); }
          }}
          onClose={() => setFormOpen(false)}
        />
      </Modal>

      <ConfirmDialog
        open={!!deleteId}
        message="هل أنت متأكد من حذف هذا الاختبار نهائياً مع كافة أسئلته ومحاولات الطلاب؟"
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
        loading={saving}
      />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                       EXAM WIZARD FORM (Step-by-Step)                      */
/* -------------------------------------------------------------------------- */
function QuizWizardForm({ quiz, locale, saving, onSave, onClose }: any) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [form, setForm] = useState<any>(() => ({
    level: 'A1',
    titleAr: '', titleDe: '', titleEn: '',
    descriptionAr: '', descriptionDe: '', descriptionEn: '',
    durationMinutes: 30,
    passingScore: 60,
    allowedAttempts: 0,
    showDetailedResults: true,
    instructionsAr: 'يرجى قراءة كل سؤال بعناية والتأكد من الإجابة قبل انتهاء الوقت.',
    instructionsDe: 'Bitte lesen Sie jede Frage sorgfältig durch.',
    sections: DEFAULT_GOETHE_SECTIONS,
    isActive: true,
    examType: 'goethe_model',
    ...(quiz || {}),
  }));

  const addSection = () => {
    const newSec: ExamSection = {
      id: `section_${Date.now()}`,
      titleAr: 'قسم جديد',
      titleDe: 'Neuer Teil',
      order: (form.sections?.length || 0) + 1,
      durationMinutes: 15,
    };
    setForm({ ...form, sections: [...(form.sections || []), newSec] });
  };

  const removeSection = (idx: number) => {
    const next = [...(form.sections || [])];
    next.splice(idx, 1);
    setForm({ ...form, sections: next });
  };

  const updateSection = (idx: number, field: string, val: any) => {
    const next = [...(form.sections || [])];
    next[idx] = { ...next[idx], [field]: val };
    setForm({ ...form, sections: next });
  };

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSave(form); }} className="space-y-6">
      {/* Wizard Steps Navigation */}
      <div className="flex items-center justify-between border-b border-border pb-3 text-xs font-bold">
        <button
          type="button"
          onClick={() => setStep(1)}
          className={`flex items-center gap-1.5 pb-1 border-b-2 transition-all ${
            step === 1 ? 'border-brand-orange text-brand-orange font-black' : 'border-transparent text-muted-foreground'
          }`}
        >
          <span className="w-5 h-5 rounded-full bg-brand-orange/10 flex items-center justify-center text-[10px]">1</span>
          المعلومات الأساسية
        </button>
        <button
          type="button"
          onClick={() => setStep(2)}
          className={`flex items-center gap-1.5 pb-1 border-b-2 transition-all ${
            step === 2 ? 'border-brand-orange text-brand-orange font-black' : 'border-transparent text-muted-foreground'
          }`}
        >
          <span className="w-5 h-5 rounded-full bg-brand-orange/10 flex items-center justify-center text-[10px]">2</span>
          أقسام الاختبار (Goethe)
        </button>
        <button
          type="button"
          onClick={() => setStep(3)}
          className={`flex items-center gap-1.5 pb-1 border-b-2 transition-all ${
            step === 3 ? 'border-brand-orange text-brand-orange font-black' : 'border-transparent text-muted-foreground'
          }`}
        >
          <span className="w-5 h-5 rounded-full bg-brand-orange/10 flex items-center justify-center text-[10px]">3</span>
          الدرجات والمحاولات
        </button>
      </div>

      {/* STEP 1: Basic Info */}
      {step === 1 && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <LangInput label="عنوان الاختبار" form={form} field="title" onChange={setForm} required />
          <LangInput label="الوصف التوضيحي" form={form} field="description" onChange={setForm} textarea rows={2} />

          <div className="grid grid-cols-2 gap-4">
            <FormRow label="المستوى التعليمي">
              <select value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value })} className={inputClass}>
                {LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
              </select>
            </FormRow>

            <FormRow label="نوع الاختبار">
              <select value={form.examType} onChange={(e) => setForm({ ...form, examType: e.target.value })} className={inputClass}>
                <option value="goethe_model">نموذج امتحاني رسمي (Goethe-style)</option>
                <option value="level_assessment">اختبار تحديد مستوى</option>
                <option value="unit_quiz">اختبار وحدة تدريبية</option>
                <option value="general">اختبار عام</option>
              </select>
            </FormRow>
          </div>

          <div className="pt-2">
            <Toggle
              checked={form.isActive}
              onChange={() => setForm({ ...form, isActive: !form.isActive })}
              labels={['منشور ومتاح للطلاب', 'مسودة غير منشورة']}
            />
          </div>
        </div>
      )}

      {/* STEP 2: Sections */}
      {step === 2 && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              قسّم الامتحان إلى أجزاء (مثل: Lesen, Hören, Schreiben, Sprechen) لتوزيع الأسئلة وحساب درجات كل قسم بشكل مستقل.
            </p>
            <button
              type="button"
              onClick={addSection}
              className="py-1.5 px-3 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground font-bold text-xs flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5 text-brand-orange" />
              إضافة قسم
            </button>
          </div>

          <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
            {(form.sections || []).map((sec: ExamSection, idx: number) => (
              <div key={sec.id || idx} className="p-3 rounded-2xl bg-secondary/30 border border-border flex items-center gap-3">
                <span className="w-6 h-6 rounded-lg bg-brand-orange/10 flex items-center justify-center text-xs font-bold text-brand-orange shrink-0">
                  {idx + 1}
                </span>
                <input
                  type="text"
                  placeholder="اسم القسم (عربي) مثل: القراءة"
                  value={sec.titleAr}
                  onChange={(e) => updateSection(idx, 'titleAr', e.target.value)}
                  className={`${inputClass} flex-1 text-xs`}
                  required
                />
                <input
                  type="text"
                  placeholder="بالألمانية مثل: Lesen"
                  value={sec.titleDe}
                  onChange={(e) => updateSection(idx, 'titleDe', e.target.value)}
                  className={`${inputClass} w-32 text-xs`}
                />
                <button
                  type="button"
                  onClick={() => removeSection(idx)}
                  className="p-1.5 text-muted-foreground hover:text-red-500 rounded-lg"
                  title="حذف القسم"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* STEP 3: Scoring & Attempts */}
      {step === 3 && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="grid grid-cols-3 gap-4">
            <FormRow label="مدة الامتحان (بالدقائق)">
              <input
                type="number"
                min="0"
                value={form.durationMinutes}
                onChange={(e) => setForm({ ...form, durationMinutes: parseInt(e.target.value) || 0 })}
                className={inputClass}
                placeholder="0 = بدون وقت محدد"
              />
            </FormRow>

            <FormRow label="درجة النجاح المئوية (%)">
              <input
                type="number"
                min="1"
                max="100"
                value={form.passingScore}
                onChange={(e) => setForm({ ...form, passingScore: parseInt(e.target.value) || 60 })}
                className={inputClass}
                placeholder="60"
              />
            </FormRow>

            <FormRow label="عدد المحاولات المسموحة">
              <select
                value={form.allowedAttempts}
                onChange={(e) => setForm({ ...form, allowedAttempts: parseInt(e.target.value) || 0 })}
                className={inputClass}
              >
                <option value={0}>عدد غير محدود</option>
                <option value={1}>محاولة واحدة فقط</option>
                <option value={2}>محاولتان</option>
                <option value={3}>3 محاولات</option>
              </select>
            </FormRow>
          </div>

          <div className="p-4 rounded-2xl bg-secondary/30 border border-border space-y-3">
            <Toggle
              checked={form.showDetailedResults}
              onChange={() => setForm({ ...form, showDetailedResults: !form.showDetailedResults })}
              labels={['إظهار الإجابات النموذجية والشرح بعد التسليم', 'حجب الإجابات والتفسيرات (تقييم مراقب)']}
            />
            <p className="text-[11px] text-muted-foreground">
              عند التفعيل، سيتمكن الطالب من مراجعة إجاباته الخاطئة ومعرفة الإجابة الصحيحة والتفسير التعليمي بعد إتمام الاختبار.
            </p>
          </div>

          <FormRow label="تعليمات الاختبار للطلاب">
            <textarea
              value={form.instructionsAr || ''}
              onChange={(e) => setForm({ ...form, instructionsAr: e.target.value })}
              className={`${inputClass} min-h-[70px] text-xs`}
              placeholder="اكتب الإرشادات التي تظهر للطالب قبل بدء الاختبار..."
            />
          </FormRow>
        </div>
      )}

      {/* Wizard Footer Controls */}
      <div className="flex items-center justify-between pt-4 border-t border-border">
        <div>
          {step > 1 && (
            <button
              type="button"
              onClick={() => setStep((s) => (s - 1) as any)}
              className="py-2 px-4 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground font-bold text-xs flex items-center gap-1"
            >
              <ChevronRight className="w-4 h-4" />
              السابق
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <GhostButton onClick={onClose} disabled={saving}>إلغاء</GhostButton>
          {step < 3 ? (
            <PrimaryButton type="button" onClick={() => setStep((s) => (s + 1) as any)}>
              التالي
              <ChevronLeft className="w-4 h-4" />
            </PrimaryButton>
          ) : (
            <PrimaryButton type="submit" disabled={saving}>
              {saving ? 'جارٍ الحفظ…' : 'حفظ ونشر الاختبار'}
            </PrimaryButton>
          )}
        </div>
      </div>
    </form>
  );
}

/* -------------------------------------------------------------------------- */
/*                     QUESTIONS MANAGER & EXCEL IMPORTER                     */
/* -------------------------------------------------------------------------- */
function QuestionsManager({ quiz, token, locale, onBack }: {
  quiz: Quiz; token: string; locale: string; onBack: () => void;
}) {
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [selectedSection, setSelectedSection] = useState<string>('all');

  // Excel Import Modal State
  const [excelModalOpen, setExcelModalOpen] = useState(false);
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [excelPreviewReport, setExcelPreviewReport] = useState<any | null>(null);
  const [importingExcel, setImportingExcel] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Student Preview Mode State
  const [previewOpen, setPreviewOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminFetch<{ questions: any[] }>(`/api/admin/quizzes/${quiz.id}/questions`, token);
      setQuestions(data.questions || []);
    } catch (e: any) { toast.error(e.message); }
    finally { setLoading(false); }
  }, [quiz.id, token]);

  const handleDelete = async () => {
    if (!deleteId) return;
    setSaving(true);
    try {
      await adminFetch(`/api/admin/quizzes/${quiz.id}/questions/${deleteId}`, token, { method: 'DELETE' });
      toast.success('تم حذف السؤال بنجاح');
      setDeleteId(null);
      load();
    } catch (e: any) { toast.error(e.message); }
    finally { setSaving(false); }
  };

  const handleDuplicate = async (q: any) => {
    setSaving(true);
    try {
      const rich = q.rich;
      const dupData = {
        ...rich,
        promptAr: `${rich.promptAr} (نسخة)`,
        order: (questions.length || 0) + 1,
      };
      await adminFetch(`/api/admin/quizzes/${quiz.id}/questions`, token, {
        method: 'POST',
        body: JSON.stringify(dupData),
      });
      toast.success('تم نسخ السؤال بنجاح');
      load();
    } catch (e: any) { toast.error(e.message); }
    finally { setSaving(false); }
  };

  const handleExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setExcelFile(file);
    setImportingExcel(true);
    setExcelPreviewReport(null);

    const fd = new FormData();
    fd.append('file', file);
    fd.append('action', 'validate');

    try {
      const res = await fetch(`/api/admin/quizzes/${quiz.id}/import`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'فشل في قراءة ملف الإكسل');
      setExcelPreviewReport(data.report);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setImportingExcel(false);
    }
  };

  const handleConfirmExcelImport = async () => {
    if (!excelFile) return;
    setImportingExcel(true);
    const fd = new FormData();
    fd.append('file', excelFile);
    fd.append('action', 'import');

    try {
      const res = await fetch(`/api/admin/quizzes/${quiz.id}/import`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'فشل في استيراد الأسئلة');
      toast.success(`تم استيراد ${data.importedCount} سؤال بنجاح!`);
      setExcelModalOpen(false);
      setExcelFile(null);
      setExcelPreviewReport(null);
      load();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setImportingExcel(false);
    }
  };

  // Filter questions by section
  const sections: ExamSection[] = quiz.sections || DEFAULT_GOETHE_SECTIONS;
  const filteredQuestions = selectedSection === 'all'
    ? questions
    : questions.filter(q => q.rich?.sectionId === selectedSection || q.rich?.sectionName === selectedSection);

  const totalPoints = questions.reduce((sum, q) => sum + (q.rich?.points || 1), 0);

  return (
    <div>
      {/* Top Navigation Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-4 border-b border-border">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2.5 hover:bg-secondary rounded-xl transition-all">
            <ArrowRight className="w-5 h-5 text-muted-foreground" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <LevelBadge level={quiz.level} />
              <h2 className="text-xl font-black text-foreground">{fieldOf(quiz as any, 'title', locale)}</h2>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {questions.length} أسئلة • مجموع الدرجات: {totalPoints} نقطة • {sections.length} أقسام
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <a
            href="/api/admin/quizzes/template"
            download
            className="py-2 px-3 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground font-bold text-xs flex items-center gap-1.5 transition-all"
            title="تحميل قالب Excel النموذجي للأسئلة"
          >
            <Download className="w-3.5 h-3.5 text-brand-orange" />
            تحميل قالب Excel
          </a>

          <button
            onClick={() => { setExcelFile(null); setExcelPreviewReport(null); setExcelModalOpen(true); }}
            className="py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            استيراد الأسئلة من Excel
          </button>

          <button
            onClick={() => setPreviewOpen(true)}
            className="py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all"
          >
            <Eye className="w-3.5 h-3.5" />
            معاينة الاختبار كطالب
          </button>

          <PrimaryButton icon={Plus} onClick={() => { setEditing(null); setFormOpen(true); }}>
            إضافة سؤال
          </PrimaryButton>
        </div>
      </div>

      {/* Sections Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-4 text-xs">
        <button
          onClick={() => setSelectedSection('all')}
          className={`px-3 py-1.5 rounded-xl font-bold transition-all shrink-0 ${
            selectedSection === 'all'
              ? 'bg-brand-orange text-white shadow-xs'
              : 'bg-secondary text-muted-foreground hover:text-foreground'
          }`}
        >
          كافة الأسئلة ({questions.length})
        </button>
        {sections.map((sec) => {
          const count = questions.filter(q => q.rich?.sectionId === sec.id || q.rich?.sectionName === sec.titleAr || q.rich?.sectionName === sec.titleDe).length;
          return (
            <button
              key={sec.id}
              onClick={() => setSelectedSection(sec.id)}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all shrink-0 ${
                selectedSection === sec.id
                  ? 'bg-brand-orange text-white shadow-xs'
                  : 'bg-secondary text-muted-foreground hover:text-foreground'
              }`}
            >
              {sec.titleAr} ({count})
            </button>
          );
        })}
      </div>

      {/* Questions List */}
      {loading ? <ListLoading /> : filteredQuestions.length === 0 ? (
        <EmptyState icon={FileText} text="لا توجد أسئلة مضافة في هذا القسم بعد" />
      ) : (
        <div className="space-y-3">
          {filteredQuestions.map((q, idx) => {
            const rich: RichQuestion = q.rich;
            const typeConfig = QUESTION_TYPES.find(t => t.id === rich.type) || QUESTION_TYPES[0];
            const TypeIcon = typeConfig.icon;

            return (
              <div key={q.id} className="card-bold p-4 sm:p-5 flex items-start justify-between gap-4 border-2 hover:border-brand-orange/30 transition-all">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <span className="w-8 h-8 rounded-xl bg-brand-orange/10 text-brand-orange flex items-center justify-center text-xs font-black shrink-0">
                    {idx + 1}
                  </span>
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-secondary text-foreground flex items-center gap-1">
                        <TypeIcon className="w-3 h-3 text-brand-orange" />
                        {typeConfig.label}
                      </span>
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-600">
                        {rich.sectionName || 'عام'}
                      </span>
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600">
                        {rich.points} نقطة
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-foreground pt-1">
                      {rich.promptAr}
                    </h4>

                    {/* Quick Answer Summary */}
                    <div className="text-xs text-muted-foreground pt-1 space-y-1">
                      {rich.type === 'single_choice' || rich.type === 'multiple_choice' ? (
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-emerald-600">
                            الإجابة الصحيحة: {rich.correctAnswers?.join(', ')}
                          </span>
                          <span className="text-muted-foreground/60">•</span>
                          <span>{rich.options?.length || 0} خيارات</span>
                        </div>
                      ) : rich.type === 'true_false' ? (
                        <span className="font-semibold text-emerald-600">
                          الإجابة: {rich.correctAnswers?.[0] === 'true' ? 'صح (Richtig)' : 'خطأ (Falsch)'}
                        </span>
                      ) : rich.type === 'fill_blank' ? (
                        <span className="font-semibold text-emerald-600">
                          الكلمات المقبولة: {(rich.acceptedAnswers || rich.correctAnswers)?.join(' / ')}
                        </span>
                      ) : null}

                      {rich.explanationAr && (
                        <p className="text-[11px] text-muted-foreground/80 italic">
                          💡 التفسير: {rich.explanationAr}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => handleDuplicate(q)}
                    title="تكرار السؤال"
                    className="p-2 text-muted-foreground hover:text-foreground rounded-xl hover:bg-secondary transition-all"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => { setEditing(q); setFormOpen(true); }}
                    title="تعديل"
                    className="p-2 text-muted-foreground hover:text-brand-orange rounded-xl hover:bg-brand-orange/5 transition-all"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setDeleteId(q.id)}
                    title="حذف"
                    className="p-2 text-muted-foreground hover:text-red-500 rounded-xl hover:bg-red-50 dark:hover:bg-red-950 transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Interactive Question Builder Modal */}
      <Modal open={formOpen} onClose={() => setFormOpen(false)} title={editing ? 'تعديل السؤال' : 'إضافة سؤال جديد'} size="xl">
        <InteractiveQuestionBuilder
          question={editing}
          quizSections={sections}
          saving={saving}
          onSave={async (data: any) => {
            setSaving(true);
            try {
              const url = editing
                ? `/api/admin/quizzes/${quiz.id}/questions/${editing.id}`
                : `/api/admin/quizzes/${quiz.id}/questions`;
              await adminFetch(url, token, { method: editing ? 'PUT' : 'POST', body: JSON.stringify(data) });
              toast.success(editing ? 'تم تحديث السؤال بنجاح' : 'تمت إضافة السؤال بنجاح');
              setFormOpen(false);
              load();
            } catch (e: any) { toast.error(e.message); }
            finally { setSaving(false); }
          }}
          onClose={() => setFormOpen(false)}
        />
      </Modal>

      {/* Excel Import Modal */}
      <Modal open={excelModalOpen} onClose={() => setExcelModalOpen(false)} title="استيراد الأسئلة من ملف Excel" size="xl">
        <div className="space-y-5">
          <div className="p-4 rounded-2xl bg-brand-orange/5 border border-brand-orange/20 text-xs text-muted-foreground space-y-2">
            <h4 className="font-bold text-foreground text-sm flex items-center gap-1.5">
              <FileSpreadsheet className="w-4 h-4 text-brand-orange" />
              تعليمات استيراد ملف Excel:
            </h4>
            <p>1. قم بتحميل القالب النموذجي لتعبئة أسئلتك بالأعمدة المطلوبة.</p>
            <p>2. يدعم النظام أسئلة الخيارات الفردية، المتعددة (A,C)، صح/خطأ، الفراغات، والنصوص.</p>
            <p>3. يتم فحص الملف وتحديد الأخطاء قبل إتمام الاستيراد لضمان سلامة الاختبار.</p>
          </div>

          <div className="border-2 border-dashed border-border hover:border-brand-orange/40 rounded-3xl p-6 text-center transition-all bg-secondary/20">
            <input
              type="file"
              ref={fileInputRef}
              accept=".xlsx,.xls"
              onChange={handleExcelUpload}
              className="hidden"
            />
            <Upload className="w-10 h-10 text-brand-orange mx-auto mb-2 opacity-80" />
            <p className="text-sm font-bold text-foreground">
              {excelFile ? excelFile.name : 'اضغط لاختيار ملف Excel أو أسقطه هنا'}
            </p>
            <span className="text-xs text-muted-foreground block mt-1">يدعم ملفات .xlsx و .xls</span>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="btn-bold-primary text-xs py-2 px-4 mt-4"
              disabled={importingExcel}
            >
              {importingExcel ? 'جارٍ فحص الملف…' : 'اختيار ملف من الجهاز'}
            </button>
          </div>

          {/* Validation Report Table */}
          {excelPreviewReport && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-3 rounded-2xl bg-secondary/60 border border-border">
                  <span className="text-xs text-muted-foreground block">إجمالي الأسئلة</span>
                  <span className="text-lg font-black text-foreground">{excelPreviewReport.totalRows}</span>
                </div>
                <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                  <span className="text-xs text-emerald-600 block">صالحة للاستيراد</span>
                  <span className="text-lg font-black text-emerald-600">{excelPreviewReport.validRowsCount}</span>
                </div>
                <div className="p-3 rounded-2xl bg-red-500/10 border border-red-500/20">
                  <span className="text-xs text-red-500 block">تحتاج لتعديل</span>
                  <span className="text-lg font-black text-red-500">{excelPreviewReport.errorRowsCount}</span>
                </div>
              </div>

              {excelPreviewReport.errorRowsCount > 0 && (
                <div className="max-h-48 overflow-y-auto space-y-2 p-3 rounded-2xl bg-red-500/5 border border-red-500/20 text-xs">
                  <h5 className="font-bold text-red-600 flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4" />
                    الصفوف التي تحتوي على أخطاء:
                  </h5>
                  {excelPreviewReport.rows.filter((r: any) => !r.isValid).map((errRow: any) => (
                    <div key={errRow.rowNumber} className="p-2 rounded-xl bg-background border border-red-200 dark:border-red-900/40">
                      <span className="font-bold text-red-600">الصف {errRow.rowNumber}:</span> {errRow.errors.join(' • ')}
                      <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                        السؤال: {errRow.raw.question || '(فارغ)'}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-between pt-3 border-t border-border">
                <GhostButton onClick={() => setExcelModalOpen(false)}>إلغاء</GhostButton>
                <PrimaryButton
                  onClick={handleConfirmExcelImport}
                  disabled={importingExcel || excelPreviewReport.validRowsCount === 0}
                >
                  {importingExcel ? 'جارٍ الاستيراد…' : `تأكيد استيراد ${excelPreviewReport.validRowsCount} سؤال صالحة`}
                </PrimaryButton>
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* Full Student Preview Simulator */}
      {previewOpen && (
        <ExamPreviewSimulator
          quiz={quiz}
          questions={questions}
          onClose={() => setPreviewOpen(false)}
        />
      )}

      <ConfirmDialog
        open={!!deleteId}
        message="هل أنت متأكد من حذف هذا السؤال نهائياً؟"
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
        loading={saving}
      />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                     INTERACTIVE QUESTION BUILDER MODAL                     */
/* -------------------------------------------------------------------------- */
function InteractiveQuestionBuilder({
  question, quizSections, saving, onSave, onClose
}: {
  question: any;
  quizSections: ExamSection[];
  saving: boolean;
  onSave: (data: any) => void;
  onClose: () => void;
}) {
  const existingRich = question?.rich;

  const [form, setForm] = useState<any>(() => ({
    promptAr: existingRich?.promptAr || question?.textAr || '',
    promptDe: existingRich?.promptDe || '',
    type: existingRich?.type || 'single_choice',
    sectionId: existingRich?.sectionId || quizSections[0]?.id || 'general',
    sectionName: existingRich?.sectionName || quizSections[0]?.titleAr || 'عام',
    points: existingRich?.points || 1,
    options: existingRich?.options || [
      { id: '1', textAr: '' },
      { id: '2', textAr: '' },
      { id: '3', textAr: '' },
      { id: '4', textAr: '' },
    ],
    correctAnswers: existingRich?.correctAnswers || ['1'],
    acceptedAnswers: existingRich?.acceptedAnswers || [],
    matchingPairs: existingRich?.matchingPairs || [
      { id: '1', left: '', right: '' },
      { id: '2', left: '', right: '' },
    ],
    orderingItems: existingRich?.orderingItems || [
      { id: '1', text: '', correctIndex: 0 },
      { id: '2', text: '', correctIndex: 1 },
    ],
    audioUrl: existingRich?.audioUrl || '',
    imageUrl: existingRich?.imageUrl || question?.imageUrl || '',
    explanationAr: existingRich?.explanationAr || '',
    order: existingRich?.order ?? 1,
  }));

  const handleTypeChange = (newType: QuestionType) => {
    setForm((prev: any) => ({
      ...prev,
      type: newType,
      correctAnswers: newType === 'true_false' ? ['true'] : ['1'],
    }));
  };

  const handleOptionChange = (idx: number, text: string) => {
    const next = [...form.options];
    next[idx] = { ...next[idx], textAr: text };
    setForm({ ...form, options: next });
  };

  const toggleCorrectOption = (optId: string) => {
    if (form.type === 'single_choice') {
      setForm({ ...form, correctAnswers: [optId] });
    } else if (form.type === 'multiple_choice') {
      const current = form.correctAnswers || [];
      const next = current.includes(optId)
        ? current.filter((id: string) => id !== optId)
        : [...current, optId];
      setForm({ ...form, correctAnswers: next });
    }
  };

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSave(form); }} className="space-y-5">
      {/* 1. Question Type Selector Tabs */}
      <FormRow label="نوع السؤال">
        <div className="grid grid-cols-3 gap-2">
          {QUESTION_TYPES.map((t) => {
            const isSelected = form.type === t.id;
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => handleTypeChange(t.id)}
                className={`p-2.5 rounded-2xl border text-right transition-all flex items-center gap-2 ${
                  isSelected
                    ? 'border-brand-orange bg-brand-orange/10 text-brand-orange font-bold shadow-xs'
                    : 'border-border bg-secondary/20 hover:bg-secondary/50 text-muted-foreground'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="text-xs truncate">{t.label}</span>
              </button>
            );
          })}
        </div>
      </FormRow>

      {/* 2. Section & Points */}
      <div className="grid grid-cols-2 gap-4">
        <FormRow label="القسم المرتبط">
          <select
            value={form.sectionId}
            onChange={(e) => {
              const sec = quizSections.find(s => s.id === e.target.value);
              setForm({ ...form, sectionId: e.target.value, sectionName: sec?.titleAr || 'عام' });
            }}
            className={inputClass}
          >
            {quizSections.map((s) => (
              <option key={s.id} value={s.id}>{s.titleAr} ({s.titleDe})</option>
            ))}
          </select>
        </FormRow>

        <FormRow label="الدرجة / النقاط">
          <input
            type="number"
            min="1"
            max="50"
            value={form.points}
            onChange={(e) => setForm({ ...form, points: parseInt(e.target.value) || 1 })}
            className={inputClass}
            required
          />
        </FormRow>
      </div>

      {/* 3. Question Prompt */}
      <FormRow label="نص السؤال">
        <textarea
          value={form.promptAr}
          onChange={(e) => setForm({ ...form, promptAr: e.target.value })}
          className={`${inputClass} min-h-[75px]`}
          placeholder="اكتب نص السؤال هنا..."
          required
        />
      </FormRow>

      {/* 4. Type Specific Editors */}
      {/* 4A: Single Choice & Multiple Choice */}
      {(form.type === 'single_choice' || form.type === 'multiple_choice') && (
        <div className="space-y-3 p-4 rounded-2xl bg-secondary/20 border border-border">
          <div className="flex items-center justify-between text-xs font-bold text-muted-foreground">
            <span>الخيارات (حدد الإجابة الصحيحة بالضغط على الدائرة/المربع):</span>
            <span className="text-brand-orange">
              {form.type === 'single_choice' ? 'اختر إجابة واحدة صحيحة' : 'اختر أكثر من إجابة صحيحة'}
            </span>
          </div>

          <div className="space-y-2">
            {form.options.map((opt: any, idx: number) => {
              const isChecked = form.correctAnswers?.includes(opt.id);
              const label = String.fromCharCode(65 + idx); // A, B, C, D
              return (
                <div key={opt.id} className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => toggleCorrectOption(opt.id)}
                    className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 transition-all ${
                      isChecked
                        ? 'bg-emerald-500 text-white shadow-xs'
                        : 'bg-secondary text-muted-foreground hover:bg-secondary/80'
                    }`}
                  >
                    {isChecked ? <Check className="w-4 h-4" /> : label}
                  </button>
                  <input
                    type="text"
                    value={opt.textAr}
                    onChange={(e) => handleOptionChange(idx, e.target.value)}
                    placeholder={`نص الخيار ${label}`}
                    className={`${inputClass} text-xs flex-1`}
                    required={idx < 2}
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 4B: True / False */}
      {form.type === 'true_false' && (
        <div className="p-4 rounded-2xl bg-secondary/20 border border-border space-y-3">
          <span className="text-xs font-bold text-muted-foreground block">حدد الإجابة الصحيحة:</span>
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setForm({ ...form, correctAnswers: ['true'] })}
              className={`p-3 rounded-xl border text-center font-bold text-sm transition-all ${
                form.correctAnswers?.[0] === 'true'
                  ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600 shadow-xs'
                  : 'border-border bg-secondary/40 text-muted-foreground'
              }`}
            >
              صح (Richtig) ✓
            </button>
            <button
              type="button"
              onClick={() => setForm({ ...form, correctAnswers: ['false'] })}
              className={`p-3 rounded-xl border text-center font-bold text-sm transition-all ${
                form.correctAnswers?.[0] === 'false'
                  ? 'border-red-500 bg-red-500/10 text-red-600 shadow-xs'
                  : 'border-border bg-secondary/40 text-muted-foreground'
              }`}
            >
              خطأ (Falsch) ✗
            </button>
          </div>
        </div>
      )}

      {/* 4C: Fill Blank */}
      {form.type === 'fill_blank' && (
        <div className="p-4 rounded-2xl bg-secondary/20 border border-border space-y-2">
          <span className="text-xs font-bold text-muted-foreground block">
            الكلمات الصحيحة المقبولة (افصل بين الكلمات بفاصلة):
          </span>
          <input
            type="text"
            value={(form.acceptedAnswers || form.correctAnswers || []).join(', ')}
            onChange={(e) => {
              const words = e.target.value.split(/[,،]+/).map(s => s.trim()).filter(Boolean);
              setForm({ ...form, acceptedAnswers: words, correctAnswers: words });
            }}
            placeholder="مثال: der, Der, DER"
            className={inputClass}
            required
          />
        </div>
      )}

      {/* 4D: Audio Question */}
      {form.type === 'audio' && (
        <div className="p-4 rounded-2xl bg-secondary/20 border border-border space-y-3">
          <FormRow label="رابط الملف الصوتي (MP3/WAV/AAC)">
            <div className="flex items-center gap-2">
              <input
                type="url"
                value={form.audioUrl || ''}
                onChange={(e) => setForm({ ...form, audioUrl: e.target.value })}
                placeholder="https://..."
                className={inputClass}
                required
              />
            </div>
          </FormRow>
          <div className="space-y-2">
            <span className="text-xs font-bold text-muted-foreground block">خيارات إجابة الاستماع:</span>
            {form.options.slice(0, 3).map((opt: any, idx: number) => (
              <div key={opt.id} className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setForm({ ...form, correctAnswers: [opt.id] })}
                  className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs ${
                    form.correctAnswers?.includes(opt.id) ? 'bg-emerald-500 text-white' : 'bg-secondary'
                  }`}
                >
                  {String.fromCharCode(65 + idx)}
                </button>
                <input
                  type="text"
                  value={opt.textAr}
                  onChange={(e) => handleOptionChange(idx, e.target.value)}
                  placeholder={`الخيار ${String.fromCharCode(65 + idx)}`}
                  className={`${inputClass} text-xs`}
                  required
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Image URL / Upload */}
      {(form.type === 'image' || form.imageUrl) && (
        <FormRow label="رابط صورة السؤال">
          <ImageField
            value={form.imageUrl}
            onChange={(v) => setForm({ ...form, imageUrl: v })}
            placeholder="رابط صورة توضيحية للسؤال"
          />
        </FormRow>
      )}

      {/* 5. Explanation */}
      <FormRow label="شرح وتفسير الإجابة النموذجية (يظهر للطالب بعد التسليم)">
        <textarea
          value={form.explanationAr || ''}
          onChange={(e) => setForm({ ...form, explanationAr: e.target.value })}
          className={`${inputClass} min-h-[60px] text-xs`}
          placeholder="شرح القاعدة النحوية أو سبب صحة الإجابة..."
        />
      </FormRow>

      <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
        <GhostButton onClick={onClose} disabled={saving}>إلغاء</GhostButton>
        <PrimaryButton type="submit" disabled={saving}>
          {saving ? 'جارٍ الحفظ…' : 'حفظ السؤال'}
        </PrimaryButton>
      </div>
    </form>
  );
}

/* -------------------------------------------------------------------------- */
/*                       FULL STUDENT PREVIEW SIMULATOR                       */
/* -------------------------------------------------------------------------- */
function ExamPreviewSimulator({ quiz, questions, onClose }: {
  quiz: Quiz; questions: any[]; onClose: () => void;
}) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, any>>({});
  const [submitted, setSubmitted] = useState(false);
  const [evalResult, setEvalResult] = useState<any | null>(null);

  const q = questions[currentIdx]?.rich;

  const handleSelectOption = (qId: string, optId: string) => {
    setUserAnswers(prev => ({
      ...prev,
      [qId]: { ...prev[qId], selectedOption: optId },
    }));
  };

  const handleToggleOption = (qId: string, optId: string) => {
    const current = userAnswers[qId]?.selectedOptions || [];
    const next = current.includes(optId) ? current.filter((id: string) => id !== optId) : [...current, optId];
    setUserAnswers(prev => ({
      ...prev,
      [qId]: { ...prev[qId], selectedOptions: next },
    }));
  };

  const handleSubmitSimulation = () => {
    const richQuestions: RichQuestion[] = questions.map(x => x.rich);
    const result = evaluateExam(richQuestions, userAnswers, {
      passingScore: quiz.passingScore || 60,
    });
    setEvalResult(result);
    setSubmitted(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-3xl bg-background rounded-3xl p-6 sm:p-8 border-2 border-border shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div className="flex items-center gap-2">
            <span className="level-badge font-bold">{quiz.level}</span>
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-600">
              👁️ وضع محاكاة ومعاينة الطالب (لن يؤثر على النتائج الحقيقية)
            </span>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-secondary text-muted-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        {!submitted ? (
          questions.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">لا توجد أسئلة مضافة في هذا الاختبار بعد</div>
          ) : (
            <div className="space-y-6">
              {/* Simulator Progress & Header */}
              <div className="flex items-center justify-between text-xs font-bold text-muted-foreground">
                <span>السؤال {currentIdx + 1} من {questions.length}</span>
                <span className="flex items-center gap-1 text-brand-orange">
                  <Clock className="w-3.5 h-3.5" />
                  مؤقت تجريبي: {quiz.durationMinutes || 30}:00
                </span>
              </div>

              {/* Question Card */}
              <div className="card-bold p-6 border-2 space-y-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-md bg-secondary text-foreground">
                    {q?.sectionName || 'القسم'}
                  </span>
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600">
                    {q?.points || 1} نقطة
                  </span>
                </div>

                <h3 className="text-lg font-bold text-foreground">
                  {q?.promptAr}
                </h3>

                {q?.type === 'multiple_choice' && (
                  <p className="text-xs font-bold text-brand-orange">
                    ⚠️ اختر أكثر من إجابة
                  </p>
                )}
                {q?.type === 'single_choice' && (
                  <p className="text-xs font-bold text-muted-foreground">
                    اختر إجابة واحدة فقط
                  </p>
                )}

                {/* Answers Options */}
                {(q?.type === 'single_choice' || q?.type === 'multiple_choice') && (
                  <div className="space-y-2 pt-2">
                    {(q?.options || []).map((opt: any) => {
                      const isSelected = q.type === 'single_choice'
                        ? userAnswers[q.id]?.selectedOption === opt.id
                        : userAnswers[q.id]?.selectedOptions?.includes(opt.id);
                      return (
                        <div
                          key={opt.id}
                          onClick={() => q.type === 'single_choice' ? handleSelectOption(q.id, opt.id) : handleToggleOption(q.id, opt.id)}
                          className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all flex items-center gap-3 ${
                            isSelected
                              ? 'border-brand-orange bg-brand-orange/10 font-bold'
                              : 'border-border bg-card hover:bg-secondary/40'
                          }`}
                        >
                          <div className={`w-5 h-5 rounded-lg border flex items-center justify-center text-xs ${
                            isSelected ? 'bg-brand-orange border-brand-orange text-white' : 'border-border'
                          }`}>
                            {isSelected && <Check className="w-3.5 h-3.5" />}
                          </div>
                          <span className="text-sm">{opt.textAr}</span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* True/False Options */}
                {q?.type === 'true_false' && (
                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <button
                      type="button"
                      onClick={() => handleSelectOption(q.id, 'true')}
                      className={`p-4 rounded-2xl border-2 font-bold text-sm transition-all ${
                        userAnswers[q.id]?.selectedOption === 'true'
                          ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600'
                          : 'border-border bg-secondary/30'
                      }`}
                    >
                      صح (Richtig)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSelectOption(q.id, 'false')}
                      className={`p-4 rounded-2xl border-2 font-bold text-sm transition-all ${
                        userAnswers[q.id]?.selectedOption === 'false'
                          ? 'border-red-500 bg-red-500/10 text-red-600'
                          : 'border-border bg-secondary/30'
                      }`}
                    >
                      خطأ (Falsch)
                    </button>
                  </div>
                )}
              </div>

              {/* Navigation Controls */}
              <div className="flex items-center justify-between pt-2">
                <button
                  disabled={currentIdx === 0}
                  onClick={() => setCurrentIdx(i => i - 1)}
                  className="py-2.5 px-4 rounded-xl bg-secondary hover:bg-secondary/80 disabled:opacity-40 font-bold text-xs flex items-center gap-1.5"
                >
                  <ChevronRight className="w-4 h-4" />
                  السؤال السابق
                </button>

                {currentIdx < questions.length - 1 ? (
                  <button
                    onClick={() => setCurrentIdx(i => i + 1)}
                    className="btn-bold-primary text-xs py-2.5 px-5 flex items-center gap-1.5"
                  >
                    السؤال التالي
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    onClick={handleSubmitSimulation}
                    className="py-2.5 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md"
                  >
                    تسليم الاختبار التجريبي
                  </button>
                )}
              </div>
            </div>
          )
        ) : (
          /* Result Screen */
          <div className="py-6 text-center space-y-6">
            <div className={`w-20 h-20 rounded-3xl mx-auto flex items-center justify-center text-3xl font-black ${
              evalResult?.passed ? 'bg-emerald-500/10 text-emerald-600 border-2 border-emerald-500/30' : 'bg-red-500/10 text-red-600 border-2 border-red-500/30'
            }`}>
              {evalResult?.percentage}%
            </div>

            <div>
              <h3 className="text-2xl font-black text-foreground">
                {evalResult?.passed ? '🎉 نتيجة ناجحة!' : 'لم تجتز الاختبار هذه المرة'}
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                الدرجة المحققة: {evalResult?.totalScore} من {evalResult?.maxScore} (درجة النجاح: {evalResult?.passingScore}%)
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto text-xs">
              <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-600 font-bold">
                ✓ الإجابات الصحيحة: {evalResult?.correctCount}
              </div>
              <div className="p-3 rounded-xl bg-red-500/10 text-red-600 font-bold">
                ✗ الإجابات الخاطئة: {evalResult?.incorrectCount}
              </div>
            </div>

            <button
              onClick={() => { setSubmitted(false); setCurrentIdx(0); setUserAnswers({}); }}
              className="btn-bold-primary text-xs py-2.5 px-6 mx-auto flex items-center gap-2"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              إعادة تجربة المحاكاة
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
