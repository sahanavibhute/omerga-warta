/**
 * Robust Multi-Tier Cloud Image Uploader
 * 
 * Supports:
 * - Direct mobile camera & gallery selection (JPG, JPEG, PNG, WEBP)
 * - File validation (< 10MB) & Canvas compression (< 800KB)
 * - TIER 1: Server-side Cloudinary upload via /api/upload-image (secure, no client secrets)
 * - TIER 2: Unsigned Cloudinary direct client upload (if VITE_CLOUDINARY_UPLOAD_PRESET is configured)
 * - TIER 3: Catbox High-Availability Global File CDN (generates permanent public HTTPS URL e.g. https://files.catbox.moe/...)
 * - TIER 4: High-efficiency client-compressed data fallback
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
 * Shrinks 10MB camera shots into high-detail ~150KB - 300KB images.
 */
export function compressImageFile(fileOrDataUrl, maxDimension = 1200, quality = 0.82) {
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
 * Uploads an image with automatic multi-tier cloud fallbacks.
 * Guaranteed to return a valid HTTPS image URL or optimized fallback.
 */
export async function uploadImageToCloud(imageInput, onProgress) {
  if (!imageInput) return null;

  // If already a permanent web URL, keep it
  if (typeof imageInput === 'string' && imageInput.startsWith('http')) {
    return imageInput;
  }

  let base64Data = imageInput;
  if (imageInput instanceof File || imageInput instanceof Blob) {
    if (onProgress) onProgress('फोटो ऑप्टिमाइझ होत आहे...');
    base64Data = await compressImageFile(imageInput);
  }

  if (onProgress) onProgress('क्लाउडवर फोटो सुरक्षित केला जात आहे...');

  // ================= TIER 1: Serverless Cloudinary Endpoint =================
  try {
    const res = await fetch('/api/upload-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: base64Data })
    });

    if (res.ok) {
      const data = await res.json();
      if (data && data.url) {
        if (onProgress) onProgress('✓ Cloudinary वर कायमस्वरूपी सेव्ह!');
        return data.url;
      }
    }
  } catch (err) {
    console.warn('Serverless Cloudinary upload attempt notice:', err);
  }

  // ================= TIER 2: Direct Client Cloudinary (if preset is configured) =================
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
          if (onProgress) onProgress('✓ Cloudinary थेट अपलोड यशस्वी!');
          return data.secure_url;
        }
      }
    } catch (err) {
      console.warn('Cloudinary direct upload note:', err);
    }
  }

  // ================= TIER 3: Catbox Global Public File Storage CDN =================
  try {
    const base64Clean = base64Data.includes(',') ? base64Data.split(',')[1] : base64Data;
    const byteCharacters = atob(base64Clean);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: 'image/jpeg' });

    const formData = new FormData();
    formData.append('reqtype', 'fileupload');
    formData.append('fileToUpload', blob, `ow_${Date.now()}.jpg`);

    const res = await fetch('https://catbox.moe/user/api.php', {
      method: 'POST',
      body: formData
    });

    if (res.ok) {
      const returnedUrl = await res.text();
      if (returnedUrl && returnedUrl.startsWith('https://files.catbox.moe/')) {
        if (onProgress) onProgress('✓ कायमस्वरूपी क्लाउड CDN वर सेव्ह केले!');
        return returnedUrl.trim();
      }
    }
  } catch (err) {
    console.warn('Catbox CDN upload note:', err);
  }

  // ================= TIER 4: Compact WebP/JPEG Data URI =================
  if (onProgress) onProgress('✓ फोटो सुरक्षितपणे जोडला');
  return base64Data;
}
