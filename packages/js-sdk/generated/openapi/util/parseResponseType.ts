import {jsTypeToSchema} from '../utils';
import {parseApiOptionTag} from './parseApiOptionTag';

// TSDoc expects {} around inline blocks so we have to use something like /path/:id in this tag.
// OpenAPI expects /path/{id}
// See https://regex101.com/r/6jcMUu/1
// Test strings
// /v2/envelopes/:id
// /v2/envelopes/:envelope_id/
// /v2/envelopes/:id/
// /v2/envelopes/:id/path/:otherParam/path2

export const parseResponseType = (currentResponseSchema: any, param: string) => {
  const parsed = parseApiOptionTag(param);
  const schema = jsTypeToSchema(parsed.type, parsed.options);

  if (parsed.name === '.') {
    Object.keys(currentResponseSchema).forEach((key) => delete currentResponseSchema[key]);
    Object.assign(currentResponseSchema, schema);
  } else {
    currentResponseSchema.type = 'object';
    currentResponseSchema.properties = currentResponseSchema.properties || {};
    currentResponseSchema.properties[parsed.name] = {description: parsed.desc, ...schema};
  }
};