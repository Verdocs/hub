import {joinTagContent, PATH_REGEX} from '../generate-openapi';
import {IBlockTag} from '../types'
import {defineDefaultEntry, DefineDefaultEntryProps, parseParam, parseResponseType} from '.';

export const distributeBlockTags = (blockTags: any[] = [], defaultEntryProps: DefineDefaultEntryProps) => {
  const entry: any = defineDefaultEntry(defaultEntryProps);
  let path = '';
  let method = '';

  blockTags?.forEach((tag: IBlockTag) => {
    switch (tag?.tag) {
      case '@category':
      case '@group':
      case '@apiGroup':
        entry.tags = [tag.content[0].text];
        break;

      case '@apiName':
        entry.operationId = tag.content[0].text;
        break;

      case '@apiDescription':
        entry.description = tag.content[0].text;
        break;

      case '@api':
        {
          const [_method, _path, ..._summary] = tag.content[0].text.split(' ');
          method = (_method || 'get').trim().toLowerCase();

          // TSDoc expects {} around inline blocks so we have to use something like /path/:id in this tag.
          // OpenAPI expects /path/{id}
          path = (_path || '').replace(PATH_REGEX, '/{$1}').trim().toLowerCase();
          entry.summary = (_summary || []).join(' ').trim();
        }
        break;

      case '@apiParam':
        {
          const parsedParam = parseParam('path', joinTagContent(tag.content));
          if (parsedParam) {
            entry.parameters.push(parsedParam);
          }
        }
        break;

      case '@apiQuery':
        {
          const parsedParam = parseParam('query', joinTagContent(tag.content));
          if (parsedParam) {
            entry.parameters.push(parsedParam);
          }
        }
        break;

      case '@apiBody':
        const parsedBodyParam = parseParam('body', joinTagContent(tag.content));
        if (parsedBodyParam) {
          entry.requestBody = entry.requestBody || {
            description: 'Body Parameters',
            required: true,
            content: {
              'application/json': {
                schema: {
                  // OR $ref: "#/components/schemas/Pet"
                  type: 'object',
                  required: [],
                  properties: {},
                },
              },
            },
          };

          entry.requestBody.content['application/json'].schema.properties[parsedBodyParam.name] = parsedBodyParam.schema;
          entry.requestBody.content['application/json'].schema.properties[parsedBodyParam.name].description = parsedBodyParam.description;

          if (parsedBodyParam.required) {
            entry.requestBody.content['application/json'].schema.required.push(parsedBodyParam.name);
          }
        }
        break;

      case '@apiSuccess':
        // @apiSuccess IEnvelope . The detailed metadata for the envelope requested
        // TODO: Description
        parseResponseType(entry.responses['200'].content['application/json'].schema, joinTagContent(tag.content));
        break;

      // case '@apiErrors':
      //   const errors = tag.content[0].text.split(',').map((e) => e.trim());
      //   console.log('errors', errors);
      // @apiSuccess IEnvelope . The detailed metadata for the envelope requested
    }
  });

  return {
    entry,
    path,
    method,
  };
};