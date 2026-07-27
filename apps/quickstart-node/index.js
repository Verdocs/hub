import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {
  VerdocsEndpoint,
  authenticate,
  cancelEnvelope,
  createEnvelope,
  decodeAccessTokenBody,
  getInPersonLink,
  getOrganization,
} from '@verdocs/js-sdk';

const REQUIRED = ['VERDOCS_CLIENT_ID', 'VERDOCS_CLIENT_SECRET', 'PDF_PATH'];

const usage = (problem) => {
  console.error(`${problem}

Copy .env.example to .env and fill in:

  VERDOCS_CLIENT_ID      client ID of a Verdocs API key
  VERDOCS_CLIENT_SECRET  the matching client secret
  PDF_PATH               path to the PDF you want signed

Create an API key at https://app.verdocs.com under Settings > API Keys.`);
  process.exit(1);
};

try {
  process.loadEnvFile();
} catch {
  usage('No .env file found.');
}

const missing = REQUIRED.filter((name) => !process.env[name]);
if (missing.length > 0) {
  usage(`Missing required settings: ${missing.join(', ')}.`);
}

// The role name ties the recipient and the signature field together. It is an arbitrary label,
// but the two have to agree or the field will not belong to anyone.
const ROLE_NAME = 'Recipient';

const pdfPath = resolve(process.env.PDF_PATH);
let pdfBase64;
try {
  pdfBase64 = readFileSync(pdfPath).toString('base64');
} catch {
  usage(`Could not read the PDF at ${pdfPath}.`);
}

const endpoint = new VerdocsEndpoint({baseURL: process.env.VERDOCS_BASE_URL || 'https://api.verdocs.com'});

// client_credentials authenticates the integration itself, so there is no user to log in and no
// refresh dance to manage. Access tokens are short lived, so ask for one per run rather than
// stashing it somewhere.
const {access_token} = await authenticate(endpoint, {
  grant_type: 'client_credentials',
  client_id: process.env.VERDOCS_CLIENT_ID,
  client_secret: process.env.VERDOCS_CLIENT_SECRET,
});
endpoint.setToken(access_token);

// The token tells you which organization you are acting as. It carries the ID but not the name, so
// the name costs one lookup. If you are creating an envelope anyway, skip this: the create response
// below carries envelope.organization.
const {organization_id} = decodeAccessTokenBody(access_token);
const organization = await getOrganization(endpoint, organization_id);
console.log(`Organization: ${organization.name} (${organization_id})`);

const envelope = await createEnvelope(endpoint, {
  name: 'Quickstart Envelope',
  recipients: [
    {
      type: 'signer',
      role_name: ROLE_NAME,
      first_name: process.env.SIGNER_FIRST_NAME || 'Test',
      last_name: process.env.SIGNER_LAST_NAME || 'User',
      email: process.env.SIGNER_EMAIL || 'test+user@maildrop.cc',
    },
  ],
  // No template involved, so the PDF rides along as base64 on the create call.
  documents: [{name: 'quickstart.pdf', mime: 'application/pdf', data: pdfBase64}],
  // document_id is the index into documents above, not a UUID, and page numbering starts at 1.
  // Position is in PDF points from the bottom-left of the page, so a larger y sits higher up.
  // Anything missing type, role_name, name, document_id, page, x, or y is dropped server-side, and
  // you find out via a confusing "Envelope has no fields" error rather than a validation message.
  fields: [
    {
      document_id: 0,
      name: 'recipient-signature',
      role_name: ROLE_NAME,
      type: 'signature',
      page: 1,
      x: 100,
      y: 600,
      width: 200,
      height: 40,
      required: true,
    },
  ],
});

// Most applications will want to database envelope.id here, alongside whatever record prompted the
// signature request, so webhooks and status checks later have something to join against.
console.log(`Envelope: ${envelope.name} (${envelope.id})`);

// In-person signing hands the device to the signer instead of emailing them. The link is single-use
// and short lived, so generate it at the moment you are ready to hand over.
const inPerson = await getInPersonLink(endpoint, envelope.id, ROLE_NAME);
console.log(`In-person signing link: ${inPerson.link}`);

// Cancel is terminal. Doing it here keeps the quickstart from leaving live signature requests
// behind; a real integration would only cancel when the underlying deal falls through.
const canceled = await cancelEnvelope(endpoint, envelope.id);
console.log(`Canceled: ${canceled.status}`);
