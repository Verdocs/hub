/* tslint:disable:no-console */

import {writeFileSync} from 'node:fs';
import {jsTypeToSchema} from './utils';
import {Preamble} from './Preamble';
import docsJson from '../docs.json';
import {generateSnippets} from './snippets';

// 1. Reuse some tags from TSDoc (Name->actionId, Summary/Description from comment, @group->tags
// 2. Adds support for root-level apiSuccess results (e.g. body of response is object)
// 3. Support for automatically referencing types exported by TSDoc (beyond String/Object/etc) via '.'
// 4. ApiDoc was archived and is no longer maintained
// 5. Must remove curly braces (confuses TSDoc)

// Supported tags:
// @api {get} /v2/envelopes/:id Get Envelope Details
//
// @apiQuery [{type}] [field=defaultValue] [description]
// @apiParam [{type}] [field=defaultValue] [description]
//
// @apiBody {String} [firstname]       Optional Firstname of the User.
// @apiBody {String} lastname          Mandatory Lastname.
// @apiBody {String} country="DE"      Mandatory with default value "DE".
// @apiBody {Number} [age=18]          Optional Age with default 18.
// @apiBody (Login) {String} pass      Only logged-in users can post this.
//                                     In generated documentation a separate
//                                     "Login" Block will be generated.
// @apiBody {Object} [address]         Optional nested address object.
// @apiBody {String} [address[street]] Optional street and number.
// @apiBody {String} [address[zip]]    Optional zip code.
// @apiBody {String} [address[city]]   Optional city.
//
//
// Addon: Use "." to denote the type of the root object
//
//  * @apiSuccess {Object[]} profiles       List of user profiles.
//  * @apiSuccess {Number}   profiles.age   Users age.
//  * @apiSuccess {String}   profiles.image Avatar-Image.
//
//  * @api {get} /user/:id
//  * @apiSuccess {Boolean} active        Specify if the account is active.
//  * @apiSuccess {Object}  profile       User profile information.
//  * @apiSuccess {Number}  profile.age   Users age.
//  * @apiSuccess {String}  profile.image Avatar-Image.
//
// @apiError UserNotFound The <code>id</code> of the User was not found.
//
// @apiDeprecated [text]
//
// @apiDescription This is the Description.
// It is multiline capable.
//
// Last line of Description.
//
// @apiName name
// @apiGroup name
//
// @apiHeader {String} Authorization Bearer: access_token

interface IBlockTagContent {
  kind: 'text';
  text: string;
}

interface IBlockTag {
  tag: string; // '@category';
  content: IBlockTagContent[];
}

// See https://regex101.com/r/yG7Inq/1
// Test strings:
//   string(format: email, xyz:a) id Test
//   string(format: email, xyz:a) id The ID of the envelope to retrieve.
//   string(format: 'email', xyz:a) i_d The ID of the envelope to retrieve.
//   string(format: email, xyz:a) id The ID of the envelope to retrieve.
//   string(format: 'email',xyz:a) id The ID of the envelope to retrieve.
//   string id The ID of the envelope to retrieve.
//   string(format: email, xyz:a) id? The ID of the envelope to retrieve.
//   string(format: 'email', xyz:a) id? The ID of the envelope to retrieve.
//   string(format: email, xyz:a) id? The ID of the envelope to retrieve.
//   string(format: 'email',xyz:a) id? The ID of the envelope to retrieve.
//   string id? The ID of the envelope to retrieve.
//   array(items: 'complete' | 'pending' | 'in progress' | 'declined' | 'canceled') enumArray? Match envelopes whose name contains this string
//   array(items: string) string_array Match envelopes whose name contains this string
//   IEnvelope . The detailed metadata for the envelope requested
const API_OPTION_REGEX = /([a-zA-Z0-9\/]+)(\([^)]*\))?\s([a-zA-Z0-9_?.]+)\s?([^\n]*)/;

