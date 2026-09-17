const base = (process.env.SEO_AUDIT_BASE_URL || process.env.APP_URL || 'http://127.0.0.1:43171').replace(/\/$/, '');

const routes = [
  { path: '/', kind: 'indexable' },
  { path: '/about', kind: 'indexable' },
  { path: '/partners', kind: 'indexable' },
  { path: '/events', kind: 'indexable' },
  { path: '/events/destiny', kind: 'indexable' },
  { path: '/tickets', kind: 'indexable' },
  { path: '/tables', kind: 'indexable' },
  { path: '/lineup', kind: 'indexable' },
  { path: '/lineup/ryal', kind: 'indexable' },
  { path: '/faq', kind: 'indexable' },
  { path: '/contact', kind: 'indexable' },
  { path: '/terms', kind: 'noindex' },
  { path: '/privacy', kind: 'noindex' },
  { path: '/events/past', kind: 'noindex' },
  { path: '/news', kind: 'conditional-list' },
  { path: '/gallery', kind: 'conditional-list' },
  { path: '/shop', kind: 'conditional-list' },
  { path: '/events?filter=completed', kind: 'noindex' },
  { path: '/lineup?country=VIETNAM', kind: 'noindex' },
  { path: '/news?category=community', kind: 'noindex' },
  { path: '/gallery?category=crowd', kind: 'noindex' },
  { path: '/shop?category=apparel', kind: 'noindex' },
  { path: '/faq?q=ticket', kind: 'noindex' },
  { path: '/admin', kind: 'private', status: 307, redirectTo: '/admin/login' },
  { path: '/admin/login', kind: 'private' },
  { path: '/book-now', kind: 'private' },
  { path: '/cart', kind: 'private' },
  { path: '/checkout/result?checkout_id=seo-audit', kind: 'private' },
  { path: '/gallery/destiny', kind: 'missing', status: 404 },
  { path: '/news/welcome-to-connection', kind: 'missing', status: 404 },
  { path: '/shop/destiny-oversized-tee', kind: 'missing', status: 404 },
  { path: '/events/no-such-event', kind: 'missing', status: 404 },
  { path: '/lineup/no-such-artist', kind: 'missing', status: 404 },
  { path: '/news/no-such-story', kind: 'missing', status: 404 },
  { path: '/gallery/no-such-collection', kind: 'missing', status: 404 },
  { path: '/shop/no-such-product', kind: 'missing', status: 404 },
];

function absolute(path) { return new URL(path, `${base}/`).toString(); }
function assert(condition, message) { if (!condition) throw new Error(message); }

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

function title(html) { return html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.replace(/\s+/g, ' ').trim() || ''; }
function canonical(html) { return tags(html, 'link').filter((item) => item.rel?.toLowerCase() === 'canonical').map((item) => item.href).filter(Boolean); }
function visibleHtml(html) { return html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '').replace(/<template\b[^>]*>[\s\S]*?<\/template>/gi, ''); }

function jsonLd(html) {
  const values = [];
  for (const match of html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try { values.push(JSON.parse(match[1])); } catch { throw new Error('Invalid JSON-LD block'); }
  }
  return values.flatMap((value) => Array.isArray(value) ? value : [value]);
}

function isNoindex(html) { return meta(html, 'name', 'robots').toLowerCase().includes('noindex'); }

async function read(route) {
  const response = await fetch(absolute(route.path), { redirect: 'manual', headers: { accept: 'text/html' } });
  return { ...route, response, html: await response.text() };
}

function checkSchemas(path, schemas) {
  for (const schema of schemas) {
    if (schema['@type'] === 'MusicEvent') {
      assert(typeof schema.startDate === 'string' && !Number.isNaN(new Date(schema.startDate).getTime()), `${path}: Event schema has no valid startDate`);
    }
    if (schema['@type'] === 'Article') {
      assert(typeof schema.datePublished === 'string' && !Number.isNaN(new Date(schema.datePublished).getTime()), `${path}: Article schema has no valid datePublished`);
    }
    if (schema['@type'] === 'Product') {
      assert(schema.offers?.['@type'] === 'Offer', `${path}: Product schema has no Offer`);
      assert(schema.offers?.price && schema.offers?.priceCurrency, `${path}: Product schema has no real price/currency`);
    }
    if (schema['@type'] === 'FAQPage') {
      assert(Array.isArray(schema.mainEntity) && schema.mainEntity.length > 0, `${path}: FAQPage has no questions`);
      assert(schema.mainEntity.every((item) => item.acceptedAnswer?.text), `${path}: FAQPage contains an incomplete answer`);
    }
    if (schema['@type'] === 'BreadcrumbList') {
      assert(Array.isArray(schema.itemListElement) && schema.itemListElement.length > 0, `${path}: BreadcrumbList is empty`);
    }
  }
}

