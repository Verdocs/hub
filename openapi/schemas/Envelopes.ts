export const Envelope = {
  type: 'object',
  description: 'An Envelope is a workflow wrapper that represents one or more Documents being signed by specific Recipients.',
  required_properties: [
    'id',
    'status',
    'profile_id',
    'organization_id',
    'name',
    'initial_reminder',
    'followup_reminders',
    'next_reminder',
    'created_at',
    'updated_at',
    'canceled_at',
    'visibility',
    'recipients',
  ],
  properties: {
    id: {type: 'string', format: 'uuid'},
    status: {type: 'string', enum: ['complete', 'pending', 'in progress', 'declined', 'canceled']},
    profile_id: {type: 'string', format: 'uuid'},
    template_id: {type: 'string', format: 'uuid'},
    organization_id: {type: 'string', format: 'uuid'},
    name: {type: 'string'},
    no_contact: {
      type: 'boolean',
      description: 'If true, Verdocs will not send any email or SMS notifications to the Recipients.',
    },
    initial_reminder: {
      type: 'number',
      description: 'Delay (in seconds) before the first reminder is sent (min: 4hrs). Set to 0 or null to disable.',
    },
    followup_reminders: {
      type: 'number',
      description: 'Delay (in seconds) before subsequent remidners are sent (min: 12hrs). Set to 0 or null to disable.',
    },
    next_reminder: {
      type: 'string',
      description: 'When the next reminder is scheduled to be sent.',
    },
    created_at: {type: 'string'},
    updated_at: {type: 'string'},
    canceled_at: {type: 'string'},
    visibility: {
      type: 'string',
      description:
        "Defaults to 'private'. If set to 'shared', this envelope will be visible to other users in the same organization. Ignored for personal profiles.",
    },
    data: {
      type: 'object',
      description:
        'Optional storage for arbitrary data that may be used e.g. to track source database/record IDs to relate Envelopes back to internal systems/applications.',
    },
    // TODO: Refs
    profile: {type: 'object'},
    template: {type: 'object'},
    organization: {type: 'object'},
    access_keys: {type: 'array', items: {type: 'object'}},
    fields: {type: 'array', items: {type: 'object'}},
    history_entries: {type: 'array', items: {type: 'object'}},
    recipients: {type: 'array', items: {type: 'object'}},
    documents: {type: 'array', items: {type: 'object'}},
  },
};
