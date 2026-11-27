export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb'
    }
  }
};

function parseRobustJson(raw) {
  if (!raw || typeof raw !== 'string') return null;
  try {
    return JSON.parse(raw);
  } catch (err) {
    let end = raw.lastIndexOf('}');
    while (end > 0) {
      try {
        return JSON.parse(raw.slice(0, end + 1));
      } catch (e) {
        end = raw.lastIndexOf('}', end - 1);
      }
    }
  }
  return null;
}

const UPSTASH_URL = 'https://feasible-halibut-74410.upstash.io';
const UPSTASH_TOKEN = 'gQAAAAAAASKqAQIgcDIyM2ZmNGZlMWUzZTY0YjZjODBhZTliYjVlNTMyZTAwNw';
const EXTENDSCLASS_URL = 'https://extendsclass.com/api/json-storage/bin/edbeaff';

async function fetchFromUpstash() {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2000);
    const res = await fetch(UPSTASH_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${UPSTASH_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(['GET', 'omerga_news_data']),
      signal: controller.signal
    });
    clearTimeout(timeout);
    if (res.ok) {
      const data = await res.json();
      if (data && data.result) {
        return JSON.parse(data.result);
      }
    }
  } catch (e) {
    // Upstash failed or timed out - silently fall through to ExtendsClass
  }
  return null;
}

async function saveToUpstash(data) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2000);
    const res = await fetch(UPSTASH_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${UPSTASH_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(['SET', 'omerga_news_data', JSON.stringify(data)]),
      signal: controller.signal
    });
    clearTimeout(timeout);
    return res.ok;
  } catch (e) {
    return false;
  }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // GET: Fetch real-time articles, rashi, and ads
  if (req.method === 'GET') {
    // 1. Primary: Persistent ExtendsClass Cloud Bin (immediate 0ms delay, rock-solid)
    try {
      const upstreamRes = await fetch(`${EXTENDSCLASS_URL}?t=${Date.now()}`, {
        headers: { 'Cache-Control': 'no-cache' }
      });
      if (upstreamRes.ok) {
        const raw = await upstreamRes.text();
        const data = parseRobustJson(raw);
        if (data && (Array.isArray(data.news) || Array.isArray(data.rashi))) {
          // Sync to Upstash in background if available
          saveToUpstash(data).catch(() => {});
          return res.status(200).json(data);
        }
      }
    } catch (err) {
      console.warn('ExtendsClass primary GET note:', err);
    }

    // 2. Secondary Fallback: Upstash Serverless Database
    const upstashData = await fetchFromUpstash();
    if (upstashData && (Array.isArray(upstashData.news) || Array.isArray(upstashData.rashi))) {
      return res.status(200).json(upstashData);
    }

    return res.status(200).json({ news: [], rashi: [], ads: null });
  }

  // POST or PUT: Save news / rashi / ads from admin dashboard
  if (req.method === 'POST' || req.method === 'PUT') {
    try {
      const payload = req.body;
      if (!payload) {
        return res.status(400).json({ error: 'Payload required' });
      }

      // 1. Fetch existing data from persistent ExtendsClass bin first
      let existing = null;
      try {
        const existingRes = await fetch(`${EXTENDSCLASS_URL}?t=${Date.now()}`, {
          headers: { 'Cache-Control': 'no-cache' }
        });
        if (existingRes.ok) {
          const raw = await existingRes.text();
          existing = parseRobustJson(raw);
        }
      } catch (e) {}

      // Fallback to Upstash if ExtendsClass was empty
      if (!existing) {
        existing = await fetchFromUpstash();
      }
      if (!existing) {
        existing = { news: [], rashi: [], ads: null };
      }

      // Merge payload
      if (Array.isArray(payload.news)) {
        // Strict 15-Post FIFO Retention Policy:
        // Do not delete anything until 15 posts are posted.
        // Once total posts exceed 15, slowly trim the oldest past 15 (keep newest 15).
        if (payload.news.length > 15) {
          existing.news = payload.news.slice(0, 15);
        } else {
          existing.news = payload.news;
        }
      }
      if (Array.isArray(payload.rashi)) {
        existing.rashi = payload.rashi;
      }
      if (payload.astro !== undefined) {
        existing.astro = payload.astro;
      }
      if (payload.ads !== undefined) {
        existing.ads = payload.ads;
      }
      if (payload.full) {
        if (Array.isArray(payload.full.news) && payload.full.news.length > 15) {
          payload.full.news = payload.full.news.slice(0, 15);
        }
        existing = payload.full;
      }

      // Save to Upstash if reachable
      saveToUpstash(existing).catch(() => {});

      // ALWAYS save directly to persistent ExtendsClass cloud bin
      const extendsRes = await fetch(EXTENDSCLASS_URL, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(existing)
      });

      return res.status(200).json({ success: true, count: existing.news?.length || 0, saved: extendsRes.ok });
    } catch (err) {
      console.error('API news save error:', err);
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(405).json({ error: 'Method Not Allowed' });
}
