'use client';

import { useEffect } from 'react';

export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;
    // Don't register in dev (localhost) — SW caching of /_next chunks can break client navigation
    if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
      // Clear any previously registered (possibly broken) SW so it stops controlling the page
      navigator.serviceWorker.getRegistrations().then((regs) =>
        regs.forEach((r) => r.unregister()),
      );
      return;
    }
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