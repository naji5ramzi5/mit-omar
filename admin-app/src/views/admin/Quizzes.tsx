'use client';

import { useState, useCallback } from 'react';
import { toast } from './toast';
import { Plus, Pencil, Trash2, GraduationCap, FileText, ArrowRight, CheckCircle2, Image as ImageIcon } from 'lucide-react';
import {
  PrimaryButton, GhostButton, Modal, ConfirmDialog, SectionHeader, EmptyState, ListLoading,
  LevelBadge, Toggle, LangInput, ImageField, FormRow, inputClass,
} from './ui';
import { adminFetch, fieldOf, useAdminData } from './api';
import { Quiz, Question, LEVELS } from './types';

const emptyQuiz = { titleAr: '', titleDe: '', titleEn: '', descriptionAr: '', descriptionDe: '', descriptionEn: '', level: 'A1', isActive: true };

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
    return <QuestionsManager quiz={managing} token={token} locale={locale} onBack={() => setManaging(null)} />;
  }

  return (
    <div>
      <SectionHeader
        title="الاختبارات"
        subtitle="إدارة الاختبارات والأسئلة لتقييم الطلاب"
        action={<PrimaryButton icon={Plus} onClick={() => { setEditing(null); setFormOpen(true); }}>إضافة اختبار</PrimaryButton>}
      />

      {listLoading ? <ListLoading /> : quizzes.length === 0 ? (
        <EmptyState icon={GraduationCap} text="لا توجد اختبارات" />
      ) : (
        <div className="space-y-3">
          {quizzes.map((q) => (
            <div key={q.id} className="card-bold p-5 flex items-center justify-between gap-4 border-2 hover:border-brand-orange/30 transition-all">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5">
                  <LevelBadge level={q.level} />
                  <span className={`w-2.5 h-2.5 rounded-full ${q.isActive ? 'bg-green-500' : 'bg-gray-300'}`} />
                </div>
                <p className="text-sm font-bold text-foreground truncate">{fieldOf(q as any, 'title', locale)}</p>
                <p className="text-xs text-muted-foreground mt-1">{q._count?.questions || 0} سؤال · {q._count?.quizAttempts || 0} محاولة</p>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => setManaging(q)} title="إدارة الأسئلة" className="p-2.5 text-muted-foreground hover:text-green-500 rounded-xl hover:bg-green-50 dark:hover:bg-green-950 transition-all"><FileText className="w-4 h-4" /></button>
                <button onClick={() => { setEditing(q); setFormOpen(true); }} className="p-2.5 text-muted-foreground hover:text-brand-orange rounded-xl hover:bg-brand-orange/5 transition-all"><Pencil className="w-4 h-4" /></button>
                <button onClick={() => setDeleteId(q.id)} className="p-2.5 text-muted-foreground hover:text-red-500 rounded-xl hover:bg-red-50 dark:hover:bg-red-950 transition-all"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={formOpen} onClose={() => setFormOpen(false)} title={editing ? 'تعديل الاختبار' : 'إضافة اختبار'}>
        <QuizForm quiz={editing} locale={locale} saving={saving}
          onSave={async (data) => {
            setSaving(true);
            try {
              const url = editing ? `/api/admin/quizzes/${editing.id}` : '/api/admin/quizzes';
              await adminFetch(url, token, { method: editing ? 'PUT' : 'POST', body: JSON.stringify(data) });
              toast.success(editing ? 'تم تحديث الاختبار' : 'تمت إضافة الاختبار');
              setFormOpen(false);
              refresh();
            } catch (e: any) { toast.error(e.message); }
            finally { setSaving(false); }
          }}
          onClose={() => setFormOpen(false)}
        />
      </Modal>

      <ConfirmDialog open={!!deleteId} message="هل أنت متأكد من حذف هذا الاختبار وكل أسئلته؟" onConfirm={handleDelete} onCancel={() => setDeleteId(null)} loading={saving} />
    </div>
  );
}

function QuizForm({ quiz, locale, saving, onSave, onClose }: any) {
  const [form, setForm] = useState<any>(() => ({ ...emptyQuiz, ...(quiz || {}) }));
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSave(form); }} className="space-y-5">
      <LangInput label="عنوان الاختبار" form={form} field="title" onChange={setForm} required />
      <LangInput label="الوصف" form={form} field="description" onChange={setForm} textarea rows={2} />
      <div className="grid grid-cols-2 gap-4 items-end">
        <FormRow label="المستوى">
          <select value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value })} className={inputClass}>
            {LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
          </select>
        </FormRow>
        <Toggle checked={form.isActive} onChange={() => setForm({ ...form, isActive: !form.isActive })} labels={['اختبار مفعل', 'اختبار معطل']} />
      </div>
      <div className="flex gap-3 justify-end pt-2">
        <GhostButton onClick={onClose} disabled={saving}>إلغاء</GhostButton>
        <PrimaryButton type="submit" disabled={saving}>{saving ? 'جارٍ الحفظ…' : 'حفظ'}</PrimaryButton>
      </div>
    </form>
  );
}

