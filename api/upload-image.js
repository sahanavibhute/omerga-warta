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

    // 1. Cloudinary if environment variables are present
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME || process.env.VITE_CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY || process.env.VITE_CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (cloudName && apiKey && apiSecret) {
      try {
        const { v2: cloudinary } = await import('cloudinary');
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

    // 2. High-Availability Server-Side Fallback via Catbox
    try {
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

      const formData = new FormData();
      formData.append('reqtype', 'fileupload');
      formData.append('fileToUpload', new Blob([buffer], { type: mimeType }), `ow_${Date.now()}.${ext}`);

      const catboxRes = await fetch('https://catbox.moe/user/api.php', {
        method: 'POST',
        body: formData
      });

      const catboxText = await catboxRes.text();
      if (catboxRes.ok && catboxText && catboxText.trim().startsWith('http')) {
        return res.status(200).json({
          success: true,
          url: catboxText.trim(),
          provider: 'catbox-cdn'
        });
      }
    } catch (catErr) {
      console.error('Catbox upload error:', catErr.message);
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
