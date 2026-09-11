import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { text, from, to } = await req.json();

    if (!text || !from || !to) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const trimmed = text.trim();
    if (!trimmed) {
      return NextResponse.json({ translation: '', success: true });
    }

    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
      'Accept': 'application/json, text/plain, */*',
    };

    // Engine 1: Google Translate GTX
    try {
      const gUrl = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${encodeURIComponent(from)}&tl=${encodeURIComponent(to)}&dt=t&q=${encodeURIComponent(trimmed)}`;
      const gRes = await fetch(gUrl, { headers });
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
      console.warn('Google translate server failed:', gErr);
    }

    // Engine 2: Lingva API
    try {
      const lUrl = `https://lingva.ml/api/v1/${encodeURIComponent(from)}/${encodeURIComponent(to)}/${encodeURIComponent(trimmed)}`;
      const lRes = await fetch(lUrl, { headers });
      if (lRes.ok) {
        const lJson = await lRes.json();
        if (lJson.translation) {
          return NextResponse.json({ translation: lJson.translation, success: true });
        }
      }
    } catch (lErr) {
      console.warn('Lingva server failed:', lErr);
    }

    // Engine 3: MyMemory
    try {
      const langPair = `${from}|${to}`;
      const mUrl = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(trimmed)}&langpair=${langPair}`;
      const mRes = await fetch(mUrl, { headers });
      if (mRes.ok) {
        const mData = await mRes.json();
        if (mData.responseStatus === 200 && mData.responseData?.translatedText) {
          return NextResponse.json({ translation: mData.responseData.translatedText, success: true });
        }
      }
    } catch (mErr) {
      console.warn('MyMemory server failed:', mErr);
    }

    return NextResponse.json({ error: 'Translation failed' }, { status: 500 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Translation error' }, { status: 500 });
  }
}

