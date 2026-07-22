import { exampleFromSchema, paramExampleString } from './example';

import type { OaSchema } from './model';

describe('exampleFromSchema', () => {
  it('prefers explicit example, then const, then default, then enum', () => {
    expect(exampleFromSchema({ type: 'string', example: 'hi' }, {})).toBe('hi');
    expect(exampleFromSchema({ type: 'string', const: 'fixed' }, {})).toBe('fixed');
    expect(exampleFromSchema({ type: 'integer', default: 20 }, {})).toBe(20);
    expect(exampleFromSchema({ type: 'string', enum: [ 'a', 'b' ] }, {})).toBe('a');
  });

  it('falls back to the type default when an enum holds only nulls', () => {
    // The generated spec really contains this shape (TPermission), so it must not produce null.
    expect(exampleFromSchema({ type: 'string', enum: [ null, null ] }, {})).toBe('string');
  });

  it('synthesizes fixed placeholders by type and format', () => {
    expect(exampleFromSchema({ type: 'string', format: 'uuid' }, {})).toBe('00000000-0000-0000-0000-000000000000');
    expect(exampleFromSchema({ type: 'string', format: 'date-time' }, {})).toBe('2024-01-01T00:00:00Z');
    expect(exampleFromSchema({ type: 'boolean' }, {})).toBe(true);
    expect(exampleFromSchema({ type: 'number' }, {})).toBe(0);
    expect(exampleFromSchema({ type: [ 'string', 'null' ] }, {})).toBe('string');
  });

  it('resolves refs against component schemas', () => {
    const schemas: Record<string, OaSchema> = { TKind: { type: 'string', enum: [ 'kind-a', 'kind-b' ] } };
    expect(exampleFromSchema({ $ref: '#/components/schemas/TKind' }, schemas)).toBe('kind-a');
  });

  it('terminates circular refs as null', () => {
    const schemas: Record<string, OaSchema> = {
      Node: {
        type: 'object',
        properties: { next: { $ref: '#/components/schemas/Node' } },
      },
    };
    expect(exampleFromSchema({ $ref: '#/components/schemas/Node' }, schemas)).toEqual({ next: null });
  });

  it('allows the same ref in sibling branches', () => {
    const schemas: Record<string, OaSchema> = { TRole: { type: 'string', enum: [ 'admin' ] } };
    const schema: OaSchema = {
      type: 'object',
      properties: {
        one: { $ref: '#/components/schemas/TRole' },
        two: { $ref: '#/components/schemas/TRole' },
      },
    };
    expect(exampleFromSchema(schema, schemas)).toEqual({ one: 'admin', two: 'admin' });
  });

  it('merges allOf object parts', () => {
    const schema: OaSchema = {
      allOf: [
        { type: 'object', properties: { a: { type: 'integer' } } },
        { type: 'object', properties: { b: { type: 'boolean' } } },
      ],
    };
    expect(exampleFromSchema(schema, {})).toEqual({ a: 0, b: true });
  });

  it('builds arrays with a single example item', () => {
    expect(exampleFromSchema({ type: 'array', items: { type: 'string', format: 'email' } }, {})).toEqual([ 'user@example.com' ]);
  });
});

describe('paramExampleString', () => {
  it('renders scalars as URL-ready strings', () => {
    expect(paramExampleString({ type: 'integer', default: 0 }, {})).toBe('0');
    expect(paramExampleString({ type: 'boolean', default: 'false' }, {})).toBe('false');
    expect(paramExampleString({ type: 'string', enum: [ 'code' ] }, {})).toBe('code');
  });

  it('uses a single item value for array params', () => {
    expect(paramExampleString({ type: 'array', items: { type: 'string', enum: [ 'complete', 'pending' ] } }, {})).toBe('complete');
  });

  it('leaves plain strings blank so the caller fills them in', () => {
    expect(paramExampleString({ type: 'string' }, {})).toBe('');
    expect(paramExampleString(undefined, {})).toBe('');
  });
});
