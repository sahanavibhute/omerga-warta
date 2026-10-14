// IndexedDB storage helper for large PDF and media storage
const DB_NAME = 'OmergaWartaDB';
const DB_VERSION = 1;
const STORE_NAME = 'epaper_store';

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    request.onsuccess = (e) => resolve(e.target.result);
    request.onerror = (e) => reject(e.target.error);
  });
}

export async function saveEpaperPdf(fileObj, meta) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const item = {
      id: 'current_epaper',
      file: fileObj, // Stored as Blob/File without size limitations
      fileName: fileObj.name,
      title_mr: meta.title_mr || 'उमरगा वार्ता - मुख्य आवृत्ती',
      date: meta.date || new Date().toLocaleDateString('mr-IN', { day: 'numeric', month: 'long', year: 'numeric' }),
      updatedAt: Date.now()
    };
    const req = store.put(item);
    req.onsuccess = () => resolve(item);
    req.onerror = (e) => reject(e.target.error);
  });
}

export async function getEpaperPdf() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const req = store.get('current_epaper');
    req.onsuccess = () => {
      const result = req.result;
      if (result && result.file) {
        const objectUrl = URL.createObjectURL(result.file);
        resolve({
          ...result,
          pdfUrl: objectUrl
        });
      } else {
        resolve(null);
      }
    };
    req.onerror = (e) => reject(e.target.error);
  });
}

export async function deleteEpaperPdf() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.delete('current_epaper');
    req.onsuccess = () => resolve(true);
    req.onerror = (e) => reject(e.target.error);
  });
}
