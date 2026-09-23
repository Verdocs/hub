#!/usr/bin/env node
// Release one workspace package: gate, publish, tag, GitHub release, docs.
//
//   pnpm release <name> [--publish] [--skip-docs] [--allow-dirty]
//
// <name> is a directory under packages/ (an npm package: js-sdk, react-sdk, ...)
// or under sdks/ (python, csharp). Without --publish this is a dry run: it
// builds, tests, and shows the artifact it would ship but touches neither a
// registry, git tags, nor GitHub. Publishing needs the registry's credential
// in the environment for the run: npm uses your npm login, Python needs
// TWINE_PASSWORD (a PyPI API token), C# needs NUGET_API_KEY. Nothing is read
// from or written to the repo. Tags and releases are named <package>@<version>
// so a monorepo tag says which package it belongs to.
import {execSync, spawnSync} from 'node:child_process';
import {existsSync, readFileSync, rmSync, readdirSync} from 'node:fs';
import {resolve} from 'node:path';

const args = process.argv.slice(2);
const name = args.find((a) => !a.startsWith('--'));
const publish = args.includes('--publish');
const skipDocs = args.includes('--skip-docs');
const allowDirty = args.includes('--allow-dirty');

const root = resolve(import.meta.dirname, '..');
const fail = (msg) => {
  console.error(`\nrelease: ${msg}`);
  process.exit(1);
};
const sh = (cmd, opts = {}) => execSync(cmd, {cwd: root, stdio: 'pipe', encoding: 'utf8', ...opts}).trim();
const run = (cmd, cwd = root, env = {}) => {
  console.log(`\n$ ${cmd}`);
  const r = spawnSync(cmd, {cwd, stdio: 'inherit', shell: true, env: {...process.env, ...env}});
  if (r.status !== 0) fail(`command failed: ${cmd}`);
};
const fetchJson = async (url) => {
  try {
    const r = await fetch(url);
    return r.ok ? await r.json() : null;
  } catch {
    return null;
  }
};

if (!name) fail('usage: pnpm release <name> [--publish] [--skip-docs] [--allow-dirty]');

// Work out what kind of package this is and where its version lives.
let target;
if (existsSync(resolve(root, 'packages', name, 'package.json'))) {
  const dir = resolve(root, 'packages', name);
  const pkg = JSON.parse(readFileSync(resolve(dir, 'package.json'), 'utf8'));
  if (pkg.private) fail(`${pkg.name} is private`);
  target = {kind: 'npm', dir, id: pkg.name, version: pkg.version, docs: !!pkg.scripts?.docs, filter: pkg.name};
} else if (existsSync(resolve(root, 'sdks', name, 'pyproject.toml'))) {
  const dir = resolve(root, 'sdks', name);
  // Changesets versions the wrapper package.json; sync-sdk-versions.mjs copies it into
  // pyproject.toml and __version__. Refuse to release if that copy has not happened.
  const wrapper = JSON.parse(readFileSync(resolve(dir, 'package.json'), 'utf8'));
  const toml = readFileSync(resolve(dir, 'pyproject.toml'), 'utf8');
  const id = toml.match(/^name\s*=\s*"([^"]+)"/m)?.[1];
  const tomlVersion = toml.match(/^version\s*=\s*"([^"]+)"/m)?.[1];
  const initVersion = readFileSync(resolve(dir, 'src', 'verdocs', '__init__.py'), 'utf8').match(/^__version__ = "([^"]+)"/m)?.[1];
  if (tomlVersion !== wrapper.version || initVersion !== wrapper.version) fail(`python versions disagree (package.json ${wrapper.version}, pyproject ${tomlVersion}, __version__ ${initVersion}); run pnpm changeset:version`);
  target = {kind: 'pypi', dir, id, version: wrapper.version, docs: false, filter: wrapper.name};
} else if (existsSync(resolve(root, 'sdks', name, 'Verdocs.Sdk.sln'))) {
  const dir = resolve(root, 'sdks', name);
  const csproj = resolve(dir, 'src', 'Verdocs.Sdk', 'Verdocs.Sdk.csproj');
  const wrapper = JSON.parse(readFileSync(resolve(dir, 'package.json'), 'utf8'));
  const xml = readFileSync(csproj, 'utf8');
  const id = xml.match(/<PackageId>([^<]+)<\/PackageId>/)?.[1];
  const csprojVersion = xml.match(/<Version>([^<]+)<\/Version>/)?.[1];
  if (csprojVersion !== wrapper.version) fail(`csharp versions disagree (package.json ${wrapper.version}, csproj ${csprojVersion}); run pnpm changeset:version`);
  target = {kind: 'nuget', dir, csproj, id, version: wrapper.version, docs: false, filter: wrapper.name};
} else {
  fail(`no releasable package named ${name} under packages/ or sdks/`);
}
if (!target.id || !target.version) fail(`could not read the package name and version for ${name}`);
const tag = `${target.id}@${target.version}`;

console.log(`${publish ? 'RELEASING' : 'DRY RUN'} ${tag} (${target.kind})`);

