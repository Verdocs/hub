/**
 * Predefined tags are needed in order to structure the OpenAI documentation for the
 * Verdocs Developer Documentation. If introducing a new tsdoc `group` value, you must add it to
 * these variables.
 */
const Tag = {
  API_KEYS: 'API Keys',
  AUTHENTICATION: 'Authentication',
  BRANDS: 'Brands',
  ENVELOPES: 'Envelopes',
  ENVELOPE_DOCUMENTS: 'Envelope Documents',
  FIELDS: 'Fields',
  KBA: 'KBA',
  NOTIFICATIONS: 'Notifications',
  ORGANIZATIONS: 'Organizations',
  ORGANIZATION_CONTACTS: 'Organization Contacts',
  ORGANIZATION_GROUPS: "Organization Groups",
  ORGANIZATION_INVITATIONS: 'Organization Invitations',
  ORGANIZATION_MEMBERS: 'Organization Members',
  PROFILES: 'Profiles',
  RECIPIENTS: 'Recipients',
  ROLES: 'Roles',
  SIGNATURES_AND_INITIALS: 'Signatures and Initials',
  TEMPLATE_DOCUMENTS: 'Template Documents',
  TEMPLATES: 'Templates',
  WEBHOOKS: 'Webhooks',
} as const;

export type Tag = (typeof Tag)[keyof typeof Tag];

export interface OpenAITag {
  name: Tag;
  description: string;
  'x-displayName': Tag;
}

/**
 * These are the tags that will be broken up until "sections" in our openapi RestAPI documentation.
 */
