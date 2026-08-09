'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, ChevronRight, ArrowRight, Tag } from 'lucide-react';
import { useAppStore } from '@/stores/app-store';
import { t } from '@/lib/i18n';
import { format } from 'date-fns';
import { ar, de, enUS } from 'date-fns/locale';

const CATEGORIES = ['education', 'exams', 'lifestyle', 'grammar'];

interface Post {
  id: string;
  titleAr: string; titleDe: string; titleEn: string;
  excerptAr?: string; excerptDe?: string; excerptEn?: string;
  category?: string;
  imageUrl?: string;
  createdAt: string;
}

export default function PostsView() {
  const { locale, navigate } = useAppStore();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('all');
  const isRtl = locale === 'ar';
  const Arrow = isRtl ? ArrowRight : ChevronRight;

  const dateLocale = locale === 'ar' ? ar : locale === 'de' ? de : enUS;

  useEffect(() => {
    fetch('/api/posts')
      .then(r => r.json())
      .then(data => setPosts(data.posts || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const getField = (obj: Record<string, unknown>, field: string) => {
    const localeKey = locale.charAt(0).toUpperCase() + locale.slice(1);
    return (obj[`${field}${localeKey}`] as string) || '';
  };

  const filtered = activeCategory === 'all' ? posts : posts.filter(p => p.category === activeCategory);

  return (
    <div className="pt-8 pb-20">
      <div className="container-bold">
        <div className="text-center mb-12">
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl sm:text-4xl font-black text-foreground mb-3"
          >
            {t(locale, 'posts_title')}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-muted-foreground text-lg"
          >
            {t(locale, 'posts_subtitle')}
          </motion.p>
        </div>

        <div className="flex flex-wrap justify-center gap-2.5 mb-12">
          <button
            onClick={() => setActiveCategory('all')}
            className={`px-6 py-2.5 text-sm font-bold rounded-xl transition-all duration-300 ${
              activeCategory === 'all'
                ? 'bg-gradient-to-r from-brand-orange to-brand-red text-white shadow-glow'
                : 'bg-white border-2 border-border text-muted-foreground hover:text-foreground hover:border-brand-orange/30 hover:shadow-card'
            }`}
          >
            {t(locale, 'posts_all')}
          </button>
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-6 py-2.5 text-sm font-bold rounded-xl transition-all duration-300 ${
                activeCategory === cat
                  ? 'bg-gradient-to-r from-brand-orange to-brand-red text-white shadow-glow'
                  : 'bg-white border-2 border-border text-muted-foreground hover:text-foreground hover:border-brand-orange/30 hover:shadow-card'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="card-bold overflow-hidden">
                <div className="h-52 skeleton-bold" />
                <div className="p-6 space-y-4">
                  <div className="h-4 w-20 skeleton-bold rounded-lg" />
                  <div className="h-6 w-3/4 skeleton-bold rounded-lg" />
                  <div className="h-4 w-full skeleton-bold rounded-lg" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <p>{t(locale, 'posts_no_posts')}</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((post, i) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="card-bold overflow-hidden group cursor-pointer"
                onClick={() => navigate('post-detail', { id: post.id })}
              >
                <div className="relative h-52 overflow-hidden">
                  <img
                    src={post.imageUrl || '/images/berlin/brandenburg-gate.png'}
                    alt=""
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  {post.category && (
                    <div className="absolute top-3 start-3">
                      <span className="inline-flex items-center gap-1 px-3 py-1 text-xs font-bold bg-white/90 text-foreground rounded-xl">
                        <Tag className="w-3 h-3" /> {post.category}
                      </span>
                    </div>
                  )}
                </div>
                <div className="p-6">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2 font-medium">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{format(new Date(post.createdAt), 'd MMM yyyy', { locale: dateLocale })}</span>
                  </div>
                  <h3 className="font-bold text-foreground mb-2 line-clamp-2 text-lg">
                    {getField(post as unknown as Record<string, unknown>, 'title')}
                  </h3>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                    {getField(post as unknown as Record<string, unknown>, 'excerpt')}
                  </p>
                  <span className="inline-flex items-center gap-1 text-sm font-bold text-brand-orange group-hover:gap-2 transition-all">
                    {t(locale, 'posts_read_more')}
                    <Arrow className="w-4 h-4" />
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
