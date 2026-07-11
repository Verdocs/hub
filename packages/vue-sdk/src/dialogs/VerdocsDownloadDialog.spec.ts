import { DOMWrapper, mount } from '@vue/test-utils';
import type { IEnvelopeDocument } from '@verdocs/js-sdk';
import VerdocsDownloadDialog from './VerdocsDownloadDialog.vue';

const sampleDocument = (overrides: Partial<IEnvelopeDocument> = {}): IEnvelopeDocument => ({
  id: 'a2ce2f1c-3f9d-4a91-b7c2-b3a1de23a6d1',
  envelope_id: '83da3d70-7857-4392-b876-c4592a304bc9',
  template_document_id: null,
  order: 1,
  type: 'attachment',
  name: 'Contract.pdf',
  pages: 4,
  mime: 'application/pdf',
  size: 182044,
  signed: true,
  page_sizes: [ { width: 612, height: 792 } ],
  created_at: '2026-07-01T17:24:05.000Z',
  updated_at: '2026-07-01T17:31:12.000Z',
  ...overrides,
});

const contract = sampleDocument();
const addendum = sampleDocument({ id: 'b7f1a044-51f5-4f5e-8f52-9a41f9f2b902', order: 2, name: 'Addendum.pdf' });
const certificate = sampleDocument({ id: 'd44e8c72-6a1b-4b6e-b1de-5f0a2f9f61c8', order: 3, type: 'certificate', name: 'Certificate.pdf' });

// The dialog teleports to document.body, so assertions and clicks go through a
// body wrapper rather than the mount wrapper.
const body = () => new DOMWrapper(document.body);

const rowByText = (text: string) => body().findAll('button').find(button => button.text().includes(text));

const attachmentLabels = () =>
  body()
    .findAll('button')
    .filter(button => button.text().includes('Download the document'))
    .map(button => button.text());

