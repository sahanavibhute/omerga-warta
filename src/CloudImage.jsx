import React, { useState, useEffect } from 'react';

// Cache for resolved cloud image bins
const imageCache = new Map();

/**
 * Universal Responsive Cloud Image Component
 * Resolves standard image URLs, data URIs, or dedicated JSON cloud storage bins.
 */
export default function CloudImage({ src, alt, className, style, onError }) {
  const [resolvedSrc, setResolvedSrc] = useState(() => {
    if (!src) return '/logo.jpg';
    if (imageCache.has(src)) return imageCache.get(src);
    // If it's a direct image file or data URI, return immediately
    if (src.startsWith('data:') || src.startsWith('/') || src.includes('.jpg') || src.includes('.png') || src.includes('.webp') || src.includes('cloudinary.com')) {
      return src;
    }
    return '/logo.jpg';
  });

  useEffect(() => {
    if (!src) {
      setResolvedSrc('/logo.jpg');
      return;
    }

    if (src.startsWith('data:') || src.startsWith('/') || src.includes('.jpg') || src.includes('.png') || src.includes('.webp') || src.includes('cloudinary.com')) {
      setResolvedSrc(src);
      return;
    }

    // If it is a cloud bin reference (e.g. extendsclass bin)
    if (src.includes('extendsclass.com/api/json-storage/bin/')) {
      if (imageCache.has(src)) {
        setResolvedSrc(imageCache.get(src));
        return;
      }

      fetch(src)
        .then(res => res.json())
        .then(data => {
          if (data && (data.image || data.url)) {
            const actualImage = data.image || data.url;
            imageCache.set(src, actualImage);
            setResolvedSrc(actualImage);
          }
        })
        .catch(err => {
          console.warn('CloudImage resolve error:', err);
        });
    }
  }, [src]);

  return (
    <img
      src={resolvedSrc}
      alt={alt || 'News image'}
      className={className}
      style={style}
      loading="lazy"
      onError={(e) => {
        if (e.target.src !== '/logo.jpg') {
          e.target.src = '/logo.jpg';
        }
        if (onError) onError(e);
      }}
    />
  );
}
