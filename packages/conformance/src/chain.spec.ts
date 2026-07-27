import { randomUUID } from 'node:crypto';
import type { IRole, ITemplateField } from '@verdocs/js-sdk';
import {
  authenticate,
  cancelEnvelope,
  createEnvelope,
  createField,
  createTemplate,
  createTemplateRole,
  getEnvelope,
  getEnvelopes,
  getTemplate,
  VerdocsEndpoint,
} from '@verdocs/js-sdk';
import { curl, loadEnv, normalizeVolatile } from './support.js';

/**
 * The canonical create-to-cancel lifecycle from fixtures.json, run live against beta as one
 * ordered test with state flowing forward. Wire shapes follow sdks/WIRE-NOTES.md: multipart
 * template create with the PDF under a part named "documents", role and field in follow-up
 * calls, envelope create as JSON with the test account as the sole recipient, then cancel.
 */

const ROLE_NAME = 'Recipient 1';
const FIELD_NAME = 'recipient-1-signature';

const minimalPdf = (): Buffer => {
  const stream = Buffer.from('q Q');
  const objects = [
    Buffer.from('<< /Type /Catalog /Pages 2 0 R >>'),
    Buffer.from('<< /Type /Pages /Kids [3 0 R] /Count 1 >>'),
    Buffer.from('<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << >> /Contents 4 0 R >>'),
    Buffer.concat([
      Buffer.from(`<< /Length ${stream.length} >>\nstream\n`),
      stream,
      Buffer.from('\nendstream'),
    ]),
  ];

  const chunks: Buffer[] = [ Buffer.from('%PDF-1.4\n') ];
  const offsets: number[] = [];

  objects.forEach((body, index) => {
    offsets.push(Buffer.concat(chunks).length);
    chunks.push(Buffer.from(`${index + 1} 0 obj\n`), body, Buffer.from('\nendobj\n'));
  });

  const body = Buffer.concat(chunks);
  const xrefAt = body.length;
  const trailer = Buffer.concat([
    Buffer.from(`xref\n0 ${objects.length + 1}\n`),
    Buffer.from('0000000000 65535 f \n'),
    ...offsets.map(offset => Buffer.from(`${String(offset).padStart(10, '0')} 00000 n \n`)),
    Buffer.from(`trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefAt}\n%%EOF\n`),
  ]);

  return Buffer.concat([ body, trailer ]);
};

const env = loadEnv();

const endpoint = new VerdocsEndpoint({ baseURL: env.apiBase, persist: false });
let token = '';

beforeAll(async () => {
  const auth = await authenticate(endpoint, { username: env.email, password: env.password, grant_type: 'password' });
  token = auth.access_token;
  endpoint.setToken(token);
});

describe('canonical chain', () => {
  it('creates a template through a canceled envelope', async () => {
    const name = `SDK Conformance Chain ${randomUUID().replace(/-/g, '')}`;

    // chain-create-template
    const pdf = minimalPdf();
    const document = new File([ new Uint8Array(pdf) ], 'sdk-conformance-chain.pdf', { type: 'application/pdf' });
    const template = await createTemplate(endpoint, { name, documents: [ document ] });
    expect(template.id).toMatch(/^[0-9a-f-]{36}$/i);
    expect(template.name).toBe(name);
    expect(template.documents).toHaveLength(1);
    expect(template.documents?.[0]?.pages).toBe(1);

    const uploadedDocument = template.documents![0]!;

    // chain-add-role
    const role = await createTemplateRole(endpoint, template.id, { name: ROLE_NAME, type: 'signer' } as IRole);
    expect(role.template_id).toBe(template.id);
    expect(role.name).toBe(ROLE_NAME);

    // chain-add-field
    const field = await createField(endpoint, template.id, {
      document_id: uploadedDocument.id,
      name: FIELD_NAME,
      role_name: ROLE_NAME,
      type: 'signature',
      page: 0,
      x: 72,
      y: 72,
    } as ITemplateField);
    expect(field.template_id).toBe(template.id);
    expect(field.document_id).toBe(uploadedDocument.id);
    expect(field.role_name).toBe(ROLE_NAME);
    expect(field.type).toBe('signature');

    const attached = await getTemplate(endpoint, template.id);
    expect((attached.roles || []).map(entry => entry.name)).toEqual([ ROLE_NAME ]);
    expect((attached.fields || []).map(entry => [ entry.name, entry.role_name ])).toEqual([ [ FIELD_NAME, ROLE_NAME ] ]);

    // chain-create-envelope
    const envelope = await createEnvelope(endpoint, {
      template_id: template.id,
      recipients: [
        {
          role_name: ROLE_NAME,
          first_name: 'Conformance',
          last_name: 'Chain',
          email: env.email,
        },
      ],
    });
    expect(envelope.id).toMatch(/^[0-9a-f-]{36}$/i);
    expect(envelope.template_id).toBe(template.id);
    expect(envelope.status).toBe('pending');
    expect(envelope.recipients?.[0]?.role_name).toBe(ROLE_NAME);
    expect(envelope.recipients?.[0]?.email?.toLowerCase()).toBe(env.email.toLowerCase());

    try {
      // chain-get-envelope
      const viaCurl = await curl('GET', `${env.apiBase}/v2/envelopes/${envelope.id}`, { token });
      expect(viaCurl.status).toBe(200);
      const fetched = await getEnvelope(endpoint, envelope.id);
      expect(fetched.id).toBe(envelope.id);
      expect(normalizeVolatile(fetched)).toEqual(normalizeVolatile(viaCurl.body));

      // chain-list-envelopes
      const page = await getEnvelopes(endpoint, { template_id: template.id, rows: 10, page: 0 });
      expect(page.envelopes?.some(entry => entry.id === envelope.id)).toBe(true);
    } catch (error) {
      try {
        await cancelEnvelope(endpoint, envelope.id);
      } catch {
        // Beta tolerates the leftover; the original failure matters more.
      }

      throw error;
    }

    // chain-cancel-envelope
    const canceled = await cancelEnvelope(endpoint, envelope.id);
    expect(canceled.id).toBe(envelope.id);
    expect(canceled.status).toBe('canceled');
    expect((await getEnvelope(endpoint, envelope.id)).status).toBe('canceled');

    console.log(`chain template id: ${template.id}`);
    console.log(`chain envelope id: ${envelope.id}`);
  });
});
