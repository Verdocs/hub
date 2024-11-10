export const Channel = {
  type: 'object',
  required_properties: ['id', 'channel_type', 'event_name'],
  properties: {
    id: {type: 'string', format: 'uuid'},
    channel_type: {type: 'string', enum: ['email', 'sms', 'notification']},
    event_name: {type: 'string'},
  },
};

export const DisabledChannel = {
  type: 'object',
  required_properties: ['channel_id', 'profile_id'],
  properties: {
    channel_id: {type: 'string', format: 'uuid'},
    profile_id: {type: 'string', format: 'uuid'},
  },
};

export const Notification = {
  type: 'object',
  required_properties: ['id', 'profile_id', 'event_name', 'data', 'read', 'deleted', 'message', 'time'],
  properties: {
    id: {type: 'string', format: 'uuid'},
    profile_id: {type: 'string', format: 'uuid'},
    event_name: {type: 'string'},
    data: {type: 'object'},
    read: {type: 'boolean'},
    deleted: {type: 'boolean'},
    message: {type: 'string'},
    time: {type: 'string', format: 'date-time'},
  },
};
