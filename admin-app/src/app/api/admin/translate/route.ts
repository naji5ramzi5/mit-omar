import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { text, from, to } = await req.json();

    if (!text || !from || !to) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Fast, accurate Google Translate engine
    try {
      const gUrl = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${encodeURIComponent(from)}&tl=${encodeURIComponent(to)}&dt=t&q=${encodeURIComponent(text)}`;
      const gRes = await fetch(gUrl);
      if (gRes.ok) {
        const gJson = await gRes.json();
        if (Array.isArray(gJson) && Array.isArray(gJson[0])) {
          const translated = gJson[0].map((chunk: any) => chunk[0]).join('');
          if (translated) {
            return NextResponse.json({ translation: translated, success: true });
          }
        }
      }
    } catch (gErr) {
      console.warn('Google translate fallback triggered:', gErr);
    }

    // Secondary fallback: MyMemory
    const langPair = `${from}|${to}`;
    const mUrl = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${langPair}`;
    const mRes = await fetch(mUrl);
    const mData = await mRes.json();
    if (mData.responseStatus === 200 && mData.responseData?.translatedText) {
      return NextResponse.json({ translation: mData.responseData.translatedText, success: true });
    }

    return NextResponse.json({ error: 'Translation failed' }, { status: 500 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Translation error' }, { status: 500 });
  }
}
