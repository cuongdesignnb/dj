import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const roots = ['app', 'components', 'lib', 'server'];
const extensions = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs']);
const mockPattern = /Mock(?:Repository|Data|Client)|DATA_SOURCE\s*=\s*["']mock["']|useMockData/i;
const businessPattern = /30\s*[./-]\s*05\s*[./-]\s*2026|30\s+May\s+2026|Friday,\s*30|0476\s*82\s*8888|hello@connectionrave|connectionland\.com|megatix\.com\.au|Metro City,\s*Perth|Perth[’']s next|FINAL\s+(?:RELEASE\s+)?TICKETS/i;

async function files(directory) {
  const entries = await readdir(path.join(root, directory), { withFileTypes: true });
  const result = [];
  for (const entry of entries) {
    const relative = path.join(directory, entry.name);
    if (entry.isDirectory()) result.push(...await files(relative));
    else if (extensions.has(path.extname(entry.name))) result.push(relative);
  }
  return result;
}

async function main() {
  const allFiles = (await Promise.all(roots.map(files))).flat();
  const mockHits = [];
  const businessHits = [];
  for (const file of allFiles) {
    const source = await readFile(path.join(root, file), 'utf8');
    if (mockPattern.test(source)) mockHits.push(file);
    if (businessPattern.test(source)) businessHits.push(file);
  }
  console.log(`RUNTIME_MOCKS_FOUND=${mockHits.length}`);
  console.log(`RUNTIME_HARDCODED_BUSINESS_DATA_FOUND=${businessHits.length}`);
  if (mockHits.length || businessHits.length) {
    if (mockHits.length) console.error(`Mock markers: ${mockHits.join(', ')}`);
    if (businessHits.length) console.error(`Business markers: ${businessHits.join(', ')}`);
    process.exitCode = 1;
    return;
  }
  console.log('RUNTIME_AUDIT=PASS');
}

main().catch((error) => {
  console.error(`RUNTIME_AUDIT=FAIL: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
