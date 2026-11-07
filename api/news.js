export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const STORAGE_API_URL = 'https://extendsclass.com/api/json-storage/bin/edbeaff';

  try {
    const upstreamRes = await fetch(`${STORAGE_API_URL}?t=${Date.now()}`, {
      headers: { 'Cache-Control': 'no-cache' }
    });
    if (upstreamRes.ok) {
      const data = await upstreamRes.json();
      return res.status(200).json(data);
    }
  } catch (err) {
    console.warn('API news upstream note:', err);
  }

  return res.status(200).json({ news: [], rashi: [], ads: null });
}
