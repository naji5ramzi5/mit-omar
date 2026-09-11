import { createHmac, timingSafeEqual } from 'crypto';

const TTL_MS = 1000 * 60 * 60 * 24 * 30;

function getSecret(): string {
  if (process.env.AUTH_TOKEN_SECRET) return process.env.AUTH_TOKEN_SECRET;
  const material = `${process.env.SUPABASE_SERVICE_ROLE_KEY || ''}:${process.env.NEXT_PUBLIC_SUPABASE_URL || ''}`;
  return createHmac('sha256', 'dmo-token-v1').update(material).digest('hex');
}

function getFallbackSecret(): string {
  const material = `${process.env.SUPABASE_SERVICE_ROLE_KEY || ''}:${process.env.NEXT_PUBLIC_SUPABASE_URL || ''}`;
  return createHmac('sha256', 'dmo-token-v1').update(material).digest('hex');
}

export function issueToken(userId: string): string {
  const payload = Buffer.from(`${userId}:${Date.now().toString()}`).toString('base64');
  const sig = createHmac('sha256', getSecret()).update(payload).digest('hex');
  return `${payload}.${sig}`;
}

export function readUserId(token: string | null): string | null {
  if (!token) return null;
  const idx = token.lastIndexOf('.');
  if (idx === -1) return null;
  const payload = token.slice(0, idx);
  const sig = token.slice(idx + 1);

  // Try primary secret
  let valid = false;
  let expected = createHmac('sha256', getSecret()).update(payload).digest('hex');
  if (expected.length === sig.length) {
    try {
      const received = Buffer.from(sig, 'hex');
      if (timingSafeEqual(received, Buffer.from(expected, 'hex'))) valid = true;
    } catch {}
  }

  // If failed, try fallback secret
  if (!valid) {
    const fallbackExpected = createHmac('sha256', getFallbackSecret()).update(payload).digest('hex');
    if (fallbackExpected.length === sig.length) {
      try {
        const received = Buffer.from(sig, 'hex');
        if (timingSafeEqual(received, Buffer.from(fallbackExpected, 'hex'))) valid = true;
      } catch {}
    }
  }

  if (!valid) return null;

  let decoded: string;
  try {
    decoded = Buffer.from(payload, 'base64').toString('utf-8');
  } catch {
    return null;
  }
  const [userId, ts] = decoded.split(':');
  if (!userId || !ts) return null;
  if (Date.now() - Number(ts) > TTL_MS) return null;
  return userId;
}