// Pick off the first part of a string up to the first (optional) parens
// See https://regex101.com/r/qXol86/1
// Test Strings:
//     string
//     string(format:uuid)
//     string(format: uuid)
//     integer
//     number
//     integer(format: int32)
//     number(format: int32)
//     integer(format:int32)
//     number(format:int32)
//     string(enum: 'a' | 'b')
//     integer(enum: 0|1)
//     number(enum: 0 | 1)
//     integer(minimum: 1, maximum:100, default: 20)))
//     ISomeInterface
//     SomeClass
//     TSomeType
//     array(type: ISomeInterface)
//     array(type: string)
//     array(items: 'a'|'b'
//     array(items: 0|1)
//     0|1
const BASE_TYPE_REGEX = /^([0-9a-zA-Z|\/]+)\(?([^)]*)\)?/;

export const processBaseType = (type: string) => {
  const match = type.match(BASE_TYPE_REGEX);
  return {baseType: match?.[1] || type, options: match?.[2]};
};

// See https://regex101.com/r/jaLDYm/1
// Test strings:
//   format:uuid
//   format: uuid
//   format: int32
//   format:int32
//   enum: 'a' | 'b'
//   enum: 'created_at' | 'name'
//   enum: 'created at' | 'name'
//   enum: 0|1
//   enum: 0 | 1
//   minimum: 1, maximum:100, default: 20)
//   type: ISomeInterface
//   type: string
//   items: 'a'|'b'
//   items: 0|1
//   items: SomeModel
const SCHEMA_REGEX = /(format|enum|minimum|maximum|default|items|type):\s?([a-zA-Z0-9'_| ]+)/g;

export const processSchemaOptions = (options: string) =>
  Array.from((options || '').matchAll(SCHEMA_REGEX) || []).map((match) => [match[1], match[2]]);

export const unionToEnumArray = (union: string) =>
  union
    .split('|')
    .map((v) => v.trim().replace(/'/g, '').trim())
    .map((v) => (isFinite(Number(v)) ? Number(v) : v));

// string (enum: 'name' | 'created_at' | 'updated_at' | 'canceled_at' | 'status')
// IEnvelope undefined
export const jsTypeToSchema = (type: string, options?: string) => {
  const typeComponents = processBaseType(type);

  const schema: any = {type: typeComponents.baseType};

  if (['string', 'integer', 'number', 'boolean'].includes(schema.type)) {
    //
  } else if (schema.type === 'image/jpeg' || schema.type === 'image/png') {
    // This will be handled when we find the "items" option below
    schema.type = 'string';
    schema.format = 'binary';
  } else if (schema.type === 'array') {
    // This will be handled when we find the "items" option below
  } else if (schema.type === 'object') {
    // TODO: Do we want to do something with these? It would be super hard to define a
    //  complex object inline in TSDoc tags, so maybe we should just only support refs?
  } else if (type.includes('|')) {
    // We don't come in here for root items like `'a'|'b' aOrB One of A or B`. We do when
    // we recurse e.g. `string(enum: 'a'|'b') aOrB One of A or B`.
    schema.enum = unionToEnumArray(type);
    schema.type = typeof schema.enum[0];
  } else {
    schema.$ref = `#/components/schemas/${schema.type}`;
    delete schema.type;
  }

  if (options) {
    const schemaOptions = processSchemaOptions(options);
    schemaOptions.forEach((schemaOption) => {
      const [option, _value] = schemaOption as [string, string];
      const value = _value.replace(/'/g, '').trim();

      switch (option) {
        case 'items':
          schema.type = 'array';
          schema.items = jsTypeToSchema(value);
          break;

        case 'enum':
          schema.enum = unionToEnumArray(value);
          schema.type = typeof schema.enum[0];
          break;

        case 'format':
          if (['int32', 'int64'].includes(value)) {
            schema.type = 'integer';
            schema.format = value;
          } else if (['image/png', 'image/jpeg'].includes(value)) {
            schema.type = 'string';
            schema.format = 'binary';
          } else if (['float', 'double'].includes(value)) {
            schema.type = 'number';
            schema.format = value;
          } else if (['uuid', 'date', 'date-time', 'password', 'byte', 'email', 'uri'].includes(value)) {
            schema.type = 'string';
            schema.format = value;
          } else {
            console.warn('Unrecognized format, ignoring', {type, option, value});
          }
          break;

        default:
          schema[option] = isFinite(Number(value)) ? Number(value) : value;
          break;
      }
    });
  }

  return schema;
};
