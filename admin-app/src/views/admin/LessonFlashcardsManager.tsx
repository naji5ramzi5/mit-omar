'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  Layers, Plus, Pencil, Trash2, ArrowUp, ArrowDown, Volume2, 
  Languages, Loader2, Eye, X, CheckCircle2, Music, Mic, Image as ImageIcon 
} from 'lucide-react';
import { adminFetch } from './api';
import { 
  PrimaryButton, GhostButton, Modal, ConfirmDialog, 
  LangInput, FormRow, inputClass, EmptyState 
} from './ui';
import { AudioUploader, ImageUploader, resolveAdminMediaUrl } from './media-uploaders';
import { Course, CourseLevel, Lesson, Flashcard } from './types';
import { toast } from './toast';

interface LessonFlashcardsManagerProps {
  course: Course;
  level: CourseLevel;
  lesson: Lesson;
  token: string;
  locale: string;
  onClose: () => void;
  onUpdated?: () => void;
}

export default function LessonFlashcardsManager({
  course,
  level,
  lesson,
  token,
  locale,
  onClose,
  onUpdated,
}: LessonFlashcardsManagerProps) {
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Card modal
  const [cardModal, setCardModal] = useState(false);
  const [editingCard, setEditingCard] = useState<Flashcard | null>(null);
  const [cardForm, setCardForm] = useState<any>({});

  // Preview & Confirm
  const [previewCard, setPreviewCard] = useState<Flashcard | null>(null);
  const [deleteCardId, setDeleteCardId] = useState<string | null>(null);
  const [translating, setTranslating] = useState(false);

  const loadCards = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminFetch<{ words: Flashcard[] }>(
        `/api/admin/flashcards/words?lessonId=${lesson.id}`,
        token
      );
      setCards(res.words || []);
    } catch (e: any) {
      toast.error(e.message || 'فشل جلب بطاقات الدرس');
    } finally {
      setLoading(false);
    }
  }, [lesson.id, token]);

  useEffect(() => {
    loadCards();
  }, [loadCards]);

  const openAddCard = () => {
    setEditingCard(null);
    setCardForm({
      lessonId: lesson.id,
      wordDe: '',
      wordAr: '',
      wordEn: '',
      exampleDe: '',
      exampleAr: '',
      exampleEn: '',
      audioUrl: null,
      imageUrl: null,
      order: cards.length + 1,
      published: true,
    });
    setCardModal(true);
  };

  const openEditCard = (card: Flashcard) => {
    setEditingCard(card);
    setCardForm({
      id: card.id,
      lessonId: lesson.id,
      wordDe: card.wordDe || '',
      wordAr: card.wordAr || '',
      wordEn: card.wordEn || '',
      exampleDe: card.exampleDe || '',
      exampleAr: card.exampleAr || (card as any).example_ar || '',
      exampleEn: card.exampleEn || (card as any).example_en || '',
      audioUrl: card.audioUrl ?? (card as any).audio_url ?? null,
      imageUrl: card.imageUrl ?? (card as any).image_url ?? null,
      order: card.order ?? cards.length,
      published: card.published !== false,
    });
    setCardModal(true);
  };

  const handleSaveCard = async () => {
    if (!cardForm.wordDe?.trim()) {
      return toast.error('الكلمة الألمانية مطلوبة');
    }

    setSaving(true);
    try {
      if (editingCard) {
        const res = await adminFetch<{ word: Flashcard }>(
          `/api/admin/flashcards/words/${editingCard.id}`,
          token,
          {
            method: 'PUT',
            body: JSON.stringify(cardForm),
          }
        );
        toast.success('تم تحديث البطاقة بنجاح');
        if (res.word) {
          setCards((prev) => prev.map((c) => (c.id === editingCard.id ? { ...c, ...res.word } : c)));
        }
      } else {
        const res = await adminFetch<{ word: Flashcard }>('/api/admin/flashcards/words', token, {
          method: 'POST',
          body: JSON.stringify({ ...cardForm, lessonId: lesson.id }),
        });
        toast.success('تمت إضافة البطاقة إلى الدرس بنجاح');
        if (res.word) {
          setCards((prev) => [...prev, res.word]);
        }
      }
      setCardModal(false);
      loadCards();
      onUpdated?.();
    } catch (e: any) {
      toast.error(e.message || 'فشل حفظ البطاقة');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCard = async () => {
    if (!deleteCardId) return;
    setSaving(true);
    try {
      await adminFetch(`/api/admin/flashcards/words/${deleteCardId}`, token, {
        method: 'DELETE',
      });
      toast.success('تم حذف البطاقة بنجاح');
      setCards((prev) => prev.filter((c) => c.id !== deleteCardId));
      setDeleteCardId(null);
      onUpdated?.();
    } catch (e: any) {
      toast.error(e.message || 'فشل حذف البطاقة');
    } finally {
      setSaving(false);
    }
  };

  const handleMoveCard = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= cards.length) return;

    const newCards = [...cards];
    const a = newCards[index];
    const b = newCards[targetIndex];

    const tempOrder = a.order;
    a.order = b.order;
    b.order = tempOrder;

    newCards[index] = b;
    newCards[targetIndex] = a;

    setCards([...newCards].sort((x, y) => x.order - y.order));

    try {
      await adminFetch(`/api/admin/flashcards/words/${a.id}`, token, {
        method: 'PUT',
        body: JSON.stringify({ order: a.order }),
      });
      await adminFetch(`/api/admin/flashcards/words/${b.id}`, token, {
        method: 'PUT',
        body: JSON.stringify({ order: b.order }),
      });
    } catch {
      toast.error('فشل حفظ الترتيب الجديد');
      loadCards();
    }
  };

  const autoTranslate = async () => {
    const text = cardForm.wordDe?.trim();
    if (!text) return toast.error('أدخل الكلمة الألمانية أولاً');
    setTranslating(true);
    try {
      const [arRes, enRes] = await Promise.all([
        fetch('/api/translate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text, from: 'de', to: 'ar' }),
        }).then((r) => r.json()),
        fetch('/api/translate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text, from: 'de', to: 'en' }),
        }).then((r) => r.json()),
      ]);

      setCardForm((prev: any) => ({
        ...prev,
        wordAr: arRes.translation || prev.wordAr,
        wordEn: enRes.translation || prev.wordEn,
      }));
      toast.success('تمت الترجمة التلقائية');
    } catch {
      toast.error('فشلت الترجمة التلقائية');
    } finally {
      setTranslating(false);
    }
  };

  const previewTTS = () => {
    const text = cardForm.wordDe?.trim();
    if (!text) return;
    const audio = new Audio(`/api/tts?text=${encodeURIComponent(text)}&lang=de-DE`);
    audio.onerror = () => {
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = 'de-DE';
      utter.rate = 0.85;
      window.speechSynthesis.speak(utter);
    };
    audio.play().catch(() => {
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = 'de-DE';
      utter.rate = 0.85;
      window.speechSynthesis.speak(utter);
    });
  };

  return (
    <div className="space-y-5">
      {/* Header Info Banner */}
      <div className="card-bold p-4 bg-secondary/40 border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
            <span>{course.titleAr}</span>
            <span>←</span>
            <span className="font-bold text-foreground">{level.name}</span>
          </div>
          <h3 className="text-base font-black text-foreground flex items-center gap-2">
            <Layers className="w-5 h-5 text-brand-orange" />
            بطاقات الحفظ الخاصة بدرس: {lesson.titleAr}
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            تظهر هذه البطاقات للطلاب مباشرة بعد انتهاء مشاهدة فيديو الدرس لترسيخ المفردات.
          </p>
        </div>

        <PrimaryButton icon={Plus} onClick={openAddCard} className="shrink-0 text-xs py-2 px-3.5">
          + إضافة بطاقة للدرس
        </PrimaryButton>
      </div>

      {/* Cards List */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-16 skeleton-bold rounded-2xl" />
          ))}
        </div>
      ) : cards.length === 0 ? (
        <div className="card-bold border-2 border-dashed p-8 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-brand-orange/10 text-brand-orange mx-auto flex items-center justify-center">
            <Layers className="w-6 h-6" />
          </div>
          <p className="text-sm font-bold text-foreground">لا توجد بطاقات حفظ لهذا الدرس بعد</p>
          <p className="text-xs text-muted-foreground max-w-md mx-auto">
            أضف كلمات ومفردات الدرس ليتمكن الطلاب من مراجعتها والاستماع إلى نطقك الصوتي فور إكمال الفيديو.
          </p>
          <div>
            <PrimaryButton icon={Plus} onClick={openAddCard} className="text-xs py-2 px-4">
              + إضافة أول بطاقة
            </PrimaryButton>
          </div>
        </div>
      ) : (
        <div className="space-y-2.5">
          {cards.map((card, idx) => (
            <div
              key={card.id}
              className="card-bold p-3.5 sm:p-4 border flex items-center justify-between gap-3 hover:border-brand-orange/40 transition-all group"
            >
              {/* Order index */}
              <span className="w-7 h-7 rounded-lg bg-secondary text-xs font-mono font-bold flex items-center justify-center text-muted-foreground shrink-0">
                {String(idx + 1).padStart(2, '0')}
              </span>

              {/* Image thumbnail if any */}
              {card.imageUrl && (
                <div className="w-10 h-10 rounded-xl overflow-hidden bg-secondary shrink-0 border border-border">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={resolveAdminMediaUrl(card.imageUrl)}
                    alt=""
                    className="w-full h-full object-cover"
                    onError={(e) => ((e.target as HTMLImageElement).style.visibility = 'hidden')}
                  />
                </div>
              )}

              {/* Word texts */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-display font-black text-sm text-foreground">
                    {card.wordDe}
                  </span>
                  <span className="text-xs text-muted-foreground">→</span>
                  <span className="text-xs font-bold text-foreground/90">
                    {card.wordAr}
                  </span>

                  {card.audioUrl && (
                    <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950 text-emerald-600 font-bold border border-emerald-200 dark:border-emerald-800">
                      <Volume2 className="w-3 h-3" /> صوت الأستاذ
                    </span>
                  )}

                  {!card.published && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950 text-amber-600 font-bold">
                      مسودة
                    </span>
                  )}
                </div>

                {card.exampleDe && (
                  <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
                    „{card.exampleDe}“
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => handleMoveCard(idx, 'up')}
                  disabled={idx === 0}
                  title="تحريك لأعلى"
                  className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-secondary disabled:opacity-30 transition-all"
                >
                  <ArrowUp className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleMoveCard(idx, 'down')}
                  disabled={idx === cards.length - 1}
                  title="تحريك لأسفل"
                  className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-secondary disabled:opacity-30 transition-all"
                >
                  <ArrowDown className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setPreviewCard(card)}
                  title="معاينة البطاقة"
                  className="p-1.5 text-muted-foreground hover:text-brand-orange rounded-lg hover:bg-brand-orange/10 transition-all"
                >
                  <Eye className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => openEditCard(card)}
                  title="تعديل البطاقة"
                  className="p-1.5 text-muted-foreground hover:text-brand-orange rounded-lg hover:bg-brand-orange/10 transition-all"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setDeleteCardId(card.id)}
                  title="حذف البطاقة"
                  className="p-1.5 text-muted-foreground hover:text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-950 transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Card Create / Edit Modal */}
      <Modal
        open={cardModal}
        onClose={() => setCardModal(false)}
        title={editingCard ? 'تعديل بطاقة الحفظ' : 'إضافة بطاقة حفظ للدرس'}
        size="xl"
      >
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-sm font-bold text-foreground">الكلمة والمعنى (3 لغات)</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={previewTTS}
                  className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-600 hover:bg-blue-100 transition-colors"
                  title="استمع إلى نطق الكلمة الألمانية عبر النظام"
                >
                  <Volume2 className="w-3 h-3" />
                  <span>استمع</span>
                </button>
                <button
                  type="button"
                  onClick={autoTranslate}
                  disabled={translating}
                  className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg bg-green-50 dark:bg-green-950 text-green-600 hover:bg-green-100 transition-colors disabled:opacity-50"
                  title="ترجمة تلقائية من الألمانية"
                >
                  {translating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Languages className="w-3 h-3" />}
                  <span>ترجمة تلقائية</span>
                </button>
              </div>
            </div>
            <LangInput label="" form={cardForm} field="word" onChange={setCardForm} required />
          </div>

          <LangInput label="مثال الاستخدام في جملة (اختياري)" form={cardForm} field="example" onChange={setCardForm} textarea rows={2} />

          <FormRow label="التسجيل الصوتي لنطق الأستاذ عمر (رفع ملف أو تسجيل مباشر بالمايكروفون)">
            <AudioUploader
              value={cardForm.audioUrl}
              token={token}
              onChange={(url) => setCardForm((prev: any) => ({ ...prev, audioUrl: url }))}
              placeholder="انقر لرفع نطق الكلمة من الكمبيوتر أو سجل صوتك مباشرة"
            />
          </FormRow>

          <FormRow label="صورة توضيحية للبطاقة (اختياري)">
            <ImageUploader
              value={cardForm.imageUrl}
              token={token}
              onChange={(url) => setCardForm((prev: any) => ({ ...prev, imageUrl: url }))}
              placeholder="انقر لرفع صورة معبرة عن الكلمة"
              aspectRatio="16/9"
            />
          </FormRow>

          <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary/40 border border-border">
            <input
              type="checkbox"
              id="lesson-card-published"
              checked={!!cardForm.published}
              onChange={(e) => setCardForm((prev: any) => ({ ...prev, published: e.target.checked }))}
              className="w-4 h-4 accent-[#E85D26]"
            />
            <label htmlFor="lesson-card-published" className="text-sm font-bold text-foreground cursor-pointer">
              بطاقة منشورة (مرئية للطلاب بعد إكمال الفيديو)
            </label>
          </div>

          <div className="flex gap-3 justify-end pt-2 border-t border-border">
            <GhostButton onClick={() => setCardModal(false)}>إلغاء</GhostButton>
            <PrimaryButton onClick={handleSaveCard} disabled={saving}>
              {saving ? 'جارٍ الحفظ...' : 'حفظ البطاقة'}
            </PrimaryButton>
          </div>
        </div>
      </Modal>

      {/* Preview Modal */}
      {previewCard && (
        <Modal open={!!previewCard} onClose={() => setPreviewCard(null)} title="معاينة بطاقة الحفظ" size="md">
          <div className="space-y-4 py-2">
            <div className="card-bold border-2 border-border p-6 rounded-2xl text-center bg-gradient-to-b from-card to-secondary/30">
              {previewCard.imageUrl && (
                <div className="w-full h-40 rounded-xl overflow-hidden mb-4 bg-secondary border border-border">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={resolveAdminMediaUrl(previewCard.imageUrl)} alt="" className="w-full h-full object-cover" />
                </div>
              )}
              <h3 className="text-2xl font-black text-foreground mb-1">{previewCard.wordDe}</h3>
              <p className="text-lg font-bold text-brand-orange mb-3">{previewCard.wordAr}</p>
              {previewCard.exampleDe && (
                <p className="text-xs text-muted-foreground bg-secondary/50 p-2.5 rounded-xl mb-3">
                  „{previewCard.exampleDe}“
                  {previewCard.exampleAr && <span className="block mt-1 text-foreground/80">{previewCard.exampleAr}</span>}
                </p>
              )}
              {previewCard.audioUrl && (
                <button
                  type="button"
                  onClick={() => {
                    const a = new Audio(resolveAdminMediaUrl(previewCard.audioUrl!));
                    a.play().catch(() => {});
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
                >
                  <Volume2 className="w-4 h-4" />
                  تشغيل نطق الأستاذ عمر
                </button>
              )}
            </div>
            <div className="flex justify-end">
              <GhostButton onClick={() => setPreviewCard(null)}>إغلاق</GhostButton>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Confirm */}
      <ConfirmDialog
        open={!!deleteCardId}
        title="حذف بطاقة الحفظ"
        message="هل أنت متأكد من حذف هذه البطاقة نهائياً من هذا الدرس؟"
        confirmText="حذف"
        cancelText="إلغاء"
        onConfirm={handleDeleteCard}
        onCancel={() => setDeleteCardId(null)}
        loading={saving}
      />
    </div>
  );
}
