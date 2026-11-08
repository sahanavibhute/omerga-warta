import fs from 'fs';
import path from 'path';

const STORAGE_API_URL = 'https://extendsclass.com/api/json-storage/bin/edbeaff';

export default async function handler(req, res) {
  const { id } = req.query;

  res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=86400');

  try {
    if (id) {
      const upstream = await fetch(`${STORAGE_API_URL}?t=${Date.now()}`, {
        headers: { 'Cache-Control': 'no-cache' }
      });
      if (upstream.ok) {
        const data = await upstream.json();
        const article = (data.news || []).find(item => String(item.id) === String(id));
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
