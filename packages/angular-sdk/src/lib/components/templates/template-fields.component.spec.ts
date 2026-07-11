import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { Component, signal } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import type { ITemplate, ITemplateDocument, ITemplateField } from '@verdocs/js-sdk';
import { VerdocsTemplateFieldsComponent, type ITemplateFieldsEvent } from './template-fields.component';
import { provideVerdocs } from '../../provide-verdocs';
import type { SDKError } from '../../types';

const makeField = (overrides: Partial<ITemplateField> = {}): ITemplateField => ({
  name: 'textboxP1-1',
  role_name: 'Recipient 1',
  template_id: 'tpl-1',
  document_id: 'doc-1',
  type: 'textbox',
  required: false,
  readonly: false,
  settings: null,
  page: 1,
  validator: null,
  label: null,
  x: 100,
  y: 200,
  width: 150,
  height: 15,
  default: null,
  placeholder: null,
  multiline: false,
  group: null,
  options: null,
  ...overrides,
});

const makeTemplate = (): ITemplate =>
  ({
    id: 'tpl-1',
    name: 'Test Template',
    documents: [
      {
        id: 'doc-1',
        name: 'Contract.pdf',
        template_id: 'tpl-1',
        order: 1,
        pages: 1,
        page_sizes: { 1: { width: 612, height: 792 } } as unknown as ITemplateDocument['page_sizes'],
      } as ITemplateDocument,
    ],
    roles: [ { name: 'Recipient 1', sequence: 1 } ],
    fields: [
      makeField(),
      makeField({ name: 'signatureP1-1', type: 'signature', x: 300, y: 400, width: 82, height: 36 }),
    ],
  }) as unknown as ITemplate;

// The field mutations chain promises the pending-task tracker cannot see, so
// settle the tracker and the microtask queue a few times before asserting.
async function settle(fixture: ComponentFixture<unknown>) {
  for (let i = 0; i < 5; i++) {
    await fixture.whenStable();
    await new Promise(resolve => setTimeout(resolve, 0));
  }
  fixture.detectChanges();
}

