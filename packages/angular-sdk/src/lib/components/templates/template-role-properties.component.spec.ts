import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { Component, signal } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import type { IRole, ITemplate, ITemplateField } from '@verdocs/js-sdk';
import { VerdocsTemplateRolePropertiesComponent } from './template-role-properties.component';
import { provideVerdocs } from '../../provide-verdocs';
import type { SDKError } from '../../types';

const sampleRole: IRole = {
  template_id: 'template-1',
  name: 'Recipient 1',
  type: 'signer',
  full_name: null,
  first_name: '',
  last_name: '',
  email: '',
  phone: '',
  message: null,
  sequence: 1,
  order: 1,
  delegator: false,
  name_locked: false,
};

const makeTemplate = (overrides: Partial<ITemplate> = {}): ITemplate =>
  ({
    id: 'template-1',
    name: 'Lease Agreement',
    roles: [ sampleRole ],
    fields: [],
    documents: [],
    ...overrides,
  }) as unknown as ITemplate;

// The role mutations chain promises the pending-task tracker cannot see, so
// settle the tracker and the microtask queue a few times before asserting.
async function settle(fixture: ComponentFixture<unknown>) {
  for (let i = 0; i < 5; i++) {
    await fixture.whenStable();
    await new Promise(resolve => setTimeout(resolve, 0));
  }
  fixture.detectChanges();
}

describe('VerdocsTemplateRolePropertiesComponent', () => {
  @Component({
    imports: [ VerdocsTemplateRolePropertiesComponent ],
    template: `
      <verdocs-template-role-properties
        [templateId]="templateId()"
        [role]="role()"
        (closed)="closes = closes + 1"
        (deleted)="deletes.push($event)"
        (sdkError)="errors.push($event)" />
    `,
  })
  class HostComponent {
    closes = 0;
    deletes: { templateId: string; roleName: string }[] = [];
    errors: SDKError[] = [];
    templateId = signal('template-1');
    role = signal<IRole>(sampleRole);
  }

  let mock: MockAdapter;

  beforeEach(() => {
    localStorage.clear();

    mock = new MockAdapter(axios);
    mock.onGet('/v2/templates/template-1').reply(200, makeTemplate());
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    TestBed.configureTestingModule({
      providers: [ provideVerdocs({ baseUrl: 'https://stage-api.verdocs.com' }) ],
    });
  });

  afterEach(() => {
    mock.restore();
    vi.restoreAllMocks();
  });

  const render = async () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    await settle(fixture);
    return fixture;
  };

  const element = (fixture: ComponentFixture<HostComponent>) => fixture.nativeElement as HTMLElement;

  const inputByPlaceholder = (fixture: ComponentFixture<HostComponent>, placeholder: string) =>
    element(fixture).querySelector(`input[placeholder="${placeholder}"]`) as HTMLInputElement;

  const setInputValue = (input: HTMLInputElement, value: string) => {
    input.value = value;
    input.dispatchEvent(new Event('input'));
  };

  const saveButton = (fixture: ComponentFixture<HostComponent>) =>
    Array.from(element(fixture).querySelectorAll<HTMLButtonElement>('verdocs-button button')).find(
      button => button.textContent?.trim() === 'Save') as HTMLButtonElement;

  const deleteButton = (fixture: ComponentFixture<HostComponent>) =>
    element(fixture).querySelector('button[aria-label="Delete Role"]') as HTMLButtonElement;

  it('renders the role values with Save disabled until edited', async () => {
    const fixture = await render();

    expect(inputByPlaceholder(fixture, 'Role Name...').value).toBe('Recipient 1');
    expect((element(fixture).querySelector('select') as HTMLSelectElement).value).toBe('signer');
    expect((element(fixture).querySelector('input[type="number"]') as HTMLInputElement).value).toBe('1');
    expect((element(fixture).querySelector('input[type="checkbox"]') as HTMLInputElement).checked).toBe(false);
    expect(saveButton(fixture).disabled).toBe(true);
  });

  it('saves edits through the role mutation and closes', async () => {
    mock.onPatch('/v2/roles/template-1/Recipient%201').reply(200, { ...sampleRole, first_name: 'Jane' });

    const fixture = await render();

    setInputValue(inputByPlaceholder(fixture, 'First...'), 'Jane');
    setInputValue(inputByPlaceholder(fixture, 'Last...'), 'Doe');
    setInputValue(inputByPlaceholder(fixture, 'Email Address...'), 'jane@example.com');
    fixture.detectChanges();

    saveButton(fixture).click();
    await settle(fixture);

    const request = mock.history.patch.find(r => r.url === '/v2/roles/template-1/Recipient%201');
    expect(JSON.parse(request?.data as string)).toEqual({
      name: 'Recipient 1',
      type: 'signer',
      sequence: 1,
      first_name: 'Jane',
      last_name: 'Doe',
      email: 'jane@example.com',
      phone: '',
      delegator: false,
    });

    expect(fixture.componentInstance.closes).toBe(1);
  });

  it('blocks saving while contact info is incomplete, and locks deletion while dirty', async () => {
    const fixture = await render();

    setInputValue(inputByPlaceholder(fixture, 'First...'), 'Jane');
    fixture.detectChanges();

    // First name alone is neither "all blank" nor "complete", so Save stays off.
    expect(saveButton(fixture).disabled).toBe(true);
    // Deleting with unsaved edits is blocked, matching the legacy behavior.
    expect(deleteButton(fixture).disabled).toBe(true);
  });

  it('deletes the role after confirmation', async () => {
    mock.onDelete('/v2/roles/template-1/Recipient%201').reply(200, '');

    const fixture = await render();

    deleteButton(fixture).click();
    await settle(fixture);

    expect(window.confirm).toHaveBeenCalled();
    expect(mock.history.delete.find(r => r.url === '/v2/roles/template-1/Recipient%201')).toBeTruthy();
    expect(fixture.componentInstance.deletes).toEqual([ { templateId: 'template-1', roleName: 'Recipient 1' } ]);
    expect(fixture.componentInstance.closes).toBe(1);
  });

  it('does not delete when the confirmation is declined', async () => {
    vi.mocked(window.confirm).mockReturnValue(false);

    const fixture = await render();

    deleteButton(fixture).click();
    await settle(fixture);

    expect(mock.history.delete).toEqual([]);
    expect(fixture.componentInstance.deletes).toEqual([]);
  });

  it('locks the name once fields reference the role', async () => {
    mock.onGet('/v2/templates/template-1').reply(200, makeTemplate({ fields: [ { role_name: 'Recipient 1' } as ITemplateField ] }));

    const fixture = await render();

    expect(inputByPlaceholder(fixture, 'Role Name...').disabled).toBe(true);
    expect(element(fixture).textContent).toContain('can no longer be renamed');
  });
});
