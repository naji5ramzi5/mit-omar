'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Layers, Plus, Pencil, Trash2, ArrowUp, ArrowDown, Volume2, Languages, Loader2, Eye, Search } from 'lucide-react';
import { adminFetch } from './api';
import { PrimaryButton, GhostButton, Modal, ConfirmDialog, SectionHeader, LangInput, FormRow, inputClass, EmptyState, LevelBadge } from './ui';
import { AudioUploader, ImageUploader, resolveAdminMediaUrl } from './media-uploaders';
import { LEVELS } from './types';
import { toast } from './toast';

interface WordList {
  id: string;
  level: string;
  titleAr: string;
  titleDe: string;
  titleEn: string;
  order: number;
}
interface Word {
  id: string;
  listId: string;
  wordDe: string;
  wordAr: string;
  wordEn: string;
  exampleDe?: string;
  exampleAr?: string;
  exampleEn?: string;
  audioUrl?: string | null;
  imageUrl?: string | null;
  order: number;
  published: boolean;
  lessonId?: string | null;
}

export default function Flashcards({ token, locale }: { token: string; locale: string }) {
  const [lists, setLists] = useState<WordList[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeList, setActiveList] = useState<string | null>(null);
  const [words, setWords] = useState<Word[]>([]);
  const [wordsLoading, setWordsLoading] = useState(false);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft'>('all');
  const [previewCard, setPreviewCard] = useState<Word | null>(null);

  const [listModal, setListModal] = useState(false);
  const [editingList, setEditingList] = useState<WordList | null>(null);
  const [listForm, setListForm] = useState({ level: 'A1', titleAr: '', titleDe: '', titleEn: '', order: 0 });

  const [wordModal, setWordModal] = useState(false);
  const [editingWord, setEditingWord] = useState<Word | null>(null);
  const [wordForm, setWordForm] = useState<any>({});

  const [confirm, setConfirm] = useState<{ type: 'list' | 'word'; id: string } | null>(null);
  const [saving, setSaving] = useState(false);

  const filteredWords = useMemo(() => {
    return words.filter((w) => {
      if (statusFilter === 'published' && !w.published) return false;
      if (statusFilter === 'draft' && w.published) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        (w.wordDe && w.wordDe.toLowerCase().includes(q)) ||
        (w.wordAr && w.wordAr.toLowerCase().includes(q)) ||
        (w.wordEn && w.wordEn.toLowerCase().includes(q))
      );
    });
  }, [words, statusFilter, searchQuery]);

  const loadLists = useCallback(async () => {
    setLoading(true);
    try {
      const r = await adminFetch<{ lists: WordList[] }>('/api/admin/flashcards/lists', token);
      setLists(r.lists || []);
      if (!activeList && (r.lists || []).length) setActiveList(r.lists[0].id);
    } catch {
      setLists([]);
    } finally {
      setLoading(false);
    }
  }, [token, activeList]);

  const loadWords = useCallback(async (listId: string) => {
    setWordsLoading(true);
    try {
      const r = await adminFetch<{ words: Word[] }>(`/api/admin/flashcards/words?listId=${listId}`, token);
      setWords(r.words || []);
    } catch {
      setWords([]);
    } finally {
      setWordsLoading(false);
    }
  }, [token]);

  useEffect(() => { void loadLists(); }, [loadLists]);
  useEffect(() => { if (activeList) void loadWords(activeList); }, [activeList, loadWords]);

  const openListModal = (list?: WordList) => {
    setEditingList(list || null);
    setListForm(list
      ? { level: list.level, titleAr: list.titleAr, titleDe: list.titleDe, titleEn: list.titleEn, order: list.order }
      : { level: 'A1', titleAr: '', titleDe: '', titleEn: '', order: lists.length });
    setListModal(true);
  };

  const saveList = async () => {
    if (!listForm.titleAr) return toast.error('العنوان العربي مطلوب');
    setSaving(true);
    try {
      if (editingList) {
        await adminFetch(`/api/admin/flashcards/lists/${editingList.id}`, token, { method: 'PUT', body: JSON.stringify(listForm) });
      } else {
        await adminFetch('/api/admin/flashcards/lists', token, { method: 'POST', body: JSON.stringify(listForm) });
      }
      toast.success('تم الحفظ');
      setListModal(false);
      await loadLists();
    } catch (e: any) {
      toast.error(e.message || 'فشل الحفظ');
    } finally {
      setSaving(false);
    }
  };

  const openWordModal = (word?: Word) => {
    setEditingWord(word || null);
    setWordForm(word
      ? {
          id: word.id,
          listId: word.listId || activeList,
          wordDe: word.wordDe || '',
          wordAr: word.wordAr || '',
          wordEn: word.wordEn || '',
          exampleDe: word.exampleDe || '',
          exampleAr: word.exampleAr || (word as any).example_ar || '',
          exampleEn: word.exampleEn || (word as any).example_en || '',
          audioUrl: word.audioUrl ?? (word as any).audio_url ?? null,
          imageUrl: word.imageUrl ?? (word as any).image_url ?? null,
          order: word.order ?? words.length,
          published: word.published !== false,
        }
      : {
          listId: activeList,
          wordDe: '',
          wordAr: '',
          wordEn: '',
          exampleDe: '',
          exampleAr: '',
          exampleEn: '',
          audioUrl: null,
          imageUrl: null,
          order: words.length,
          published: true,
        });
    setWordModal(true);
  };

  const saveWord = async () => {
    if (!wordForm.wordDe?.trim()) return toast.error('الكلمة الألمانية مطلوبة');
    setSaving(true);
    try {
      if (editingWord) {
        const res = await adminFetch<{ word: Word }>(`/api/admin/flashcards/words/${editingWord.id}`, token, {
          method: 'PUT',
          body: JSON.stringify(wordForm),
        });
        toast.success('تم تحديث بيانات البطاقة بنجاح');
        setWordModal(false);
        if (res.word) {
          setWords((prev) => prev.map((w) => (w.id === editingWord.id ? { ...w, ...res.word } : w)));
        }
      } else {
        const res = await adminFetch<{ word: Word }>('/api/admin/flashcards/words', token, {
          method: 'POST',
          body: JSON.stringify(wordForm),
        });
        toast.success('تمت إضافة البطاقة بنجاح');
        setWordModal(false);
        if (res.word) {
          setWords((prev) => [...prev, res.word]);
        }
      }
      if (activeList) await loadWords(activeList);
    } catch (e: any) {
      toast.error(e.message || 'فشل حفظ البطاقة');
    } finally {
      setSaving(false);
    }
  };

  const [translating, setTranslating] = useState(false);

  const autoTranslate = async () => {
    const text = wordForm.wordDe?.trim();
    if (!text) return toast.error('أدخل الكلمة الألمانية أولاً');
    setTranslating(true);
    try {
      const [arRes, enRes] = await Promise.all([
        fetch('/api/translate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text, from: 'de', to: 'ar' }) }).then(r => r.json()),
        fetch('/api/translate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text, from: 'de', to: 'en' }) }).then(r => r.json()),
      ]);
      setWordForm((w: any) => ({
        ...w,
        wordAr: arRes.translation || w.wordAr,
        wordEn: enRes.translation || w.wordEn,
      }));
      toast.success('تمت الترجمة التلقائية');
    } catch {
      toast.error('فشلت الترجمة');
    } finally {
      setTranslating(false);
    }
  };

  const previewTTS = () => {
    const text = wordForm.wordDe?.trim();
    if (!text) return;
    // Try server TTS first, fall back to browser SpeechSynthesis
    const audio = new Audio(`/api/tts?text=${encodeURIComponent(text)}&lang=de-DE`);
    audio.onerror = () => {
      // Fallback to browser SpeechSynthesis
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

  const moveWord = async (idx: number, dir: -1 | 1) => {
    const target = words[idx + dir];
    if (!target) return;
    const a = words[idx];
    const oa = a.order, ob = target.order;
    setWords((ws) => ws
      .map((w) => (w.id === a.id ? { ...w, order: ob } : w.id === target.id ? { ...w, order: oa } : w))
      .sort((x, y) => x.order - y.order));
    try {
      await adminFetch(`/api/admin/flashcards/words/${a.id}`, token, { method: 'PUT', body: JSON.stringify({ order: ob }) });
      await adminFetch(`/api/admin/flashcards/words/${target.id}`, token, { method: 'PUT', body: JSON.stringify({ order: oa }) });
    } catch { toast.error('فشل إعادة الترتيب'); }
  };

  const doDelete = async () => {
    if (!confirm) return;
    setSaving(true);
    try {
      if (confirm.type === 'list') {
        await adminFetch(`/api/admin/flashcards/lists/${confirm.id}`, token, { method: 'DELETE' });
        if (activeList === confirm.id) setActiveList(null);
        await loadLists();
      } else {
        await adminFetch(`/api/admin/flashcards/words/${confirm.id}`, token, { method: 'DELETE' });
        if (activeList) await loadWords(activeList);
      }
      toast.success('تم الحذف');
    } catch { toast.error('فشل الحذف'); }
    finally { setConfirm(null); setSaving(false); }
  };

  return (
    <div className="grid lg:grid-cols-[280px_1fr] gap-6">
      {/* Lists sidebar */}
      <div className="card-bold border-2 p-3 h-fit lg:sticky lg:top-4 space-y-2">
        <div className="flex items-center justify-between px-1 pb-1">
          <p className="text-sm font-black text-foreground">قوائم الكلمات</p>
          <button onClick={() => openListModal()} className="w-7 h-7 rounded-lg bg-gradient-to-r from-brand-orange to-brand-red text-white flex items-center justify-center"><Plus className="w-4 h-4" /></button>
        </div>
        {loading ? (
          <div className="space-y-2">{[...Array(3)].map((_, i) => <div key={i} className="h-12 skeleton-bold rounded-xl" />)}</div>
        ) : lists.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-6">لا توجد قوائم</p>
        ) : (
          lists.map((l) => (
            <button key={l.id} onClick={() => setActiveList(l.id)}
              className={`w-full text-start p-3 rounded-xl border-2 transition-all ${activeList === l.id ? 'border-brand-orange bg-brand-orange/5' : 'border-transparent hover:border-border'}`}>
              <div className="flex items-center gap-2 mb-1"><LevelBadge level={l.level} /><span className="text-[10px] text-muted-foreground">{l.order}</span></div>
              <p className="font-bold text-sm text-foreground truncate">{l.titleAr}</p>
            </button>
          ))
        )}
      </div>

      {/* Words panel */}
      <div>
        <SectionHeader
          title={activeList ? (lists.find((l) => l.id === activeList)?.titleAr || 'الكلمات') : 'بطاقات الحفظ'}
          subtitle="أضف الكلمات وسيّر الترتيب والنشر وتسجيل الصوت الحقيقي للأستاذ"
          action={<PrimaryButton icon={Plus} onClick={() => openWordModal()}>+ إضافة بطاقة جديدة</PrimaryButton>}
        />

        {/* Filter & Search Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-4">
          <div className="relative flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث عن بطاقة بالألمانية أو العربية..."
              className={inputClass}
            />
          </div>
          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className={inputClass}
            >
              <option value="all">جميع الحالات</option>
              <option value="published">المنشورة فقط</option>
              <option value="draft">المسودات</option>
            </select>
          </div>
        </div>

        {wordsLoading ? (
          <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-[72px] skeleton-bold rounded-xl" />)}</div>
        ) : filteredWords.length === 0 ? (
          <EmptyState icon={Layers} text={searchQuery ? 'لا توجد بطاقات مطابقة لبحثك' : 'لا توجد بطاقات في هذه القائمة بعد'} />
        ) : (
          <div className="space-y-3">
            {filteredWords.map((w, idx) => (
              <div key={w.id} className="card-bold border-2 p-4 flex items-center gap-4 hover:border-brand-orange/30 transition-all">
                {w.imageUrl && (
                  <div className="w-12 h-12 rounded-xl overflow-hidden bg-secondary shrink-0 border border-border">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={resolveAdminMediaUrl(w.imageUrl)} alt="" className="w-full h-full object-cover" onError={(e) => ((e.target as HTMLImageElement).style.visibility = 'hidden')} />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-display font-bold text-foreground">{w.wordDe}</p>
                    <span className="text-xs text-muted-foreground">→ {w.wordAr}</span>
                    {w.audioUrl && (
                      <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950 text-emerald-600 font-bold border border-emerald-200 dark:border-emerald-800">
                        <Volume2 className="w-3 h-3" /> صوت الأستاذ
                      </span>
                    )}
                    {!w.published && <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950 text-amber-600 font-bold">مسودة</span>}
                  </div>
                  {w.exampleDe && <p className="text-xs text-muted-foreground mt-0.5 truncate">„{w.exampleDe}“</p>}
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => moveWord(idx, -1)} disabled={idx === 0} title="تحريك لأعلى" className="w-8 h-8 rounded-lg hover:bg-secondary flex items-center justify-center text-muted-foreground disabled:opacity-30"><ArrowUp className="w-4 h-4" /></button>
                  <button onClick={() => moveWord(idx, 1)} disabled={idx === filteredWords.length - 1} title="تحريك لأسفل" className="w-8 h-8 rounded-lg hover:bg-secondary flex items-center justify-center text-muted-foreground disabled:opacity-30"><ArrowDown className="w-4 h-4" /></button>
                  <button onClick={() => setPreviewCard(w)} title="معاينة البطاقة" className="w-8 h-8 rounded-lg hover:bg-secondary flex items-center justify-center text-muted-foreground hover:text-brand-orange"><Eye className="w-4 h-4" /></button>
                  <button onClick={() => openWordModal(w)} title="تعديل البطاقة" className="w-8 h-8 rounded-lg hover:bg-secondary flex items-center justify-center text-muted-foreground hover:text-brand-orange"><Pencil className="w-4 h-4" /></button>
                  <button onClick={() => setConfirm({ type: 'word', id: w.id })} title="حذف البطاقة" className="w-8 h-8 rounded-lg hover:bg-red-50 dark:hover:bg-red-950 flex items-center justify-center text-red-500"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* List modal */}
      <Modal open={listModal} onClose={() => setListModal(false)} title={editingList ? 'تعديل القائمة' : 'قائمة جديدة'}>
        <div className="space-y-4">
          <FormRow label="المستوى">
            <select value={listForm.level} onChange={(e) => setListForm({ ...listForm, level: e.target.value })} className={inputClass}>
              {LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
            </select>
          </FormRow>
          <LangInput label="عنوان القائمة" form={listForm} field="title" onChange={(next) => setListForm(next as any)} required />
          <div className="flex gap-3 justify-end pt-2">
            <GhostButton onClick={() => setListModal(false)}>إلغاء</GhostButton>
            <PrimaryButton onClick={saveList} disabled={saving}>{saving ? 'جارٍ الحفظ...' : 'حفظ'}</PrimaryButton>
          </div>
        </div>
      </Modal>

      {/* Word modal */}
      <Modal open={wordModal} onClose={() => setWordModal(false)} title={editingWord ? 'تعديل بيانات البطاقة' : 'إضافة بطاقة جديدة'} size="xl">
        <div className="space-y-4">
          {/* German word with TTS preview */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-sm font-bold text-foreground">الكلمة والمعنى (3 لغات)</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={previewTTS}
                  className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900 transition-colors cursor-pointer"
                  title="استمع إلى نطق الكلمة الألمانية عبر النظام"
                >
                  <Volume2 className="w-3 h-3" />
                  <span>استمع</span>
                </button>
                <button
                  type="button"
                  onClick={autoTranslate}
                  disabled={translating}
                  className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg bg-green-50 dark:bg-green-950 text-green-600 hover:bg-green-100 dark:hover:bg-green-900 transition-colors disabled:opacity-50 cursor-pointer"
                  title="ترجمة تلقائية من الألمانية"
                >
                  {translating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Languages className="w-3 h-3" />}
                  <span>ترجمة تلقائية</span>
                </button>
              </div>
            </div>
            <LangInput label="" form={wordForm} field="word" onChange={setWordForm} required />
          </div>
          <LangInput label="مثال الاستخدام في جملة (اختياري)" form={wordForm} field="example" onChange={setWordForm} textarea />

          <FormRow label="التسجيل الصوتي لنطق الأستاذ عمر (رفع ملف أو تسجيل مباشر بالمايكروفون)">
            <AudioUploader
              value={wordForm.audioUrl}
              token={token}
              onChange={(url) => setWordForm((w: any) => ({ ...w, audioUrl: url }))}
              placeholder="انقر لاختيار نطق الكلمة من الكمبيوتر أو سجل بصوتك مباشرة"
            />
          </FormRow>

          <FormRow label="صورة توضيحية للبطاقة (اختياري)">
            <ImageUploader
              value={wordForm.imageUrl}
              token={token}
              onChange={(url) => setWordForm((w: any) => ({ ...w, imageUrl: url }))}
              placeholder="انقر لرفع صورة معبرة عن الكلمة"
              aspectRatio="16/9"
            />
          </FormRow>

          <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary/40 border border-border">
            <input type="checkbox" checked={!!wordForm.published} onChange={(e) => setWordForm((w: any) => ({ ...w, published: e.target.checked }))} className="w-4 h-4 accent-[#E85D26]" id="pub-check" />
            <label htmlFor="pub-check" className="text-sm font-bold text-foreground cursor-pointer">
              بطاقة منشورة (مرئية للطلاب)
            </label>
          </div>

          <div className="flex gap-3 justify-end pt-2 border-t border-border">
            <GhostButton onClick={() => setWordModal(false)}>إلغاء</GhostButton>
            <PrimaryButton onClick={saveWord} disabled={saving}>
              {saving ? 'جارٍ الحفظ...' : 'حفظ التغييرات'}
            </PrimaryButton>
          </div>
        </div>
      </Modal>

      {/* Card Preview Modal */}
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

      {/* Confirm Dialog */}
      <ConfirmDialog
        open={!!confirm}
        title="تأكيد الحذف"
        message={confirm?.type === 'word' ? 'هل أنت متأكد من حذف هذه البطاقة نهائياً؟ سيتم حذفها من قاعدة البيانات.' : 'هل أنت متأكد من حذف هذه القائمة؟ سيتم حذف جميع الكلمات التابعة لها.'}
        confirmText="حذف"
        cancelText="إلغاء"
        onConfirm={doDelete}
        onCancel={() => setConfirm(null)}
        loading={saving}
      />
    </div>
  );
}
