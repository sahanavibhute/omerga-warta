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

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const STORAGE_API_URL = 'https://extendsclass.com/api/json-storage/bin/edbeaff';

  // GET: Fetch real-time articles, rashi, and ads
  if (req.method === 'GET') {
    try {
      const upstreamRes = await fetch(`${STORAGE_API_URL}?t=${Date.now()}`, {
        headers: { 'Cache-Control': 'no-cache' }
      });
      if (upstreamRes.ok) {
        const raw = await upstreamRes.text();
        const data = parseRobustJson(raw);
        if (data && (Array.isArray(data.news) || Array.isArray(data.rashi))) {
          return res.status(200).json(data);
        }
      }
    } catch (err) {
      console.warn('API news upstream GET note:', err);
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

      // Fetch existing data first to merge
      let existing = { news: [], rashi: [], ads: null };
      try {
        const existingRes = await fetch(`${STORAGE_API_URL}?t=${Date.now()}`, {
          headers: { 'Cache-Control': 'no-cache' }
        });
        if (existingRes.ok) {
          const raw = await existingRes.text();
          const parsed = parseRobustJson(raw);
          if (parsed) {
            existing = parsed;
          }
        }
      } catch (e) {}

      // Merge payload
      if (Array.isArray(payload.news)) {
        existing.news = payload.news;
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

      const saveRes = await fetch(STORAGE_API_URL, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(existing)
      });

      if (saveRes.ok) {
        return res.status(200).json({ success: true, count: existing.news?.length || 0 });
      } else {
        const errText = await saveRes.text();
        return res.status(saveRes.status).json({ error: errText });
      }
    } catch (err) {
      console.error('API news upstream PUT error:', err);
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(405).json({ error: 'Method Not Allowed' });
}
