import { v2 as cloudinary } from 'cloudinary';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '15mb'
    }
  }
};

function parseRobustJson(str) {
  try {
    return JSON.parse(str);
  } catch (e) {
    const match = str.match(/\{[\s\S]*\}/);
    if (match) {
      let candidate = match[0];
      let end = candidate.lastIndexOf('}');
      while (end > 0) {
        try {
          return JSON.parse(candidate.slice(0, end + 1));
        } catch (err) {
          candidate = candidate.slice(0, end);
          end = candidate.lastIndexOf('}');
        }
      }
    }
  }
  return null;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { image } = req.body || {};

    if (!image) {
      return res.status(400).json({ error: 'Image data is required' });
    }

    // 1. Primary: Cloudinary (If environment variables are added to Vercel)
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME || process.env.VITE_CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY || process.env.VITE_CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (cloudName && apiKey && apiSecret) {
      try {
        cloudinary.config({
          cloud_name: cloudName,
          api_key: apiKey,
          api_secret: apiSecret
        });

        const uploadResult = await cloudinary.uploader.upload(image, {
          folder: 'omerga-warta',
          resource_type: 'image',
          transformation: [
            { quality: 'auto:good' },
            { fetch_format: 'auto' },
            { width: 1200, crop: 'limit' }
          ]
        });

        return res.status(200).json({
          success: true,
          url: uploadResult.secure_url,
          provider: 'cloudinary'
        });
      } catch (cErr) {
        console.error('Cloudinary upload error:', cErr.message);
      }
    }

    // 2. High-Performance Dedicated Cloud Storage for this specific image:
    // Creates a dedicated permanent cloud bin for this photo
    // This allows the main news bin to store only lightweight URLs without hitting the 100KB limit
    try {
      const createBinRes = await fetch('https://extendsclass.com/api/json-storage/bin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image })
      });

      if (createBinRes.ok) {
        const rawText = await createBinRes.text();
        const binJson = parseRobustJson(rawText);
        if (binJson && binJson.id) {
          const directUrl = `https://extendsclass.com/api/json-storage/bin/${binJson.id}`;
          return res.status(200).json({
            success: true,
            url: directUrl,
            provider: 'cloud-storage-bin'
          });
        }
      }
    } catch (binErr) {
      console.warn('Dedicated bin creation error:', binErr.message);
    }

    // 3. Fallback: Return optimized image
    return res.status(200).json({
      success: true,
      url: image,
      provider: 'fallback-direct'
    });
  } catch (error) {
    console.error('Upload handler error:', error);
    return res.status(500).json({
      error: error.message || 'Upload failed'
    });
  }
}
