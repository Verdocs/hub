import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { VerdocsEndpoint } from '@verdocs/js-sdk';
import { flushPromises, mount } from '@vue/test-utils';
import type { IRole, ITemplate } from '@verdocs/js-sdk';
import { QueryClient, VUE_QUERY_CLIENT } from '@tanstack/vue-query';
import VerdocsTemplateRoles from './VerdocsTemplateRoles.vue';
import { VERDOCS_ENDPOINT_KEY } from '../../provider/keys';
import { TEST_API_BASE } from '../../test/support';

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
  ({ id: 'template-1', name: 'Lease Agreement', roles, fields: [], documents: [], ...overrides }) as ITemplate;

const buttonByText = (wrapper: ReturnType<typeof mount>, text: string) => wrapper.findAll('button').find(button => button.text() === text)!;

describe('VerdocsTemplateRoles', () => {
  let mock: MockAdapter;

  beforeEach(() => {
    localStorage.clear();
    mock = new MockAdapter(axios);
  });

  afterEach(() => {
    mock.restore();
    document.body.innerHTML = '';
  });

  const mountRoles = async (template = makeTemplate(), props = {}) => {
    mock.onGet('/v2/templates/template-1').reply(200, template);
    const endpoint = new VerdocsEndpoint({ baseURL: TEST_API_BASE, persist: false });
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const wrapper = mount(VerdocsTemplateRoles, {
      props: { templateId: 'template-1', ...props },
      global: { provide: { [VERDOCS_ENDPOINT_KEY as symbol]: endpoint, [VUE_QUERY_CLIENT]: queryClient } },
    });
    await flushPromises();
    return wrapper;
  };

  it('renders role chips grouped by sequence', async () => {
    const wrapper = await mountRoles();

    // Placeholder roles show their role name; known roles show the person.
    expect(wrapper.text()).toContain('Recipient 1');
    expect(wrapper.text()).toContain('Larry Landlord');

    // Two sequence rows plus the trailing add-a-step row.
    expect(wrapper.text()).toContain('1.');
    expect(wrapper.text()).toContain('2.');
    expect(wrapper.text()).toContain('3.');
  });

  it('adds a role with a generated name at the row sequence', async () => {
    mock.onPost('/v2/roles/template-1').reply(200, makeRole({ name: 'Recipient 3', sequence: 1, order: 2 }));

    const wrapper = await mountRoles();

    await wrapper.findAll('button').filter(button => button.text() === '+ Add Role')[0]!.trigger('click');
    await flushPromises();

    expect(JSON.parse(String(mock.history.post[0]!.data))).toMatchObject({ name: 'Recipient 3', sequence: 1, order: 2, type: 'signer' });
    expect(wrapper.emitted('rolesUpdated')![0]![0]).toMatchObject({ event: 'added', templateId: 'template-1' });
  });

  it('opens the role editor from a chip', async () => {
    const wrapper = await mountRoles();

    await wrapper.find('button[aria-label="Edit role Recipient 1"]').trigger('click');
    await flushPromises();

    // The editor renders through a Teleport, so it lands in document.body.
    const nameInput = document.body.querySelector('input[placeholder="Role Name..."]') as HTMLInputElement | null;
    expect(nameInput?.value).toBe('Recipient 1');
  });

  it('shows the empty state and disables OK when there are no roles', async () => {
    const wrapper = await mountRoles(makeTemplate({ roles: [] }));

    expect(wrapper.text()).toContain('You must add at least one Role');
    expect(buttonByText(wrapper, 'OK').attributes('disabled')).toBeDefined();
    expect(wrapper.text()).toContain('1.');
  });
});
