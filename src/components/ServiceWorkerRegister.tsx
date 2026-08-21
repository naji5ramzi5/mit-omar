'use client';

import { useEffect } from 'react';

export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;
    const register = async () => {
      try {
        const reg = await navigator.serviceWorker.register('/sw.js');
        if (reg.waiting) reg.waiting.postMessage({ type: 'SKIP_WAITING' });
      } catch {
        /* push unavailable — non-critical */
      }
    };
    void register();
  }, []);

  return null;
}