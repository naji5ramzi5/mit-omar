/**
 * Helper to resolve media URLs from Cloudflare R2, local assets, or external providers.
 */
export function resolveMediaUrl(url?: string | null): string {
  if (!url) return '';
  if (
    url.startsWith('http://') ||
    url.startsWith('https://') ||
    url.startsWith('/') ||
    url.startsWith('blob:') ||
    url.startsWith('data:')
  ) {
    return url;
  }
  const key = url.replace(/^r2:\/*/, '');
  
  // If it's a video file or stored in videos directory, stream via our streaming API route
  if (key.match(/\.(mp4|webm|mov|mkv|m4v|ogg)$/i) || key.startsWith('videos/')) {
    return `/api/videos/stream?key=${encodeURIComponent(key)}`;
  }

  const publicBase = (
    process.env.NEXT_PUBLIC_R2_PUBLIC_URL ||
    'https://pub-607a1dc482665aa8e967d6e58f506e12.r2.dev'
  ).replace(/\/+$/, '');
  return `${publicBase}/${key}`;
}
