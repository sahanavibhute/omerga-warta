// Cloud Real-Time Storage Sync for Omerga Warta (उमरगा वार्ता)
// Syncs news, rashibhavishya, and e-paper metadata universally across all devices (Mobile, Desktop, Laptop)
// without requiring any manual database setup or API keys.

const KVDB_BUCKET = 'AD2mUcAFDXGAQdaKZsixjX';
const KVDB_BASE_URL = `https://kvdb.io/${KVDB_BUCKET}`;

// One week in milliseconds for auto-purging old posts
const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Filter items older than 7 days
 */
export function filterOlderThanOneWeek(items) {
  if (!Array.isArray(items)) return [];
  const cutoff = Date.now() - ONE_WEEK_MS;
  return items.filter(item => {
    // Keep sample/default placeholder items with small id if present
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
    const res = await fetch(`${KVDB_BASE_URL}/ow_news?t=${Date.now()}`, {
      headers: { 'Cache-Control': 'no-cache' }
    });
    if (res.status === 404) {
      return null;
    }
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) {
        return filterOlderThanOneWeek(data);
      }
    }
  } catch (err) {
    console.warn('Cloud news fetch warning:', err);
  }
  return null;
}

/**
 * Push news articles list to Cloud Storage
 */
export async function saveNewsToCloud(newsList) {
  try {
    const freshNews = filterOlderThanOneWeek(newsList);
    await fetch(`${KVDB_BASE_URL}/ow_news`, {
      method: 'POST',
      body: JSON.stringify(freshNews),
      headers: { 'Content-Type': 'application/json' }
    });
    return true;
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
    const res = await fetch(`${KVDB_BASE_URL}/ow_rashi?t=${Date.now()}`, {
      headers: { 'Cache-Control': 'no-cache' }
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        return data;
      }
    }
  } catch (err) {
    console.warn('Cloud rashi fetch warning:', err);
  }
  return null;
}

/**
 * Save Rashi Bhavishya to Cloud Storage
 */
export async function saveRashiToCloud(rashiList) {
  try {
    await fetch(`${KVDB_BASE_URL}/ow_rashi`, {
      method: 'POST',
      body: JSON.stringify(rashiList),
      headers: { 'Content-Type': 'application/json' }
    });
    return true;
  } catch (err) {
    console.error('Cloud rashi save error:', err);
    return false;
  }
}

/**
 * Fetch E-Paper metadata from Cloud Storage
 */
export async function fetchEpaperMetaFromCloud() {
  try {
    const res = await fetch(`${KVDB_BASE_URL}/ow_epaper_meta?t=${Date.now()}`, {
      headers: { 'Cache-Control': 'no-cache' }
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('Cloud epaper fetch warning:', err);
  }
  return null;
}

/**
 * Save E-Paper metadata to Cloud Storage
 */
export async function saveEpaperMetaToCloud(meta) {
  try {
    await fetch(`${KVDB_BASE_URL}/ow_epaper_meta`, {
      method: 'POST',
      body: JSON.stringify(meta),
      headers: { 'Content-Type': 'application/json' }
    });
    return true;
  } catch (err) {
    console.error('Cloud epaper save error:', err);
    return false;
  }
}
