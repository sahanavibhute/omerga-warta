// Cloud Real-Time Storage Sync for Omerga Warta (उमरगा वार्ता)
// Backed by resilient ExtendsClass Cloud Storage (Bin: edbeaff)
// Seamlessly syncs articles, photos, advertisements, and horoscope across all phones, tablets, and laptops.

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
    if (!item) return false;
    // Exclude mock news items with low id
    if (typeof item.id === 'number' && item.id < 1000) return false;
    const itemTime = item.createdAt || (typeof item.id === 'number' && item.id > 1000000 ? item.id : null) || Date.now();
    return itemTime >= cutoff;
  });
}

/**
 * Helper to fetch complete bin data
 * Dual-tier fallback: First queries same-origin /api/news (bypasses any mobile carrier / ISP blocking),
 * then falls back directly to cloud storage bin and local bundle.
 */
async function fetchFullBinData() {
  // 1. Try same-origin /api/news proxy (zero CORS, zero mobile ISP blocks)
  try {
    const res = await fetch(`/api/news?t=${Date.now()}`);
    if (res.ok) {
      const data = await res.json();
      if (data && (Array.isArray(data.news) || Array.isArray(data.rashi))) {
        return data;
      }
    }
  } catch (e) {}

  // 2. Direct cloud bin
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);
    const res = await fetch(`${STORAGE_API_URL}?t=${Date.now()}`, {
      headers: { 'Cache-Control': 'no-cache' },
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    console.warn('Full bin fetch note:', e);
  }

  // 3. Static fallback bundle
  try {
    const res = await fetch(`/news-fallback.json?t=${Date.now()}`);
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {}

  return { news: [], rashi: [], ads: null };
}

/**
 * Helper to save full bin data
 */
async function saveFullBinData(data) {
  try {
    const res = await fetch(STORAGE_API_URL, {
      method: 'PUT',
      body: JSON.stringify(data),
      headers: { 'Content-Type': 'application/json' }
    });
    return res.ok;
  } catch (e) {
    console.error('Full bin save error:', e);
    return false;
  }
}

/**
 * Fetch latest news articles from Cloud Storage with timeout safety
 */
export async function fetchNewsFromCloud() {
  try {
    const data = await fetchFullBinData();
    if (data && Array.isArray(data.news)) {
      return filterOlderThanOneWeek(data.news);
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
    const existing = await fetchFullBinData();
    existing.news = freshNews;
    return await saveFullBinData(existing);
  } catch (err) {
    console.error('Cloud news save error:', err);
    return false;
  }
}

/**
 * Fetch Rashi Bhavishya from Cloud Storage with timeout safety
 */
export async function fetchRashiFromCloud() {
  try {
    const data = await fetchFullBinData();
    if (data && Array.isArray(data.rashi) && data.rashi.length > 0) {
      return data.rashi;
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
    const existing = await fetchFullBinData();
    existing.rashi = rashiList;
    return await saveFullBinData(existing);
  } catch (err) {
    console.error('Cloud rashi save error:', err);
    return false;
  }
}

/**
 * Fetch Advertisements configuration from Cloud Storage
 */
export async function fetchAdsFromCloud() {
  try {
    const data = await fetchFullBinData();
    if (data && data.ads) {
      return data.ads;
    }
  } catch (err) {
    console.warn('Cloud ads fetch note:', err);
  }
  return null;
}

/**
 * Save Advertisements configuration to Cloud Storage
 */
export async function saveAdsToCloud(adsConfig) {
  try {
    const existing = await fetchFullBinData();
    existing.ads = adsConfig;
    return await saveFullBinData(existing);
  } catch (err) {
    console.error('Cloud ads save error:', err);
    return false;
  }
}
