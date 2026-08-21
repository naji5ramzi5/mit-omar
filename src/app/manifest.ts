import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'ديوتش مع عمر | Deutsch mit Omar',
    short_name: 'Deutsch mit Omar',
    description: 'تعلم اللغة الألمانية مع الأستاذ عمر — دروس فيديو، بطاقات حفظ، اختبارات وشهادات',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#E85D26',
    lang: 'ar',
    dir: 'rtl',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}