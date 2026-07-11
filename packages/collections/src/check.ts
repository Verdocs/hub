import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { buildOutputs, diffTrees, readTree, writeTree } from './tree';
import { OUTPUT_DIR, SPEC_PATH } from './paths';

// Staleness gate for CI: regenerate into a temp dir and byte-compare against the committed
// collections/ output. Writing to a real directory (instead of diffing in memory) exercises the
// same write path generate uses, so filesystem quirks surface here too.
const { tree } = buildOutputs(SPEC_PATH);
const tempDir = await mkdtemp(join(tmpdir(), 'verdocs-collections-'));

try {
  await writeTree(tempDir, tree);
  const expected = await readTree(tempDir);
  const actual = await readTree(OUTPUT_DIR);
  const problems = diffTrees(expected, actual);

  if (problems.length > 0) {
    console.error('collections/ is out of date with packages/js-sdk/openapi.json:');
    for (const problem of problems) {
      console.error(`  ${problem}`);
    }
    console.error('\nRegenerate the collections and commit the result:\n  pnpm --filter @verdocs/collections generate');
    // exitCode instead of process.exit() so the finally block still cleans up the temp dir.
    process.exitCode = 1;
  } else {
    console.log(`collections/ is up to date (${tree.size} files).`);
  }
} finally {
  await rm(tempDir, { recursive: true, force: true });
}
