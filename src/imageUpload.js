/**
 * Universal Multi-Tier Image Uploader
 * 
 * 1. Validates file format (JPG, JPEG, PNG, WEBP) & size (< 10MB)
 * 2. Compresses & resizes on canvas to high-clarity lightweight JPEG (~50KB)
 * 3. Uploads to Cloudinary (if configured) or dedicated cloud storage bin
 * 4. Yields a lightweight, permanent cloud URL
 */

export function validateImageFile(file) {
  if (!file) return { valid: false, error: 'कृपया फोटो निवडा (Please select an image file).' };

  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  const ext = file.name ? file.name.split('.').pop().toLowerCase() : '';
  const validExtensions = ['jpg', 'jpeg', 'png', 'webp'];

  if (!validTypes.includes(file.type) && !validExtensions.includes(ext)) {
    return {
      valid: false,
      error: 'अवैध फाइल फॉरमॅट! फक्त JPG, JPEG, PNG आणि WebP फोटो चालतील.'
    };
  }

  const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
  if (file.size > MAX_SIZE_BYTES) {
    return {
      valid: false,
      error: 'फोटोची साइज 10MB पेक्षा जास्त आहे. कृपया लहान फोटो निवडा.'
    };
  }

  return { valid: true };
}

/**
 * High-performance client-side image compression.
 * Shrinks uploaded camera photos down to ~50KB with sharp clarity.
 */
export function compressImageFile(fileOrDataUrl, maxDimension = 800, quality = 0.7) {
  return new Promise((resolve, reject) => {
    if (typeof fileOrDataUrl === 'string' && fileOrDataUrl.startsWith('data:')) {
      const img = new Image();
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
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = () => resolve(fileOrDataUrl);
      img.src = fileOrDataUrl;
      return;
    }

    const reader = new FileReader();
    reader.onload = (readerEvent) => {
      const img = new Image();
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
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = () => resolve(readerEvent.target.result);
      img.src = readerEvent.target.result;
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(fileOrDataUrl);
  });
}

/**
 * Uploads an image with automatic cloud fallback.
 */
export async function uploadImageToCloud(imageInput, onProgress) {
  if (!imageInput) return null;

  if (typeof imageInput === 'string' && imageInput.startsWith('http')) {
    return imageInput;
  }

  let base64Data = imageInput;
  if (imageInput instanceof File || imageInput instanceof Blob) {
    if (onProgress) onProgress('फोटो ऑप्टिमाइझ होत आहे...');
    base64Data = await compressImageFile(imageInput);
  }

  if (onProgress) onProgress('क्लाउडवर फोटो सुरक्षित केला जात आहे...');

  // 1. Primary: Serverless route (Uploads to Cloudinary if env configured, or creates dedicated storage bin)
  try {
    const res = await fetch('/api/upload-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: base64Data })
    });

    if (res.ok) {
      const data = await res.json();
      if (data && data.url) {
        if (onProgress) onProgress('✓ फोटो क्लाउडवर यशस्वीरीत्या सेव्ह झाला!');
        return data.url;
      }
    }
  } catch (err) {
    console.warn('Serverless image upload note:', err);
  }

  // 2. Client-side fallback: Direct dedicated cloud bin creation
  try {
    const binRes = await fetch('https://extendsclass.com/api/json-storage/bin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: base64Data })
    });
    if (binRes.ok) {
      const binData = await binRes.json();
      if (binData && binData.id) {
        const url = `https://extendsclass.com/api/json-storage/bin/${binData.id}`;
        if (onProgress) onProgress('✓ फोटो क्लाउडवर सेव्ह झाला!');
        return url;
      }
    }
  } catch (e) {
    console.warn('Client direct bin upload note:', e);
  }

  return base64Data;
}
