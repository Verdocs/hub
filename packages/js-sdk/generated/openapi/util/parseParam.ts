import {jsTypeToSchema} from '../utils';
import {parseApiOptionTag} from './parseApiOptionTag';

export const parseParam = (paramIn: 'body' | 'cookie' | 'header' | 'path' | 'query', param: string) => {
  const {type, options, name, desc} = parseApiOptionTag(param);

  const entry = {
    in: paramIn,
    name: (name || '').replace('?', '').trim(),
    description: (desc || '').trim(),
    required: !(name || '').includes('?') || paramIn === 'path' || undefined,
    schema: jsTypeToSchema(type, options),
  };

  if (type && name) {
    return entry;
  }
};