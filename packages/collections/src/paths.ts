import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// Anchor on this file's location rather than cwd so the scripts behave the same whether they are
// run from the package, the repo root, or by turbo.
const packageDir = dirname(dirname(fileURLToPath(import.meta.url)));
const repoRoot = resolve(packageDir, '..', '..');

export const SPEC_PATH = resolve(repoRoot, 'packages', 'js-sdk', 'openapi.json');
export const OUTPUT_DIR = resolve(repoRoot, 'collections');
