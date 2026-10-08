import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { Component, signal } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import type { IBrand, IOrganization, IRole, ITemplate } from '@verdocs/js-sdk';
import { VerdocsSendComponent, type IBeforeSendEvent, type ISentEventDetail } from './send.component';
import { provideVerdocs, VERDOCS_ENDPOINT } from '../provide-verdocs';
import { makeTestJwt } from '../test-support';
import { TEST_API_BASE } from '../session';

const makeRole = (overrides: Partial<IRole>): IRole =>
  ({
    template_id: 'template-1',
    name: 'Signer 1',
    type: 'signer',
    sequence: 1,
    order: 1,
    first_name: null,
    last_name: null,
    email: null,
    phone: null,
    message: null,
    ...overrides,
  }) as IRole;

const makeTemplate = (overrides: Partial<ITemplate>): ITemplate =>
  ({
    id: 'template-1',
    name: 'Offer Letter',
    organization_id: 'org-1',
    is_sendable: true,
    roles: [ makeRole({}) ],
    ...overrides,
  }) as ITemplate;

const filledRole = (overrides: Partial<IRole>) =>
  makeRole({ first_name: 'Paige', last_name: 'Turner', email: 'paige@example.com', ...overrides });

const makeBrand = (overrides: Partial<IBrand>): IBrand =>
  ({
    id: 'brand-1',
    organization_id: 'org-1',
    key: 'acme',
    name: 'Acme Corp',
    favicon_url: null,
    thumbnail_url: null,
    primary_color: '#123456',
    ...overrides,
  }) as IBrand;

// whenStable settles Angular's own work, not the SDK's promise chains, so the mocked axios
// responses need a few macrotasks to land before we assert on the rendered result.
async function settle(fixture: ComponentFixture<unknown>) {
  for (let i = 0; i < 5; i++) {
    await fixture.whenStable();
    await new Promise(resolve => setTimeout(resolve, 0));
  }

  fixture.detectChanges();
}

