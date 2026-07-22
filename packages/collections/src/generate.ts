import { rm } from 'node:fs/promises';
import { buildOutputs, writeTree } from './tree';
import { OUTPUT_DIR, SPEC_PATH } from './paths';

const { tree, groupCount, requestCount } = buildOutputs(SPEC_PATH);

// The generator owns collections/ outright. Clearing it first removes files for endpoints that
// have left the spec; everything current is rewritten immediately after.
await rm(OUTPUT_DIR, { recursive: true, force: true });
await writeTree(OUTPUT_DIR, tree);

console.log(`Generated Postman and Bruno collections: ${requestCount} requests in ${groupCount} groups (${tree.size} files) at ${OUTPUT_DIR}`);