// Preflight. A real publish wants main, a clean tree, gh signed in, and the
// registry credential for this kind of package.
const branch = sh('git rev-parse --abbrev-ref HEAD');
const dirty = sh('git status --porcelain');
if (publish && branch !== 'main') fail(`publish from main, not ${branch}`);
if (publish && dirty && !allowDirty) fail('working tree is not clean (use --allow-dirty to override)');
if (!publish && branch !== 'main') console.log(`note: on ${branch}, a real publish would need main`);
if (spawnSync('gh', ['auth', 'status'], {encoding: 'utf8'}).status !== 0) fail('gh is not authenticated (gh auth login)');
if (target.kind === 'npm' && !spawnSync('npm', ['whoami'], {encoding: 'utf8'}).stdout?.trim()) fail('not logged in to npm (npm login)');
if (publish && target.kind === 'pypi' && !process.env.TWINE_PASSWORD) fail('set TWINE_PASSWORD to a PyPI API token for this run');
if (publish && target.kind === 'nuget' && !process.env.NUGET_API_KEY) fail('set NUGET_API_KEY for this run');

// Is this version already on the registry?
let onRegistry = false;
if (target.kind === 'npm') onRegistry = !!spawnSync('npm', ['view', tag, 'version'], {encoding: 'utf8'}).stdout?.trim();
if (target.kind === 'pypi') onRegistry = !!(await fetchJson(`https://pypi.org/pypi/${target.id}/${target.version}/json`));
if (target.kind === 'nuget') {
  const idx = await fetchJson(`https://api.nuget.org/v3-flatcontainer/${target.id.toLowerCase()}/index.json`);
  onRegistry = !!idx?.versions?.includes(target.version);
}
if (onRegistry) {
  if (publish) fail(`${tag} is already published; bump the version first`);
  console.log(`note: ${tag} is already published, a real publish would stop here`);
}
if (sh(`git tag -l "${tag}"`)) {
  if (publish) fail(`tag ${tag} already exists`);
  console.log(`note: tag ${tag} already exists`);
}

// Release notes come from the package's CHANGELOG section for this version.
const changelogPath = resolve(target.dir, 'CHANGELOG.md');
let notes = '';
if (existsSync(changelogPath)) {
  const lines = readFileSync(changelogPath, 'utf8').split('\n');
  const start = lines.findIndex((l) => l.trim() === `## ${target.version}`);
  if (start >= 0) {
    let end = lines.findIndex((l, i) => i > start && /^## /.test(l));
    if (end < 0) end = lines.length;
    notes = lines.slice(start + 1, end).join('\n').trim();
  }
}
if (!notes) {
  if (publish) fail(`no "## ${target.version}" section in ${changelogPath}`);
  console.log(`note: no CHANGELOG section for ${target.version} yet`);
}

// Gate, build the artifact, then publish (or the dry run of it).
if (target.kind === 'npm') {
  run(`pnpm --filter ${target.filter} build`);
  run(`pnpm --filter ${target.filter} test`);
  // pnpm has its own clean-tree check on publish; --allow-dirty has to cover that one too.
  if (publish) run(`pnpm publish --access public${allowDirty ? ' --no-git-checks' : ''}`, target.dir);
  else if (onRegistry) run('pnpm pack --pack-destination /tmp', target.dir); // npm refuses even a dry run over a published version
  else run('pnpm publish --access public --dry-run --no-git-checks', target.dir);
}
if (target.kind === 'pypi') {
  run(`pnpm --filter ${target.filter} lint`);
  run(`pnpm --filter ${target.filter} test`);
  rmSync(resolve(target.dir, 'dist'), {recursive: true, force: true});
  run('.venv/bin/python -m build', target.dir);
  run('.venv/bin/python -m twine check dist/*', target.dir);
  if (publish) run('.venv/bin/python -m twine upload dist/*', target.dir, {TWINE_USERNAME: '__token__'});
  else console.log(`would upload: ${readdirSync(resolve(target.dir, 'dist')).join(', ')}`);
}
if (target.kind === 'nuget') {
  run(`pnpm --filter ${target.filter} build`);
  run(`pnpm --filter ${target.filter} test`);
  rmSync(resolve(target.dir, 'out'), {recursive: true, force: true});
  run(`dotnet pack ${target.csproj} -c Release -o out`, target.dir);
  const nupkg = `out/${target.id}.${target.version}.nupkg`;
  if (!existsSync(resolve(target.dir, nupkg))) fail(`expected ${nupkg} after pack`);
  if (publish) run(`dotnet nuget push ${nupkg} --api-key "$NUGET_API_KEY" --source https://api.nuget.org/v3/index.json`, target.dir);
  else console.log(`would push: ${nupkg}`);
}

if (publish) {
  run(`git tag -a "${tag}" -m "${tag}"`);
  run(`git push origin "${tag}"`);
  const r = spawnSync('gh', ['release', 'create', tag, '--title', tag, '--notes', notes], {cwd: root, stdio: 'inherit'});
  if (r.status !== 0) fail('gh release create failed (the tag is pushed; create the release by hand)');
} else {
  console.log(`\nwould tag ${tag}, push it, and create a GitHub release with these notes:\n\n${notes || '(none)'}\n`);
}

// Docs: only packages with a docs script have one, and it writes into the
// sibling platform checkout (apps/dev-docs), which is committed separately.
if (target.docs && !skipDocs) {
  if (publish) run(`pnpm --filter ${target.filter} docs`);
  else console.log(`would run: pnpm --filter ${target.filter} docs (writes into ../platform/apps/dev-docs)`);
}

console.log(`\n${publish ? 'released' : 'dry run complete for'} ${tag}`);
