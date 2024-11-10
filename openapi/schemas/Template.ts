export const Template = {
  type: 'object',
  properties: {
    id: {
      type: 'string',
      example: 'ba0d1718-a946-4ecc-a19f-2b483949ad1d',
    },
    profile_id: {
      type: 'string',
      example: 'ba0d1718-a946-4ecc-a19f-2b483949ad1d',
    },
    organization_id: {
      type: 'string',
      example: 'ba0d1718-a946-4ecc-a19f-2b483949ad1d',
    },
    name: {
      type: 'string',
      example: 'Bill of Sale',
    },
    counter: {
      type: 'integer',
      format: 'int64',
      example: 1,
    },
    star_counter: {
      type: 'integer',
      format: 'int64',
      example: 1,
    },
    is_personal: {
      type: 'boolean',
      example: true,
    },
    is_public: {
      type: 'boolean',
      example: true,
    },
    sender: {
      type: 'string',
      example: 'creator',
    },
    description: {
      type: 'string',
      example: '',
    },
    token: {
      type: 'string',
      example: 'ccIPZmovmyUBd7o0WVBUcE94SWreGwaV',
    },
    created_at: {
      type: 'string',
      format: 'date',
      example: '2022-11-22T15:03:09.385Z',
    },
    updated_at: {
      type: 'string',
      format: 'date',
      example: '2022-11-22T15:03:09.385Z',
    },
    last_used_at: {
      type: 'string',
      format: 'date',
      example: '2022-11-22T15:03:09.385Z',
    },
  },
};
