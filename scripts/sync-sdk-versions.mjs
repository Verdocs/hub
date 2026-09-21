#!/usr/bin/env node
// Copies the version changesets assigned to the Python and C# wrapper packages into the
// files those toolchains actually read: pyproject.toml, the package __version__, and the
// csproj <Version>. Runs after `changeset version` so nothing is bumped by hand.
import {readFileSync, writeFileSync} from 'node:fs';
import {resolve} from 'node:path';

const root = resolve(import.meta.dirname, '..');
const read = (p) => readFileSync(resolve(root, p), 'utf8');
const replaceOnce = (p, pattern, replacement) => {
  const before = read(p);
  const after = before.replace(pattern, replacement);
  if (after === before) return false;
  writeFileSync(resolve(root, p), after);
  return true;
};

const python = JSON.parse(read('sdks/python/package.json')).version;
const csharp = JSON.parse(read('sdks/csharp/package.json')).version;

const changed = [
  replaceOnce('sdks/python/pyproject.toml', /^version = "[^"]+"/m, `version = "${python}"`) && 'pyproject.toml',
  replaceOnce('sdks/python/src/verdocs/__init__.py', /^__version__ = "[^"]+"/m, `__version__ = "${python}"`) && '__init__.py',
  replaceOnce('sdks/csharp/src/Verdocs.Sdk/Verdocs.Sdk.csproj', /<Version>[^<]+<\/Version>/, `<Version>${csharp}</Version>`) && 'Verdocs.Sdk.csproj',
].filter(Boolean);

console.log(`python-sdk ${python}, csharp-sdk ${csharp}${changed.length ? `; updated ${changed.join(', ')}` : '; already in sync'}`);
