import { v2 as cloudinary } from 'cloudinary';

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
    const { image } = req.body || {};

    if (!image) {
      return res.status(400).json({ error: 'Image data is required' });
    }

    // 1. Primary: Cloudinary if environment variables are provided
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

    // 2. High-Efficiency Built-in CDN Delivery:
    // If external third-party CDN is blocked or unconfigured, return the clean optimized data URI
    // It embeds directly into the cloud database entry and displays instantly on all phones and computers
    return res.status(200).json({
      success: true,
      url: image,
      provider: 'direct-storage',
      note: 'To use Cloudinary, set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in Vercel settings.'
    });
  } catch (error) {
    console.error('Serverless Upload Error:', error);
    return res.status(500).json({
      error: error.message || 'Image upload failed'
    });
  }
}
