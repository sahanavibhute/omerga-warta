import fs from 'fs';
import path from 'path';

const UPSTASH_URL = 'https://feasible-halibut-74410.upstash.io';
const UPSTASH_TOKEN = 'gQAAAAAAASKqAQIgcDIyM2ZmNGZlMWUzZTY0YjZjODBhZTliYjVlNTMyZTAwNw';
const EXTENDSCLASS_URL = 'https://extendsclass.com/api/json-storage/bin/edbeaff';

async function getArticleById(id) {
  // 1. Upstash primary
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
      const resp = await res.json();
      if (resp && resp.result) {
        const data = JSON.parse(resp.result);
        const found = (data?.news || []).find(item => String(item.id) === String(id));
        if (found) return found;
      }
    }
  } catch (e) {}

  // 2. ExtendsClass fallback
  try {
    const upstream = await fetch(`${EXTENDSCLASS_URL}?t=${Date.now()}`, {
      headers: { 'Cache-Control': 'no-cache' }
    });
    if (upstream.ok) {
      const raw = await upstream.text();
      let end = raw.lastIndexOf('}');
      while (end > 0) {
        try {
          const data = JSON.parse(raw.slice(0, end + 1));
          const found = (data?.news || []).find(item => String(item.id) === String(id));
          if (found) return found;
          break;
        } catch (retryErr) {
          end = raw.lastIndexOf('}', end - 1);
        }
      }
    }
  } catch (e) {}

  return null;
}

export default async function handler(req, res) {
  const { id } = req.query;

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');
  res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=86400');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (id) {
      const article = await getArticleById(id);
      if (article && article.image) {
        let rawSrc = article.image;

        // Case A: Cloud storage JSON bin
        if (rawSrc.includes('extendsclass.com/api/json-storage/bin/')) {
          const binRes = await fetch(rawSrc);
          if (binRes.ok) {
            const binJson = await binRes.json();
            rawSrc = binJson.image || binJson.url || rawSrc;
          }
        }

        // Case B: Base64 data URI
        if (rawSrc.startsWith('data:image/')) {
          const matches = rawSrc.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
          if (matches && matches.length === 3) {
            const mimeType = matches[1];
            const buffer = Buffer.from(matches[2], 'base64');
            res.setHeader('Content-Type', mimeType);
            res.setHeader('Content-Length', buffer.length);
            return res.status(200).send(buffer);
          }
        }

        // Case C: Direct image URL (e.g. Cloudinary, Unsplash)
        if (rawSrc.startsWith('http')) {
          const directImg = await fetch(rawSrc);
          if (directImg.ok) {
            const imgBuffer = Buffer.from(await directImg.arrayBuffer());
            res.setHeader('Content-Type', directImg.headers.get('content-type') || 'image/jpeg');
            res.setHeader('Content-Length', imgBuffer.length);
            return res.status(200).send(imgBuffer);
          }
        }
      }
    }
  } catch (err) {
    console.warn('Image proxy error:', err);
  }

  // Fallback to default logo
  try {
    const logoPath = path.join(process.cwd(), 'public', 'logo.jpg');
    if (fs.existsSync(logoPath)) {
      const defaultImg = fs.readFileSync(logoPath);
      res.setHeader('Content-Type', 'image/jpeg');
      res.setHeader('Content-Length', defaultImg.length);
      return res.status(200).send(defaultImg);
    }
  } catch (e) {}

  return res.status(404).end();
}