describe('VerdocsSendComponent', () => {
  @Component({
    imports: [ VerdocsSendComponent ],
    template: `
      <verdocs-send
        templateId="template-1"
        [environment]="environment()"
        [showCancel]="showCancel()"
        [brandKey]="brandKey()"
        (beforeSend)="onBeforeSend($event)"
        (send)="sent.push($event)"
        (cancel)="cancels = cancels + 1" />
    `,
  })
  class HostComponent {
    environment = signal('');
    showCancel = signal(true);
    brandKey = signal('');
    cancelTheSend = false;
    beforeSends: IBeforeSendEvent[] = [];
    sent: ISentEventDetail[] = [];
    cancels = 0;

    onBeforeSend(details: IBeforeSendEvent) {
      this.beforeSends.push(details);
      if (this.cancelTheSend) {
        details.preventDefault();
      }
    }
  }

  let mock: MockAdapter;
  let template: ITemplate;
  let brands: IBrand[];
  let organization: IOrganization;
  let postReply: [number, unknown];

  beforeEach(() => {
    localStorage.clear();
    template = makeTemplate({});
    brands = [];
    organization = { id: 'org-1', name: 'Test Org' } as IOrganization;
    postReply = [ 200, { id: 'envelope-1', name: 'Offer Letter' } ];

    mock = new MockAdapter(axios);
    mock.onGet('/v2/profiles').reply(200, []);
    mock.onGet('/v2/templates/template-1').reply(() => [ 200, template ]);
    mock.onGet('/v2/organizations/org-1/brands').reply(() => [ 200, brands ]);
    mock.onGet('/v2/organizations/org-1').reply(() => [ 200, organization ]);
    mock.onGet('/v2/organization-contacts').reply(200, []);
    mock.onGet('/v2/organizations/entitlements').reply(200, []);
    mock.onPost('/v2/envelopes').reply(() => postReply);

    TestBed.configureTestingModule({ providers: [ provideVerdocs({ baseUrl: TEST_API_BASE }) ] });
    TestBed.inject(VERDOCS_ENDPOINT).setToken(makeTestJwt());
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

  type TFixture = ComponentFixture<HostComponent>;

  const element = (fixture: TFixture) => fixture.nativeElement as HTMLElement;

  const text = (fixture: TFixture) => element(fixture).textContent?.replace(/\s+/g, ' ') ?? '';

  const buttonByLabel = (fixture: TFixture, label: string) =>
    Array.from(element(fixture).querySelectorAll<HTMLButtonElement>('verdocs-button button')).find(
      button => button.textContent?.trim() === label) as HTMLButtonElement;

  const roleRow = (fixture: TFixture, roleName: string) => element(fixture).querySelector(`button[data-rn="${roleName}"]`) as HTMLButtonElement;

  const deliveryRow = (fixture: TFixture, label: string) =>
    Array.from(element(fixture).querySelectorAll<HTMLButtonElement>('button')).find(
      button => button.textContent?.replace(/\s+/g, ' ').trim().startsWith(label)) as HTMLButtonElement;

  const field = (fixture: TFixture, name: string) => element(fixture).querySelector(`[id$="-${name}"]`) as HTMLInputElement;

  const type = (target: HTMLInputElement, value: string) => {
    target.value = value;
    target.dispatchEvent(new Event('input'));
  };

  const openRow = async (fixture: TFixture, row: HTMLButtonElement) => {
    row.click();
    await settle(fixture);
  };

  const configureRecipient = async (fixture: TFixture, roleName: string, first: string, last: string, email: string) => {
    await openRow(fixture, roleRow(fixture, roleName));
    type(field(fixture, 'first-name'), first);
    type(field(fixture, 'last-name'), last);
    type(field(fixture, 'email'), email);
    fixture.detectChanges();
    buttonByLabel(fixture, 'Done').click();
    await settle(fixture);
  };

  it('renders a row per role, with step labels only when the template has more than one step', async () => {
    template = makeTemplate({ roles: [ makeRole({ name: 'Buyer' }), makeRole({ name: 'Seller', sequence: 2 }) ] });

    const fixture = await render();

    expect(roleRow(fixture, 'Buyer')).not.toBeNull();
    expect(roleRow(fixture, 'Seller')).not.toBeNull();
    expect(text(fixture)).toContain('Step 1');
    expect(text(fixture)).toContain('Step 2');
    expect(element(fixture).querySelectorAll('button[data-rn]')).toHaveLength(2);
  });

  it('omits step labels for a single-step template', async () => {
    template = makeTemplate({ roles: [ makeRole({ name: 'Buyer' }), makeRole({ name: 'Seller' }) ] });

    const fixture = await render();

    expect(roleRow(fixture, 'Buyer')).not.toBeNull();
    expect(text(fixture)).not.toContain('Step 1');
  });

  it('keeps Send disabled until every role is configured', async () => {
    template = makeTemplate({ roles: [ filledRole({ name: 'Buyer' }), makeRole({ name: 'Seller' }) ] });

    const fixture = await render();

    expect(buttonByLabel(fixture, 'Send').disabled).toBe(true);
    expect(text(fixture)).toContain('Paige Turner \u00b7 paige@example.com');
    expect(text(fixture)).toContain('Configure recipient');
  });

  it('enables Send once every role carries a name and email', async () => {
    template = makeTemplate({
      roles: [ filledRole({ name: 'Buyer' }), filledRole({ name: 'Seller', first_name: 'Rita', last_name: 'Booke', email: 'rita@example.com' }) ],
    });

    const fixture = await render();

    expect(buttonByLabel(fixture, 'Send').disabled).toBe(false);
    expect(text(fixture)).not.toContain('Recipients cannot share the same email.');
  });

  it('merges a contact picked in the detail view into its role', async () => {
    template = makeTemplate({ roles: [ makeRole({ name: 'Buyer' }) ] });

    const fixture = await render();
    await configureRecipient(fixture, 'Buyer', 'Paige', 'Turner', 'paige@example.com');

    expect(text(fixture)).toContain('Paige Turner \u00b7 paige@example.com');
    expect(buttonByLabel(fixture, 'Send').disabled).toBe(false);
  });

  it('blocks the send when two recipients share an email', async () => {
    template = makeTemplate({ roles: [ filledRole({ name: 'Buyer' }), filledRole({ name: 'Seller' }) ] });

    const fixture = await render();

    expect(text(fixture)).toContain('Recipients cannot share the same email.');
    expect(buttonByLabel(fixture, 'Send').disabled).toBe(true);
  });

  it('labels the brand row with the organization default when there is one', async () => {
    brands = [ makeBrand({}) ];
    organization = { id: 'org-1', default_brand_id: 'brand-1' } as IOrganization;

    const fixture = await render();

    expect(text(fixture)).toContain('Default (Acme Corp)');
  });

  it('falls back to Verdocs styling in the brand row, and offers to create a brand', async () => {
    const fixture = await render();

    expect(text(fixture)).toContain('Default (Verdocs)');

    await openRow(fixture, deliveryRow(fixture, 'Brand'));

    expect(text(fixture)).toContain('Creating a Brand');
    const link = element(fixture).querySelector('a[target="_blank"]') as HTMLAnchorElement;
    expect(link.getAttribute('href')).toBe('https://app.verdocs.com/settings/branding');
  });

  it('picks a brand and reports it on the row', async () => {
    brands = [ makeBrand({}), makeBrand({ id: 'brand-2', key: 'globex', name: 'Globex' }) ];
    organization = { id: 'org-1', default_brand_id: 'brand-1' } as IOrganization;
    template = makeTemplate({ roles: [ filledRole({ name: 'Buyer' }) ] });

    const fixture = await render();
    await openRow(fixture, deliveryRow(fixture, 'Brand'));

    const options = Array.from(element(fixture).querySelectorAll<HTMLButtonElement>('button[role="radio"]'));
    expect(options.map(option => option.textContent?.replace(/\s+/g, ' ').trim())).toEqual([
      'AC Default (Acme Corp) Organization default',
      'GL Globex globex',
    ]);

    options[1]?.click();
    await settle(fixture);
    buttonByLabel(fixture, 'Done').click();
    await settle(fixture);

    expect(text(fixture)).toContain('Globex');

    buttonByLabel(fixture, 'Send').click();
    await settle(fixture);

    expect(JSON.parse(mock.history.post[0]?.data as string).brand_key).toBe('globex');
  });

  it('honors a preset brand key once the template loads', async () => {
    brands = [ makeBrand({}) ];
    template = makeTemplate({ roles: [ filledRole({ name: 'Buyer' }) ] });

    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.brandKey.set('acme');
    fixture.detectChanges();
    await settle(fixture);

    expect(text(fixture)).toContain('Acme Corp');

    buttonByLabel(fixture, 'Send').click();
    await settle(fixture);

    expect(JSON.parse(mock.history.post[0]?.data as string).brand_key).toBe('acme');
  });

  it('clamps the expiration to 120 days and treats a blank field as the default', async () => {
    const fixture = await render();
    await openRow(fixture, deliveryRow(fixture, 'Expires'));

    const days = element(fixture).querySelector('input[aria-label="Expires in days"]') as HTMLInputElement;
    type(days, '999');
    await settle(fixture);
    expect(days.value).toBe('120');
    expect(text(fixture)).toContain('Expirations may be set from 1-120 days. If left blank, this will default to 120.');

    type(days, '30');
    await settle(fixture);
    expect(days.value).toBe('30');

    buttonByLabel(fixture, 'Done').click();
    await settle(fixture);
    expect(text(fixture)).toContain('Expires 30 days');

    await openRow(fixture, deliveryRow(fixture, 'Expires'));
    type(element(fixture).querySelector('input[aria-label="Expires in days"]') as HTMLInputElement, '');
    await settle(fixture);
    buttonByLabel(fixture, 'Done').click();
    await settle(fixture);
    expect(text(fixture)).toContain('Expires 120 days');
  });

  it('switches the notifications row to Off when they are disabled', async () => {
    const fixture = await render();

    expect(text(fixture)).toContain('Notifications On');

    await openRow(fixture, deliveryRow(fixture, 'Notifications'));
    const checkbox = element(fixture).querySelector('verdocs-checkbox input[type="checkbox"]') as HTMLInputElement;
    checkbox.click();
    await settle(fixture);

    expect(text(fixture)).toContain('Disabling notifications turns off invitations and reminders');
    const webhooks = Array.from(element(fixture).querySelectorAll<HTMLAnchorElement>('a')).find(
      link => link.textContent?.includes('Webhooks')) as HTMLAnchorElement;
    expect(webhooks.getAttribute('href')).toBe('https://app.verdocs.com/settings/webhooks');
    expect(webhooks.getAttribute('target')).toBe('_blank');

    buttonByLabel(fixture, 'Done').click();
    await settle(fixture);
    expect(text(fixture)).toContain('Notifications Off');
  });

  it('posts the envelope request, reports the result, and resets the form', async () => {
    template = makeTemplate({ roles: [ filledRole({ name: 'Buyer' }) ] });

    const fixture = await render();
    fixture.componentInstance.environment.set('web');
    fixture.detectChanges();

    buttonByLabel(fixture, 'Send').click();
    await settle(fixture);

    const request = JSON.parse(mock.history.post[0]?.data as string);
    expect(request).toMatchObject({
      template_id: 'template-1',
      name: 'Offer Letter',
      environment: 'web',
      initial_reminder: 0,
      followup_reminders: 0,
      no_contact: false,
    });
    expect(request.brand_key).toBeUndefined();
    expect(typeof request.expires_at).toBe('string');
    expect(request.recipients).toMatchObject([ { role_name: 'Buyer', first_name: 'Paige', last_name: 'Turner', email: 'paige@example.com' } ]);

    expect(fixture.componentInstance.sent).toHaveLength(1);
    expect(fixture.componentInstance.sent[0]?.envelope_id).toBe('envelope-1');
    // The roster is back to the template's own values and the delivery settings are at defaults.
    expect(text(fixture)).toContain('Expires 120 days');
    expect(text(fixture)).toContain('Notifications On');
  });

  it('cancels the send when the beforeSend handler calls preventDefault', async () => {
    template = makeTemplate({ roles: [ filledRole({ name: 'Buyer' }) ] });

    const fixture = await render();
    fixture.componentInstance.cancelTheSend = true;

    buttonByLabel(fixture, 'Send').click();
    await settle(fixture);

    expect(fixture.componentInstance.beforeSends).toHaveLength(1);
    expect(fixture.componentInstance.beforeSends[0]?.template.id).toBe('template-1');
    expect(mock.history.post).toHaveLength(0);
    expect(fixture.componentInstance.sent).toHaveLength(0);
  });

  it('reports a failed create through a toast and sdkError', async () => {
    postReply = [ 400, { error: 'Nope' } ];
    template = makeTemplate({ roles: [ filledRole({ name: 'Buyer' }) ] });

    const fixture = await render();
    buttonByLabel(fixture, 'Send').click();
    await settle(fixture);

    expect(document.querySelector('.vdocs-toast')?.textContent).toContain('Nope');
    expect(fixture.componentInstance.sent).toHaveLength(0);
  });

  it('reports the Cancel button to the host and hides it on request', async () => {
    const fixture = await render();

    buttonByLabel(fixture, 'Cancel').click();
    expect(fixture.componentInstance.cancels).toBe(1);

    fixture.componentInstance.showCancel.set(false);
    fixture.detectChanges();
    expect(buttonByLabel(fixture, 'Cancel')).toBeUndefined();
  });

  it('renders nothing for a template that is not sendable', async () => {
    template = makeTemplate({ is_sendable: false });

    const fixture = await render();

    expect(element(fixture).querySelector('button')).toBeNull();
  });
});
