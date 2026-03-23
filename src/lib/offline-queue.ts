// Queue API mutations when offline, replay when online

interface QueueItem {
  id?: number;
  url: string;
  method: string;
  body: object;
  timestamp: number;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('gnt-offline', 1);
    req.onupgradeneeded = () => {
      req.result.createObjectStore('queue', { keyPath: 'id', autoIncrement: true });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function queueMutation(url: string, method: string, body: object): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('queue', 'readwrite');
    tx.objectStore('queue').add({ url, method, body, timestamp: Date.now() });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getQueueCount(): Promise<number> {
  const db = await openDB();
  return new Promise((resolve) => {
    const tx = db.transaction('queue', 'readonly');
    const req = tx.objectStore('queue').count();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => resolve(0);
  });
}

export async function replayQueue(): Promise<void> {
  if (!navigator.onLine) return;
  const db = await openDB();

  const items: QueueItem[] = await new Promise((resolve) => {
    const tx = db.transaction('queue', 'readonly');
    const req = tx.objectStore('queue').getAll();
    req.onsuccess = () => resolve(req.result as QueueItem[]);
    req.onerror = () => resolve([]);
  });

  for (const item of items) {
    try {
      const res = await fetch(item.url, {
        method: item.method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item.body),
      });
      if (res.ok && item.id !== undefined) {
        await new Promise<void>((resolve) => {
          const tx = db.transaction('queue', 'readwrite');
          tx.objectStore('queue').delete(item.id!);
          tx.oncomplete = () => resolve();
        });
      }
    } catch {
      break; // Stop if still offline
    }
  }
}
