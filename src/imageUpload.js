/**
 * Robust Cloud Image Uploader
 * 
 * Flow:
 * 1. Validates file format (JPG, JPEG, PNG, WEBP) & size (< 10MB)
 * 2. Compresses & resizes on canvas for fast mobile upload (< 1200px)
 * 3. Sends to serverless endpoint /api/upload-image which uploads to:
 *    - Cloudinary (if credentials configured in Vercel)
 *    - Catbox Global Cloud File CDN (high-availability HTTPS server fallback)
 * 4. Returns guaranteed HTTPS permanent image URL (never a local base64 or blob URL)
 */

/**
 * Validates image file type and size
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
 * High-performance client-side image compression and resizing.
 * Shrinks 10MB camera shots into high-detail ~150KB - 250KB JPEG for fast transfer.
 */
export function compressImageFile(fileOrDataUrl, maxDimension = 1200, quality = 0.8) {
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
 * Uploads an image to the cloud and returns a permanent HTTPS URL.
 */
export async function uploadImageToCloud(imageInput, onProgress) {
  if (!imageInput) return null;

  // If already a permanent web URL, keep it directly
  if (typeof imageInput === 'string' && imageInput.startsWith('http')) {
    return imageInput;
  }

  let base64Data = imageInput;
  if (imageInput instanceof File || imageInput instanceof Blob) {
    if (onProgress) onProgress('फोटो ऑप्टिमाइझ होत आहे...');
    base64Data = await compressImageFile(imageInput);
  }

  if (onProgress) onProgress('क्लाउड सर्व्हरवर फोटो सुरक्षित केला जात आहे...');

  // 1. Primary: Serverless upload route (supports Cloudinary and server-side CDN fallback)
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

  // 2. Direct Cloudinary Client (if upload preset configured in frontend)
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

  if (cloudName && uploadPreset) {
    try {
      const formData = new FormData();
      formData.append('file', base64Data);
      formData.append('upload_preset', uploadPreset);

      const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: 'POST',
        body: formData
      });

      if (res.ok) {
        const data = await res.json();
        if (data && data.secure_url) {
          if (onProgress) onProgress('✓ Cloudinary वर सेव्ह झाला!');
          return data.secure_url;
        }
      }
    } catch (err) {
      console.warn('Cloudinary direct client upload note:', err);
    }
  }

  throw new Error('फोटो क्लाउडवर सेव्ह करता आला नाही. कृपया इंटरनेट तपासा.');
}