const parseApiOptionTag = (option: string) => {
  const matchArr = Array.from(option.match(API_OPTION_REGEX) || []);
  return {
    type: matchArr[1],
    options: matchArr[2],
    name: matchArr[3],
    desc: matchArr[4],
  };
};

// TSDoc expects {} around inline blocks so we have to use something like /path/:id in this tag.
// OpenAPI expects /path/{id}
// See https://regex101.com/r/6jcMUu/1
// Test strings
// /v2/envelopes/:id
// /v2/envelopes/:envelope_id/
// /v2/envelopes/:id/
// /v2/envelopes/:id/path/:otherParam/path2
const PATH_REGEX = /\/:([a-zA-Z0-9-_]+)/g;

const parseResponseType = (currentResponseSchema: any, param: string) => {
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

const parseParam = (paramIn: 'body' | 'cookie' | 'header' | 'path' | 'query', param: string) => {
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

const processChild = (child: Record<string, any>) => {
  const {name, kind, comment} = child as {name: string; kind: number; comment: any; child: any};
  const description = comment?.summary?.[0]?.text || '';

  // console.log('Processing child', name, kind);
  if (kind === 2097152) {
    Preamble.components = Preamble.components ?? {};
    Preamble.components.schemas = Preamble.components.schemas ?? {};
    // console.log('Type', {name, kind, comment, description, child});

    // TODO: Support for any other enum types?
    (Preamble.components.schemas as any)[name] = {
      type: 'string',
      description: (description || '').trim(),
      enum: child?.type?.types?.map((type: any) => type.value) || [],
    };
    return;
  }

  if (kind === 256) {
    Preamble.components = Preamble.components ?? {};
    Preamble.components.schemas = Preamble.components.schemas ?? {};

    const schemaEntry: any = {
      type: 'object',
      description: (description || '').trim(),
      required: [],
      properties: {},
    };

    child.children.forEach((child: Record<string, any>) => {
      const {name, kind, comment, type} = child;
      if (kind !== 1024 || !comment) {
        return;
      }

      schemaEntry.properties[name] = {
        // TODO
        type: type.name === 'number' ? 'integer' : 'string',
        description: comment.summary[0].text,
      };

      if (child.flags?.isOptional !== true) {
        schemaEntry.required.push(name);
      }
    });

    (Preamble.components.schemas as any)[name] = schemaEntry;
    return;
  }

  if (kind !== 64 || !description) {
    return;
  }

  //
  //   if (metadata.bodySchema) {
  //     entry.requestBody = {
  //       // TODO
  //       description: '',
  //       required: true,
  //       content: {
  //         'application/json': {
  //           schema: zodToJsonSchema(metadata.bodySchema),
  //         },
  //       },
  //     };
  //   }
  //
  //   if (metadata.security) {
  //     entry.security = metadata.security;
  //   }
  //
  //   if (metadata.errors) {
  //     metadata.errors.forEach((errorCode) => {
  //       switch (errorCode) {
  //         case 400:
  //           entry.responses['400'] = {$ref: '#/components/responses/InvalidRequest'};
  //           break;
  //
  //         case 401:
  //           entry.responses['401'] = {$ref: '#/components/responses/AccessDenied'};
  //           break;
  //
  //         case 404:
  //           entry.responses['404'] = {$ref: '#/components/responses/NotFound'};
  //           break;
  //
  //         case 406:
  //           entry.responses['406'] = {$ref: '#/components/responses/InvalidParameter'};
  //           break;
  //
  //         case 500:
  //           entry.responses['500'] = {$ref: '#/components/responses/ServerError'};
  //           break;
  //       }
  //     });
  //   }
  //
  //   if (metadata.responseSchema) {
  //     entry.responses['200'] = {
  //       description: 'Success',
  //       content: {'application/json': {schema: metadata.responseSchema}},
  //     };
  //   }
  //
  //   Preamble.paths[realPath][method] = entry;
  let path = '';
  let method = '';

  const entry: any = {
    operationId: name,
    summary: '',
    description,
    tags: [],
    parameters: [],
    responses: {
      '200': {
        description: 'Success',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {},
            },
          },
        },
      },
      // TODO: Although this is a documented approach, (see
      //  https://swagger.io/docs/specification/v3_0/describing-responses/#default-response), this causes
      //  the error "Resolver error at responses.default.content.application/json.schema.$ref Could not
      //  resolve reference: JSON Pointer evaluation failed while evaluating token "Error" against an
      //  ObjectElement" to appear in Swagger Editor Next. The old Swagger Editor is just broken entirely
      //  displaying JSON-format OpenAPI v3.1 specs. Disabling it for now and hard-coding responses.
      //  see https://github.com/swagger-api/swagger-ui/issues/9304
      // default: {
      //   description: 'An error occurred.',
      //   content: {
      //     'application/json': {
      //       schema: {$ref: '#/components/schemas/Error'},
      //     },
      //   },
      // },
      '400': {
        description: 'Request Error',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['status', 'error'],
              properties: {
                status: {type: 'string', enum: ['ERROR'], description: 'Always set to "ERROR".'},
                error: {type: 'string', description: 'Description of the error that occurred.'},
              },
            },
          },
        },
      },
      '401': {
        description: 'Access Denied',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['status', 'error'],
              properties: {
                status: {type: 'string', enum: ['ERROR'], description: 'Always set to "ERROR".'},
                error: {type: 'string', description: 'Description of the error that occurred.'},
              },
            },
          },
        },
      },
      '404': {
        description: 'Not Found',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['status', 'error'],
              properties: {
                status: {type: 'string', enum: ['ERROR'], description: 'Always set to "ERROR".'},
                error: {type: 'string', description: 'Description of the error that occurred.'},
              },
            },
          },
        },
      },
      '406': {
        description: 'Invalid Parameter',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['status', 'error'],
              properties: {
                status: {type: 'string', enum: ['ERROR'], description: 'Always set to "ERROR".'},
                error: {type: 'string', description: 'Description of the error that occurred.'},
              },
            },
          },
        },
      },
    },
  };

  child.comment?.blockTags?.forEach((tag: IBlockTag) => {
    switch (tag.tag) {
      case '@category':
      case '@group':
      case '@apiGroup':
        entry.tags = [tag.content[0].text];
        break;

      case '@apiName':
        entry.operationId = tag.content[0].text;
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
          const parsedParam = parseParam('path', tag.content[0].text);
          if (parsedParam) {
            entry.parameters.push(parsedParam);
          }
        }
        break;

      case '@apiQuery':
        {
          const parsedParam = parseParam('query', tag.content[0].text);
          if (parsedParam) {
            entry.parameters.push(parsedParam);
          }
        }
        break;

      case '@apiBody':
        const parsedBodyParam = parseParam('body', tag.content[0].text);
        console.log('pbp', parsedBodyParam);
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
        parseResponseType(entry.responses['200'].content['application/json'].schema, tag.content[0].text);
        break;

      // case '@apiErrors':
      //   const errors = tag.content[0].text.split(',').map((e) => e.trim());
      //   console.log('errors', errors);
      // @apiSuccess IEnvelope . The detailed metadata for the envelope requested
    }
  });

  if (path && method) {
    entry['x-codeSamples'] = generateSnippets(method, path, {
      showQuery: entry.parameters.find((p: any) => p.in === 'query'),
      showBody: true,
    });

    (Preamble.paths as any)[path] = (Preamble.paths as any)[path] ?? {};
    (Preamble.paths as any)[path][method] = entry;
  }
};

const processEntry = (child: Record<string, any>) => {
  processChild(child);
  if (child.children) {
    return child.children.map(processEntry);
  }
};

const generateDocs = async () => {
  console.log('Generating docs');
  processEntry(docsJson);
};

generateDocs()
  .then(() => {
    console.log('Done generating OpenAPI docs');
    writeFileSync('./openapi.json', JSON.stringify(Preamble, null, 2));
    process.exit(0);
  })
  .catch((e) => {
    console.log('Unknown error', e);
    process.exit(-1);
  });
