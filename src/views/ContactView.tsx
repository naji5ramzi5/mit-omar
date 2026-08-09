'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Send, Mail, MapPin, CheckCircle } from 'lucide-react';
import { useAppStore } from '@/stores/app-store';
import { t } from '@/lib/i18n';

export default function ContactView() {
  const { locale } = useAppStore();
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setSent(true);
        setForm({ name: '', email: '', subject: '', message: '' });
      }
    } catch { /* ignore */ }
    setLoading(false);
  };

  if (sent) {
    return (
      <div className="pt-20 pb-20 container-bold text-center relative overflow-hidden">
        <div className="absolute top-1/4 start-1/4 w-64 h-64 bg-brand-orange/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 end-1/4 w-64 h-64 bg-brand-red/5 rounded-full blur-[120px]" />
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="relative z-10">
          <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shadow-lg">
            <CheckCircle className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-black text-foreground mb-2">{t(locale, 'contact_success')}</h2>
          <button onClick={() => setSent(false)} className="btn-bold-secondary mt-6">
            {t(locale, 'contact_title')}
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="pt-8 pb-20 relative overflow-hidden">
      <div className="absolute top-1/4 start-1/4 w-64 h-64 bg-brand-orange/5 rounded-full blur-[120px]" />
      <div className="absolute bottom-1/4 end-1/4 w-64 h-64 bg-brand-red/5 rounded-full blur-[120px]" />
      <div className="container-bold max-w-5xl relative z-10">
        <div className="text-center mb-12">
          <motion.h1 initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="text-3xl sm:text-4xl font-black text-foreground mb-3">
            {t(locale, 'contact_title')}
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-muted-foreground text-lg">
            {t(locale, 'contact_subtitle')}
          </motion.p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8 lg:gap-12">
          <div className="space-y-6">
            <div className="card-bold p-6 border-2 relative overflow-hidden">
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-brand-orange to-brand-red" />
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-orange/10 to-brand-red/10 flex items-center justify-center mb-4 shadow-card">
                <Mail className="w-5 h-5 text-brand-orange" />
              </div>
              <h3 className="font-bold text-foreground mb-1">Email</h3>
              <p className="text-sm text-muted-foreground">info@deutschmitomar.com</p>
            </div>
            <div className="card-bold p-6 border-2 relative overflow-hidden">
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-brand-red to-red-500" />
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-red/10 to-red-500/10 flex items-center justify-center mb-4 shadow-card">
                <MapPin className="w-5 h-5 text-brand-red" />
              </div>
              <h3 className="font-bold text-foreground mb-1">Location</h3>
              <p className="text-sm text-muted-foreground">Berlin, Germany</p>
            </div>
          </div>

          <motion.form onSubmit={handleSubmit} className="lg:col-span-2 card-bold p-8 border-2 relative overflow-hidden" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-brand-orange via-brand-red to-brand-orange" />
            <div className="grid sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-bold text-foreground mb-1.5">{t(locale, 'contact_name')}</label>
                <input type="text" required value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className="input-bold" />
              </div>
              <div>
                <label className="block text-sm font-bold text-foreground mb-1.5">{t(locale, 'contact_email')}</label>
                <input type="email" required value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} className="input-bold" />
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-bold text-foreground mb-1.5">{t(locale, 'contact_subject')}</label>
              <input type="text" required value={form.subject} onChange={e => setForm(p => ({ ...p, subject: e.target.value }))} className="input-bold" />
            </div>
            <div className="mb-6">
              <label className="block text-sm font-bold text-foreground mb-1.5">{t(locale, 'contact_message')}</label>
              <textarea required rows={5} value={form.message} onChange={e => setForm(p => ({ ...p, message: e.target.value }))} className="input-bold resize-none" />
            </div>
            <button type="submit" disabled={loading} className="btn-bold-primary inline-flex items-center gap-2 shadow-glow-lg hover:shadow-brand-orange/50">
              <Send className="w-4 h-4" />
              {t(locale, 'contact_send')}
            </button>
          </motion.form>
        </div>
      </div>
    </div>
  );
}
