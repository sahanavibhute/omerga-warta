import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary using server-side environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || process.env.VITE_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY || process.env.VITE_CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb'
    }
  }
};

export default async function handler(req, res) {
  // CORS & method verification
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

    // Check Cloudinary configuration
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME || process.env.VITE_CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY || process.env.VITE_CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
      return res.status(503).json({
        error: 'Cloudinary credentials are not configured on server',
        needsConfig: {
          CLOUDINARY_CLOUD_NAME: Boolean(cloudName),
          CLOUDINARY_API_KEY: Boolean(apiKey),
          CLOUDINARY_API_SECRET: Boolean(apiSecret)
        }
      });
    }

    // Server-side upload to Cloudinary with automated format and responsive quality optimization
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
      publicId: uploadResult.public_id,
      format: uploadResult.format,
      width: uploadResult.width,
      height: uploadResult.height
    });
  } catch (error) {
    console.error('Cloudinary Serverless Upload Error:', error);
    return res.status(500).json({
      error: error.message || 'Image upload failed'
    });
  }
}