export const PREAMBLE_TAGS: OpenAITag[] = [
  {
    name: Tag.ORGANIZATIONS,
    description:
      'An Organization represents a logical workspace that groups users, documents, and resources under a shared administrative domain. Organizations enable multi-tenant management by isolating data and permissions between different teams or companies. Each organization typically contains its own users, templates, envelopes, and settings, ensuring that activity and access remain scoped to that organization. Organizations are commonly used to support multiple teams, departments, or clients within a single platform.',
    'x-displayName': Tag.ORGANIZATIONS,
  },
  {
    name: Tag.ENVELOPES,
    description:
      'An envelope is a digital package that groups one or more documents together with their signing instructions, recipients, and metadata for the purpose of routing, signing, and tracking the documents in an electronic signature workflow.',
    'x-displayName': Tag.ENVELOPES,
  },
  {
    name: Tag.ENVELOPE_DOCUMENTS,
    description: 'The files that need to be signed or reviewed (PDFs, contracts, etc.), within an envelope.',
    'x-displayName': Tag.ENVELOPE_DOCUMENTS,
  },
  {
    name: Tag.SIGNATURES_AND_INITIALS,
    description:
      'Signatures & Initials are the visual marks applied by recipients to indicate approval or acknowledgment of a document. A signature represents a recipient\'s full legal signature, while an initial is typically used to confirm review of specific sections or pages. In the Verdocs platform, signatures and initials are placed within designated signing fields in a document. When a recipient completes a signing step, the platform captures the signature or initials along with metadata such as the timestamp, signer identity, and audit trail information.',
    'x-displayName': Tag.SIGNATURES_AND_INITIALS,
  },
  {
    name: Tag.API_KEYS,
    description: 'API keys are required when using Verdocs technpologies. Please log in to your account to view/generate your API Key.',
    'x-displayName': Tag.API_KEYS,
  },
  {
    name: Tag.ORGANIZATION_CONTACTS,
    description: 'Endpoints for managing organization contacts',
    'x-displayName': Tag.ORGANIZATION_CONTACTS,
  },
  {
    name: Tag.ORGANIZATION_INVITATIONS,
    description: 'Endpoints for managing organization invitations',
    'x-displayName': Tag.ORGANIZATION_INVITATIONS,
  },
  {
    name: Tag.ORGANIZATION_MEMBERS,
    description: 'Endpoints for managing organization members',
    'x-displayName': Tag.ORGANIZATION_MEMBERS,
  },
  {
    name: Tag.WEBHOOKS,
    description:
      'Webhooks are HTTP callbacks that notify external systems when specific events occur within the platform. Common events include document signing completion, envelope status changes, or recipient actions. Webhooks enable real-time integration with external applications, allowing automated workflows, notifications, and auditing.',
    'x-displayName': Tag.WEBHOOKS,
  },
  {
    name: Tag.FIELDS,
    description:
      'Fields are interactive elements placed within a document that collect or display information during the signing process. Fields define where recipients must provide input or review information. Common field types include signature fields, initials, text inputs, dates, checkboxes, and dropdown selections. Fields can be assigned to specific recipients and may include validation rules, default values, or formatting constraints. Fields ensure that documents capture the required information and guide recipients through the signing workflow.',
    'x-displayName': Tag.FIELDS,
  },
  {
    name: Tag.ROLES,
    description:
      'Roles define the permissions and responsibilities assigned to users or recipients within the system. Roles determine what actions a user can perform, such as creating envelopes, approving documents, managing templates, or accessing administrative settings. Assigning roles ensures that users only have access to the resources and actions appropriate for their responsibilities.',
    'x-displayName': Tag.ROLES,
  },
  {
    name: Tag.TEMPLATE_DOCUMENTS,
    description:
      'A Template Document is a single file included within a template that defines part of the content and structure for a signing workflow. Template documents can contain predefined fields, placeholders, and formatting that standardize the signing process. When a template is used to create an envelope, each template document is included in the signing transaction according to the template configuration.',
    'x-displayName': Tag.TEMPLATE_DOCUMENTS,
  },
  {
    name: Tag.TEMPLATES,
    description:
      'A Template is a reusable document configuration that defines the structure of a signing workflow. Templates typically include one or more documents, predefined fields, recipient roles, and routing rules. By using templates, organizations can standardize frequently used agreements and automate document preparation. When a template is used, the platform generates a new signing transaction based on the template\'s configuration, allowing documents to be sent for signature quickly and consistently.',
    'x-displayName': Tag.TEMPLATES,
  },
  {
    name: Tag.AUTHENTICATION,
    description: 'Endpoints for managing authentication',
    'x-displayName': Tag.AUTHENTICATION,
  },
  {
    name: Tag.PROFILES,
    description:
      'A Profile represents the personal or account information of a user within the platform. Profiles store data such as the user\'s name, email, contact information, and preferences. Profiles are used to identify users in signing workflows, manage access, and personalize communications or notifications.',
    'x-displayName': Tag.PROFILES,
  },
  {
    name: Tag.BRANDS,
    description:
      'Brands define the visual identity, email settings, and presentation for documents and notifications sent by an organization. Each brand can specify unique logos, color schemes, and email domains to deliver a customized recipient experience. Organizations can manage multiple brands to represent different business units or product lines, ensuring that all outgoing documents and communications align with their branding standards.',
    'x-displayName': Tag.BRANDS,
  },
  {
    name: Tag.RECIPIENTS,
    description:
      'Recipients represent individuals who are designated to complete actions within an envelope, such as signing, initialing, or reviewing documents. Each recipient is assigned a role and may have unique authentication methods, fields to complete, and workflow actions such as agreeing or declining disclosures, submitting signatures, asking questions, or delegating their responsibility. The recipient workflow supports in-person and remote signing, reminder notifications, and advanced verification (e.g., KBA, SMS, passcode). Managing recipients is essential to controlling access and progress through the signing process.',
    'x-displayName': Tag.RECIPIENTS,
  },
  {
    name: Tag.NOTIFICATIONS,
    description:
      'Notifications provide alerts and updates to users regarding activity and important events within the platform. These may include workflow changes, recipient actions, completion statuses, and reminders. Notifications can be delivered via email, SMS, or in-app messages, ensuring that users are informed of required actions or the status of documents and processes.',
    'x-displayName': Tag.NOTIFICATIONS,
  },
  {
    name: Tag.ORGANIZATION_GROUPS,
    description: "Endpoints for managing organization groups and group membership.",
    'x-displayName': "Organization Groups"
  },
  {
    name: Tag.KBA,
    description: "Knowledge-Based Authentication endpoints for recipient identity verification during signing.",
    'x-displayName': "KBA"
  }
];