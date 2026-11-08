const STORAGE_API_URL = 'https://extendsclass.com/api/json-storage/bin/edbeaff';

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export default async function handler(req, res) {
  const { id } = req.query;
  const proto = req.headers['x-forwarded-proto'] || 'https';
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  const siteUrl = `${proto}://${host}`;

  let title = 'उमरगा वार्ता - Omerga Warta News Portal';
  let description = 'उमरगा शहर, तालुका आणि धाराशिव जिल्ह्यातील प्रत्येक घडामोडीचे विश्वासार्ह व्यासपीठ.';
  let imageUrl = `${siteUrl}/logo.jpg`;
  let canonicalUrl = `${siteUrl}/`;

  if (id) {
    canonicalUrl = `${siteUrl}/news/${id}`;
    try {
      const upstream = await fetch(`${STORAGE_API_URL}?t=${Date.now()}`, {
        headers: { 'Cache-Control': 'no-cache' }
      });
      if (upstream.ok) {
        const data = await upstream.json();
        const article = (data.news || []).find(item => String(item.id) === String(id));
        if (article) {
          if (article.title_mr || article.title_en) {
            title = (article.title_mr || article.title_en).trim();
          }
          if (article.content_mr) {
            description = article.content_mr.substring(0, 160).replace(/\s+/g, ' ').trim() + '...';
          }
          if (article.image) {
            imageUrl = `${siteUrl}/api/image?id=${id}`;
          }
        }
      }
    } catch (e) {
      console.warn('Share meta fetch error:', e);
    }
  }

  const destination = id ? `/?story=${encodeURIComponent(id)}` : '/';

  // Always return 200 with full Open Graph tags so every WhatsApp / Facebook / Telegram client parses the preview.
  // Real humans are immediately redirected by JavaScript and meta-refresh to the reading modal.
  const html = `<!doctype html>
<html lang="mr" prefix="og: http://ogp.me/ns#">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}" />
  
  <!-- Open Graph / WhatsApp Preview Meta -->
  <meta property="og:type" content="article" />
  <meta property="og:site_name" content="उमरगा वार्ता" />
  <meta property="og:title" content="${escapeHtml(title)}" />
  <meta property="og:description" content="${escapeHtml(description)}" />
  <meta property="og:image" content="${escapeHtml(imageUrl)}" />
  <meta property="og:image:secure_url" content="${escapeHtml(imageUrl)}" />
  <meta property="og:image:type" content="image/jpeg" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:url" content="${escapeHtml(canonicalUrl)}" />

  <!-- Twitter Preview Meta -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escapeHtml(title)}" />
  <meta name="twitter:description" content="${escapeHtml(description)}" />
  <meta name="twitter:image" content="${escapeHtml(imageUrl)}" />

  <!-- Fast client redirect for humans -->
  <meta http-equiv="refresh" content="0;url=${destination}" />
  <script>
    window.location.replace("${destination}");
  </script>
</head>
<body style="font-family: system-ui, sans-serif; padding: 24px; text-align: center; background: #fffdf5; color: #1e293b;">
  <h2>${escapeHtml(title)}</h2>
  <p>${escapeHtml(description)}</p>
  <p><a href="${destination}" style="color: #0b3c75; font-weight: bold; text-decoration: underline;">येथे क्लिक करून संपूर्ण बातमी वाचा...</a></p>
</body>
</html>`;

  res.setHeader('Content-Type', 'text/html; charset=UTF-8');
  res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=300');
  return res.status(200).send(html);
}
