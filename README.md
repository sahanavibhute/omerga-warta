# Omerga Warta (उमरगा वार्ता) - News Portal & Publishing System

Comprehensive digital news portal for Omerga and Dharashiv district with real-time editorial publishing, cloud-based image CDN storage, horoscope management, and responsive advertisements.

---

## 📸 Image Upload & Cloud Storage Architecture

The application implements a secure, multi-tier cloud upload architecture:

1. **Cloudinary (Primary Secure Server-Side Storage)**:
   - Handled server-side through `/api/upload-image` (Vercel Serverless Function).
   - Secures API secrets on the server so credentials are never exposed in frontend bundles.
   - Automatically compresses, resizes (max 1200px limit), and formats to optimal WebP/JPEG.
   - Generates permanent HTTPS URLs (`https://res.cloudinary.com/...`).

2. **Automated Fallback Cloud CDN (Catbox Global File Storage)**:
   - If Cloudinary credentials are not yet configured or temporarily rate-limited, image uploads automatically fall back to Catbox high-availability global CDN.
   - Produces permanent public HTTPS links (`https://files.catbox.moe/...`).
   - Ensures zero downtime or upload failures from any phone, tablet, or PC.

3. **Client-Side Optimization**:
   - Supports JPG, JPEG, PNG, and WebP formats.
   - Validates file size (up to 10MB).
   - High-performance canvas down-scaling ensures ultra-fast mobile upload speeds even on 3G/4G networks.

---

## 🔑 Environment Variables Configuration (Vercel)

To configure your own Cloudinary account on Vercel:

1. Open your **Vercel Project Dashboard** -> **Settings** -> **Environment Variables**.
2. Add the following environment variables:

| Variable Name | Description | Example / Location |
| :--- | :--- | :--- |
| `CLOUDINARY_CLOUD_NAME` | Your Cloudinary Cloud Name | Cloudinary Dashboard -> Product Environment |
| `CLOUDINARY_API_KEY` | Your Cloudinary API Key | Cloudinary Dashboard -> API Keys |
| `CLOUDINARY_API_SECRET` | Your Cloudinary API Secret (server-side only) | Cloudinary Dashboard -> API Keys |

> [!NOTE]
> Even if you have not configured Cloudinary credentials yet, the application's automated cloud fallback (Tier 3) will upload images to a permanent public HTTPS CDN, ensuring that images are immediately visible to everyone on all devices.

---

## 🛠️ Admin Dashboard (`/admin`)

- **Secure Login**:
  - Username: `adminmahesh`
  - Password: `admin55@`
- **Features**:
  - Create and publish news articles with device image uploads and live preview.
  - Save as **Draft** or **Publish** directly to the public website.
  - Edit or delete existing articles.
  - Update daily Horoscope (Rashi Bhavishya) with auto-translation.
  - Manage advertisements: Header banner, sidebar banner, and custom click URLs.

---

## 🚀 Deployment Instructions

1. Clone repository:
   ```bash
   git clone https://github.com/sahanavibhute/omerga-warta.git
   cd omerga-warta
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run local dev server:
   ```bash
   npm run dev
   ```
4. Build for production:
   ```bash
   npm run build
   ```
5. Deploy to Vercel:
   - Connect the GitHub repository in Vercel.
   - Framework preset: **Vite**.
   - Build command: `npm run build`.
   - Output directory: `dist`.
