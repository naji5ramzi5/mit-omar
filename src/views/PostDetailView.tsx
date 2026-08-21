'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, ArrowLeft, Calendar, Tag } from 'lucide-react';
import { useAppStore } from '@/stores/app-store';
import { t } from '@/lib/i18n';
import { format } from 'date-fns';
import { ar, de, enUS } from 'date-fns/locale';

export default function PostDetailView() {
  const { locale, navigate, viewParams } = useAppStore();
  const [post, setPost] = useState<Record<string, string | null | undefined> | null>(null);
  const [loading, setLoading] = useState(true);
  const postId = viewParams.id;
  const isRtl = locale === 'ar';
  const BackArrow = isRtl ? ArrowRight : ArrowLeft;
  const dateLocale = locale === 'ar' ? ar : locale === 'de' ? de : enUS;

  useEffect(() => {
    if (!postId) return;
    fetch(`/api/posts/${postId}`)
      .then(r => r.json())
      .then(data => setPost(data.post || null))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [postId]);

  const getField = (field: string) => {
    if (!post) return '';
    const localeKey = locale.charAt(0).toUpperCase() + locale.slice(1);
    return post[`${field}${localeKey}`] as string || '';
  };

  if (loading) {
    return (
      <div className="pt-8 pb-20 container-bold">
        <div className="animate-pulse space-y-4">
          <div className="h-6 w-40 skeleton-bold rounded-lg" />
          <div className="h-72 skeleton-bold rounded-3xl" />
          <div className="h-8 w-3/4 skeleton-bold rounded-lg" />
          <div className="space-y-3"><div className="h-4 w-full skeleton-bold rounded-lg" /><div className="h-4 w-full skeleton-bold rounded-lg" /></div>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="pt-20 pb-20 container-bold text-center text-muted-foreground">
        <p>{t(locale, 'posts_no_posts')}</p>
      </div>
    );
  }

  return (
    <div className="pt-8 pb-20">
      <div className="container-bold max-w-4xl">
        <button
          onClick={() => navigate('posts')}
          className="flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-brand-orange transition-colors mb-8 group"
        >
          <BackArrow className="w-4 h-4 group-hover:translate-x-[-4px] transition-transform" />
          {t(locale, 'posts_back')}
        </button>

        {post.imageUrl && (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-3xl overflow-hidden mb-8"
          >
            <img src={post.imageUrl as string} alt="" className="w-full h-64 sm:h-80 object-cover" />
          </motion.div>
        )}

        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
              <Calendar className="w-3.5 h-3.5" />
              <span>{format(new Date(post.createdAt as string), 'd MMMM yyyy', { locale: dateLocale })}</span>
            </div>
            {post.category && (
              <span className="inline-flex items-center gap-1 px-3 py-1 text-xs font-bold bg-brand-orange/10 text-brand-orange rounded-xl">
                <Tag className="w-3 h-3" /> {post.category}
              </span>
            )}
          </div>

          <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl font-black text-foreground mb-6">
            {getField('title')}
          </h1>

          <div className="prose prose-sm max-w-none text-muted-foreground leading-relaxed whitespace-pre-wrap">
            {getField('content')}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
