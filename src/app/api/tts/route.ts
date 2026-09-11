import { NextResponse } from 'next/server';

/**
 * GET /api/tts?text=...&lang=de-DE
 *
 * Server-side text-to-speech proxy using Google Translate TTS (public, no API key required).
 * Used as a fallback when teacher recordings are not available.
 *
 * Supported languages: de-DE, ar-SA, en-US
 *
 * Security: Only allows specific languages, sanitizes text, limits length.
 */

const ALLOWED_LANGS = new Set(['de-DE', 'de', 'ar', 'ar-SA', 'en', 'en-US']);

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const text = searchParams.get('text')?.trim();
  const lang = searchParams.get('lang') || 'de-DE';

  if (!text) {
    return NextResponse.json({ error: 'text is required' }, { status: 400 });
  }

  if (text.length > 200) {
    return NextResponse.json({ error: 'text too long (max 200 chars)' }, { status: 400 });
  }

  if (!ALLOWED_LANGS.has(lang)) {
    return NextResponse.json({ error: 'unsupported language' }, { status: 400 });
  }

  try {
    // Google Translate TTS endpoint (used for educational/accessibility purposes)
    const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(text)}&tl=${lang}&client=tw-ob`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'https://translate.google.com/',
      },
    });

    if (!response.ok) {
      throw new Error(`TTS service error: ${response.status}`);
    }

    const audioBuffer = await response.arrayBuffer();

    return new Response(audioBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'public, max-age=86400', // Cache TTS audio for 24 hours
        'Content-Length': String(audioBuffer.byteLength),
      },
    });
  } catch (error) {
    console.error('TTS error:', error);
    // Return empty response so client can fall back to Web Speech API
    return NextResponse.json({ error: 'TTS service unavailable' }, { status: 503 });
  }
}
