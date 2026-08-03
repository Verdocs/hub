import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import type { ITemplate } from '@verdocs/js-sdk';
import { VerdocsEndpoint } from '@verdocs/js-sdk';
import { flushPromises, mount } from '@vue/test-utils';
import { QueryClient, VUE_QUERY_CLIENT } from '@tanstack/vue-query';
import VerdocsTemplateSettings from './VerdocsTemplateSettings.vue';
import { VERDOCS_ENDPOINT_KEY } from '../../provider/keys';
import { TEST_API_BASE } from '../../test/support';
import type { ITemplateEvent } from '../../types';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

const makeTemplate = (overrides: Partial<ITemplate> = {}): ITemplate =>
  ({
    id: 'template-1',
    name: 'Lease Agreement',
    visibility: 'private',
    sender: 'envelope_creator',
    initial_reminder: null,
    followup_reminders: null,
    roles: [],
    fields: [],
    documents: [],
    ...overrides,
  }) as ITemplate;

const buttonByText = (wrapper: ReturnType<typeof mount>, text: string) => wrapper.findAll('button').find(button => button.text() === text)!;

describe('VerdocsTemplateSettings', () => {
  let mock: MockAdapter;

  beforeEach(() => {
    localStorage.clear();
    mock = new MockAdapter(axios);
    mock.onGet('/v2/templates/template-1').reply(200, makeTemplate());
  });

  afterEach(() => mock.restore());

  const mountSettings = async (props = {}) => {
    const endpoint = new VerdocsEndpoint({ baseURL: TEST_API_BASE, persist: false });
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const wrapper = mount(VerdocsTemplateSettings, {
      props: { templateId: 'template-1', ...props },
      global: { provide: { [VERDOCS_ENDPOINT_KEY as symbol]: endpoint, [VUE_QUERY_CLIENT]: queryClient } },
    });
    await flushPromises();
    return wrapper;
  };

  it('loads the current settings into the form', async () => {
    const wrapper = await mountSettings();

    expect((wrapper.find('input[type="text"]').element as HTMLInputElement).value).toBe('Lease Agreement');
    expect((wrapper.findAll('select')[0]!.element as HTMLSelectElement).value).toBe('private');
    expect((wrapper.findAll('select')[1]!.element as HTMLSelectElement).value).toBe('envelope_creator');
    expect((wrapper.find('input[role="switch"]').element as HTMLInputElement).checked).toBe(false);
    expect(buttonByText(wrapper, 'Save').attributes('disabled')).toBeDefined();
  });

  it('saves edits and reports the updated template', async () => {
    const updated = makeTemplate({ name: 'Renamed', visibility: 'shared' });
    mock.onPatch('/v2/templates/template-1').reply(200, updated);

    const wrapper = await mountSettings();

    await wrapper.find('input[type="text"]').setValue('Renamed');
    await wrapper.findAll('select')[0]!.setValue('shared');
    await buttonByText(wrapper, 'Save').trigger('click');
    await flushPromises();

    expect(JSON.parse(String(mock.history.patch[0]!.data))).toEqual({
      name: 'Renamed',
      visibility: 'shared',
      sender: 'envelope_creator',
      initial_reminder: null,
      followup_reminders: null,
    });

    const [ event ] = wrapper.emitted('settingsChanged')![0] as [ITemplateEvent];
    expect(event.template.name).toBe('Renamed');
  });

  it('converts reminder days to milliseconds when reminders are enabled', async () => {
    mock.onPatch('/v2/templates/template-1').reply(200, makeTemplate());

    const wrapper = await mountSettings();

    await wrapper.find('input[role="switch"]').setValue(true);
    await wrapper.find('input[type="number"]').setValue('3');
    await buttonByText(wrapper, 'Save').trigger('click');
    await flushPromises();

    expect(JSON.parse(String(mock.history.patch[0]!.data))).toMatchObject({ initial_reminder: 3 * MS_PER_DAY, followup_reminders: 0 });
  });

  it('emits cancel when the user cancels', async () => {
    const wrapper = await mountSettings();

    await buttonByText(wrapper, 'Cancel').trigger('click');

    expect(wrapper.emitted('cancel')).toHaveLength(1);
  });

  it('reports load errors and shows the error state', async () => {
    mock.onGet('/v2/templates/template-1').reply(404, { error: 'boom' });

    const wrapper = await mountSettings();

    expect(wrapper.find('[role="alert"]').text()).toContain('Unable to load this template');
    expect(wrapper.emitted('sdkError')).toBeTruthy();
  });
});
