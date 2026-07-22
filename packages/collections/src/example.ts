import type { OaSchema } from './model';

// Fixed placeholder values keep the generated collections byte-stable between runs. Anything
// derived from the clock or a RNG would show up as noise in every regeneration diff.
const STRING_FORMAT_EXAMPLES: Record<string, string> = {
  uuid: '00000000-0000-0000-0000-000000000000',
  'date-time': '2024-01-01T00:00:00Z',
  date: '2024-01-01',
  email: 'user@example.com',
  uri: 'https://example.com',
  url: 'https://example.com',
};

function resolveRefName(ref: string): string {
  const name = ref.split('/').pop();
  return name ?? '';
}

function firstDefinedType(type: string | string[] | undefined): string | undefined {
  // OpenAPI 3.1 allows type arrays for nullable unions, e.g. ["string", "null"]. The non-null
  // member is the one worth demonstrating.
  if (Array.isArray(type)) return type.find(t => t !== 'null');
  return type;
}

/**
 * Derive a deterministic example value from a JSON schema. Explicit examples, consts, defaults,
 * and enums win over synthesized placeholders. Refs resolve against the spec's component schemas,
 * with a per-branch guard so circular refs terminate as null.
 */
export function exampleFromSchema(schema: OaSchema | undefined, schemas: Record<string, OaSchema>, seen: Set<string> = new Set()): unknown {
  if (!schema) return null;

  if (schema.$ref) {
    const name = resolveRefName(schema.$ref);
    if (seen.has(name)) return null;
    const resolved = schemas[name];
    if (!resolved) return null;
    const branch = new Set(seen);
    branch.add(name);
    return exampleFromSchema(resolved, schemas, branch);
  }

  if (schema.example !== undefined) return schema.example;
  if (Array.isArray(schema.examples) && schema.examples.length > 0) return schema.examples[0];
  if (schema.const !== undefined) return schema.const;
  if (schema.default !== undefined) return schema.default;

  if (Array.isArray(schema.enum)) {
    // The generated spec contains at least one enum of all nulls (TPermission), so we only trust
    // an enum when it offers a real value and otherwise fall through to the type-based default.
    const value = schema.enum.find(v => v !== null && v !== undefined);
    if (value !== undefined) return value;
  }

  if (Array.isArray(schema.allOf) && schema.allOf.length > 0) {
    const merged: Record<string, unknown> = {};
    let sawObject = false;
    for (const part of schema.allOf) {
      const value = exampleFromSchema(part, schemas, seen);
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        sawObject = true;
        Object.assign(merged, value);
      }
    }
    if (sawObject) return merged;
    return exampleFromSchema(schema.allOf[0], schemas, seen);
  }

  const variants = schema.oneOf ?? schema.anyOf;
  if (Array.isArray(variants) && variants.length > 0) {
    return exampleFromSchema(variants[0], schemas, seen);
  }

  let type = firstDefinedType(schema.type);
  if (!type && schema.properties) type = 'object';
  if (!type && schema.items) type = 'array';

  switch (type) {
    case 'object': {
      const result: Record<string, unknown> = {};
      // Property order follows the spec so examples read the way the schema was written.
      for (const [ key, prop ] of Object.entries(schema.properties ?? {})) {
        result[key] = exampleFromSchema(prop, schemas, seen);
      }
      return result;
    }
    case 'array':
      return schema.items ? [ exampleFromSchema(schema.items, schemas, seen) ] : [];
    case 'string':
      return STRING_FORMAT_EXAMPLES[schema.format ?? ''] ?? 'string';
    case 'integer':
    case 'number':
      return 0;
    case 'boolean':
      return true;
    default:
      return null;
  }
}

/**
 * Render a parameter example as the string it would take in a URL. Array params (repeated query
 * keys) are represented by a single item's value.
 */
export function paramExampleString(schema: OaSchema | undefined, schemas: Record<string, OaSchema>): string {
  if (!schema) return '';
  const target = firstDefinedType(schema.type) === 'array' && schema.items ? schema.items : schema;
  const value = exampleFromSchema(target, schemas);
  if (value === null || value === undefined) return '';
  // A bare "string" placeholder is noise in a query field; leave it blank for the caller to fill.
  if (value === 'string') return '';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}
