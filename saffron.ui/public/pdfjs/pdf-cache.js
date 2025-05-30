export async function openPdfCacheDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('PdfCacheDB', 1);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('pdfs')) {
        db.createObjectStore('pdfs', { keyPath: 'url' });
      }
    };
    request.onsuccess = (event) => resolve(event.target.result);
    request.onerror = (event) => reject(event.target.error);
  });
}

export async function savePdfToCache(url, buffer) {
  const db = await openPdfCacheDb();
  const tx = db.transaction(['pdfs'], 'readwrite');
  const store = tx.objectStore('pdfs');
  await store.put({ url, buffer });
  return tx.complete;
}

export async function loadPdfFromCache(url) {
  const db = await openPdfCacheDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(['pdfs'], 'readonly');
    const store = tx.objectStore('pdfs');
    const request = store.get(url);
    request.onsuccess = () => {
      const result = request.result;
      resolve(result ? result.buffer : null);
    };
    request.onerror = () => reject(request.error);
  });
}

export async function getCachedPdf(url, pdfjsLib) {
  const cachedBuffer = await loadPdfFromCache(url);
  let buffer;
  if (cachedBuffer) {
    buffer = cachedBuffer;
  } else {
    const response = await fetch(url);
    buffer = await response.arrayBuffer();
    await savePdfToCache(url, buffer);
  }

  const uint8Array = new Uint8Array(buffer);
  return await pdfjsLib.getDocument({ data: uint8Array }).promise;
}
