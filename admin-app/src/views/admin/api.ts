'use client';

import { useState, useEffect, useCallback } from 'react';

export async function adminFetch<T = any>(
  path: string,
  token: string,
  init: RequestInit = {},
): Promise<T> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    ...(init.headers as Record<string, string>),
  };
  if (init.body) headers['Content-Type'] = 'application/json';

  const res = await fetch(path, { ...init, headers });
  let data: any = {};
  try {
    data = await res.json();
  } catch {
    /* ignore */
  }
  if (!res.ok) {
    throw new Error(data?.error || 'Request failed');
  }
  return data as T;
}

export function fieldOf(obj: Record<string, any>, field: string, locale: string): string {
  const key = locale.charAt(0).toUpperCase() + locale.slice(1);
  return obj[`${field}${key}`] || obj[`${field}En`] || '';
}

/** Fetches a list from an admin API route once (and exposes a manual refresh). */
export function useAdminData<T>(path: string, token: string, key: string) {
  const [data, setData] = useState<T[] | null>(null);
  const [loading, setLoading] = useState(true);
  const refresh = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await adminFetch<Record<string, any>>(path, token);
      const list = res?.[key];
      setData(Array.isArray(list) ? list : []);
    } catch {
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [path, token, key]);
  useEffect(() => {
    void refresh();
  }, [refresh]);
  return { data, loading, refresh };
}
