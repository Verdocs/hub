import { DEFAULT_BASE_URL, PRODUCTION_BASE_URL, type CollectionModel, type ModelRequest } from './model';

// Bru (.bru) dictionary values are single-line and unquoted, so writers below assume inputs with
// no newlines. The model normalizes names and descriptions before they get here.

interface BruPair {
  key: string;
  value: string;
  // Disabled entries are written with the ~ prefix Bruno uses for unchecked params.
  enabled?: boolean;
}

function bruDict(tag: string, pairs: BruPair[]): string {
  const lines = pairs.map(pair => `  ${pair.enabled === false ? '~' : ''}${pair.key}: ${pair.value}`.trimEnd());
  return `${tag} {\n${lines.join('\n')}\n}`;
}

function bruTextBlock(tag: string, text: string): string {
  const indented = text
    .split('\n')
    .map(line => `  ${line}`.trimEnd())
    .join('\n');
  return `${tag} {\n${indented}\n}`;
}

// Bruno's parser tracks brace nesting inside text blocks, so balanced braces are fine but an
// unbalanced one would corrupt the whole file. Today's spec has no braces in prose; this guard
// keeps a future description from silently breaking the collection.
function safeDocsText(text: string): string {
  let depth = 0;
  let balanced = true;
  for (const ch of text) {
    if (ch === '{') depth += 1;
    if (ch === '}') {
      depth -= 1;
      if (depth < 0) balanced = false;
    }
  }
  if (balanced && depth === 0) return text;
  return text.replace(/[{}]/g, '');
}

// Bruno uses :name path segments, same convention as Postman.
function toBrunoPath(pathTemplate: string): string {
  return pathTemplate.replace(/\{([^}]+)\}/g, ':$1');
}

function requestUrl(request: ModelRequest): string {
  const enabledPairs = request.queryParams.filter(q => q.required).map(q => `${q.name}=${q.example}`);
  const rawQuery = enabledPairs.length > 0 ? `?${enabledPairs.join('&')}` : '';
  return `{{base_url}}${toBrunoPath(request.pathTemplate)}${rawQuery}`;
}

// The params blocks already enumerate every parameter, so docs only carry what they cannot:
// prose. Params without descriptions are skipped rather than padded with filler.
function requestDocs(request: ModelRequest): string {
  const sections: string[] = [];
  if (request.description) sections.push(request.description);
  const pathLines = request.pathParams.filter(p => p.description).map(p => `- ${p.name}: ${p.description}`);
  if (pathLines.length > 0) {
    sections.push(`Path parameters:\n${pathLines.join('\n')}`);
  }
  const queryLines = request.queryParams.filter(p => p.description).map(p => `- ${p.name}${p.required ? '' : ' (optional)'}: ${p.description}`);
  if (queryLines.length > 0) {
    sections.push(`Query parameters:\n${queryLines.join('\n')}`);
  }
  return safeDocsText(sections.join('\n\n'));
}

export function buildRequestBru(request: ModelRequest, seq: number): string {
  const blocks: string[] = [];

  blocks.push(bruDict('meta', [
    { key: 'name', value: request.name },
    { key: 'type', value: 'http' },
    { key: 'seq', value: String(seq) },
  ]));

  blocks.push(bruDict(request.method.toLowerCase(), [
    { key: 'url', value: requestUrl(request) },
    { key: 'body', value: request.bodyExample !== undefined ? 'json' : 'none' },
    { key: 'auth', value: 'inherit' },
  ]));

  if (request.queryParams.length > 0) {
    blocks.push(bruDict('params:query', request.queryParams.map(q => ({ key: q.name, value: q.example, enabled: q.required }))));
  }

  if (request.pathParams.length > 0) {
    blocks.push(bruDict('params:path', request.pathParams.map(p => ({ key: p.name, value: p.example }))));
  }

  if (request.bodyExample !== undefined) {
    blocks.push(bruTextBlock('body:json', JSON.stringify(request.bodyExample, null, 2)));
  }

  const docs = requestDocs(request);
  if (docs) {
    blocks.push(bruTextBlock('docs', docs));
  }

  return `${blocks.join('\n\n')}\n`;
}

function collectionBru(model: CollectionModel): string {
  const blocks = [
    // Requests declare auth: inherit, so the one bearer config here covers the whole collection.
    bruDict('auth', [ { key: 'mode', value: 'bearer' } ]),
    bruDict('auth:bearer', [ { key: 'token', value: '{{access_token}}' } ]),
    bruTextBlock('docs', safeDocsText(`${model.description}\n\nGenerated from packages/js-sdk/openapi.json by @verdocs/collections. Do not edit by hand.`)),
  ];
  return `${blocks.join('\n\n')}\n`;
}

function betaEnvironmentBru(): string {
  // access_token is declared secret so Bruno never writes its value back into this committed file.
  const blocks = [
    bruDict('vars', [ { key: 'base_url', value: DEFAULT_BASE_URL } ]),
    `vars:secret [\n  access_token\n]`,
  ];
  return `${blocks.join('\n\n')}\n`;
}

function folderBru(name: string, seq: number): string {
  return `${bruDict('meta', [ { key: 'name', value: name }, { key: 'seq', value: String(seq) } ])}\n`;
}

/**
 * Build the Bruno collection as a map of file paths (relative to the collection root) to
 * contents: bruno.json, collection.bru, a beta environment, and a folder of .bru files per group.
 */
export function buildBrunoFiles(model: CollectionModel): Map<string, string> {
  const files = new Map<string, string>();

  const manifest = {
    version: '1',
    name: model.title,
    type: 'collection',
    ignore: [ 'node_modules', '.git' ],
  };
  files.set('bruno.json', `${JSON.stringify(manifest, null, 2)}\n`);
  files.set('collection.bru', collectionBru(model));
  files.set('environments/beta.bru', betaEnvironmentBru());

  model.groups.forEach((group, groupIndex) => {
    files.set(`${group.dirname}/folder.bru`, folderBru(group.name, groupIndex + 1));
    group.requests.forEach((request, requestIndex) => {
      files.set(`${group.dirname}/${request.slug}.bru`, buildRequestBru(request, requestIndex + 1));
    });
  });

  return files;
}

export function brunoBaseUrlNote(): string {
  return `The beta environment points base_url at ${DEFAULT_BASE_URL}. For production, add an environment with base_url set to ${PRODUCTION_BASE_URL}.`;
}
