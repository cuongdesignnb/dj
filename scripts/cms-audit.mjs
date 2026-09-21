import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();

async function files(directory) {
  const entries = await readdir(path.join(root, directory), { withFileTypes: true });
  const result = [];
  for (const entry of entries) {
    const relative = path.join(directory, entry.name);
    if (entry.isDirectory()) result.push(...await files(relative));
    else if (/\.(ts|tsx|js|jsx|mjs|md)$/.test(entry.name)) result.push(relative);
  }
  return result;
}

function sourcePath(value) {
  return value.replaceAll('\\', '/');
}

function contains(source, value) {
  return source.includes(value);
}

async function main() {
  const sourceFiles = (await Promise.all(['app', 'components', 'lib', 'server', 'prisma'].map(files))).flat();
  const source = new Map(await Promise.all(sourceFiles.map(async (file) => [sourcePath(file), await readFile(path.join(root, file), 'utf8')])));
  const docs = new Map(await Promise.all(['docs/cms/cms-coverage-matrix.md', 'docs/cms/admin-page-map.md'].map(async (file) => [file, await readFile(path.join(root, file), 'utf8').catch(() => '')])));

  const requiredFiles = [
    'lib/cms/page-content.ts', 'lib/cms/public-page.ts', 'lib/navigation/route-registry.ts',
    'server/services/cms.ts', 'prisma/seeds/15-cms.ts',
    'components/admin/cms/MenuEditor.tsx', 'components/admin/cms/MenuLocations.tsx',
    'components/home/Header.tsx', 'components/events/EventsFooter.tsx',
  ];
  const requiredPatterns = [
    ['GET / PATCH page content', 'server/services/cms.ts', 'updateAdminPageContent'],
    ['public page content API', 'app/api/v1/[...path]/route.ts', "root === 'page-content'"],
    ['public navigation API', 'app/api/v1/[...path]/route.ts', "root === 'navigation'"],
    ['navigation permissions', 'lib/admin/auth/permissions.ts', "id: 'navigation'"],
    ['dynamic routes', 'server/services/cms.ts', 'getNavigationRoutes'],
    ['menu cache invalidation', 'server/cache/public-revalidation.ts', 'navigationLocation'],
    ['ticket page binding', 'lib/tickets/repository.ts', 'tickets:${eventId}'],
    ['VIP page binding', 'lib/vip/repository.ts', 'tables:${eventId}'],
    ['booking page binding', 'lib/vip/repository.ts', 'booking:${eventId}'],
    ['listing page binding', 'lib/cms/public-page.ts', 'fetchPublicListingContent'],
  ];
  const missingFiles = requiredFiles.filter((file) => !source.has(file));
  let cmsGaps = missingFiles.length;
  const missingPatterns = requiredPatterns.filter(([, file, pattern]) => !contains(source.get(file) ?? '', pattern));
  cmsGaps += missingPatterns.length;
  cmsGaps += docs.get('docs/cms/cms-coverage-matrix.md')?.includes('| `/tickets`') ? 0 : 1;
  cmsGaps += docs.get('docs/cms/admin-page-map.md')?.includes('| `/book-now`') ? 0 : 1;

  const runtimeCopy = [
    'YOUR NIGHT.', 'YOUR BOOTH.', 'BOOK YOUR EXPERIENCE', 'STAY CONNECTED',
    'Ticket release details will be published here.', 'WHY OUR NIGHTS LAST',
  ];
  const runtimeHardcodeHits = [];
  for (const [file, text] of source) {
    if (file.includes('prisma/seeds/') || file.includes('fixtures') || file.includes('.test.')) continue;
    for (const phrase of runtimeCopy) if (text.includes(phrase)) runtimeHardcodeHits.push(`${file}:${phrase}`);
  }

  const registry = source.get('lib/navigation/route-registry.ts') ?? '';
  const seed = source.get('prisma/seeds/15-cms.ts') ?? '';
  const routeKeys = new Set([...registry.matchAll(/\['([^']+)'\s*,\s*'[^']+'\s*,\s*'[^']+'/g)].map((match) => match[1]));
  const menuKeys = [...seed.matchAll(/items:\s*\[([\s\S]*?)\]\s*}/g)].flatMap((match) => [...match[1].matchAll(/\['[^']+',\s*'([^']+)'\]/g)].map((item) => item[1]));
  const menuBroken = menuKeys.filter((key) => !routeKeys.has(key)).length;

  const mappedRoutes = ['/events', '/events/past', '/lineup', '/news', '/gallery', '/shop', '/tickets', '/tables', '/book-now'];
  const pageMap = docs.get('docs/cms/admin-page-map.md') ?? '';
  const unmapped = mappedRoutes.filter((route) => !pageMap.includes(`| \`${route}\``)).length;

  console.log(`CMS_GAPS=${cmsGaps}`);
  console.log(`RUNTIME_CMS_HARDCODE=${runtimeHardcodeHits.length}`);
  console.log(`MENU_BROKEN_LINKS=${menuBroken}`);
  console.log(`UNMAPPED_CLIENT_ROUTES=${unmapped}`);
  if (runtimeHardcodeHits.length) console.error(`Runtime CMS copy hits: ${runtimeHardcodeHits.join(', ')}`);
  if (cmsGaps || runtimeHardcodeHits.length || menuBroken || unmapped) process.exitCode = 1;
}

main().catch((error) => {
  console.error(`CMS_AUDIT=FAIL: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
