const base = (process.env.SEO_AUDIT_BASE_URL || process.env.APP_URL || 'http://127.0.0.1:43171').replace(/\/$/, '');

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function main() {
  const response = await fetch(`${base}/sitemap.xml`, { redirect: 'follow' });
  const xml = await response.text();
  assert(response.status === 200, `expected 200, received ${response.status}`);
  assert(xml.includes('<urlset') && xml.includes('</urlset>'), 'sitemap is not a urlset');
  const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
  for (const url of urls) {
    assert(!/[?&#]/.test(url), `query/hash found in sitemap URL: ${url}`);
    assert(!/\/(admin|api|cart|checkout|book-now|preview|draft)(\/|$)/i.test(new URL(url).pathname), `private/preview URL found in sitemap: ${url}`);
  }
  console.log(`SITEMAP_URLS=${urls.length}`);
  console.log('SITEMAP=PASS');
}

main().catch((error) => {
  console.error(`SITEMAP=FAIL: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
