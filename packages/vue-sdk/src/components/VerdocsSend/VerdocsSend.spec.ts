import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { VerdocsEndpoint } from '@verdocs/js-sdk';
import type { IBrand, IRole, ITemplate } from '@verdocs/js-sdk';
import { QueryClient, VUE_QUERY_CLIENT } from '@tanstack/vue-query';
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils';
import type { ISendEventDetail, ISentEventDetail } from './VerdocsSend.vue';
import { makeTestJwt, TEST_API_BASE } from '../../test/support';
import { VERDOCS_ENDPOINT_KEY } from '../../provider/keys';
import VerdocsSend from './VerdocsSend.vue';

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

type Wrapper = VueWrapper<InstanceType<typeof VerdocsSend>>;

const button = (wrapper: Wrapper, label: string) => wrapper.findAll('button').find(candidate => candidate.text() === label);

const row = (wrapper: Wrapper, roleName: string) => wrapper.find(`button[data-rn="${roleName}"]`);

const deliveryRow = (wrapper: Wrapper, label: string) => wrapper.findAll('button').find(candidate => candidate.text().startsWith(label));

// Picker fields are labelled, so we resolve them through the label's for attribute.
const pickerField = (wrapper: Wrapper, labelText: string) => {
  const label = wrapper.findAll('label').find(candidate => candidate.text().replace(/\s+/g, ' ').trim() === labelText);
  return wrapper.find(`#${label!.attributes('for')}`);
};

