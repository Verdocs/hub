import * as Schemas from './schemas';
import pkg from '../package.json';

export const Preamble = {
  openapi: '3.1.0',
  info: {
    title: 'Verdocs Platform API',
    version: pkg.version,
    description:
      'The Verdocs Platform API provides endpoints for performing all common operations in the Verdocs Platform. API endpoints follow REST conventions and use standard HTTP methods for most operations. All calls are made via a common endpoint [https://api.verdocs.com](https://api.verdocs.com) and use JSON formatting for both request and response bodies.',
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT',
    },
  },
  externalDocs: {
    description: 'Verdocs Developer Portal',
    url: 'https://developers.verdocs.com/',
  },
  servers: [
    {
      url: 'https://api.verdocs.com',
      description: 'Production API endpoint.',
    },
  ],
  tags: [
    {
      name: 'Books',
      description: 'Entries related to books',
    },
  ],
  paths: {},
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        description: 'Bearer Token',
      },
      OAuth2: {
        type: 'oauth2',
        flows: {
          authorizationCode: {
            authorizationUrl: 'https://api.verdocs.com/v2/oauth2/token',
            tokenUrl: 'https://api.verdocs.com/v2/oauth2/token',
            scopes: {
              read: 'Grants read access',
              write: 'Grants write access',
              admin: 'Grants admin access',
            },
          },
        },
      },
    },
    schemas: Schemas,
    responses: {
      InvalidRequest: {
        description: 'The request was invalid. Typically thrown for invalid operations, such as trying to cancel an envelope that has already been canceled.',
      },
      InvalidParameter: {
        description: 'One or more parameters were invalid.',
      },
      AccessDenied: {
        description:
          'Access was denied. Check to be sure the Authorization header contains a valid, non-expired token, and that you have appropriate access to the objects related to the request.',
      },
      NotFound: {
        description: 'The requested resource was not found.',
      },
      ServerError: {
        description: 'A server error has occurred.',
      },
    },
  },
};
