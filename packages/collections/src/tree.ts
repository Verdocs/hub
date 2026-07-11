import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { buildModel, loadSpec, byCodePoint } from './model';
import { brunoReadme, postmanReadme } from './readme';
import { buildPostmanCollection } from './postman';
import { buildBrunoFiles } from './bruno';

// Relative posix paths (under collections/) mapped to file contents.
export type FileTree = Map<string, string>;

export interface BuildResult {
  tree: FileTree;
  groupCount: number;
  requestCount: number;
}

/**
 * Build the full contents of the collections/ output directory in memory. Pure function of the
 * spec file, so generate and check are guaranteed to agree on what "current" looks like.
 */
export function buildOutputs(specPath: string): BuildResult {
  const spec = loadSpec(specPath);
  const model = buildModel(spec);

  const tree: FileTree = new Map();
  tree.set('postman/verdocs-api.postman_collection.json', `${JSON.stringify(buildPostmanCollection(model), null, 2)}\n`);
  tree.set('postman/README.md', postmanReadme(model));
  for (const [ path, content ] of buildBrunoFiles(model)) {
    tree.set(`bruno/${path}`, content);
  }
  tree.set('bruno/README.md', brunoReadme(model));

  return {
    tree,
    groupCount: model.groups.length,
    requestCount: model.groups.reduce((sum, group) => sum + group.requests.length, 0),
  };
}

export async function writeTree(rootDir: string, tree: FileTree): Promise<void> {
  for (const [ path, content ] of tree) {
    const target = join(rootDir, path);
    await mkdir(dirname(target), { recursive: true });
    await writeFile(target, content, 'utf8');
  }
}

export async function readTree(rootDir: string): Promise<FileTree> {
  const tree: FileTree = new Map();
  let entries;
  try {
    entries = await readdir(rootDir, { recursive: true, withFileTypes: true });
  } catch (err) {
    // A missing output dir reads as an empty tree; the diff then reports every file as missing.
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') return tree;
    throw err;
  }
  for (const entry of entries) {
    if (!entry.isFile()) continue;
    const absolute = join(entry.parentPath, entry.name);
    const relative = absolute.slice(rootDir.length + 1).split('\\').join('/');
    tree.set(relative, await readFile(absolute, 'utf8'));
  }
  return tree;
}

/**
 * Compare the generated tree against what is on disk. Returns one message per problem file;
 * empty means the committed output is current.
 */
export function diffTrees(expected: FileTree, actual: FileTree): string[] {
  const problems: string[] = [];
  const paths = [ ...new Set([ ...expected.keys(), ...actual.keys() ]) ].sort(byCodePoint);
  for (const path of paths) {
    const expectedContent = expected.get(path);
    const actualContent = actual.get(path);
    if (expectedContent === undefined) {
      problems.push(`unexpected file (not produced by the generator): ${path}`);
    } else if (actualContent === undefined) {
      problems.push(`missing: ${path}`);
    } else if (expectedContent !== actualContent) {
      problems.push(`stale: ${path}`);
    }
  }
  return problems;
}
