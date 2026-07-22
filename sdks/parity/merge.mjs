// Merges port-agent disposition drops (incoming/*.json) into dispositions.json and
// regenerates API-PARITY.md. Each drop maps "<js-sdk relative file>#<symbol>" to
// {csharp: "...", python: "..."} (either or both languages). Keys that do not match a
// row in the generated inventory are reported as errors so typos never silently vanish.
//
// Usage, from the hub root: node sdks/parity/merge.mjs

import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const incomingDir = path.join(here, 'incoming');
const dispositionsPath = path.join(here, 'dispositions.json');

const dispositions = fs.existsSync(dispositionsPath) ? JSON.parse(fs.readFileSync(dispositionsPath, 'utf8')) : {};

// The inventory of valid keys comes from the parity table itself; regenerate first so
// we validate against the current js-sdk surface.
execFileSync('node', [path.join(here, 'generate.mjs')], {stdio: 'inherit'});
const parityMd = fs.readFileSync(path.resolve(here, '..', 'API-PARITY.md'), 'utf8');
const validKeys = new Set();
for (const line of parityMd.split('\n')) {
  if (!line.startsWith('|') || line.startsWith('| Symbol') || line.startsWith('| ---')) continue;
  const [, name, , file] = line.split('|').map(part => part.trim());
  if (name && file) validKeys.add(`${file}#${name}`);
}

const allowed = ['ported', 'adapted', 'skipped', 'frozen'];
let merged = 0;
const errors = [];

for (const drop of fs.existsSync(incomingDir) ? fs.readdirSync(incomingDir).filter(f => f.endsWith('.json')) : []) {
  const dropPath = path.join(incomingDir, drop);
  const entries = JSON.parse(fs.readFileSync(dropPath, 'utf8'));
  for (const [key, value] of Object.entries(entries)) {
    if (!validKeys.has(key)) {
      errors.push(`${drop}: unknown key ${key}`);
      continue;
    }
    for (const [language, disposition] of Object.entries(value)) {
      if (!['csharp', 'python'].includes(language)) {
        errors.push(`${drop}: ${key} has unknown language ${language}`);
        continue;
      }
      if (!allowed.some(prefix => disposition.startsWith(prefix))) {
        errors.push(`${drop}: ${key} ${language} disposition must start with ported/adapted/skipped/frozen`);
        continue;
      }
      dispositions[key] = {...dispositions[key], [language]: disposition};
      merged += 1;
    }
  }
  fs.unlinkSync(dropPath);
  console.log(`merged ${drop}`);
}

fs.writeFileSync(dispositionsPath, JSON.stringify(dispositions, null, 1) + '\n');
execFileSync('node', [path.join(here, 'generate.mjs')], {stdio: 'inherit'});

console.log(`merged ${merged} cells`);
if (errors.length > 0) {
  console.error('ERRORS:\n' + errors.join('\n'));
  process.exit(1);
}
