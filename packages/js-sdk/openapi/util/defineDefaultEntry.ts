export interface DefineDefaultEntryProps {
  name: string;
  summary: string;
}

export const defineDefaultEntry = (props: DefineDefaultEntryProps) => {
  const {name, summary} = props;
  return {
    operationId: name,
    summary,
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
};