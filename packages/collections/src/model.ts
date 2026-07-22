import { readFileSync } from 'node:fs';

import { exampleFromSchema, paramExampleString } from './example';

// Minimal OpenAPI 3.1 typings, just the parts the generators consume. The spec is produced by
// js-sdk's own pipeline and committed there, so we read it as trusted input rather than validating.
export interface OaSchema {
  $ref?: string;
  type?: string | string[];
  format?: string;
  enum?: unknown[];
  const?: unknown;
  example?: unknown;
  examples?: unknown[];
  default?: unknown;
  properties?: Record<string, OaSchema>;
  items?: OaSchema;
  allOf?: OaSchema[];
  anyOf?: OaSchema[];
  oneOf?: OaSchema[];
}

export interface OaParameter {
  in: string;
  name: string;
  description?: string;
  required?: boolean;
  schema?: OaSchema;
}

export interface OaOperation {
  operationId?: string;
  summary?: string;
  description?: string;
  tags?: string[];
  parameters?: OaParameter[];
  requestBody?: {
    required?: boolean;
    content?: Record<string, { schema?: OaSchema }>;
  };
}

export interface OaSpec {
  openapi: string;
  info: { title: string; version: string; description?: string };
  servers?: { url: string; description?: string }[];
  paths: Record<string, Record<string, OaOperation>>;
  components?: { schemas?: Record<string, OaSchema> };
}

export interface ModelParam {
  name: string;
  description: string;
  required: boolean;
  // Params travel in URLs, so examples are pre-rendered as strings.
  example: string;
}

export interface ModelRequest {
  name: string;
  // Filename-safe identifier, unique within its group.
  slug: string;
  method: string;
  // The spec's path template, with {curly} placeholders.
  pathTemplate: string;
  description: string;
  pathParams: ModelParam[];
  queryParams: ModelParam[];
  // Present only when the operation takes a JSON request body.
  bodyExample?: unknown;
}

export interface ModelGroup {
  name: string;
  // Directory name for Bruno output.
  dirname: string;
  requests: ModelRequest[];
}

export interface CollectionModel {
  title: string;
  version: string;
  description: string;
  groups: ModelGroup[];
}

const HTTP_METHODS = [ 'get', 'put', 'post', 'delete', 'options', 'head', 'patch', 'trace' ];

// Beta is the default so imported collections point somewhere safe to experiment against.
export const DEFAULT_BASE_URL = 'https://stage-api.verdocs.com';
export const PRODUCTION_BASE_URL = 'https://api.verdocs.com';

export function loadSpec(specPath: string): OaSpec {
  return JSON.parse(readFileSync(specPath, 'utf8')) as OaSpec;
}

export function slugify(name: string, maxLength = 60): string {
  let slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  if (slug.length > maxLength) {
    // A few spec summaries run whole sentences, which would make unwieldy filenames (and risk
    // Windows path-length limits). Cut at a word boundary; dedupeSlugs guards collisions.
    const head = slug.slice(0, maxLength);
    const lastDash = head.lastIndexOf('-');
    slug = lastDash > 0 ? head.slice(0, lastDash) : head;
  }
  return slug;
}

// Locale-independent compare. localeCompare can order differently across ICU builds, which would
// break the determinism guarantee, so we compare code points directly.
export function byCodePoint(a: string, b: string): number {
  if (a < b) return -1;
  if (a > b) return 1;
  return 0;
}

function sanitizeDirname(name: string): string {
  const cleaned = name.replace(/[^A-Za-z0-9 _-]+/g, '-').trim();
  return cleaned.length > 0 ? cleaned : 'Other';
}

function buildParam(param: OaParameter, schemas: Record<string, OaSchema>): ModelParam {
  return {
    name: param.name,
    description: (param.description ?? '').replace(/\s+/g, ' ').trim(),
    required: param.required === true,
    example: paramExampleString(param.schema, schemas),
  };
}

// The spec's declared path parameters are unreliable: most parameterized paths declare none, and
// a few declare params that are not in the template at all (misparsed body fields). The URL
// template is what a client actually has to fill in, so it is the source of truth; declarations
// only contribute docs and example values when they line up.
function buildPathParams(pathTemplate: string, declared: OaParameter[], schemas: Record<string, OaSchema>): ModelParam[] {
  const names = [ ...pathTemplate.matchAll(/\{([^}]+)\}/g) ].map(match => match[1] ?? '');
  return names.map(name => {
    let param = declared.find(p => p.name === name);
    // Two endpoints declare their only path param under a different name than the template
    // placeholder ({id} declared as document_id). One of each means they are the same parameter.
    if (!param && names.length === 1 && declared.length === 1) param = declared[0];
    return {
      name,
      description: (param?.description ?? '').replace(/\s+/g, ' ').trim(),
      // Path params are always required per OpenAPI, whatever the declaration says.
      required: true,
      example: paramExampleString(param?.schema, schemas),
    };
  });
}

export function buildModel(spec: OaSpec): CollectionModel {
  const schemas = spec.components?.schemas ?? {};
  const groupMap = new Map<string, ModelRequest[]>();

  for (const [ pathTemplate, pathItem ] of Object.entries(spec.paths)) {
    for (const method of HTTP_METHODS) {
      const op = pathItem[method];
      if (!op) continue;

      const groupName = op.tags?.[0] ?? 'Other';
      const name = (op.summary ?? op.operationId ?? `${method.toUpperCase()} ${pathTemplate}`).replace(/\s+/g, ' ').trim();
      const params = op.parameters ?? [];
      const jsonBody = op.requestBody?.content?.['application/json'];

      const request: ModelRequest = {
        name,
        slug: slugify(name),
        method: method.toUpperCase(),
        pathTemplate,
        description: (op.description ?? '').trim(),
        pathParams: buildPathParams(pathTemplate, params.filter(p => p.in === 'path'), schemas),
        queryParams: params.filter(p => p.in === 'query').map(p => buildParam(p, schemas)),
      };
      if (jsonBody?.schema) {
        request.bodyExample = exampleFromSchema(jsonBody.schema, schemas);
      }

      const list = groupMap.get(groupName) ?? [];
      list.push(request);
      groupMap.set(groupName, list);
    }
  }

  const groups: ModelGroup[] = [ ...groupMap.keys() ].sort(byCodePoint).map(groupName => {
    const requests = groupMap.get(groupName) ?? [];
    // Name first, then method and path as tie-breakers so equal summaries still order stably.
    requests.sort((a, b) => byCodePoint(a.name, b.name) || byCodePoint(a.method, b.method) || byCodePoint(a.pathTemplate, b.pathTemplate));
    dedupeSlugs(requests);
    return { name: groupName, dirname: sanitizeDirname(groupName), requests };
  });

  return {
    title: spec.info.title,
    version: spec.info.version,
    description: (spec.info.description ?? '').trim(),
    groups,
  };
}

// Summaries are unique per tag in today's spec, but a future near-duplicate ("Get user" vs
// "Get User") would collide after slugification and silently overwrite a file. Suffix instead.
function dedupeSlugs(requests: ModelRequest[]): void {
  const counts = new Map<string, number>();
  for (const request of requests) {
    const seen = counts.get(request.slug) ?? 0;
    counts.set(request.slug, seen + 1);
    if (seen > 0) {
      request.slug = `${request.slug}-${seen + 1}`;
    }
  }
}
