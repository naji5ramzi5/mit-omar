import { NextResponse } from 'next/server';

const LANG_MAP: Record<string, string> = {
  ar: 'ar',
  de: 'de',
  en: 'en',
};

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { text, from, to } = body;

    if (!text || !from || !to) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const sourceLang = LANG_MAP[from] || from;
    const targetLang = LANG_MAP[to] || to;

    const langPair = `${sourceLang}|${targetLang}`;
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${langPair}`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.responseStatus === 200 && data.responseData?.translatedText) {
      return NextResponse.json({
        translation: data.responseData.translatedText,
        match: data.responseData.match,
      });
    } else {
      return NextResponse.json({ error: 'Translation failed' }, { status: 500 });
    }
  } catch (error) {
    console.error('Translation error:', error);
    return NextResponse.json({ error: 'Translation service unavailable' }, { status: 500 });
  }
}