/* ---------------------------- Questions manager -------------------------- */
function QuestionsManager({ quiz, token, locale, onBack }: {
  quiz: Quiz; token: string; locale: string; onBack: () => void;
}) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Question | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminFetch<{ questions: Question[] }>(`/api/admin/quizzes/${quiz.id}/questions`, token);
      setQuestions(data.questions || []);
    } catch (e: any) { toast.error(e.message); }
    finally { setLoading(false); }
  }, [quiz.id, token]);

  const handleDelete = async () => {
    if (!deleteId) return;
    setSaving(true);
    try {
      await adminFetch(`/api/admin/quizzes/${quiz.id}/questions/${deleteId}`, token, { method: 'DELETE' });
      toast.success('تم حذف السؤال');
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
          <h2 className="text-xl font-black text-foreground truncate">{fieldOf(quiz as any, 'title', locale)}</h2>
          <p className="text-xs text-muted-foreground">{questions.length} سؤال</p>
        </div>
        <PrimaryButton icon={Plus} onClick={() => { setEditing(null); setFormOpen(true); }}>إضافة سؤال</PrimaryButton>
      </div>

      {loading ? <ListLoading /> : questions.length === 0 ? (
        <EmptyState icon={FileText} text="لا توجد أسئلة بعد" />
      ) : (
        <div className="space-y-3">
          {questions.map((q, idx) => (
            <div key={q.id} className="card-bold p-5 flex items-start justify-between gap-4 border-2">
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <span className="w-8 h-8 rounded-lg bg-brand-orange/10 flex items-center justify-center text-xs font-black text-brand-orange shrink-0">{idx + 1}</span>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-foreground truncate">{fieldOf(q as any, 'text', locale)}</p>
                  <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-green-500" /> الإجابة الصحيحة: الخيار {q.correctOption}
                  </p>
                  {q.imageUrl && <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1"><ImageIcon className="w-3 h-3" />صورة مرفقة</p>}
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => { setEditing(q); setFormOpen(true); }} className="p-2.5 text-muted-foreground hover:text-brand-orange rounded-xl hover:bg-brand-orange/5 transition-all"><Pencil className="w-4 h-4" /></button>
                <button onClick={() => setDeleteId(q.id)} className="p-2.5 text-muted-foreground hover:text-red-500 rounded-xl hover:bg-red-50 dark:hover:bg-red-950 transition-all"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={formOpen} onClose={() => setFormOpen(false)} title={editing ? 'تعديل السؤال' : 'إضافة سؤال'} size="xl">
        <QuestionForm question={editing} locale={locale} saving={saving}
          onSave={async (data) => {
            setSaving(true);
            try {
              const url = editing ? `/api/admin/quizzes/${quiz.id}/questions/${editing.id}` : `/api/admin/quizzes/${quiz.id}/questions`;
              await adminFetch(url, token, { method: editing ? 'PUT' : 'POST', body: JSON.stringify(data) });
              toast.success(editing ? 'تم تحديث السؤال' : 'تمت إضافة السؤال');
              setFormOpen(false);
              load();
            } catch (e: any) { toast.error(e.message); }
            finally { setSaving(false); }
          }}
          onClose={() => setFormOpen(false)}
        />
      </Modal>

      <ConfirmDialog open={!!deleteId} message="هل أنت متأكد من حذف هذا السؤال؟" onConfirm={handleDelete} onCancel={() => setDeleteId(null)} loading={saving} />
    </div>
  );
}

const emptyQuestion = {
  textAr: '', textDe: '', textEn: '',
  option1Ar: '', option1De: '', option1En: '',
  option2Ar: '', option2De: '', option2En: '',
  option3Ar: '', option3De: '', option3En: '',
  option4Ar: '', option4De: '', option4En: '',
  imageUrl: null, correctOption: 1, order: 0,
};

function QuestionForm({ question, locale, saving, onSave, onClose }: any) {
  const [form, setForm] = useState<any>(() => ({ ...emptyQuestion, ...(question || {}) }));

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSave(form); }} className="space-y-5">
      <LangInput label="نص السؤال" form={form} field="text" onChange={setForm} required />

      {[1, 2, 3, 4].map((opt) => (
        <LangInput key={opt} label={`الخيار ${opt}`} form={form} field={`option${opt}`} onChange={setForm} required={opt === 1} />
      ))}

      <FormRow label="صورة السؤال (اختياري)">
        <ImageField value={form.imageUrl} onChange={(v) => setForm({ ...form, imageUrl: v })} placeholder="رابط صورة السؤال" />
      </FormRow>

      <div className="grid grid-cols-2 gap-4">
        <FormRow label="الإجابة الصحيحة">
          <select value={form.correctOption} onChange={(e) => setForm({ ...form, correctOption: parseInt(e.target.value) })} className={inputClass}>
            {[1, 2, 3, 4].map((o) => <option key={o} value={o}>الخيار {o}</option>)}
          </select>
        </FormRow>
        <FormRow label="الترتيب">
          <input type="number" value={form.order} onChange={(e) => setForm({ ...form, order: parseInt(e.target.value) || 0 })} className={inputClass} />
        </FormRow>
      </div>

      <div className="flex gap-3 justify-end pt-2">
        <GhostButton onClick={onClose} disabled={saving}>إلغاء</GhostButton>
        <PrimaryButton type="submit" disabled={saving}>{saving ? 'جارٍ الحفظ…' : 'حفظ'}</PrimaryButton>
      </div>
    </form>
  );
}
