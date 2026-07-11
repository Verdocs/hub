import { buildPostmanCollection } from './postman';
import { buildModel, type OaSpec } from './model';
import { buildRequestBru } from './bruno';
import { buildOutputs } from './tree';
import { SPEC_PATH } from './paths';

const spec: OaSpec = {
  openapi: '3.1.0',
  info: { title: 'Test API', version: '1.0.0', description: 'Test description.' },
  paths: {
    '/v2/widgets/{widget_id}': {
      get: {
        summary: 'Get a widget',
        tags: [ 'Widgets' ],
        parameters: [
          { in: 'path', name: 'widget_id', required: true, description: 'Widget ID.', schema: { type: 'string', format: 'uuid' } },
          { in: 'query', name: 'expand', description: 'Expand relations.', schema: { type: 'boolean' } },
        ],
      },
    },
    '/v2/widgets': {
      post: {
        summary: 'Create a widget',
        tags: [ 'Widgets' ],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { type: 'object', properties: { name: { type: 'string' } } } } },
        },
      },
    },
  },
};

describe('buildPostmanCollection', () => {
  const collection = buildPostmanCollection(buildModel(spec));

  it('targets the v2.1.0 schema with collection-level bearer auth and variables', () => {
    expect(collection.info.schema).toBe('https://schema.getpostman.com/json/collection/v2.1.0/collection.json');
    expect(collection.auth).toEqual({ type: 'bearer', bearer: [ { key: 'token', value: '{{access_token}}', type: 'string' } ] });
    expect(collection.variable.map(v => [ v.key, v.value ])).toEqual([
      [ 'base_url', 'https://stage-api.verdocs.com' ],
      [ 'access_token', '' ],
    ]);
  });

  it('converts path templates to :param segments and disables optional query params', () => {
    const get = collection.item[0]?.item.find(i => i.name === 'Get a widget');
    expect(get?.request.method).toBe('GET');
    expect(get?.request.url.raw).toBe('{{base_url}}/v2/widgets/:widget_id');
    expect(get?.request.url.path).toEqual([ 'v2', 'widgets', ':widget_id' ]);
    expect(get?.request.url.query).toEqual([ { key: 'expand', value: 'true', description: 'Expand relations.', disabled: true } ]);
    expect(get?.request.url.variable).toEqual([ { key: 'widget_id', value: '00000000-0000-0000-0000-000000000000', description: 'Widget ID.' } ]);
  });

  it('emits example JSON bodies with the content-type header', () => {
    const post = collection.item[0]?.item.find(i => i.name === 'Create a widget');
    expect(post?.request.header).toEqual([ { key: 'Content-Type', value: 'application/json' } ]);
    expect(post?.request.body).toEqual({
      mode: 'raw',
      raw: '{\n  "name": "string"\n}',
      options: { raw: { language: 'json' } },
    });
  });
});

describe('buildRequestBru', () => {
  const model = buildModel(spec);

  it('renders the full .bru file for a GET with params', () => {
    const get = model.groups[0]?.requests.find(r => r.name === 'Get a widget');
    expect(get).toBeDefined();
    expect(buildRequestBru(get!, 2)).toBe(`meta {
  name: Get a widget
  type: http
  seq: 2
}

get {
  url: {{base_url}}/v2/widgets/:widget_id
  body: none
  auth: inherit
}

params:query {
  ~expand: true
}

params:path {
  widget_id: 00000000-0000-0000-0000-000000000000
}

docs {
  Path parameters:
  - widget_id: Widget ID.

  Query parameters:
  - expand (optional): Expand relations.
}
`);
  });

  it('renders a json body block for a POST', () => {
    const post = model.groups[0]?.requests.find(r => r.name === 'Create a widget');
    expect(post).toBeDefined();
    const bru = buildRequestBru(post!, 1);
    expect(bru).toContain('post {\n  url: {{base_url}}/v2/widgets\n  body: json\n  auth: inherit\n}');
    expect(bru).toContain('body:json {\n  {\n    "name": "string"\n  }\n}');
  });
});

describe('buildOutputs against the committed spec', () => {
  it('is deterministic: two builds produce identical bytes', () => {
    const first = buildOutputs(SPEC_PATH);
    const second = buildOutputs(SPEC_PATH);
    expect([ ...first.tree.keys() ]).toEqual([ ...second.tree.keys() ]);
    expect(Object.fromEntries(second.tree)).toEqual(Object.fromEntries(first.tree));
  });

  it('emits clean text files: trailing newline, no trailing spaces in .bru files', () => {
    const { tree } = buildOutputs(SPEC_PATH);
    const missingFinalNewline = [ ...tree.entries() ]
      .filter(([ , content ]) => !content.endsWith('\n'))
      .map(([ path ]) => path);
    expect(missingFinalNewline).toEqual([]);

    const withTrailingWhitespace = [ ...tree.entries() ]
      .filter(([ path ]) => path.endsWith('.bru'))
      .filter(([ , content ]) => content.split('\n').some(line => line !== line.trimEnd()))
      .map(([ path ]) => path);
    expect(withTrailingWhitespace).toEqual([]);
  });
});
