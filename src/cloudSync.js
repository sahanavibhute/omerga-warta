// Cloud Real-Time Storage Sync for Omerga Warta (उमरगा वार्ता)
// Backed by ExtendsClass Cloud Storage (Bin: edbeaff)
// Seamlessly syncs articles, photos, and horoscope across all phones, tablets, and laptops.

const STORAGE_BIN_ID = 'edbeaff';
const STORAGE_API_URL = `https://extendsclass.com/api/json-storage/bin/${STORAGE_BIN_ID}`;

// One week in milliseconds for automatic 7-day purging of old posts
const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Filter items older than 7 days
 */
export function filterOlderThanOneWeek(items) {
  if (!Array.isArray(items)) return [];
  const cutoff = Date.now() - ONE_WEEK_MS;
  return items.filter(item => {
    // Keep sample/default placeholder items with small id
    if (typeof item.id === 'number' && item.id < 1000) return true;
    const itemTime = item.createdAt || (typeof item.id === 'number' && item.id > 1000000 ? item.id : null) || Date.now();
    return itemTime >= cutoff;
  });
}

/**
 * Fetch latest news articles from Cloud Storage
 */
export async function fetchNewsFromCloud() {
  try {
    const res = await fetch(`${STORAGE_API_URL}?t=${Date.now()}`, {
      headers: { 'Cache-Control': 'no-cache' }
    });
    if (res.ok) {
      const data = await res.json();
      if (data && Array.isArray(data.news)) {
        return filterOlderThanOneWeek(data.news);
      }
    }
  } catch (err) {
    console.warn('Cloud news fetch note:', err);
  }
  return null;
}

/**
 * Push news articles list to Cloud Storage
 */
export async function saveNewsToCloud(newsList) {
  try {
    const freshNews = filterOlderThanOneWeek(newsList);
    // Fetch existing bin content first so we preserve rashi
    let existingData = { news: [], rashi: [] };
    try {
      const getRes = await fetch(`${STORAGE_API_URL}?t=${Date.now()}`);
      if (getRes.ok) {
        existingData = await getRes.json();
      }
    } catch (e) {}

    existingData.news = freshNews;

    const res = await fetch(STORAGE_API_URL, {
      method: 'PUT',
      body: JSON.stringify(existingData),
      headers: { 'Content-Type': 'application/json' }
    });
    return res.ok;
  } catch (err) {
    console.error('Cloud news save error:', err);
    return false;
  }
}

/**
 * Fetch Rashi Bhavishya from Cloud Storage
 */
export async function fetchRashiFromCloud() {
  try {
    const res = await fetch(`${STORAGE_API_URL}?t=${Date.now()}`, {
      headers: { 'Cache-Control': 'no-cache' }
    });
    if (res.ok) {
      const data = await res.json();
      if (data && Array.isArray(data.rashi) && data.rashi.length > 0) {
        return data.rashi;
      }
    }
  } catch (err) {
    console.warn('Cloud rashi fetch note:', err);
  }
  return null;
}

/**
 * Save Rashi Bhavishya to Cloud Storage
 */
export async function saveRashiToCloud(rashiList) {
  try {
    let existingData = { news: [], rashi: [] };
    try {
      const getRes = await fetch(`${STORAGE_API_URL}?t=${Date.now()}`);
      if (getRes.ok) {
        existingData = await getRes.json();
      }
    } catch (e) {}

    existingData.rashi = rashiList;

    const res = await fetch(STORAGE_API_URL, {
      method: 'PUT',
      body: JSON.stringify(existingData),
      headers: { 'Content-Type': 'application/json' }
    });
    return res.ok;
  } catch (err) {
    console.error('Cloud rashi save error:', err);
    return false;
  }
}
