import { DEFAULT_BASE_URL, PRODUCTION_BASE_URL, type CollectionModel, type ModelRequest } from './model';

// Postman Collection Format v2.1, per https://schema.getpostman.com/json/collection/v2.1.0/collection.json.
const POSTMAN_SCHEMA_URL = 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json';

interface PostmanQuery {
  key: string;
  value: string;
  description?: string;
  disabled?: boolean;
}

interface PostmanVariable {
  key: string;
  value: string;
  description?: string;
  type?: string;
}

interface PostmanUrl {
  raw: string;
  host: string[];
  path: string[];
  query?: PostmanQuery[];
  variable?: PostmanVariable[];
}

interface PostmanRequestItem {
  name: string;
  request: {
    method: string;
    header: { key: string; value: string }[];
    url: PostmanUrl;
    description?: string;
    body?: { mode: 'raw'; raw: string; options: { raw: { language: 'json' } } };
  };
  response: unknown[];
}

interface PostmanFolder {
  name: string;
  item: PostmanRequestItem[];
}

export interface PostmanCollection {
  info: { name: string; description: string; version: string; schema: string };
  auth: { type: 'bearer'; bearer: { key: string; value: string; type: string }[] };
  item: PostmanFolder[];
  variable: PostmanVariable[];
}

// Postman uses :name path segments where OpenAPI uses {name}.
function toPostmanSegments(pathTemplate: string): string[] {
  return pathTemplate
    .split('/')
    .filter(segment => segment.length > 0)
    .map(segment => segment.replace(/\{([^}]+)\}/g, ':$1'));
}

function buildUrl(request: ModelRequest): PostmanUrl {
  const segments = toPostmanSegments(request.pathTemplate);

  // Only required params belong in the raw URL; optional ones ride along disabled so they are
  // discoverable in the UI without changing the request that gets sent.
  const enabledPairs = request.queryParams.filter(q => q.required).map(q => `${q.name}=${q.example}`);
  const rawQuery = enabledPairs.length > 0 ? `?${enabledPairs.join('&')}` : '';

  const url: PostmanUrl = {
    raw: `{{base_url}}/${segments.join('/')}${rawQuery}`,
    host: [ '{{base_url}}' ],
    path: segments,
  };

  if (request.queryParams.length > 0) {
    url.query = request.queryParams.map(q => {
      const entry: PostmanQuery = { key: q.name, value: q.example };
      if (q.description) entry.description = q.description;
      if (!q.required) entry.disabled = true;
      return entry;
    });
  }

  if (request.pathParams.length > 0) {
    url.variable = request.pathParams.map(p => {
      const entry: PostmanVariable = { key: p.name, value: p.example };
      if (p.description) entry.description = p.description;
      return entry;
    });
  }

  return url;
}

export function buildPostmanCollection(model: CollectionModel): PostmanCollection {
  return {
    info: {
      name: model.title,
      description: `${model.description}\n\nGenerated from packages/js-sdk/openapi.json by @verdocs/collections. Do not edit by hand.`,
      version: model.version,
      schema: POSTMAN_SCHEMA_URL,
    },
    // Every operation in the spec authenticates the same way, so bearer auth lives at the
    // collection level and each request inherits it.
    auth: {
      type: 'bearer',
      bearer: [ { key: 'token', value: '{{access_token}}', type: 'string' } ],
    },
    item: model.groups.map(group => ({
      name: group.name,
      item: group.requests.map(request => {
        const item: PostmanRequestItem = {
          name: request.name,
          request: {
            method: request.method,
            header: request.bodyExample !== undefined ? [ { key: 'Content-Type', value: 'application/json' } ] : [],
            url: buildUrl(request),
          },
          response: [],
        };
        if (request.description) {
          item.request.description = request.description;
        }
        if (request.bodyExample !== undefined) {
          item.request.body = {
            mode: 'raw',
            raw: JSON.stringify(request.bodyExample, null, 2),
            options: { raw: { language: 'json' } },
          };
        }
        return item;
      }),
    })),
    variable: [
      {
        key: 'base_url',
        value: DEFAULT_BASE_URL,
        description: `API base URL. Defaults to beta; use ${PRODUCTION_BASE_URL} for production.`,
        type: 'string',
      },
      {
        key: 'access_token',
        value: '',
        description: 'Bearer token sent with every request. Obtain one via the Authentication endpoints.',
        type: 'string',
      },
    ],
  };
}