describe('VerdocsSend', () => {
  let mock: MockAdapter;
  // The mock adapter answers with the first matching handler it was given, so the fixtures live
  // in variables the handlers read rather than being re-registered per test.
  let template: ITemplate;
  let brands: IBrand[];
  let defaultBrandId: string | null;

  const setTemplate = (next: ITemplate) => {
    template = next;
  };

  const setBrands = (next: IBrand[], nextDefaultBrandId: string | null = null) => {
    brands = next;
    defaultBrandId = nextDefaultBrandId;
  };

  beforeEach(() => {
    localStorage.clear();
    setTemplate(makeTemplate({}));
    setBrands([]);

    mock = new MockAdapter(axios);
    mock.onGet('/v2/templates/template-1').reply(() => [ 200, template ]);
    mock.onGet('/v2/organizations/org-1/brands').reply(() => [ 200, brands ]);
    mock.onGet('/v2/organizations/org-1').reply(() => [ 200, { id: 'org-1', name: 'Test Org', default_brand_id: defaultBrandId } ]);
    mock.onGet('/v2/organization-contacts').reply(200, []);
    mock.onGet('/v2/organizations/entitlements').reply(200, []);
    mock.onPost('/v2/envelopes').reply(200, { id: 'envelope-1', name: 'Offer Letter' });
    mock.onAny().reply(200, {});
  });

  afterEach(() => {
    mock.restore();
  });

  const mountSend = async (props: Record<string, unknown> = {}) => {
    // The endpoint is built after the adapter is installed so its axios instance inherits the
    // mocked transport, and the token gives the component the session it insists on.
    const endpoint = new VerdocsEndpoint({ baseURL: TEST_API_BASE, persist: false });
    endpoint.setToken(makeTestJwt());

    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const wrapper = mount(VerdocsSend, {
      props: { templateId: 'template-1', ...props },
      global: {
        provide: {
          [VERDOCS_ENDPOINT_KEY as symbol]: endpoint,
          [VUE_QUERY_CLIENT]: queryClient,
        },
      },
    });

    await flushPromises();
    await flushPromises();
    return wrapper as Wrapper;
  };

  const configureRecipient = async (wrapper: Wrapper, roleName: string, email: string) => {
    await row(wrapper, roleName).trigger('click');
    await pickerField(wrapper, 'First name').setValue('Paige');
    await pickerField(wrapper, 'Last name').setValue('Turner');
    await pickerField(wrapper, 'Email').setValue(email);
    await button(wrapper, 'Done')!.trigger('click');
  };

  it('renders a row per role, with step labels when the template has more than one step', async () => {
    setTemplate(makeTemplate({ roles: [ makeRole({ name: 'Signer 1' }), makeRole({ name: 'Approver', sequence: 2 }) ] }));
    const wrapper = await mountSend();

    expect(row(wrapper, 'Signer 1').exists()).toBe(true);
    expect(row(wrapper, 'Approver').exists()).toBe(true);
    expect(wrapper.text()).toContain('Step 1');
    expect(wrapper.text()).toContain('Step 2');
    expect(row(wrapper, 'Signer 1').text()).toContain('Configure recipient');
  });

  it('omits step labels for a single-step template', async () => {
    setTemplate(makeTemplate({ roles: [ makeRole({ name: 'Signer 1' }), makeRole({ name: 'Signer 2' }) ] }));
    const wrapper = await mountSend();

    expect(wrapper.text()).not.toContain('Step 1');
  });

  it('keeps Send disabled until every role is configured', async () => {
    setTemplate(makeTemplate({ roles: [ filledRole({ name: 'Signer 1' }), makeRole({ name: 'Signer 2' }) ] }));
    const wrapper = await mountSend();

    expect(button(wrapper, 'Send')!.attributes('disabled')).toBeDefined();
    expect(row(wrapper, 'Signer 1').text()).toContain('paige@example.com');
  });

  it('enables Send once every role carries a name and email', async () => {
    setTemplate(makeTemplate({ roles: [ filledRole({ name: 'Signer 1' }), filledRole({ name: 'Signer 2', email: 'sue@example.com' }) ] }));
    const wrapper = await mountSend();

    expect(button(wrapper, 'Send')!.attributes('disabled')).toBeUndefined();
  });

  it('merges a contact configured in the detail view into its role', async () => {
    const wrapper = await mountSend();

    await configureRecipient(wrapper, 'Signer 1', 'paige@example.com');

    expect(row(wrapper, 'Signer 1').text()).toContain('Paige Turner');
    expect(row(wrapper, 'Signer 1').text()).toContain('paige@example.com');
    expect(button(wrapper, 'Send')!.attributes('disabled')).toBeUndefined();
  });

  it('blocks the send when two recipients share an email', async () => {
    setTemplate(makeTemplate({ roles: [ filledRole({ name: 'Signer 1' }), filledRole({ name: 'Signer 2' }) ] }));
    const wrapper = await mountSend();

    expect(wrapper.text()).toContain('Recipients cannot share the same email.');
    expect(button(wrapper, 'Send')!.attributes('disabled')).toBeDefined();
  });

  it('labels the brand row with the organization default when there is one', async () => {
    setBrands([ makeBrand({}) ], 'brand-1');
    const wrapper = await mountSend();

    expect(deliveryRow(wrapper, 'Brand')!.text()).toContain('Default (Acme Corp)');
  });

  it('falls back to Verdocs styling in the brand row when the organization has no default', async () => {
    const wrapper = await mountSend();

    expect(deliveryRow(wrapper, 'Brand')!.text()).toContain('Default (Verdocs)');
  });

  it('offers the Creating a Brand hint when the organization has no brands', async () => {
    const wrapper = await mountSend();

    await deliveryRow(wrapper, 'Brand')!.trigger('click');

    expect(wrapper.text()).toContain('Creating a Brand');
    expect(wrapper.find('a[href="https://app.verdocs.com/settings/branding"]').exists()).toBe(true);
  });

  it('clamps the expiration to 120 days and treats a blank field as the default', async () => {
    const wrapper = await mountSend();

    expect(deliveryRow(wrapper, 'Expires')!.text()).toContain('120 days');

    await deliveryRow(wrapper, 'Expires')!.trigger('click');
    const days = wrapper.find('input[aria-label="Expires in days"]');

    await days.setValue('300');
    expect((days.element as HTMLInputElement).value).toBe('120');

    await days.setValue('45');
    expect((days.element as HTMLInputElement).value).toBe('45');

    await button(wrapper, 'Done')!.trigger('click');
    expect(deliveryRow(wrapper, 'Expires')!.text()).toContain('45 days');
  });

  it('switches the notifications row to Off when they are disabled', async () => {
    const wrapper = await mountSend();

    expect(deliveryRow(wrapper, 'Notifications')!.text()).toContain('On');

    await deliveryRow(wrapper, 'Notifications')!.trigger('click');
    await wrapper.find('input[type="checkbox"]').setValue(true);

    expect(wrapper.text()).toContain('Disabling notifications turns off invitations and reminders');
    expect(wrapper.find('a[href="https://app.verdocs.com/settings/webhooks"]').exists()).toBe(true);

    await button(wrapper, 'Done')!.trigger('click');
    expect(deliveryRow(wrapper, 'Notifications')!.text()).toContain('Off');
  });

  it('posts the envelope request and reports the result', async () => {
    setTemplate(makeTemplate({ roles: [ filledRole({ name: 'Signer 1' }) ] }));
    const wrapper = await mountSend();

    await button(wrapper, 'Send')!.trigger('click');
    await flushPromises();

    const posted = JSON.parse(mock.history.post.find(request => request.url === '/v2/envelopes')!.data);
    expect(posted).toMatchObject({
      template_id: 'template-1',
      name: 'Offer Letter',
      no_contact: false,
      initial_reminder: 0,
      followup_reminders: 0,
    });
    expect(typeof posted.expires_at).toBe('string');
    expect(posted.brand_key).toBeUndefined();
    expect(posted.recipients).toHaveLength(1);

    const [ sent ] = wrapper.emitted('send')![0] as [ISentEventDetail];
    expect(sent.envelope_id).toBe('envelope-1');
    expect(sent.template_id).toBe('template-1');
  });

  it('includes brand_key only once a brand is chosen', async () => {
    setTemplate(makeTemplate({ roles: [ filledRole({ name: 'Signer 1' }) ] }));
    setBrands([ makeBrand({}) ], null);
    const wrapper = await mountSend();

    await deliveryRow(wrapper, 'Brand')!.trigger('click');
    await wrapper.findAll('button[role="radio"]')[1]!.trigger('click');
    await button(wrapper, 'Done')!.trigger('click');
    await button(wrapper, 'Send')!.trigger('click');
    await flushPromises();

    const posted = JSON.parse(mock.history.post.find(request => request.url === '/v2/envelopes')!.data);
    expect(posted.brand_key).toBe('acme');
  });

  it('cancels the send when the host calls the cancel function', async () => {
    setTemplate(makeTemplate({ roles: [ filledRole({ name: 'Signer 1' }) ] }));
    const onBeforeSend = vi.fn((_details: ISendEventDetail, cancel: () => void) => cancel());
    const wrapper = await mountSend({ onBeforeSend });

    await button(wrapper, 'Send')!.trigger('click');
    await flushPromises();

    expect(onBeforeSend).toHaveBeenCalledTimes(1);

    expect(mock.history.post.some(request => request.url === '/v2/envelopes')).toBe(false);
    expect(wrapper.emitted('send')).toBeUndefined();
  });

  it('emits cancel when the user backs out', async () => {
    const wrapper = await mountSend();

    await button(wrapper, 'Cancel')!.trigger('click');

    expect(wrapper.emitted('cancel')).toHaveLength(1);
  });

  it('hides Cancel when the host supplies its own navigation', async () => {
    const wrapper = await mountSend({ showCancel: false });

    expect(button(wrapper, 'Cancel')).toBeUndefined();
    expect(button(wrapper, 'Send')).toBeDefined();
  });

  it('renders nothing for a template that is not sendable', async () => {
    setTemplate(makeTemplate({ is_sendable: false }));
    const wrapper = await mountSend();

    expect(wrapper.find('button').exists()).toBe(false);
  });
});
