import { TestBed } from '@angular/core/testing';
import { Component, signal } from '@angular/core';
import type { IEnvelopeDocument } from '@verdocs/js-sdk';
import { VerdocsDownloadDialogComponent, type IDownloadSelection } from './download-dialog.component';

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

describe('VerdocsDownloadDialogComponent', () => {
  @Component({
    imports: [ VerdocsDownloadDialogComponent ],
    template: `
      <verdocs-download-dialog
        [documents]="documents()"
        [signed]="signed()"
        [polling]="polling()"
        [hasCertificate]="hasCertificate()"
        (download)="downloads.push($event)"
        (cancel)="cancels = cancels + 1" />
    `,
  })
  class HostComponent {
    downloads: IDownloadSelection[] = [];
    cancels = 0;
    documents = signal<IEnvelopeDocument[]>([]);
    signed = signal(false);
    polling = signal(false);
    hasCertificate = signal(false);
  }

  async function createFixture() {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    return fixture;
  }

  const panel = () => document.querySelector('[role="dialog"]') as HTMLElement;
  const rowByText = (text: string) =>
    Array.from(panel().querySelectorAll('button')).find(button => button.textContent?.includes(text)) as HTMLButtonElement | undefined;

  it('renders attachments sorted by order plus the certificate, combined, and zip options', async () => {
    const fixture = await createFixture();
    fixture.componentInstance.documents.set([ addendum, contract, certificate ]);
    fixture.componentInstance.signed.set(true);
    fixture.detectChanges();

    expect(panel().textContent).toContain('Download');
    const attachmentRows = Array.from(panel().querySelectorAll('button')).filter(button => button.textContent?.includes('Download the document'));
    expect(attachmentRows.length).toBe(2);
    expect(attachmentRows[0]?.textContent).toContain('Contract.pdf');
    expect(attachmentRows[1]?.textContent).toContain('Addendum.pdf');
    expect(rowByText('Download the certificate')).toBeDefined();
    expect(rowByText('Combined')).toBeDefined();
    expect(rowByText('All Files')).toBeDefined();
    expect(panel().textContent).not.toContain('Multiple documents attached');
  });

  it('replaces attachment rows with an info message when more than two attachments exist', async () => {
    const fixture = await createFixture();
    const exhibit = sampleDocument({ id: 'exhibit', order: 3, name: 'Exhibit.pdf' });
    fixture.componentInstance.documents.set([ contract, addendum, exhibit ]);
    fixture.componentInstance.signed.set(true);
    fixture.detectChanges();

    expect(panel().textContent).toContain('Multiple documents attached. Please use the ZIP option below to download all files.');
    expect(rowByText('Contract.pdf')).toBeUndefined();
  });

  it('fires download with the attachment even while the envelope is unsigned, and marks it signed later', async () => {
    const fixture = await createFixture();
    fixture.componentInstance.documents.set([ contract ]);
    fixture.detectChanges();

    // Unsigned attachments show the busy spinner rather than the Signed badge, but stay clickable.
    expect(panel().textContent).not.toContain('Signed');
    rowByText('Contract.pdf')?.click();
    expect(fixture.componentInstance.downloads).toEqual([ { document: contract, variant: 'document' } ]);

    fixture.componentInstance.signed.set(true);
    fixture.detectChanges();
    expect(panel().textContent).toContain('Signed');
  });

  it('disables the certificate option until signed, then fires with the certificate document or undefined', async () => {
    const fixture = await createFixture();
    fixture.componentInstance.documents.set([ contract, certificate ]);
    fixture.detectChanges();

    const certRow = rowByText('Download the certificate') as HTMLButtonElement;
    expect(certRow.disabled).toBe(true);
    expect(certRow.title).toBe('Certificate not yet available');
    certRow.click();
    expect(fixture.componentInstance.downloads).toEqual([]);

    fixture.componentInstance.signed.set(true);
    fixture.detectChanges();
    rowByText('Download the certificate')?.click();
    expect(fixture.componentInstance.downloads).toEqual([ { document: certificate, variant: 'certificate' } ]);

    // A certificate that exists server-side but is not in documents yet downloads with no source document.
    fixture.componentInstance.documents.set([ contract ]);
    fixture.componentInstance.hasCertificate.set(true);
    fixture.detectChanges();
    rowByText('Download the certificate')?.click();
    expect(fixture.componentInstance.downloads[1]).toEqual({ document: undefined, variant: 'certificate' });
  });

  it('keeps combined disabled without the certificate document or while polling', async () => {
    const fixture = await createFixture();

    // hasCertificate alone is not enough: merging needs the certificate document itself.
    fixture.componentInstance.documents.set([ contract ]);
    fixture.componentInstance.signed.set(true);
    fixture.componentInstance.hasCertificate.set(true);
    fixture.detectChanges();
    const combinedRow = rowByText('Combined') as HTMLButtonElement;
    expect(combinedRow.disabled).toBe(true);
    expect(combinedRow.title).toBe('Waiting for all documents to be ready');

    fixture.componentInstance.documents.set([ contract, certificate ]);
    fixture.componentInstance.polling.set(true);
    fixture.detectChanges();
    expect((rowByText('Combined') as HTMLButtonElement).disabled).toBe(true);
    expect((rowByText('All Files') as HTMLButtonElement).disabled).toBe(true);

    fixture.componentInstance.polling.set(false);
    fixture.detectChanges();
    rowByText('Combined')?.click();
    expect(fixture.componentInstance.downloads).toEqual([ { document: certificate, variant: 'combined' } ]);
  });

  it('fires the zip variant with no document and cancels from the close button', async () => {
    const fixture = await createFixture();
    fixture.componentInstance.documents.set([ contract, certificate ]);
    fixture.componentInstance.signed.set(true);
    fixture.detectChanges();

    rowByText('All Files')?.click();
    expect(fixture.componentInstance.downloads).toEqual([ { document: undefined, variant: 'zip' } ]);

    (document.querySelector('button[aria-label="Close"]') as HTMLButtonElement).click();
    expect(fixture.componentInstance.cancels).toBe(1);
  });
});
