'use client';

import { useEffect } from 'react';
import { replayQueue } from '@/lib/offline-queue';

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(console.error);
    }

    // Replay queued mutations when coming back online
    const handleOnline = () => {
      replayQueue();
    };
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, []);

  return null;
}
