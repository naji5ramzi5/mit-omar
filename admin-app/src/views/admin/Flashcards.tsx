'use client';

import { useState, useEffect, useCallback } from 'react';
import { Layers, Plus, Pencil, Trash2, ArrowUp, ArrowDown, Volume2, Languages, Loader2 } from 'lucide-react';
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
}

export default function Flashcards({ token, locale }: { token: string; locale: string }) {
  const [lists, setLists] = useState<WordList[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeList, setActiveList] = useState<string | null>(null);
  const [words, setWords] = useState<Word[]>([]);
  const [wordsLoading, setWordsLoading] = useState(false);

  const [listModal, setListModal] = useState(false);
  const [editingList, setEditingList] = useState<WordList | null>(null);
  const [listForm, setListForm] = useState({ level: 'A1', titleAr: '', titleDe: '', titleEn: '', order: 0 });

  const [wordModal, setWordModal] = useState(false);
  const [editingWord, setEditingWord] = useState<Word | null>(null);
  const [wordForm, setWordForm] = useState<any>({});

  const [confirm, setConfirm] = useState<{ type: 'list' | 'word'; id: string } | null>(null);
  const [saving, setSaving] = useState(false);

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
      ? { ...word }
      : { listId: activeList, wordDe: '', wordAr: '', wordEn: '', exampleDe: '', exampleAr: '', exampleEn: '', audioUrl: null, imageUrl: null, order: words.length, published: true });
    setWordModal(true);
  };

  const saveWord = async () => {
    if (!wordForm.wordDe) return toast.error('الكلمة الألمانية مطلوبة');
    setSaving(true);
    try {
      if (editingWord) {
        await adminFetch(`/api/admin/flashcards/words/${editingWord.id}`, token, { method: 'PUT', body: JSON.stringify(wordForm) });
      } else {
        await adminFetch('/api/admin/flashcards/words', token, { method: 'POST', body: JSON.stringify(wordForm) });
      }
      toast.success('تم الحفظ');
      setWordModal(false);
      if (activeList) await loadWords(activeList);
    } catch (e: any) {
      toast.error(e.message || 'فشل الحفظ');
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
          subtitle="أضف الكلمات وسيّر الترتيب والنشر وتسجيل الصوت"
          action={<PrimaryButton icon={Plus} onClick={() => openWordModal()}>كلمة جديدة</PrimaryButton>}
        />

        {wordsLoading ? (
          <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-[72px] skeleton-bold rounded-xl" />)}</div>
        ) : words.length === 0 ? (
          <EmptyState icon={Layers} text="لا توجد كلمات في هذه القائمة بعد" />
        ) : (
          <div className="space-y-3">
            {words.map((w, idx) => (
              <div key={w.id} className="card-bold border-2 p-4 flex items-center gap-4">
                {w.imageUrl && (
                  <div className="w-12 h-12 rounded-xl overflow-hidden bg-secondary shrink-0 border border-border">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={resolveAdminMediaUrl(w.imageUrl)} alt="" className="w-full h-full object-cover" onError={(e) => ((e.target as HTMLImageElement).style.visibility = 'hidden')} />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-display font-bold text-foreground">{w.wordDe}</p>
                    <span className="text-xs text-muted-foreground">→ {w.wordAr}</span>
                    {w.audioUrl && <Volume2 className="w-3.5 h-3.5 text-brand-orange" />}
                    {!w.published && <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950 text-amber-600 font-bold">مسودة</span>}
                  </div>
                  {w.exampleDe && <p className="text-xs text-muted-foreground mt-0.5 truncate">„{w.exampleDe}“</p>}
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => moveWord(idx, -1)} disabled={idx === 0} className="w-8 h-8 rounded-lg hover:bg-secondary flex items-center justify-center text-muted-foreground disabled:opacity-30"><ArrowUp className="w-4 h-4" /></button>
                  <button onClick={() => moveWord(idx, 1)} disabled={idx === words.length - 1} className="w-8 h-8 rounded-lg hover:bg-secondary flex items-center justify-center text-muted-foreground disabled:opacity-30"><ArrowDown className="w-4 h-4" /></button>
                  <button onClick={() => openWordModal(w)} className="w-8 h-8 rounded-lg hover:bg-secondary flex items-center justify-center text-muted-foreground"><Pencil className="w-4 h-4" /></button>
                  <button onClick={() => setConfirm({ type: 'word', id: w.id })} className="w-8 h-8 rounded-lg hover:bg-red-50 dark:hover:bg-red-950 flex items-center justify-center text-red-500"><Trash2 className="w-4 h-4" /></button>
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
            <PrimaryButton onClick={saveList} disabled={saving}>حفظ</PrimaryButton>
          </div>
        </div>
      </Modal>

      {/* Word modal */}
      <Modal open={wordModal} onClose={() => setWordModal(false)} title={editingWord ? 'تعديل الكلمة' : 'كلمة جديدة'} size="xl">
        <div className="space-y-4">
          {/* German word with TTS preview */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-sm font-bold text-foreground">الكلمة الألمانية والمعنى</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={previewTTS}
                  className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900 transition-colors"
                  title="استمع إلى نطق الكلمة الألمانية"
                >
                  <Volume2 className="w-3 h-3" />
                  <span>استمع</span>
                </button>
                <button
                  type="button"
                  onClick={autoTranslate}
                  disabled={translating}
                  className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg bg-green-50 dark:bg-green-950 text-green-600 hover:bg-green-100 dark:hover:bg-green-900 transition-colors disabled:opacity-50"
                  title="ترجمة تلقائية من الألمانية"
                >
                  {translating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Languages className="w-3 h-3" />}
                  <span>ترجمة تلقائية</span>
                </button>
              </div>
            </div>
            <LangInput label="" form={wordForm} field="word" onChange={setWordForm} required />
          </div>
          <LangInput label="مثال (اختياري)" form={wordForm} field="example" onChange={setWordForm} textarea />

          <FormRow label="التسجيل الصوتي — نطق الأستاذ عمر">
            <AudioUploader
              value={wordForm.audioUrl}
              onChange={(url) => setWordForm((w: any) => ({ ...w, audioUrl: url }))}
              placeholder="انقر لرفع نطق الكلمة من الكمبيوتر أو اسحبه هنا"
            />
          </FormRow>

          <FormRow label="صورة توضيحية للبطاقة (اختياري)">
            <ImageUploader
              value={wordForm.imageUrl}
              onChange={(url) => setWordForm((w: any) => ({ ...w, imageUrl: url }))}
              placeholder="انقر لرفع صورة معبرة عن الكلمة"
              aspectRatio="16/9"
            />
          </FormRow>

          <div className="flex items-center gap-3">
            <input type="checkbox" checked={!!wordForm.published} onChange={(e) => setWordForm((w: any) => ({ ...w, published: e.target.checked }))} className="w-4 h-4 accent-[#E85D26]" />
            <span className="text-sm font-bold text-foreground">منشور</span>
          </div>

          <div className="flex gap-3 justify-end pt-2">
            <GhostButton onClick={() => setWordModal(false)}>إلغاء</GhostButton>
            <PrimaryButton onClick={saveWord} disabled={saving}>حفظ</PrimaryButton>
          </div>
        </div>
      </Modal>

      <ConfirmDialog open={!!confirm} message="هل أنت متأكد من الحذف؟" onConfirm={doDelete} onCancel={() => setConfirm(null)} loading={saving} />
    </div>
  );
}
