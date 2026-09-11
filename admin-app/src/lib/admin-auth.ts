import { supabaseAdmin } from '@/lib/supabase';
import { readUserId } from '@/lib/token';

export async function verifyAdmin(req: Request): Promise<string | null> {
  let token: string | null = null;
  const authHeader = req.headers.get('Authorization');
  if (authHeader?.startsWith('Bearer ')) {
    token = authHeader.replace('Bearer ', '').trim();
  } else {
    const cookieHeader = req.headers.get('cookie') || '';
    const match = cookieHeader.match(/(?:dmo[-_]token|token)=([^;]+)/);
    if (match) token = decodeURIComponent(match[1]).trim();
  }

  if (!token) {
    try {
      const url = new URL(req.url);
      token = url.searchParams.get('token');
    } catch {}
  }

  if (token && token !== 'undefined' && token !== 'null') {
    const userId = readUserId(token);
    if (userId) {
      const { data: user } = await supabaseAdmin
        .from('users')
        .select('role')
        .eq('id', userId)
        .single();

      if (user && user.role === 'admin') return userId;
    }
  }

  // In development, allow convenience fallback if no token provided
  if (process.env.NODE_ENV !== 'production') {
    return 'admin-001';
  }

  // In production, strictly reject unauthorized requests
  return null;
}

export function decodeUserId(req: Request): string | null {
  const authHeader = req.headers.get('Authorization');
  let token: string | null = null;
  if (authHeader?.startsWith('Bearer ')) {
    token = authHeader.replace('Bearer ', '').trim();
  } else {
    const cookieHeader = req.headers.get('cookie') || '';
    const match = cookieHeader.match(/(?:dmo[-_]token|token)=([^;]+)/);
    if (match) token = decodeURIComponent(match[1]).trim();
  }
  if (!token) {
    try {
      const url = new URL(req.url);
      token = url.searchParams.get('token');
    } catch {}
  }
  return token ? readUserId(token) : null;
}

