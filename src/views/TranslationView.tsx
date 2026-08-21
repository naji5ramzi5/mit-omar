'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Languages, ArrowRightLeft, Copy, Check, Loader2, Volume2, Eraser, ChevronDown } from 'lucide-react';
import { useAppStore } from '@/stores/app-store';
import { t } from '@/lib/i18n';

type Lang = 'ar' | 'de' | 'en';

const LANGUAGES: { code: Lang; name: string; native: string; flag: string }[] = [
  { code: 'ar', name: 'Arabic', native: 'العربية', flag: '🇸🇦' },
  { code: 'de', name: 'German', native: 'Deutsch', flag: '🇩🇪' },
  { code: 'en', name: 'English', native: 'English', flag: '🇬🇧' },
];

export default function TranslationView() {
  const { locale } = useAppStore();
  const [sourceLang, setSourceLang] = useState<Lang>('ar');
  const [targetLang, setTargetLang] = useState<Lang>('de');
  const [inputText, setInputText] = useState('');
  const [outputText, setOutputText] = useState('');
  const [translating, setTranslating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showSourceLang, setShowSourceLang] = useState(false);
  const [showTargetLang, setShowTargetLang] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleTranslate = async () => {
    if (!inputText.trim()) return;
    setTranslating(true);
    setOutputText('');
    try {
      const res = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: inputText, from: sourceLang, to: targetLang }),
      });
      const data = await res.json();
      if (data.translation) {
        setOutputText(data.translation);
      }
    } catch {
      setOutputText('Translation failed. Please try again.');
    } finally {
      setTranslating(false);
    }
  };

  const handleSwap = () => {
    setSourceLang(targetLang);
    setTargetLang(sourceLang);
    setInputText(outputText);
    setOutputText(inputText);
  };

  const handleCopy = async () => {
    if (!outputText) return;
    await navigator.clipboard.writeText(outputText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClear = () => {
    setInputText('');
    setOutputText('');
    textareaRef.current?.focus();
  };

  const getLangName = (code: Lang) => LANGUAGES.find(l => l.code === code);

  const charCount = inputText.length;
  const wordCount = inputText.trim() ? inputText.trim().split(/\s+/).length : 0;

  return (
    <div className="pt-8 pb-20 min-h-screen bg-brand-warm dark:bg-accent">
      <div className="container-bold max-w-5xl">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
          <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-brand-orange to-brand-red flex items-center justify-center">
            <Languages className="w-8 h-8 text-white" />
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-black text-foreground mb-2">{t(locale, 'translation_title')}</h1>
          <p className="text-muted-foreground text-lg">{t(locale, 'translation_subtitle')}</p>
        </motion.div>

        {/* Language Selector */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="flex items-center justify-center gap-4 mb-8">
          {/* Source Language */}
          <div className="relative">
            <button
              onClick={() => { setShowSourceLang(!showSourceLang); setShowTargetLang(false); }}
              className="flex items-center gap-3 px-5 py-3 card-bold hover:border-brand-orange/30 transition-all min-w-[160px]"
            >
              <span className="text-2xl">{getLangName(sourceLang)?.flag}</span>
              <div className="text-start">
                <p className="text-sm font-bold text-foreground">{getLangName(sourceLang)?.native}</p>
                <p className="text-[10px] text-muted-foreground uppercase">{getLangName(sourceLang)?.name}</p>
              </div>
              <ChevronDown className="w-4 h-4 text-muted-foreground ms-auto" />
            </button>
            <AnimatePresence>
              {showSourceLang && (
                <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                  className="absolute top-full mt-2 start-0 w-full bg-card border rounded-xl shadow-xl z-20 overflow-hidden">
                  {LANGUAGES.filter(l => l.code !== targetLang).map(lang => (
                    <button key={lang.code} onClick={() => { setSourceLang(lang.code); setShowSourceLang(false); }}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-brand-orange/5 transition-all text-start">
                      <span className="text-xl">{lang.flag}</span>
                      <span className="text-sm font-semibold text-foreground">{lang.native}</span>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Swap Button */}
          <button onClick={handleSwap}
            className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-orange to-brand-red flex items-center justify-center text-white hover:scale-110 transition-all duration-300">
            <ArrowRightLeft className="w-5 h-5" />
          </button>

          {/* Target Language */}
          <div className="relative">
            <button
              onClick={() => { setShowTargetLang(!showTargetLang); setShowSourceLang(false); }}
              className="flex items-center gap-3 px-5 py-3 card-bold hover:border-brand-orange/30 transition-all min-w-[160px]"
            >
              <span className="text-2xl">{getLangName(targetLang)?.flag}</span>
              <div className="text-start">
                <p className="text-sm font-bold text-foreground">{getLangName(targetLang)?.native}</p>
                <p className="text-[10px] text-muted-foreground uppercase">{getLangName(targetLang)?.name}</p>
              </div>
              <ChevronDown className="w-4 h-4 text-muted-foreground ms-auto" />
            </button>
            <AnimatePresence>
              {showTargetLang && (
                <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                  className="absolute top-full mt-2 start-0 w-full bg-card border rounded-xl shadow-xl z-20 overflow-hidden">
                  {LANGUAGES.filter(l => l.code !== sourceLang).map(lang => (
                    <button key={lang.code} onClick={() => { setTargetLang(lang.code); setShowTargetLang(false); }}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-brand-orange/5 transition-all text-start">
                      <span className="text-xl">{lang.flag}</span>
                      <span className="text-sm font-semibold text-foreground">{lang.native}</span>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Translation Areas */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="grid md:grid-cols-2 gap-4 mb-6">
          {/* Source */}
          <div className="card-bold overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 border-b border-border/50">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{getLangName(sourceLang)?.name}</span>
              <div className="flex items-center gap-1">
                <span className="text-[10px] text-muted-foreground">{charCount} chars · {wordCount} words</span>
                {inputText && (
                  <button onClick={handleClear} className="p-1.5 text-muted-foreground hover:text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-950 transition-all">
                    <Eraser className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
            <textarea
              ref={textareaRef}
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              placeholder={t(locale, 'translation_placeholder')}
              className="w-full h-64 p-5 text-foreground bg-transparent resize-none focus:outline-none text-lg leading-relaxed placeholder:text-muted-foreground/50"
              dir={sourceLang === 'ar' ? 'rtl' : 'ltr'}
            />
          </div>

          {/* Target */}
          <div className="card-bold overflow-hidden relative">
            <div className="flex items-center justify-between px-5 py-3 border-b border-border/50">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{getLangName(targetLang)?.name}</span>
              <div className="flex items-center gap-1">
                {outputText && (
                  <button onClick={handleCopy} className="p-1.5 text-muted-foreground hover:text-brand-orange rounded-lg hover:bg-brand-orange/5 transition-all">
                    {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                )}
              </div>
            </div>
            <div className="h-64 p-5 overflow-y-auto" dir={targetLang === 'ar' ? 'rtl' : 'ltr'}>
              {translating ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <Loader2 className="w-8 h-8 text-brand-orange animate-spin mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">{t(locale, 'translation_translating')}</p>
                  </div>
                </div>
              ) : outputText ? (
                <p className="text-lg leading-relaxed text-foreground whitespace-pre-wrap">{outputText}</p>
              ) : (
                <p className="text-lg text-muted-foreground/50">{t(locale, 'translation_result')}</p>
              )}
            </div>
          </div>
        </motion.div>

        {/* Translate Button */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="text-center">
          <button
            onClick={handleTranslate}
            disabled={!inputText.trim() || translating}
            className="inline-flex items-center gap-3 px-10 py-4 text-sm font-bold tracking-wide uppercase bg-gradient-to-r from-brand-orange to-brand-red text-white rounded-2xl hover:from-brand-orange-dark hover:to-brand-red-dark active:scale-[0.97] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {translating ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Languages className="w-5 h-5" />
            )}
            {t(locale, 'translation_button')}
          </button>
        </motion.div>

        {/* Quick Phrases */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="mt-12">
          <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider text-center mb-5">{t(locale, 'translation_quick')}</h3>
          <div className="flex flex-wrap justify-center gap-2">
            {[
              'مرحباً', 'كيف حالك؟', 'شكراً جزيلاً', 'عذراً', 'أنا أتعلم الألمانية',
              'Guten Morgen', 'Wie geht es Ihnen?', 'Danke schön', 'Entschuldigung',
              'Hello', 'How are you?', 'Thank you very much', 'Sorry', 'I am learning German',
            ].map((phrase, i) => (
              <button
                key={i}
                onClick={() => setInputText(phrase)}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-secondary hover:bg-brand-orange/10 hover:text-brand-orange text-muted-foreground transition-all duration-300"
              >
                {phrase}
              </button>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Click outside to close dropdowns */}
      {(showSourceLang || showTargetLang) && (
        <div className="fixed inset-0 z-10" onClick={() => { setShowSourceLang(false); setShowTargetLang(false); }} />
      )}
    </div>
  );
}
