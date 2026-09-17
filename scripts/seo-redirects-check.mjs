const base = (process.env.SEO_AUDIT_BASE_URL || process.env.APP_URL || 'http://127.0.0.1:43171').replace(/\/$/, '');

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function main() {
  const response = await fetch(`${base}/event?utm_source=redirect-check`, { redirect: 'manual' });
  assert(response.status === 308, `expected /event to return 308, received ${response.status}`);
  const location = response.headers.get('location') || '';
  const destination = new URL(location, `${base}/`);
  assert(destination.pathname === '/events/destiny', `unexpected redirect destination: ${location}`);
  const target = await fetch(destination, { redirect: 'follow' });
  assert(target.status === 200, `redirect target returned ${target.status}`);
  console.log(`REDIRECT_LOCATION=${destination.pathname}`);
  console.log('REDIRECTS=PASS');
}

main().catch((error) => {
  console.error(`REDIRECTS=FAIL: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
