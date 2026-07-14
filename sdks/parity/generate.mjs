// Generates hub/sdks/API-PARITY.md: one row per public js-sdk symbol, one disposition
// column per ported language. The inventory side is computed from the TypeScript AST by
// walking the export-star barrel graph from src/index.ts, so nothing is hand-listed.
// Dispositions live in dispositions.json next to this script; the coordinator merges
// entries there as port agents complete modules. Cells with no entry render as "pending".
//
// Usage:
//   node sdks/parity/generate.mjs          regenerate API-PARITY.md
//   node sdks/parity/generate.mjs --check  exit 1 if any cell is still pending
//
// Run from the hub root (it resolves typescript from hub/node_modules).

import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const hubRoot = path.resolve(here, '..', '..');
const srcRoot = path.join(hubRoot, 'packages', 'js-sdk', 'src');
const dispositionsPath = path.join(here, 'dispositions.json');
const outputPath = path.resolve(here, '..', 'API-PARITY.md');

const require = createRequire(path.join(hubRoot, 'package.json'));
const ts = require('typescript');

const checkMode = process.argv.includes('--check');

// Resolve an export-star specifier ('./Envelopes') against the importing file's
// directory: a sibling .ts file, or a directory with an index.ts.
function resolveSpecifier(fromFile, specifier) {
  const base = path.resolve(path.dirname(fromFile), specifier);
  for (const candidate of [base + '.ts', path.join(base, 'index.ts')]) {
    if (fs.existsSync(candidate)) return candidate;
  }
  throw new Error(`Cannot resolve ${specifier} from ${fromFile}`);
}

function parse(file) {
  return ts.createSourceFile(file, fs.readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true);
}

function hasExportModifier(node) {
  return (ts.getCombinedModifierFlags(node) & ts.ModifierFlags.Export) !== 0;
}

// Walk the barrel graph breadth-first from src/index.ts, collecting the set of files
// whose exports are public, then the exported symbols per file.
const queue = [path.join(srcRoot, 'index.ts')];
const seenFiles = new Set();
const symbolFiles = [];

while (queue.length > 0) {
  const file = queue.shift();
  if (seenFiles.has(file)) continue;
  seenFiles.add(file);

  const source = parse(file);
  let declaresSymbols = false;

  for (const statement of source.statements) {
    if (ts.isExportDeclaration(statement) && !statement.exportClause && statement.moduleSpecifier) {
      queue.push(resolveSpecifier(file, statement.moduleSpecifier.text));
    } else if (hasExportModifier(statement) || (ts.isExportDeclaration(statement) && statement.exportClause)) {
      declaresSymbols = true;
    }
  }

  if (declaresSymbols) symbolFiles.push(file);
}

function collectSymbols(file) {
  const source = parse(file);
  const symbols = [];

  for (const statement of source.statements) {
    if (ts.isFunctionDeclaration(statement) && hasExportModifier(statement) && statement.name) {
      symbols.push({name: statement.name.text, kind: 'function'});
    } else if (ts.isInterfaceDeclaration(statement) && hasExportModifier(statement)) {
      symbols.push({name: statement.name.text, kind: 'interface'});
    } else if (ts.isTypeAliasDeclaration(statement) && hasExportModifier(statement)) {
      symbols.push({name: statement.name.text, kind: 'type'});
    } else if (ts.isClassDeclaration(statement) && hasExportModifier(statement) && statement.name) {
      symbols.push({name: statement.name.text, kind: 'class'});
    } else if (ts.isEnumDeclaration(statement) && hasExportModifier(statement)) {
      symbols.push({name: statement.name.text, kind: 'enum'});
    } else if (ts.isVariableStatement(statement) && hasExportModifier(statement)) {
      for (const declaration of statement.declarationList.declarations) {
        if (ts.isIdentifier(declaration.name)) {
          symbols.push({name: declaration.name.text, kind: 'const'});
        }
      }
    } else if (ts.isExportDeclaration(statement) && statement.exportClause && ts.isNamedExports(statement.exportClause)) {
      for (const element of statement.exportClause.elements) {
        symbols.push({name: element.name.text, kind: 'reexport'});
      }
    }
  }

  return symbols;
}

