const base = (process.env.SEO_AUDIT_BASE_URL || process.env.APP_URL || 'http://127.0.0.1:43171').replace(/\/$/, '');

const publicRoutes = [
  '/',
  '/about',
  '/partners',
  '/events',
  '/events/destiny',
  '/tickets',
  '/tables',
  '/lineup',
  '/lineup/ryal',
  '/faq',
  '/contact',
  '/terms',
  '/privacy',
  '/news',
  '/gallery',
  '/shop',
];

const privateRoutes = ['/admin/login', '/admin', '/book-now', '/cart', '/checkout/result?checkout_id=seo-audit'];

function absolute(path) {
  return new URL(path, `${base}/`).toString();
}

function attrs(tag) {
  const result = {};
  for (const match of tag.matchAll(/([\w:-]+)\s*=\s*["']([^"']*)["']/g)) result[match[1].toLowerCase()] = match[2];
  return result;
}

function tags(html, name) {
  return [...html.matchAll(new RegExp(`<${name}\\b[^>]*>`, 'gi'))].map((match) => attrs(match[0]));
}

function meta(html, key, value) {
  return tags(html, 'meta').find((item) => item[key] === value)?.content || '';
}

function title(html) {
  return html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.replace(/\s+/g, ' ').trim() || '';
}

function canonical(html) {
  return tags(html, 'link').filter((item) => item.rel?.toLowerCase() === 'canonical').map((item) => item.href).filter(Boolean);
}

function jsonLd(html) {
  const values = [];
  for (const match of html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      values.push(JSON.parse(match[1]));
    } catch {
      throw new Error('Invalid JSON-LD block');
    }
  }
  return values.flatMap((value) => (Array.isArray(value) ? value : [value]));
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function visibleHtml(html) {
  return html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<template\b[^>]*>[\s\S]*?<\/template>/gi, '');
}

async function read(path) {
  const response = await fetch(absolute(path), { redirect: 'follow', headers: { accept: 'text/html' } });
  return { path, response, html: await response.text() };
}

async function checkPage(path, expectedPrivate) {
  const { response, html } = await read(path);
  assert(response.status === 200, `${path}: expected 200, received ${response.status}`);
  const canonicalLinks = canonical(html);
  assert(canonicalLinks.length === 1, `${path}: expected one canonical, found ${canonicalLinks.length}`);
  assert(!/[?&#]/.test(canonicalLinks[0]), `${path}: canonical contains query/hash`);
  assert(title(html), `${path}: missing title`);
  assert(meta(html, 'name', 'description'), `${path}: missing meta description`);
  assert(meta(html, 'property', 'og:title'), `${path}: missing og:title`);
  assert(meta(html, 'property', 'og:description'), `${path}: missing og:description`);
  const ogImage = meta(html, 'property', 'og:image');
  assert(ogImage && /^https?:\/\//i.test(ogImage), `${path}: missing absolute og:image`);
  const twitterImage = meta(html, 'name', 'twitter:image');
  assert(twitterImage && /^https?:\/\//i.test(twitterImage), `${path}: missing absolute twitter:image`);
  const h1Tags = visibleHtml(html).match(/<h1\b[^>]*>/gi) || [];
  const uniqueH1Tags = new Set(h1Tags);
  assert(h1Tags.length > 0 && uniqueH1Tags.size === 1, `${path}: expected exactly one unique h1, found ${uniqueH1Tags.size}`);
  const robots = meta(html, 'name', 'robots').toLowerCase();
  if (expectedPrivate) assert(robots.includes('noindex'), `${path}: private route is indexable`);
  const schemas = jsonLd(html);
  for (const schema of schemas) {
    if (schema['@type'] === 'MusicEvent') assert(schema.startDate, `${path}: MusicEvent is missing startDate`);
    if (schema['@type'] === 'Article') assert(schema.datePublished, `${path}: Article is missing datePublished`);
    if (schema['@type'] === 'Product') assert(schema.offers?.price && schema.offers?.priceCurrency, `${path}: Product is missing offer price`);
  }
  return { path, status: response.status, robots, schemas: schemas.map((schema) => schema['@type']).filter(Boolean) };
}

async function main() {
  const results = [];
  for (const path of publicRoutes) results.push(await checkPage(path, false));
  for (const path of privateRoutes) results.push(await checkPage(path, true));
  const redirect = await fetch(absolute('/event?utm_source=seo-audit'), { redirect: 'manual' });
  assert(redirect.status === 308, `/event: expected 308, received ${redirect.status}`);
  const location = redirect.headers.get('location') || '';
  assert(new URL(location, `${base}/`).pathname === '/events/destiny', `/event: unexpected location ${location}`);

  const robotsResponse = await fetch(absolute('/robots.txt'));
  const robotsText = await robotsResponse.text();
  assert(robotsResponse.status === 200, `/robots.txt: expected 200, received ${robotsResponse.status}`);
  assert(robotsText.includes('Disallow: /admin'), '/robots.txt: admin path is not disallowed');
  assert(robotsText.includes('Disallow: /api'), '/robots.txt: API path is not disallowed');
  assert(robotsText.includes('Sitemap:'), '/robots.txt: sitemap declaration is missing');

  assert(results.every((result) => result.path && result.status === 200), 'metadata route checks did not complete');
  assert(results.some((result) => result.schemas.length > 0), 'structured data is missing from audited pages');
  console.log(`SEO_AUDIT_ROUTES=${results.length}`);
  console.log(`SEO_INDEXING_ENABLED=${process.env.SEO_INDEXING_ENABLED === 'true' ? 'true' : 'false'}`);
  console.log('DYNAMIC_METADATA=PASS');
  console.log('CANONICAL=PASS');
  console.log('ROBOTS=PASS');
  console.log('STRUCTURED_DATA=PASS');
  console.log('SEO_AUDIT=PASS');
}

main().catch((error) => {
  console.error(`SEO_AUDIT=FAIL: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
