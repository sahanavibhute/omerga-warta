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
    }

    // 2. High-Availability Server-Side Fallback (Catbox CDN):
    // Server-to-server request is immune to browser CORS and delivers a permanent HTTPS URL
    const base64Clean = image.includes(',') ? image.split(',')[1] : image;
    const buffer = Buffer.from(base64Clean, 'base64');

    const formData = new FormData();
    formData.append('reqtype', 'fileupload');
    formData.append('fileToUpload', new Blob([buffer], { type: 'image/jpeg' }), `ow_${Date.now()}.jpg`);

    const catboxRes = await fetch('https://catbox.moe/user/api.php', {
      method: 'POST',
      body: formData
    });

    if (catboxRes.ok) {
      const returnedUrl = await catboxRes.text();
      if (returnedUrl && returnedUrl.startsWith('https://files.catbox.moe/')) {
        return res.status(200).json({
          success: true,
          url: returnedUrl.trim(),
          provider: 'catbox-cdn'
        });
      }
    }

    return res.status(502).json({
      error: 'All cloud upload providers failed'
    });
  } catch (error) {
    console.error('Serverless Upload Error:', error);
    return res.status(500).json({
      error: error.message || 'Image upload failed'
    });
  }
}
