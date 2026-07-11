import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { Component, signal } from '@angular/core';
import type { ITemplate, ITemplateField } from '@verdocs/js-sdk';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { VerdocsTemplateFieldPropertiesComponent } from './template-field-properties.component';
import { provideVerdocs } from '../../provide-verdocs';
import type { SDKError } from '../../types';

const makeField = (overrides: Partial<ITemplateField> = {}): ITemplateField => ({
  name: 'textboxP1-1',
  role_name: 'Recipient 1',
  template_id: 'tpl-1',
  document_id: 'doc-1',
  type: 'textbox',
  required: true,
  readonly: false,
  settings: null,
  page: 1,
  validator: null,
  label: 'Legal name',
  x: 100,
  y: 200,
  width: 150,
  height: 15,
  default: null,
  placeholder: 'Full name',
  multiline: false,
  group: null,
  options: null,
  ...overrides,
});

// The field mutations chain promises the pending-task tracker cannot see, so
// settle the tracker and the microtask queue a few times before asserting.
async function settle(fixture: ComponentFixture<unknown>) {
  for (let i = 0; i < 5; i++) {
    await fixture.whenStable();
    await new Promise(resolve => setTimeout(resolve, 0));
  }
  fixture.detectChanges();
}

describe('VerdocsTemplateFieldPropertiesComponent', () => {
  @Component({
    imports: [ VerdocsTemplateFieldPropertiesComponent ],
    template: `
      <verdocs-template-field-properties
        [templateId]="templateId()"
        [fieldName]="fieldName()"
        [helpText]="helpText()"
        (closed)="closes = closes + 1"
        (deleted)="deletes.push($event)"
        (settingsChanged)="changes.push($event)"
        (sdkError)="errors.push($event)" />
    `,
  })
  class HostComponent {
    closes = 0;
    deletes: { templateId: string; fieldName: string }[] = [];
    changes: { fieldName: string; field: ITemplateField }[] = [];
    errors: SDKError[] = [];
    templateId = signal('tpl-1');
    fieldName = signal('textboxP1-1');
    helpText = signal('');
  }

  let mock: MockAdapter;
  let serverTemplate: ITemplate;

  const installApi = (field: ITemplateField) => {
    serverTemplate = {
      id: 'tpl-1',
      name: 'Test Template',
      roles: [ { name: 'Recipient 1', sequence: 1 }, { name: 'Recipient 2', sequence: 2 } ],
      fields: [ field ],
    } as unknown as ITemplate;

    mock.onGet('/v2/templates/tpl-1').reply(() => [ 200, serverTemplate ]);
    mock.onPatch(/\/v2\/fields\/tpl-1\/.+/).reply(config => {
      const name = decodeURIComponent(config.url?.split('/').pop() || '');
      const index = (serverTemplate.fields || []).findIndex(f => f.name === name);
      serverTemplate.fields![index] = { ...serverTemplate.fields![index], ...JSON.parse(config.data as string) } as ITemplateField;
      return [ 200, serverTemplate.fields![index] ];
    });
    mock.onDelete(/\/v2\/fields\/tpl-1\/.+/).reply(config => {
      const name = decodeURIComponent(config.url?.split('/').pop() || '');
      serverTemplate.fields = (serverTemplate.fields || []).filter(f => f.name !== name);
      return [ 200, {} ];
    });
  };

  beforeEach(() => {
    localStorage.clear();
    mock = new MockAdapter(axios);

    TestBed.configureTestingModule({
      providers: [ provideVerdocs({ baseUrl: 'https://stage-api.verdocs.com' }) ],
    });
  });

  afterEach(() => {
    mock.restore();
    document.querySelectorAll('.vdocs-toast').forEach(toast => toast.remove());
  });

  const render = async (field: ITemplateField) => {
    installApi(field);
    const fixture = TestBed.createComponent(HostComponent);
    if (field.name !== 'textboxP1-1') {
      fixture.componentInstance.fieldName.set(field.name);
    }
    fixture.detectChanges();
    await settle(fixture);
    return fixture;
  };

  const element = (fixture: ComponentFixture<HostComponent>) => fixture.nativeElement as HTMLElement;

  const inputByPlaceholder = (fixture: ComponentFixture<HostComponent>, placeholder: string, index = 0) =>
    element(fixture).querySelectorAll(`input[placeholder="${placeholder}"]`)[index] as HTMLInputElement;

  const setInputValue = (input: HTMLInputElement, value: string) => {
    input.value = value;
    input.dispatchEvent(new Event('input'));
  };

  const checkboxByLabel = (fixture: ComponentFixture<HostComponent>, label: string) =>
    Array.from(element(fixture).querySelectorAll('verdocs-checkbox label'))
      .find(el => el.textContent?.includes(label))
      ?.querySelector('input') as HTMLInputElement;

  const buttonByLabel = (fixture: ComponentFixture<HostComponent>, label: string) =>
    Array.from(element(fixture).querySelectorAll<HTMLButtonElement>('verdocs-button button')).find(
      button => button.textContent?.trim() === label) as HTMLButtonElement;

  it('seeds the form from the field settings', async () => {
    const fixture = await render(makeField());

    expect(element(fixture).textContent).toContain('Textbox Settings');
    expect(inputByPlaceholder(fixture, 'Field Name...').value).toBe('textboxP1-1');
    expect(inputByPlaceholder(fixture, 'Optional Label...').value).toBe('Legal name');
    expect((element(fixture).querySelector('select') as HTMLSelectElement).value).toBe('Recipient 1');
    expect(checkboxByLabel(fixture, 'Required').checked).toBe(true);
    expect(checkboxByLabel(fixture, 'Read-only').checked).toBe(false);
    expect(buttonByLabel(fixture, 'Save').disabled).toBe(true);
    expect(buttonByLabel(fixture, 'Cancel').disabled).toBe(true);
  });

  it('saves edited settings and reports them', async () => {
    const fixture = await render(makeField());

    checkboxByLabel(fixture, 'Read-only').click();
    fixture.detectChanges();

    // With read-only on and no default yet, the default input flips to its
    // "Default value required" placeholder.
    setInputValue(inputByPlaceholder(fixture, 'Default value required'), 'Jane Smith');
    fixture.detectChanges();

    buttonByLabel(fixture, 'Save').click();
    await settle(fixture);

    const request = mock.history.patch.find(r => r.url === '/v2/fields/tpl-1/textboxP1-1');
    expect(JSON.parse(request?.data as string)).toEqual(
      expect.objectContaining({ readonly: true, default: 'Jane Smith', required: true }),
    );

    expect(fixture.componentInstance.changes).toEqual([
      expect.objectContaining({
        fieldName: 'textboxP1-1',
        field: expect.objectContaining({ readonly: true, default: 'Jane Smith' }),
      }),
    ]);
    expect(fixture.componentInstance.closes).toBe(1);
  });

  it('blocks saving a read-only field without a default value', async () => {
    const fixture = await render(makeField());

    checkboxByLabel(fixture, 'Read-only').click();
    fixture.detectChanges();

    expect(buttonByLabel(fixture, 'Save').disabled).toBe(true);
    expect(inputByPlaceholder(fixture, 'Default value required')).toBeTruthy();
  });

  it('deletes the field and reports the deletion', async () => {
    const fixture = await render(makeField());

    const deleteButton = element(fixture).querySelector('button[aria-label="Delete field"]') as HTMLButtonElement;
    expect(deleteButton.disabled).toBe(false);

    deleteButton.click();
    await settle(fixture);

    expect(mock.history.delete.find(r => r.url === '/v2/fields/tpl-1/textboxP1-1')).toBeTruthy();
    expect(fixture.componentInstance.deletes).toEqual([ { templateId: 'tpl-1', fieldName: 'textboxP1-1' } ]);
    expect(fixture.componentInstance.closes).toBe(1);
  });

  it('disables deletion once the form is dirty', async () => {
    const fixture = await render(makeField());

    setInputValue(inputByPlaceholder(fixture, 'Optional Label...'), 'Legal name!');
    fixture.detectChanges();

    expect((element(fixture).querySelector('button[aria-label="Delete field"]') as HTMLButtonElement).disabled).toBe(true);
  });

  it('edits dropdown options with a trailing blank row and requires one option to save', async () => {
    const fixture = await render(makeField({
      name: 'dropdownP1-1',
      type: 'dropdown',
      label: null,
      placeholder: null,
      options: [ { id: 'yes', label: 'Yes' } ],
    }));

    expect(element(fixture).textContent).toContain('Dropdown Settings');

    // One filled row plus the blank row for adding the next entry.
    expect(inputByPlaceholder(fixture, 'Unique ID', 0).value).toBe('yes');
    expect(inputByPlaceholder(fixture, 'Unique ID', 1).value).toBe('');

    // Clearing the only filled row leaves no options, which blocks saving.
    (element(fixture).querySelector('button[aria-label="Remove option 1"]') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(buttonByLabel(fixture, 'Save').disabled).toBe(true);

    setInputValue(inputByPlaceholder(fixture, 'Unique ID', 0), 'no');
    fixture.detectChanges();
    setInputValue(inputByPlaceholder(fixture, 'Display label', 0), 'No');
    fixture.detectChanges();

    buttonByLabel(fixture, 'Save').click();
    await settle(fixture);

    const request = mock.history.patch.find(r => r.url === '/v2/fields/tpl-1/dropdownP1-1');
    expect(JSON.parse(request?.data as string)).toEqual(
      expect.objectContaining({ options: [ { id: 'no', label: 'No' } ] }),
    );
  });

  it('resets edits and closes on cancel', async () => {
    const fixture = await render(makeField());

    setInputValue(inputByPlaceholder(fixture, 'Optional Label...'), 'Legal name edited');
    fixture.detectChanges();

    buttonByLabel(fixture, 'Cancel').click();
    fixture.detectChanges();

    expect(fixture.componentInstance.closes).toBe(1);
    expect(inputByPlaceholder(fixture, 'Optional Label...').value).toBe('Legal name');
  });

  it('flips to the help view when helpText is provided', async () => {
    const fixture = await render(makeField());
    fixture.componentInstance.helpText.set('Text boxes collect a single line of text.');
    fixture.detectChanges();

    (element(fixture).querySelector('button[aria-label="Show help"]') as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(element(fixture).textContent).toContain('Text boxes collect a single line of text.');
    expect(inputByPlaceholder(fixture, 'Field Name...')).toBeUndefined();

    (element(fixture).querySelector('button[aria-label="Hide help"]') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(inputByPlaceholder(fixture, 'Field Name...')).toBeTruthy();
  });
});
