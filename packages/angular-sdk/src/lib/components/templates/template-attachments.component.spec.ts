import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { Component, signal } from '@angular/core';
import type { ITemplate, ITemplateDocument } from '@verdocs/js-sdk';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { VerdocsTemplateAttachmentsComponent } from './template-attachments.component';
import type { ITemplateEvent, SDKError } from '../../types';
import { provideVerdocs } from '../../provide-verdocs';

const makeDocument = (overrides: Partial<ITemplateDocument>): ITemplateDocument =>
  ({
    id: 'doc-1',
    name: 'NDA.pdf',
    template_id: 'template-1',
    order: 0,
    pages: 3,
    mime: 'application/pdf',
    size: 12345,
    page_sizes: [],
    ...overrides,
  }) as unknown as ITemplateDocument;

const documents = [
  makeDocument({ id: 'doc-1', name: 'NDA.pdf' }),
  makeDocument({
    id: 'doc-2',
    name: 'Exhibit-A.docx',
    pages: 1,
    mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  }),
];

const makeTemplate = (overrides: Partial<ITemplate> = {}): ITemplate =>
  ({
    id: 'template-1',
    name: 'Lease Agreement',
    roles: [],
    fields: [],
    documents,
    ...overrides,
  }) as unknown as ITemplate;

// The upload and delete handlers chain promises the pending-task tracker
// cannot see, so settle the tracker and the microtask queue a few times.
async function settle(fixture: ComponentFixture<unknown>) {
  for (let i = 0; i < 5; i++) {
    await fixture.whenStable();
    await new Promise(resolve => setTimeout(resolve, 0));
  }
  fixture.detectChanges();
}

describe('VerdocsTemplateAttachmentsComponent', () => {
  @Component({
    imports: [ VerdocsTemplateAttachmentsComponent ],
    template: `
      <verdocs-template-attachments
        [templateId]="templateId()"
        (attachmentsChanged)="changes.push($event)"
        (next)="nexts.push($event)"
        (sdkError)="errors.push($event)"
        (cancel)="cancels = cancels + 1" />
    `,
  })
  class HostComponent {
    changes: ITemplateEvent[] = [];
    nexts: ITemplateEvent[] = [];
    errors: SDKError[] = [];
    cancels = 0;
    templateId = signal('template-1');
  }

  let mock: MockAdapter;

  beforeEach(() => {
    localStorage.clear();

    mock = new MockAdapter(axios);
    mock.onGet('/v2/templates/template-1').reply(200, makeTemplate());

    TestBed.configureTestingModule({
      providers: [ provideVerdocs({ baseUrl: 'https://stage-api.verdocs.com' }) ],
    });
  });

  afterEach(() => {
    mock.restore();
  });

  const render = async () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    await settle(fixture);
    return fixture;
  };

  const element = (fixture: ComponentFixture<HostComponent>) => fixture.nativeElement as HTMLElement;

  const fixtureButton = (fixture: ComponentFixture<HostComponent>, label: string) =>
    Array.from(element(fixture).querySelectorAll<HTMLButtonElement>('verdocs-button button')).find(
      button => button.textContent?.trim() === label) as HTMLButtonElement;

  // The confirmation dialogs render into document.body, not the fixture.
  const dialogButton = (label: string) =>
    Array.from(document.querySelectorAll<HTMLButtonElement>('[role="dialog"] button')).find(
      button => button.textContent?.trim() === label);

  it('lists the template documents', async () => {
    const fixture = await render();

    const text = element(fixture).textContent;
    expect(text).toContain('NDA.pdf');
    expect(text).toContain('Exhibit-A.docx');
    expect(element(fixture).querySelector('[title="3 page(s)"]')).not.toBeNull();
  });

  it('uploads a selected file and reports the change', async () => {
    mock.onPost('/v2/template-documents').reply(200, makeDocument({ id: 'doc-3', name: 'Lease.pdf' }));

    const fixture = await render();

    const file = new File([ 'dummy' ], 'Lease.pdf', { type: 'application/pdf' });
    const input = element(fixture).querySelector('input[type="file"]') as HTMLInputElement;
    Object.defineProperty(input, 'files', { value: [ file ], configurable: true });
    input.dispatchEvent(new Event('change'));
    await settle(fixture);

    const request = mock.history.post.find(r => r.url === '/v2/template-documents');
    const body = request?.data as FormData;
    expect(body.get('file')).toEqual(file);
    expect(body.get('template_id')).toBe('template-1');

    expect(fixture.componentInstance.changes).toEqual([
      expect.objectContaining({ template: expect.objectContaining({ id: 'template-1' }) }),
    ]);
  });

  it('deletes an attachment after the user confirms', async () => {
    mock.onDelete('/v2/template-documents/doc-1').reply(200, makeTemplate());

    const fixture = await render();

    (element(fixture).querySelector('button[aria-label="Delete NDA.pdf"]') as HTMLButtonElement).click();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(document.body.textContent).toContain('Delete this Attachment?');
    dialogButton('OK')?.click();
    await settle(fixture);

    expect(mock.history.delete.find(r => r.url === '/v2/template-documents/doc-1')).toBeTruthy();
    expect(fixture.componentInstance.changes.length).toBe(1);
  });

  it('refuses to delete the last attachment', async () => {
    mock.onGet('/v2/templates/template-1').reply(200, makeTemplate({ documents: [ documents[0] as ITemplateDocument ] }));

    const fixture = await render();

    (element(fixture).querySelector('button[aria-label="Delete NDA.pdf"]') as HTMLButtonElement).click();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(document.body.textContent).toContain('Unable to Delete Attachment');
    expect(mock.history.delete).toEqual([]);

    dialogButton('OK')?.click();
    fixture.detectChanges();
    expect(document.body.textContent).not.toContain('Unable to Delete Attachment');
  });

  it('fires next with the template and cancel when dismissed', async () => {
    const fixture = await render();

    fixtureButton(fixture, 'Next').click();
    expect(fixture.componentInstance.nexts).toEqual([
      expect.objectContaining({ template: expect.objectContaining({ id: 'template-1' }) }),
    ]);

    fixtureButton(fixture, 'Cancel').click();
    expect(fixture.componentInstance.cancels).toBe(1);
  });

  it('disables Next when the template has no documents', async () => {
    mock.onGet('/v2/templates/template-1').reply(200, makeTemplate({ documents: [] }));

    const fixture = await render();

    expect(fixtureButton(fixture, 'Next').disabled).toBe(true);
  });
});
