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
    const res = await fetch(UPSTASH_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${UPSTASH_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(['GET', 'omerga_news_data'])
    });
    if (res.ok) {
      const data = await res.json();
      if (data && data.result) {
        return JSON.parse(data.result);
      }
    }
  } catch (e) {
    console.warn('Upstash GET error:', e);
  }
  return null;
}

async function saveToUpstash(data) {
  try {
    const res = await fetch(UPSTASH_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${UPSTASH_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(['SET', 'omerga_news_data', JSON.stringify(data)])
    });
    return res.ok;
  } catch (e) {
    console.warn('Upstash SET error:', e);
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
    // 1. Primary: High-speed Upstash Serverless Database
    const upstashData = await fetchFromUpstash();
    if (upstashData && (Array.isArray(upstashData.news) || Array.isArray(upstashData.rashi))) {
      return res.status(200).json(upstashData);
    }

    // 2. Secondary Fallback: ExtendsClass Bin
    try {
      const upstreamRes = await fetch(`${EXTENDSCLASS_URL}?t=${Date.now()}`, {
        headers: { 'Cache-Control': 'no-cache' }
      });
      if (upstreamRes.ok) {
        const raw = await upstreamRes.text();
        const data = parseRobustJson(raw);
        if (data && (Array.isArray(data.news) || Array.isArray(data.rashi))) {
          // Sync into Upstash in background
          saveToUpstash(data).catch(() => {});
          return res.status(200).json(data);
        }
      }
    } catch (err) {
      console.warn('Extendsclass fallback GET error:', err);
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

      // Fetch existing data from Upstash first (fastest and most reliable)
      let existing = await fetchFromUpstash();
      if (!existing) {
        existing = { news: [], rashi: [], ads: null };
        try {
          const existingRes = await fetch(`${EXTENDSCLASS_URL}?t=${Date.now()}`, {
            headers: { 'Cache-Control': 'no-cache' }
          });
          if (existingRes.ok) {
            const raw = await existingRes.text();
            const parsed = parseRobustJson(raw);
            if (parsed) existing = parsed;
          }
        } catch (e) {}
      }

      // Merge payload
      if (Array.isArray(payload.news)) {
        // Strict FIFO Retention Policy:
        // Only trigger auto-deletion when total posts EXCEED 1000.
        // Never delete anything if post count <= 1000.
        // When exceeding 1000, keep exactly the freshest 1000 posts (newest first).
        if (payload.news.length > 1000) {
          existing.news = payload.news.slice(0, 1000);
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
        existing = payload.full;
      }

      // Save to Upstash first (primary persistent database)
      const upstashSaved = await saveToUpstash(existing);

      // Also mirror to secondary bin in background
      fetch(EXTENDSCLASS_URL, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(existing)
      }).catch(e => console.warn('Secondary mirror note:', e));

      if (upstashSaved) {
        return res.status(200).json({ success: true, count: existing.news?.length || 0 });
      } else {
        return res.status(200).json({ success: true, count: existing.news?.length || 0, mirrored: true });
      }
    } catch (err) {
      console.error('API news save error:', err);
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(405).json({ error: 'Method Not Allowed' });
}