// Group rows by module (top-level directory under src, or 'Root' for the loose files).
function moduleOf(file) {
  const relative = path.relative(srcRoot, file);
  const parts = relative.split(path.sep);
  return parts.length > 1 ? parts[0] : 'Root';
}

const rows = [];
const seenSymbols = new Set();
for (const file of symbolFiles) {
  const relative = path.relative(srcRoot, file);
  for (const symbol of collectSymbols(file)) {
    // Utils/index.ts re-exports Fields twice; dedupe on module-qualified name.
    const key = `${relative}#${symbol.name}`;
    if (seenSymbols.has(key)) continue;
    seenSymbols.add(key);
    rows.push({module: moduleOf(file), file: relative, ...symbol});
  }
}

rows.sort((a, b) => a.module.localeCompare(b.module) || a.file.localeCompare(b.file) || a.name.localeCompare(b.name));

const dispositions = fs.existsSync(dispositionsPath) ? JSON.parse(fs.readFileSync(dispositionsPath, 'utf8')) : {};

let pending = 0;
function cell(row, language) {
  const entry = dispositions[`${row.file}#${row.name}`];
  const value = entry?.[language];
  if (!value) {
    pending += 1;
    return 'pending';
  }
  return value;
}

const byModule = new Map();
for (const row of rows) {
  if (!byModule.has(row.module)) byModule.set(row.module, []);
  byModule.get(row.module).push(row);
}

const lines = [];
lines.push('# API Parity: js-sdk 6.10.0 vs C# and Python SDKs');
lines.push('');
lines.push('Generated by sdks/parity/generate.mjs from the js-sdk public surface (the export-star');
lines.push('closure of src/index.ts); do not edit by hand. Dispositions come from');
lines.push('sdks/parity/dispositions.json, which the coordinator owns. Disposition values are:');
lines.push('ported (with the target-language name), adapted (with a note), skipped (with a reason),');
lines.push('or frozen. Files not reachable from the barrel graph (Utils/Retry.ts, Utils/globalThis.js)');
lines.push('are internal, not public surface, and are listed at the bottom for completeness.');
lines.push('');
lines.push(`Total public symbols: ${rows.length}`);
lines.push('');

for (const [module, moduleRows] of byModule) {
  lines.push(`## ${module} (${moduleRows.length} symbols)`);
  lines.push('');
  lines.push('| Symbol | Kind | File | C# | Python |');
  lines.push('| --- | --- | --- | --- | --- |');
  for (const row of moduleRows) {
    lines.push(`| ${row.name} | ${row.kind} | ${row.file} | ${cell(row, 'csharp')} | ${cell(row, 'python')} |`);
  }
  lines.push('');
}

lines.push('## Internal (not public surface)');
lines.push('');
lines.push('- Utils/Retry.ts: retryOnceOnTimeout, internal timeout retry helper; not exported by Utils/index.ts. Both ports implement equivalent behavior internally where the js-sdk applies it.');
lines.push('- Utils/globalThis.js: browser/Node global shim backing getDefault(); not exported. C# has VerdocsEndpoint.Default, Python intentionally has no process-global default (see its module docstring).');
lines.push('');

fs.writeFileSync(outputPath, lines.join('\n'));

const counts = [...byModule.entries()].map(([module, moduleRows]) => `${module} ${moduleRows.length}`).join(', ');
console.log(`Wrote ${path.relative(hubRoot, outputPath)}: ${rows.length} symbols (${counts}); ${pending} pending cells`);

if (checkMode && pending > 0) {
  console.error(`FAIL: ${pending} cells are still pending`);
  process.exit(1);
}
