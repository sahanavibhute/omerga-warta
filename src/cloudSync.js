// Universal Real-Time Redis Cloud Sync for Omerga Warta (उमरगा वार्ता)
// Powered by Upstash Global Redis REST API
// Guaranteed instant sync across all phones, computers, and tablets.

const UPSTASH_REST_URL = 'https://relaxed-gator-234366.upstash.io';
const UPSTASH_REST_TOKEN = 'gQAAAAAAA5N-AQIgcDE1YWIzNWIyNGFkZmQ0M2Y2YmY4M2ZkMDVjODhhNGZiNA';

// 7-day auto-expiry cutoff in milliseconds
const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export function filterOlderThanOneWeek(items) {
  if (!Array.isArray(items)) return [];
  const cutoff = Date.now() - ONE_WEEK_MS;
  return items.filter(item => {
    // Exclude mock news items
    if (typeof item.id === 'number' && item.id < 1000) return false;
    const itemTime = item.createdAt || (typeof item.id === 'number' && item.id > 1000000 ? item.id : null) || Date.now();
    return itemTime >= cutoff;
  });
}

/**
 * Fetch latest news articles from Redis Cloud Database
 */
export async function fetchNewsFromCloud() {
  try {
    const res = await fetch(`${UPSTASH_REST_URL}/get/ow_news`, {
      headers: {
        Authorization: `Bearer ${UPSTASH_REST_TOKEN}`
      }
    });

    if (res.ok) {
      const data = await res.json();
      if (data && data.result) {
        const parsed = typeof data.result === 'string' ? JSON.parse(data.result) : data.result;
        if (Array.isArray(parsed)) {
          return filterOlderThanOneWeek(parsed);
        }
      }
    }
  } catch (err) {
    console.warn('Upstash fetchNewsFromCloud note:', err);
  }
  return null;
}

/**
 * Push news articles list to Redis Cloud Database
 */
export async function saveNewsToCloud(newsList) {
  try {
    const freshNews = filterOlderThanOneWeek(newsList);
    const res = await fetch(UPSTASH_REST_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${UPSTASH_REST_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(['SET', 'ow_news', JSON.stringify(freshNews)])
    });

    return res.ok;
  } catch (err) {
    console.error('Upstash saveNewsToCloud error:', err);
    return false;
  }
}

/**
 * Fetch Rashi Bhavishya from Redis Cloud Database
 */
export async function fetchRashiFromCloud() {
  try {
    const res = await fetch(`${UPSTASH_REST_URL}/get/ow_rashi`, {
      headers: {
        Authorization: `Bearer ${UPSTASH_REST_TOKEN}`
      }
    });

    if (res.ok) {
      const data = await res.json();
      if (data && data.result) {
        const parsed = typeof data.result === 'string' ? JSON.parse(data.result) : data.result;
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    }
  } catch (err) {
    console.warn('Upstash fetchRashiFromCloud note:', err);
  }
  return null;
}

/**
 * Save Rashi Bhavishya to Redis Cloud Database
 */
export async function saveRashiToCloud(rashiList) {
  try {
    const res = await fetch(UPSTASH_REST_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${UPSTASH_REST_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(['SET', 'ow_rashi', JSON.stringify(rashiList)])
    });

    return res.ok;
  } catch (err) {
    console.error('Upstash saveRashiToCloud error:', err);
    return false;
  }
}
