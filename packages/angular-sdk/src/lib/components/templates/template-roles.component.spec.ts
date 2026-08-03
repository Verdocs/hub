import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { Component, signal } from '@angular/core';
import type { IRole, ITemplate } from '@verdocs/js-sdk';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { VerdocsTemplateRolesComponent, type IRolesUpdatedEvent } from './template-roles.component';
import { provideVerdocs } from '../../provide-verdocs';
import { TEST_API_BASE } from '../../session';
import type { SDKError } from '../../types';

const makeRole = (overrides: Partial<IRole>): IRole => ({
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
  ...overrides,
});

const roles = [
  makeRole({ name: 'Recipient 1', sequence: 1, order: 1 }),
  makeRole({ name: 'Landlord', sequence: 2, order: 1, first_name: 'Larry', last_name: 'Landlord', email: 'larry@example.com' }),
];

const makeTemplate = (overrides: Partial<ITemplate> = {}): ITemplate =>
  ({
    id: 'template-1',
    name: 'Lease Agreement',
    roles,
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

describe('VerdocsTemplateRolesComponent', () => {
  @Component({
    imports: [ VerdocsTemplateRolesComponent ],
    template: `
      <verdocs-template-roles
        [templateId]="templateId()"
        (rolesUpdated)="updates.push($event)"
        (sdkError)="errors.push($event)"
        (next)="nexts = nexts + 1"
        (cancel)="cancels = cancels + 1" />
    `,
  })
  class HostComponent {
    updates: IRolesUpdatedEvent[] = [];
    errors: SDKError[] = [];
    nexts = 0;
    cancels = 0;
    templateId = signal('template-1');
  }

  let mock: MockAdapter;

  beforeEach(() => {
    localStorage.clear();

    mock = new MockAdapter(axios);
    mock.onGet('/v2/templates/template-1').reply(200, makeTemplate());
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    TestBed.configureTestingModule({
      providers: [ provideVerdocs({ baseUrl: TEST_API_BASE }) ],
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

  it('renders role chips grouped by sequence', async () => {
    const fixture = await render();

    // Placeholder roles show their role name; known roles show the person.
    const text = element(fixture).textContent;
    expect(text).toContain('Recipient 1');
    expect(text).toContain('Larry Landlord');

    // Two sequence rows plus the trailing add-a-step row.
    expect(text).toContain('1.');
    expect(text).toContain('2.');
    expect(text).toContain('3.');
  });

  it('adds a role with a generated name at the row sequence', async () => {
    mock.onPost('/v2/roles/template-1').reply(200, makeRole({ name: 'Recipient 3', sequence: 1, order: 2 }));

    const fixture = await render();

    const addButtons = Array.from(element(fixture).querySelectorAll<HTMLButtonElement>('button')).filter(
      button => button.textContent?.trim() === '+ Add Role');
    (addButtons[0] as HTMLButtonElement).click();
    await settle(fixture);

    const request = mock.history.post.find(r => r.url === '/v2/roles/template-1');
    expect(JSON.parse(request?.data as string)).toEqual(
      expect.objectContaining({ name: 'Recipient 3', sequence: 1, order: 2, type: 'signer' }),
    );

    expect(fixture.componentInstance.updates).toEqual([
      expect.objectContaining({ event: 'added', templateId: 'template-1' }),
    ]);
  });

  it('opens the role editor from a chip', async () => {
    const fixture = await render();

    (element(fixture).querySelector('button[aria-label="Edit role Recipient 1"]') as HTMLButtonElement).click();
    fixture.detectChanges();
    await fixture.whenStable();

    // The editor renders into a floating portal in document.body.
    const editorName = document.querySelector('.vdocs-portal input[placeholder="Role Name..."]') as HTMLInputElement;
    expect(editorName.value).toBe('Recipient 1');
  });

  it('deletes a role through the editor and reports it', async () => {
    mock.onDelete('/v2/roles/template-1/Recipient%201').reply(200, '');

    const fixture = await render();

    (element(fixture).querySelector('button[aria-label="Edit role Recipient 1"]') as HTMLButtonElement).click();
    fixture.detectChanges();
    await fixture.whenStable();

    (document.querySelector('.vdocs-portal button[aria-label="Delete Role"]') as HTMLButtonElement).click();
    await settle(fixture);

    expect(mock.history.delete.find(r => r.url === '/v2/roles/template-1/Recipient%201')).toBeTruthy();
    expect(fixture.componentInstance.updates).toEqual([ expect.objectContaining({ event: 'deleted' }) ]);

    // The editor panel closes with the deletion.
    expect(document.querySelector('.vdocs-portal input[placeholder="Role Name..."]')).toBeNull();
  });

  it('shows the empty state and disables OK when there are no roles', async () => {
    mock.onGet('/v2/templates/template-1').reply(200, makeTemplate({ roles: [] }));

    const fixture = await render();

    expect(element(fixture).textContent).toContain('You must add at least one Role');
    expect(element(fixture).textContent).toContain('1.');

    const ok = Array.from(element(fixture).querySelectorAll<HTMLButtonElement>('verdocs-button button')).find(
      button => button.textContent?.trim() === 'OK');
    expect(ok?.disabled).toBe(true);
  });
});
