/**
 * Cloud Image Upload Helper
 * Automatically uploads device images to public image CDN (Freeimage.host / ImgBB)
 * so image URLs are universally accessible on ANY phone, tablet, and computer.
 */

// Public API key for freeimage.host
const FREEIMAGE_API_KEY = '6d207e02198a847aa98d0a2a901485a5';

/**
 * Uploads an image File or Base64 data URL to the cloud CDN.
 * Returns the public URL (e.g. https://iili.io/xyz.jpg).
 */
export async function uploadImageToCloudCDN(imageInput) {
  if (!imageInput) return null;

  // If it's already an http/https URL, no need to upload
  if (typeof imageInput === 'string' && imageInput.startsWith('http')) {
    return imageInput;
  }

  try {
    const formData = new FormData();
    formData.append('key', FREEIMAGE_API_KEY);
    formData.append('action', 'upload');
    formData.append('format', 'json');

    if (imageInput instanceof File || imageInput instanceof Blob) {
      formData.append('source', imageInput);
    } else if (typeof imageInput === 'string' && imageInput.startsWith('data:')) {
      // Strip data:image/...;base64, prefix for the API
      const base64Clean = imageInput.split(',')[1];
      formData.append('source', base64Clean);
    } else {
      formData.append('source', imageInput);
    }

    const res = await fetch('https://freeimage.host/api/1/upload', {
      method: 'POST',
      body: formData
    });

    if (res.ok) {
      const json = await res.json();
      if (json && json.image && json.image.url) {
        return json.image.url;
      }
    }
  } catch (err) {
    console.warn('Freeimage upload failed, attempting fallback...', err);
  }

  // Fallback: If cloud CDN is unreachable, compress the base64 image with canvas
  if (typeof imageInput === 'string' && imageInput.startsWith('data:')) {
    try {
      return await compressBase64(imageInput, 800, 0.7);
    } catch (e) {
      return imageInput;
    }
  }

  return imageInput;
}

/**
 * Client-side Canvas Image Compression
 * Shrinks uploaded camera photos down to lightweight WebP/JPEG (< 100KB)
 * to ensure instant loading on mobile 4G networks.
 */
export function compressBase64(dataUrl, maxDimension = 900, quality = 0.75) {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > maxDimension) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        }
      } else {
        if (height > maxDimension) {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);

      const compressed = canvas.toDataURL('image/jpeg', quality);
      resolve(compressed);
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}
