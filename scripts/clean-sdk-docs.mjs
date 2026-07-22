import {unlinkSync} from 'node:fs';
import {resolve} from 'node:path';

const root = resolve(import.meta.dirname, '..');

const paths = [
  'packages/js-sdk/sdk-docs.json',
  'packages/js-sdk/unified-sdks.json',
  'sdks/python/sdk-docs.json',
  'sdks/csharp/sdk-docs.json',
];

for (const relativePath of paths) {
  const absolutePath = resolve(root, relativePath);

  try {
    unlinkSync(absolutePath);
    console.log(`Removed ${relativePath}`);
  } catch (error) {
    if (error.code !== 'ENOENT') {
      throw error;
    }
  }
}
