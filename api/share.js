const UPSTASH_URL = 'https://feasible-halibut-74410.upstash.io';
const UPSTASH_TOKEN = 'gQAAAAAAASKqAQIgcDIyM2ZmNGZlMWUzZTY0YjZjODBhZTliYjVlNTMyZTAwNw';
const EXTENDSCLASS_URL = 'https://extendsclass.com/api/json-storage/bin/edbeaff';

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

async function getArticleById(id) {
  // 1. Try high-speed Upstash first
  try {
    const res = await fetch(UPSTASH_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${UPSTASH_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(['GET', 'omerga_news_data'])
    });
    if (res.ok) {
      const resp = await res.json();
      if (resp && resp.result) {
        const data = JSON.parse(resp.result);
        const found = (data?.news || []).find(item => String(item.id) === String(id));
        if (found) return found;
      }
    }
  } catch (e) {}

  // 2. Fallback to ExtendsClass
  try {
    const upstream = await fetch(`${EXTENDSCLASS_URL}?t=${Date.now()}`, {
      headers: { 'Cache-Control': 'no-cache' }
    });
    if (upstream.ok) {
      const raw = await upstream.text();
      let end = raw.lastIndexOf('}');
      while (end > 0) {
        try {
          const data = JSON.parse(raw.slice(0, end + 1));
          const found = (data?.news || []).find(item => String(item.id) === String(id));
          if (found) return found;
          break;
        } catch (retryErr) {
          end = raw.lastIndexOf('}', end - 1);
        }
      }
    }
  } catch (e) {}

  return null;
}

export default async function handler(req, res) {
  const { id } = req.query;
  const proto = req.headers['x-forwarded-proto'] || 'https';
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  const siteUrl = `${proto}://${host}`;

  const userAgent = req.headers['user-agent'] || '';
  const isSocialCrawler = /facebookexternalhit|Facebot|WhatsApp|Twitterbot|TelegramBot/i.test(userAgent);

  let title = 'उमरगा वार्ता - Omerga Warta News Portal';
  let description = 'उमरगा शहर, तालुका आणि धाराशिव जिल्ह्यातील प्रत्येक घडामोडीचे विश्वासार्ह व्यासपीठ.';
  let imageUrl = `${siteUrl}/logo.jpg`;
  let canonicalUrl = `${siteUrl}/`;

  if (id) {
    canonicalUrl = `${siteUrl}/news/${id}`;
    const article = await getArticleById(id);
    if (article) {
      if (article.title_mr || article.title_en) {
        title = (article.title_mr || article.title_en).trim();
      }
      if (article.content_mr) {
        description = article.content_mr.substring(0, 160).replace(/\s+/g, ' ').trim() + '...';
      }
      if (article.image) {
        // Clean direct .jpg URL without query parameters so WhatsApp accepts it immediately
        imageUrl = `${siteUrl}/images/${id}.jpg`;
      }
    }
  }

  const destination = id ? `/?story=${encodeURIComponent(id)}` : '/';

  // In WhatsApp Web, the browser itself (Chrome, Edge, etc.) fetches the link preview.
  // If <meta http-equiv="refresh"> or window.location.replace is present in the HTML,
  // the browser immediately aborts parsing the image and redirects, destroying the preview!
  // Therefore, redirect ONLY on explicit user click, or when loaded by a human who actually visits the URL in an address bar.
  const isDirectBrowserVisit = !isSocialCrawler && !req.headers['sec-fetch-dest'] && req.headers['sec-fetch-mode'] === 'navigate';
  
  // NEVER inject auto-redirect into the initial HTML payload so all crawlers AND WhatsApp Web browsers can read the image.
  const redirectTags = '';

  const html = `<!doctype html>
<html lang="mr" prefix="og: http://ogp.me/ns#">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}" />
  
  <!-- WhatsApp / Open Graph Meta Tags -->
  <meta property="og:site_name" content="उमरगा वार्ता" />
  <meta property="og:title" content="${escapeHtml(title)}" />
  <meta property="og:description" content="${escapeHtml(description)}" />
  <meta property="og:image" content="${escapeHtml(imageUrl)}" />
  <meta property="og:image:url" content="${escapeHtml(imageUrl)}" />
  <meta property="og:image:secure_url" content="${escapeHtml(imageUrl)}" />
  <meta property="og:image:type" content="image/jpeg" />
  <meta property="og:type" content="article" />
  <meta property="og:url" content="${escapeHtml(canonicalUrl)}" />
  <link rel="image_src" href="${escapeHtml(imageUrl)}" />

  <!-- Twitter Meta Tags -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escapeHtml(title)}" />
  <meta name="twitter:description" content="${escapeHtml(description)}" />
  <meta name="twitter:image" content="${escapeHtml(imageUrl)}" />

  <!-- Instant reader redirect for humans only -->
  ${redirectTags}
</head>
<body style="font-family: system-ui, -apple-system, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto; background: #f8fafc; color: #1e293b;">
  <div style="background: #ffffff; border-radius: 12px; padding: 20px; box-shadow: 0 4px 12px rgba(0,0,0,0.08); text-align: left;">
    <img src="${escapeHtml(imageUrl)}" alt="${escapeHtml(title)}" style="width: 100%; height: auto; border-radius: 8px; margin-bottom: 16px;" />
    <h1 style="font-size: 1.3rem; font-weight: 800; color: #0b3c75; line-height: 1.4; margin-bottom: 12px;">${escapeHtml(title)}</h1>
    <p style="font-size: 1rem; color: #475569; line-height: 1.6; margin-bottom: 20px;">${escapeHtml(description)}</p>
    <a href="${destination}" style="display: block; text-align: center; background: #b91c1c; color: #ffffff; text-decoration: none; padding: 12px 20px; border-radius: 8px; font-weight: bold; font-size: 1.05rem;">
      संपूर्ण बातमी उमरगा वार्ता पोर्टलवर वाचा →
    </a>
  </div>
  <script>
    // Smooth redirect for humans who click through
    if (window.self === window.top) {
      setTimeout(function() {
        window.location.replace("${destination}");
      }, 300);
    }
  </script>
</body>
</html>`;

  res.setHeader('Content-Type', 'text/html; charset=UTF-8');
  res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=3600');
  return res.status(200).send(html);
}
