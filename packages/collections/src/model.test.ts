import { buildModel, slugify, type OaSpec } from './model';

function specWith(paths: OaSpec['paths'], schemas: NonNullable<OaSpec['components']>['schemas'] = {}): OaSpec {
  return {
    openapi: '3.1.0',
    info: { title: 'Test API', version: '1.0.0', description: 'Test description.' },
    paths,
    components: { schemas },
  };
}

describe('slugify', () => {
  it('lowercases and collapses non-alphanumerics into single dashes', () => {
    expect(slugify('Get Templates')).toBe('get-templates');
    expect(slugify("Update a recipient's status")).toBe('update-a-recipient-s-status');
    expect(slugify('  Trim -- me  ')).toBe('trim-me');
  });

  it('caps long names at a word boundary', () => {
    expect(slugify('alpha beta gamma delta', 15)).toBe('alpha-beta');
    expect(slugify('a'.repeat(80), 15)).toBe('a'.repeat(15));
  });
});

describe('buildModel', () => {
  it('sorts groups and requests alphabetically regardless of spec order', () => {
    const model = buildModel(specWith({
      '/v2/widgets': {
        post: { summary: 'Create a widget', tags: [ 'Widgets' ] },
        get: { summary: 'List widgets', tags: [ 'Widgets' ] },
      },
      '/v2/auth': {
        post: { summary: 'Authenticate', tags: [ 'Auth' ] },
      },
    }));

    expect(model.groups.map(g => g.name)).toEqual([ 'Auth', 'Widgets' ]);
    expect(model.groups[1]?.requests.map(r => r.name)).toEqual([ 'Create a widget', 'List widgets' ]);
  });

  it('suffixes colliding slugs so files never overwrite each other', () => {
    const model = buildModel(specWith({
      '/v2/a': { get: { summary: 'Ping', tags: [ 'Misc' ] } },
      '/v2/b': { get: { summary: 'Ping', tags: [ 'Misc' ] } },
    }));

    expect(model.groups[0]?.requests.map(r => r.slug)).toEqual([ 'ping', 'ping-2' ]);
  });

  it('separates path and query parameters and derives examples', () => {
    const model = buildModel(specWith({
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
    }));

    const request = model.groups[0]?.requests[0];
    expect(request?.pathParams).toEqual([
      { name: 'widget_id', description: 'Widget ID.', required: true, example: '00000000-0000-0000-0000-000000000000' },
    ]);
    expect(request?.queryParams).toEqual([
      { name: 'expand', description: 'Expand relations.', required: false, example: 'true' },
    ]);
  });

  it('takes path params from the URL template, not the declaration list', () => {
    const model = buildModel(specWith({
      // Mirrors real spec quirks: {organizationid} is undeclared, and sign/verify declares
      // body fields as path params even though its template has no placeholders.
      '/v2/organizations/{organizationid}/brands': {
        get: { summary: 'List brands', tags: [ 'Brands' ], parameters: [] },
      },
      '/v2/sign/verify': {
        post: {
          summary: 'Verify',
          tags: [ 'Signing' ],
          parameters: [ { in: 'path', name: 'code', schema: { type: 'string' } } ],
        },
      },
    }));

    expect(model.groups[0]?.requests[0]?.pathParams).toEqual([
      { name: 'organizationid', description: '', required: true, example: '' },
    ]);
    expect(model.groups[1]?.requests[0]?.pathParams).toEqual([]);
  });

  it('adopts a lone declared path param whose name differs from the template placeholder', () => {
    const model = buildModel(specWith({
      '/v2/envelope-documents/{id}': {
        get: {
          summary: 'Get envelope document',
          tags: [ 'Envelope Documents' ],
          parameters: [
            { in: 'path', name: 'document_id', required: true, description: 'The document ID.', schema: { type: 'string', format: 'uuid' } },
          ],
        },
      },
    }));

    expect(model.groups[0]?.requests[0]?.pathParams).toEqual([
      { name: 'id', description: 'The document ID.', required: true, example: '00000000-0000-0000-0000-000000000000' },
    ]);
  });

  it('derives a JSON body example, resolving refs', () => {
    const model = buildModel(specWith({
      '/v2/widgets': {
        post: {
          summary: 'Create a widget',
          tags: [ 'Widgets' ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    name: { type: 'string' },
                    kind: { $ref: '#/components/schemas/TKind' },
                  },
                },
              },
            },
          },
        },
      },
    }, { TKind: { type: 'string', enum: [ 'kind-a', 'kind-b' ] } }));

    expect(model.groups[0]?.requests[0]?.bodyExample).toEqual({ name: 'string', kind: 'kind-a' });
  });
});