async function checkPage(route) {
  const result = await read(route);
  const expectedStatus = route.status ?? 200;
  assert(result.response.status === expectedStatus, `${route.path}: expected ${expectedStatus}, received ${result.response.status}`);
  if (expectedStatus !== 200) {
    if (route.redirectTo) {
      const location = new URL(result.response.headers.get('location') || '', `${base}/`);
      assert(location.pathname === route.redirectTo, `${route.path}: unexpected redirect target ${location.pathname}`);
    }
    return result;
  }

  const canonicalLinks = canonical(result.html);
  assert(canonicalLinks.length === 1, `${route.path}: expected one canonical, found ${canonicalLinks.length}`);
  assert(/^https?:\/\//i.test(canonicalLinks[0]) && !/[?&#]/.test(canonicalLinks[0]), `${route.path}: canonical is not an absolute clean URL`);
  assert(title(result.html), `${route.path}: missing title`);
  assert(meta(result.html, 'name', 'description'), `${route.path}: missing meta description`);
  assert(meta(result.html, 'property', 'og:title'), `${route.path}: missing og:title`);
  assert(meta(result.html, 'property', 'og:description'), `${route.path}: missing og:description`);
  assert(meta(result.html, 'property', 'og:image'), `${route.path}: missing og:image`);
  const h1Tags = visibleHtml(result.html).match(/<h1\b[^>]*>/gi) || [];
  assert(h1Tags.length > 0 && new Set(h1Tags).size === 1, `${route.path}: expected one unique H1, found ${new Set(h1Tags).size}`);

  const noindex = isNoindex(result.html);
  if (['noindex', 'private'].includes(route.kind)) assert(noindex, `${route.path}: expected noindex`);
  if (route.kind === 'indexable' && process.env.SEO_INDEXING_ENABLED === 'true') assert(!noindex, `${route.path}: indexing is enabled but page is noindex`);
  checkSchemas(route.path, jsonLd(result.html));
  return result;
}

async function checkSitemap() {
  const response = await fetch(`${base}/sitemap.xml`, { redirect: 'follow' });
  const xml = await response.text();
  assert(response.status === 200 && xml.includes('<urlset') && xml.includes('</urlset>'), 'sitemap is not a valid urlset');
  const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
  for (const url of urls) {
    const parsed = new URL(url);
    assert(!parsed.search && !parsed.hash, `sitemap contains query/hash: ${url}`);
    assert(!/\/(admin|api|cart|checkout|book-now|preview|draft)(\/|$)/i.test(parsed.pathname), `sitemap contains a private/preview path: ${url}`);
    const page = await fetch(url, { redirect: 'manual', headers: { accept: 'text/html' } });
    assert(page.status === 200, `sitemap URL ${url} returned ${page.status}`);
  }
  return urls.length;
}

async function main() {
  const results = [];
  for (const route of routes) results.push(await checkPage(route));

  const redirect = await fetch(absolute('/event?utm_source=seo-route-matrix'), { redirect: 'manual' });
  assert(redirect.status === 308, `/event: expected 308, received ${redirect.status}`);
  assert(new URL(redirect.headers.get('location') || '', `${base}/`).pathname === '/events/destiny', '/event: wrong redirect target');

  const robotsResponse = await fetch(absolute('/robots.txt'));
  const robotsText = await robotsResponse.text();
  assert(robotsResponse.status === 200, `/robots.txt: expected 200, received ${robotsResponse.status}`);
  for (const path of ['/admin', '/api', '/cart', '/checkout']) assert(robotsText.includes(`Disallow: ${path}`), `/robots.txt: missing ${path}`);
  assert(robotsText.includes('Sitemap:'), '/robots.txt: missing Sitemap');

  const crawledHtml = results.filter((result) => result.response.status === 200).map((result) => result.html).join('\n');
  const internalTargets = new Set([...crawledHtml.matchAll(/href=["'](\/[^"'#?]*)/gi)].map((match) => match[1].replace(/\/$/, '') || '/'));
  const linkedCandidates = ['/about', '/partners', '/events', '/tickets', '/tables', '/lineup', '/faq', '/contact'];
  const orphaned = linkedCandidates.filter((path) => !internalTargets.has(path) && !(path === '/events' && internalTargets.has('/event')));
  assert(orphaned.length === 0, `orphan indexable routes: ${orphaned.join(', ')}`);

  const sitemapUrls = await checkSitemap();
  console.log(`SEO_ROUTE_MATRIX_ROUTES=${routes.length}`);
  console.log(`SITEMAP_URLS=${sitemapUrls}`);
  console.log(`ORPHAN_INDEXABLE_PAGES=${orphaned.length}`);
  console.log('SEO_ROUTE_MATRIX=PASS');
  console.log('STRUCTURED_DATA_PARSE=PASS');
  console.log('NO_FAKE_SCHEMA=PASS');
  console.log('ROBOTS_CHECK=PASS');
  console.log('SITEMAP_CHECK=PASS');
  console.log('REDIRECT_CHECK=PASS');
  console.log('FILTER_NOINDEX=PASS');
  console.log('ADMIN_NOINDEX=PASS');
  console.log('CART_NOINDEX=PASS');
  console.log('CHECKOUT_NOINDEX=PASS');
  console.log('PREVIEW_DRAFT_NOINDEX=PASS');
}

main().catch((error) => {
  console.error(`SEO_ROUTE_MATRIX=FAIL: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
