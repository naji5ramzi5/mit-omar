'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send } from 'lucide-react';
import { useAppStore } from '@/stores/app-store';
import { t } from '@/lib/i18n';
import { WHATSAPP_URL, TELEGRAM_URL, CONTACT_EMAIL } from '@/lib/site-config';

export default function FloatingContact() {
  const { locale } = useAppStore();
  const [isOpen, setIsOpen] = useState(false);

  const contactOptions = [
    ...(WHATSAPP_URL ? [{ name: 'WhatsApp', icon: '💬', color: 'bg-green-500', url: WHATSAPP_URL }] : []),
    ...(TELEGRAM_URL ? [{ name: 'Telegram', icon: '✈️', color: 'bg-blue-500', url: TELEGRAM_URL }] : []),
    { name: 'Email', icon: '📧', color: 'bg-brand-orange', url: `mailto:${CONTACT_EMAIL}` },
  ];

  return (
    <div className="fixed bottom-6 end-6 z-40">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ duration: 0.3 }}
            className="mb-4 card-bold p-4 min-w-[220px]"
          >
            <p className="text-sm font-bold text-foreground mb-3">{t(locale, 'contact_us')}</p>
            <div className="space-y-2">
              {contactOptions.map((option, i) => (
                <motion.a
                  key={option.name}
                  href={option.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-brand-orange/5 transition-all group"
                >
                  <span className="text-xl">{option.icon}</span>
                  <span className="text-sm font-semibold text-foreground group-hover:text-brand-orange transition-colors">{option.name}</span>
                </motion.a>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg shadow-brand-orange/30 transition-all duration-300 ${
          isOpen
            ? 'bg-gray-500 text-white'
            : 'bg-gradient-to-br from-brand-orange to-brand-red text-white animate-pulse-glow'
        }`}
      >
        {isOpen ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
      </motion.button>
    </div>
  );
}
