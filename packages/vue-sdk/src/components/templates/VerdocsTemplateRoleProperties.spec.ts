import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { VerdocsEndpoint } from '@verdocs/js-sdk';
import { flushPromises, mount } from '@vue/test-utils';
import { QueryClient, VUE_QUERY_CLIENT } from '@tanstack/vue-query';
import type { IRole, ITemplate, ITemplateField } from '@verdocs/js-sdk';
import VerdocsTemplateRoleProperties from './VerdocsTemplateRoleProperties.vue';
import { VERDOCS_ENDPOINT_KEY } from '../../provider/keys';
import { TEST_API_BASE } from '../../test/support';

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
  ({ id: 'template-1', name: 'Lease Agreement', roles: [ sampleRole ], fields: [], documents: [], ...overrides }) as ITemplate;

const buttonByText = (wrapper: ReturnType<typeof mount>, text: string) => wrapper.findAll('button').find(button => button.text() === text)!;

describe('VerdocsTemplateRoleProperties', () => {
  let mock: MockAdapter;

  beforeEach(() => {
    localStorage.clear();
    mock = new MockAdapter(axios);
    vi.spyOn(window, 'confirm').mockReturnValue(true);
  });

  afterEach(() => {
    mock.restore();
    vi.restoreAllMocks();
  });

  const mountPanel = async (props = {}, template = makeTemplate()) => {
    mock.onGet('/v2/templates/template-1').reply(200, template);
    const endpoint = new VerdocsEndpoint({ baseURL: TEST_API_BASE, persist: false });
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const wrapper = mount(VerdocsTemplateRoleProperties, {
      props: { templateId: 'template-1', role: sampleRole, ...props },
      global: { provide: { [VERDOCS_ENDPOINT_KEY as symbol]: endpoint, [VUE_QUERY_CLIENT]: queryClient } },
    });
    await flushPromises();
    return wrapper;
  };

  it('renders the role values with Save disabled until edited', async () => {
    const wrapper = await mountPanel();

    expect((wrapper.find('input[placeholder="Role Name..."]').element as HTMLInputElement).value).toBe('Recipient 1');
    expect((wrapper.find('select').element as HTMLSelectElement).value).toBe('signer');
    expect((wrapper.find('input[type="number"]').element as HTMLInputElement).value).toBe('1');
    expect((wrapper.find('input[type="checkbox"]').element as HTMLInputElement).checked).toBe(false);
    expect(buttonByText(wrapper, 'Save').attributes('disabled')).toBeDefined();
  });

  it('saves edits through updateTemplateRole and emits close', async () => {
    mock.onPatch(/\/v2\/roles\/template-1\//).reply(200, { ...sampleRole, first_name: 'Jane' });

    const wrapper = await mountPanel();

    await wrapper.find('input[aria-label="First Name"]').setValue('Jane');
    await wrapper.find('input[aria-label="Last Name"]').setValue('Doe');
    await wrapper.find('input[aria-label="Email Address"]').setValue('jane@example.com');
    await buttonByText(wrapper, 'Save').trigger('click');
    await flushPromises();

    expect(JSON.parse(String(mock.history.patch[0]!.data))).toEqual({
      name: 'Recipient 1',
      type: 'signer',
      sequence: 1,
      first_name: 'Jane',
      last_name: 'Doe',
      email: 'jane@example.com',
      phone: '',
      delegator: false,
    });
    expect(wrapper.emitted('close')).toBeTruthy();
  });

  it('blocks saving while contact info is incomplete, and locks deletion while dirty', async () => {
    const wrapper = await mountPanel();

    await wrapper.find('input[aria-label="First Name"]').setValue('Jane');

    expect(buttonByText(wrapper, 'Save').attributes('disabled')).toBeDefined();
    expect(wrapper.find('button[aria-label="Delete Role"]').attributes('disabled')).toBeDefined();
  });

  it('deletes the role after confirmation and reports it', async () => {
    mock.onDelete(/\/v2\/roles\/template-1\//).reply(200, '');

    const wrapper = await mountPanel();

    await wrapper.find('button[aria-label="Delete Role"]').trigger('click');
    await flushPromises();

    expect(window.confirm).toHaveBeenCalled();
    expect(mock.history.delete).toHaveLength(1);
    expect(wrapper.emitted('roleDeleted')![0]).toEqual([ { templateId: 'template-1', roleName: 'Recipient 1' } ]);
    expect(wrapper.emitted('close')).toBeTruthy();
  });

  it('does not delete when the confirmation is declined', async () => {
    vi.mocked(window.confirm).mockReturnValue(false);

    const wrapper = await mountPanel();

    await wrapper.find('button[aria-label="Delete Role"]').trigger('click');
    await flushPromises();

    expect(mock.history.delete).toHaveLength(0);
    expect(wrapper.emitted('roleDeleted')).toBeFalsy();
  });

  it('locks the name once fields reference the role', async () => {
    const wrapper = await mountPanel({}, makeTemplate({ fields: [ { role_name: 'Recipient 1' } as ITemplateField ] }));

    expect(wrapper.find('input[placeholder="Role Name..."]').attributes('disabled')).toBeDefined();
    expect(wrapper.text()).toContain('can no longer be renamed');
  });
});