describe('VerdocsTemplateFieldsComponent', () => {
  @Component({
    imports: [ VerdocsTemplateFieldsComponent ],
    template: `
      <verdocs-template-fields
        [templateId]="templateId()"
        (templateUpdated)="updates.push($event)"
        (sdkError)="errors.push($event)" />
    `,
  })
  class HostComponent {
    updates: ITemplateFieldsEvent[] = [];
    errors: SDKError[] = [];
    templateId = signal('tpl-1');
  }

  let mock: MockAdapter;
  let serverTemplate: ITemplate;

  beforeEach(() => {
    localStorage.clear();
    serverTemplate = makeTemplate();

    // The server template is mutable so PATCH and DELETE responses feed the
    // refetch the same way the real API would.
    mock = new MockAdapter(axios);
    mock.onGet('/v2/templates/tpl-1').reply(() => [ 200, serverTemplate ]);
    mock.onGet(/\/v2\/template-documents\/page-image\/doc-1\/original\/\d+/).reply(config => [
      200,
      `https://fake.test/page-${config.url?.split('/').pop()}.png`,
    ]);
    mock.onPatch(/\/v2\/fields\/tpl-1\/.+/).reply(config => {
      const name = decodeURIComponent(config.url?.split('/').pop() || '');
      const index = (serverTemplate.fields || []).findIndex(field => field.name === name);
      serverTemplate.fields![index] = { ...serverTemplate.fields![index], ...JSON.parse(config.data as string) } as ITemplateField;
      return [ 200, serverTemplate.fields![index] ];
    });
    mock.onDelete(/\/v2\/fields\/tpl-1\/.+/).reply(config => {
      const name = decodeURIComponent(config.url?.split('/').pop() || '');
      serverTemplate.fields = (serverTemplate.fields || []).filter(field => field.name !== name);
      return [ 200, {} ];
    });

    TestBed.configureTestingModule({
      providers: [ provideVerdocs({ baseUrl: 'https://stage-api.verdocs.com' }) ],
    });
  });

  afterEach(() => {
    mock.restore();
    document.querySelectorAll('.vdocs-toast').forEach(toast => toast.remove());
  });

  const render = async () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    await settle(fixture);
    return fixture;
  };

  const element = (fixture: ComponentFixture<HostComponent>) => fixture.nativeElement as HTMLElement;

  const settingsWrapper = (fixture: ComponentFixture<HostComponent>, name: string) =>
    element(fixture).querySelector(`[aria-label="${name} settings"]`) as HTMLElement;

  // The properties panel renders into a floating portal in document.body.
  const panelButton = (label: string) =>
    Array.from(document.querySelectorAll<HTMLButtonElement>('.vdocs-portal button')).find(
      button => button.textContent?.trim() === label || button.getAttribute('aria-label') === label);

  it('renders the page image with each field component at its stored position', async () => {
    const fixture = await render();

    const image = element(fixture).querySelector('img[alt="Page 1"]') as HTMLImageElement;
    expect(image.getAttribute('src')).toBe('https://fake.test/page-1.png');

    // The textbox field renders the field textbox input, the signature field
    // the signature affordance, each inside a positioned settings wrapper
    // placed in PDF coordinates (left from the left edge, bottom up from the
    // page bottom).
    const textbox = element(fixture).querySelector('verdocs-field-textbox input') as HTMLInputElement;
    expect(textbox.disabled).toBe(true);

    const signature = element(fixture).querySelector('verdocs-field-signature button') as HTMLButtonElement;
    expect(signature.disabled).toBe(true);

    const textboxWrapper = settingsWrapper(fixture, 'textboxP1-1');
    expect(textboxWrapper.style.left).toBe('100px');
    expect(textboxWrapper.style.bottom).toBe('200px');
    expect(textboxWrapper.style.width).toBe('150px');
    expect(textboxWrapper.style.height).toBe('15px');

    const signatureWrapper = settingsWrapper(fixture, 'signatureP1-1');
    expect(signatureWrapper.style.left).toBe('300px');
    expect(signatureWrapper.style.bottom).toBe('400px');
    expect(signatureWrapper.style.width).toBe('82px');
    expect(signatureWrapper.style.height).toBe('36px');
  });

  it('opens the properties panel on click and saves edits through the API', async () => {
    const fixture = await render();

    settingsWrapper(fixture, 'textboxP1-1').click();
    await settle(fixture);

    expect(document.body.textContent).toContain('Textbox Settings');

    const label = document.querySelector('.vdocs-portal input[placeholder="Optional Label..."]') as HTMLInputElement;
    label.value = 'Legal name';
    label.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    panelButton('Save')?.click();
    await settle(fixture);

    const request = mock.history.patch.find(r => r.url === '/v2/fields/tpl-1/textboxP1-1');
    expect(JSON.parse(request?.data as string)).toEqual(
      expect.objectContaining({ name: 'textboxP1-1', label: 'Legal name', role_name: 'Recipient 1' }),
    );

    expect(fixture.componentInstance.updates).toEqual([ expect.objectContaining({ event: 'updated-field' }) ]);
    expect(document.body.textContent).not.toContain('Textbox Settings');
  });

  it('deletes a field from the properties panel', async () => {
    const fixture = await render();

    settingsWrapper(fixture, 'signatureP1-1').click();
    await settle(fixture);

    expect(document.body.textContent).toContain('Signature Settings');

    panelButton('Delete field')?.click();
    await settle(fixture);

    expect(mock.history.delete.find(r => r.url === '/v2/fields/tpl-1/signatureP1-1')).toBeTruthy();
    expect(fixture.componentInstance.updates).toEqual([ expect.objectContaining({ event: 'deleted-field' }) ]);

    // The refreshed template no longer has the field, so the canvas drops it.
    expect(settingsWrapper(fixture, 'signatureP1-1')).toBeNull();
  });

  it('shows the empty state when the template has no documents', async () => {
    serverTemplate.documents = [];
    serverTemplate.fields = [];

    const fixture = await render();

    expect(element(fixture).textContent).toContain('does not have any documents yet');
  });
});
