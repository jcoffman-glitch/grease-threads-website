'use client';

import { useEffect, useState } from 'react';

export default function OfflinePage() {
  const [queueCount, setQueueCount] = useState(0);

  useEffect(() => {
    // Count queued items in IndexedDB
    const req = indexedDB.open('gnt-offline', 1);
    req.onsuccess = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains('queue')) return;
      const tx = db.transaction('queue', 'readonly');
      const countReq = tx.objectStore('queue').count();
      countReq.onsuccess = () => setQueueCount(countReq.result);
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="text-center max-w-sm">
        <div className="text-6xl mb-4">📡</div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">You&apos;re Offline</h1>
        <p className="text-gray-600 mb-4">
          Your changes will sync when you&apos;re back online.
        </p>
        {queueCount > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-800">
            <strong>{queueCount}</strong> pending action{queueCount !== 1 ? 's' : ''} queued — will sync automatically when connected.
          </div>
        )}
        <button
          onClick={() => window.location.href = '/admin'}
          className="mt-6 px-6 py-2 bg-amber-500 text-white rounded-lg font-medium hover:bg-amber-600"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
