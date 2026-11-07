import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary using server-side environment variables if present
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || process.env.VITE_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY || process.env.VITE_CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '12mb'
    }
  }
};

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
    const { image, folder = 'omerga-warta' } = req.body || {};

    if (!image) {
      return res.status(400).json({ error: 'Image data is required' });
    }

    const cloudName = process.env.CLOUDINARY_CLOUD_NAME || process.env.VITE_CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY || process.env.VITE_CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    // 1. If Cloudinary credentials are provided in Vercel, upload to Cloudinary
    if (cloudName && apiKey && apiSecret) {
      try {
        const uploadResult = await cloudinary.uploader.upload(image, {
          folder,
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
        console.error('Cloudinary upload error:', cErr);
      }
    }

    // 2. High-Availability Server-Side Fallback:
    let base64Clean = image;
    let mimeType = 'image/jpeg';
    if (image.includes(',')) {
      const parts = image.split(',');
      base64Clean = parts[1];
      const match = parts[0].match(/:(.*?);/);
      if (match) mimeType = match[1];
    }
    const buffer = Buffer.from(base64Clean, 'base64');
    const ext = mimeType.includes('png') ? 'png' : 'jpg';

    // Try Catbox file upload
    try {
      const formData = new FormData();
      formData.append('reqtype', 'fileupload');
      formData.append('fileToUpload', new Blob([buffer], { type: mimeType }), `ow_${Date.now()}.${ext}`);

      const catboxRes = await fetch('https://catbox.moe/user/api.php', {
        method: 'POST',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
        },
        body: formData
      });

      if (catboxRes.ok) {
        const returnedUrl = await catboxRes.text();
        if (returnedUrl && returnedUrl.trim().startsWith('http')) {
          return res.status(200).json({
            success: true,
            url: returnedUrl.trim(),
            provider: 'catbox-cdn'
          });
        }
      }
    } catch (catErr) {
      console.error('Catbox upload error:', catErr);
    }

    // 3. Fallback: Freeimage.host API upload from server (server-to-server)
    try {
      const fiForm = new URLSearchParams();
      fiForm.append('key', '6d207e02198a847aa98d0a2a901485a5');
      fiForm.append('action', 'upload');
      fiForm.append('format', 'json');
      fiForm.append('source', base64Clean);

      const fiRes = await fetch('https://freeimage.host/api/1/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: fiForm
      });

      if (fiRes.ok) {
        const fiData = await fiRes.json();
        if (fiData && fiData.image && fiData.image.url) {
          return res.status(200).json({
            success: true,
            url: fiData.image.url,
            provider: 'freeimage'
          });
        }
      }
    } catch (fiErr) {
      console.error('Freeimage upload error:', fiErr);
    }

    return res.status(502).json({
      error: 'All cloud upload providers failed',
      hasCloudinaryConfig: Boolean(cloudName && apiKey && apiSecret)
    });
  } catch (error) {
    console.error('Serverless Upload Error:', error);
    return res.status(500).json({
      error: error.message || 'Image upload failed'
    });
  }
}
