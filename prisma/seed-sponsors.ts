/**
 * Adds the sponsor logos and partners (MCQ, BIHI Entertainment, Bi Hair, VINA9) without
 * touching anything an editor has set. Safe to repeat. `--dry-run` shows the changes and
 * rolls them back.
 *
 *   npx tsx prisma/seed-sponsors.ts [--dry-run]
 */
import { PrismaClient } from '@prisma/client';

import { seedSponsors } from './seeds/16-sponsors';

const db = new PrismaClient();
const dryRun = process.argv.includes('--dry-run');

class DryRunRollback extends Error {}

async function main() {
  let report: string[] = [];
  try {
    await db.$transaction(async (tx) => {
      report = await seedSponsors(tx);
      if (dryRun) throw new DryRunRollback();
    }, { maxWait: 10_000, timeout: 60_000 });
  } catch (error) {
    if (!(error instanceof DryRunRollback)) throw error;
  }
  for (const line of report) console.log(`[sponsors] ${line}`);
  console.log(`[sponsors] ${dryRun ? 'DRY RUN, rolled back' : 'done'}: ${report.length} change(s).`);
}

main()
  .catch((error) => {
    console.error('[sponsors] failed', error);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