describe('VerdocsDownloadDialog', () => {
  it('renders a row per attachment plus the certificate, combined, and zip options, and cancels on dismissal', async () => {
    const wrapper = mount(VerdocsDownloadDialog, { props: { documents: [ contract, addendum, certificate ], signed: true } });

    const dialog = body().get('[role="dialog"]');
    expect(dialog.text()).toContain('Download');
    expect(rowByText('Contract.pdf')).toBeDefined();
    expect(rowByText('Addendum.pdf')).toBeDefined();
    expect(rowByText('Download the certificate')).toBeDefined();
    expect(rowByText('Combined')).toBeDefined();
    expect(rowByText('All Files')).toBeDefined();
    expect(dialog.text()).not.toContain('Multiple documents attached');

    await body().get('button[aria-label="Close"]').trigger('click');
    expect(wrapper.emitted('cancel')).toHaveLength(1);

    wrapper.unmount();
  });

  it('sorts attachments by order, then created_at', () => {
    // Same order: created_at breaks the tie.
    const later = sampleDocument({ id: 'later', name: 'Later.pdf', order: 1, created_at: '2026-07-02T00:00:00.000Z' });
    const earlier = sampleDocument({ id: 'earlier', name: 'Earlier.pdf', order: 1, created_at: '2026-07-01T00:00:00.000Z' });
    const tied = mount(VerdocsDownloadDialog, { props: { documents: [ later, earlier ], signed: true } });
    expect(attachmentLabels()[0]).toContain('Earlier.pdf');
    expect(attachmentLabels()[1]).toContain('Later.pdf');
    tied.unmount();

    // Different orders: order wins even against an earlier created_at.
    const second = sampleDocument({ id: 'second', name: 'Second.pdf', order: 2, created_at: '2026-06-01T00:00:00.000Z' });
    const first = sampleDocument({ id: 'first', name: 'First.pdf', order: 1, created_at: '2026-07-02T00:00:00.000Z' });
    const ordered = mount(VerdocsDownloadDialog, { props: { documents: [ second, first ], signed: true } });
    expect(attachmentLabels()[0]).toContain('First.pdf');
    expect(attachmentLabels()[1]).toContain('Second.pdf');
    ordered.unmount();
  });

  it('replaces attachment rows with an info message when more than two attachments exist', () => {
    const exhibit = sampleDocument({ id: 'exhibit', order: 3, name: 'Exhibit.pdf' });
    const wrapper = mount(VerdocsDownloadDialog, { props: { documents: [ contract, addendum, exhibit ], signed: true } });

    expect(body().get('[role="dialog"]').text()).toContain('Multiple documents attached. Please use the ZIP option below to download all files.');
    expect(rowByText('Contract.pdf')).toBeUndefined();

    wrapper.unmount();
  });

  it('offers attachments even while unsigned, and marks them signed afterwards', async () => {
    const unsigned = mount(VerdocsDownloadDialog, { props: { documents: [ contract ] } });

    // Unsigned attachments show the busy spinner rather than the Signed badge, but stay clickable.
    expect(rowByText('Contract.pdf')!.text()).not.toContain('Signed');
    await rowByText('Contract.pdf')!.trigger('click');
    expect(unsigned.emitted('download')).toEqual([ [ { document: contract, variant: 'document' } ] ]);
    unsigned.unmount();

    const signed = mount(VerdocsDownloadDialog, { props: { documents: [ contract ], signed: true } });
    expect(rowByText('Contract.pdf')!.text()).toContain('Signed');
    signed.unmount();
  });

  it('gates the certificate on signing, then fires it with the document or undefined', async () => {
    const unsigned = mount(VerdocsDownloadDialog, { props: { documents: [ contract, certificate ] } });
    expect(rowByText('Download the certificate')!.attributes('disabled')).toBeDefined();
    expect(rowByText('Download the certificate')!.attributes('title')).toBe('Certificate not yet available');
    await rowByText('Download the certificate')!.trigger('click');
    expect(unsigned.emitted('download')).toBeUndefined();
    unsigned.unmount();

    const signed = mount(VerdocsDownloadDialog, { props: { documents: [ contract, certificate ], signed: true } });
    await rowByText('Download the certificate')!.trigger('click');
    expect(signed.emitted('download')).toEqual([ [ { document: certificate, variant: 'certificate' } ] ]);
    signed.unmount();

    // A certificate that exists server-side but is not in documents yet fires with no document.
    const pending = mount(VerdocsDownloadDialog, { props: { documents: [ contract ], signed: true, hasCertificate: true } });
    await rowByText('Download the certificate')!.trigger('click');
    expect(pending.emitted('download')).toEqual([ [ { document: undefined, variant: 'certificate' } ] ]);
    pending.unmount();
  });

  it('gates combined and zip on readiness and fires their payloads', async () => {
    // hasCertificate alone is not enough: merging needs the certificate document itself.
    const pending = mount(VerdocsDownloadDialog, { props: { documents: [ contract ], signed: true, hasCertificate: true } });
    expect(rowByText('Combined')!.attributes('disabled')).toBeDefined();
    expect(rowByText('Combined')!.attributes('title')).toBe('Waiting for all documents to be ready');
    pending.unmount();

    const polling = mount(VerdocsDownloadDialog, { props: { documents: [ contract, certificate ], signed: true, polling: true } });
    expect(rowByText('Combined')!.attributes('disabled')).toBeDefined();
    expect(rowByText('All Files')!.attributes('disabled')).toBeDefined();
    polling.unmount();

    const ready = mount(VerdocsDownloadDialog, { props: { documents: [ contract, certificate ], signed: true } });
    await rowByText('Combined')!.trigger('click');
    await rowByText('All Files')!.trigger('click');
    expect(ready.emitted('download')).toEqual([
      [ { document: certificate, variant: 'combined' } ],
      [ { document: undefined, variant: 'zip' } ],
    ]);
    ready.unmount();
  });
});
