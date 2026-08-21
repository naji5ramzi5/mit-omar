import { supabaseAdmin } from '@/lib/supabase';
import { readUserId } from '@/lib/token';

export async function verifyAdmin(req: Request): Promise<string | null> {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.replace('Bearer ', '');
  const userId = readUserId(token);
  if (!userId) return null;

  const { data: user } = await supabaseAdmin
    .from('users')
    .select('role')
    .eq('id', userId)
    .single();

  if (!user || user.role !== 'admin') return null;
  return userId;
}

export function decodeUserId(req: Request): string | null {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.replace('Bearer ', '');
  return readUserId(token);
}
