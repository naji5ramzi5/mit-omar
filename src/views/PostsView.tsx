'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, ChevronRight, ArrowRight, Tag } from 'lucide-react';
import { useAppStore } from '@/stores/app-store';
import { t } from '@/lib/i18n';
import { format } from 'date-fns';
import { ar, de, enUS } from 'date-fns/locale';
import SectionTitle from '@/components/SectionTitle';

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
        <div className="text-center mb-10">
          <SectionTitle badge={t(locale, 'posts_title')} title={t(locale, 'posts_title')} subtitle={t(locale, 'posts_subtitle')} />
        </div>

        <div className="flex flex-wrap justify-center gap-2 mb-8">
          <button
            onClick={() => setActiveCategory('all')}
            className={`px-5 py-2 text-xs font-bold rounded-lg transition-all duration-200 ${
              activeCategory === 'all'
                ? 'bg-gradient-to-r from-brand-orange to-brand-red text-white'
                : 'bg-white border border-border text-muted-foreground hover:text-foreground hover:border-brand-orange/20'
            }`}
          >
            {t(locale, 'posts_all')}
          </button>
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-5 py-2 text-xs font-bold rounded-lg transition-all duration-200 ${
                activeCategory === cat
                  ? 'bg-gradient-to-r from-brand-orange to-brand-red text-white'
                  : 'bg-white border border-border text-muted-foreground hover:text-foreground hover:border-brand-orange/20'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="card-bold overflow-hidden">
                <div className="h-44 skeleton-bold" />
                <div className="p-5 space-y-3">
                  <div className="h-3 w-16 skeleton-bold rounded-lg" />
                  <div className="h-5 w-3/4 skeleton-bold rounded-lg" />
                  <div className="h-3 w-full skeleton-bold rounded-lg" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <p className="text-sm">{t(locale, 'posts_no_posts')}</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((post, i) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
                className="card-bold overflow-hidden group cursor-pointer"
                onClick={() => navigate('post-detail', { id: post.id })}
              >
                <div className="relative h-44 overflow-hidden">
                  <img
                    src={post.imageUrl || '/images/berlin/brandenburg-gate.png'}
                    alt=""
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                  {post.category && (
                    <div className="absolute top-2.5 start-2.5">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[9px] font-bold bg-white/90 text-foreground rounded-md">
                        <Tag className="w-2.5 h-2.5" /> {post.category}
                      </span>
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <div className="flex items-center gap-1 text-[10px] text-muted-foreground mb-1.5 font-medium">
                    <Calendar className="w-3 h-3" />
                    <span>{format(new Date(post.createdAt), 'd MMM yyyy', { locale: dateLocale })}</span>
                  </div>
                  <h3 className="font-bold text-foreground mb-1 line-clamp-2 text-sm">
                    {getField(post as unknown as Record<string, unknown>, 'title')}
                  </h3>
                  <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                    {getField(post as unknown as Record<string, unknown>, 'excerpt')}
                  </p>
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-brand-orange group-hover:gap-1.5 transition-all">
                    {t(locale, 'posts_read_more')}
                    <Arrow className="w-3 h-3" />
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
