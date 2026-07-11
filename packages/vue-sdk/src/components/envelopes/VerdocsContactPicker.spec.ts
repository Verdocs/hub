import { DOMWrapper, flushPromises, mount } from '@vue/test-utils';
import type { IContactSelectEvent } from './VerdocsContactPicker.vue';
import VerdocsContactPicker from './VerdocsContactPicker.vue';
import VerdocsPortal from '../../controls/VerdocsPortal.vue';

const okButton = (wrapper: ReturnType<typeof mount>) => wrapper.findAll('button').find(button => button.text() === 'OK');

describe('VerdocsContactPicker', () => {
  it('pre-fills the form from the template role', () => {
    const wrapper = mount(VerdocsContactPicker, {
      props: { templateRole: { first_name: 'Paige', last_name: 'Turner', email: 'paige@example.com' } },
    });

    expect((wrapper.find('input[aria-label="First name"]').element as HTMLInputElement).value).toBe('Paige');
    expect((wrapper.find('input[aria-label="Last name"]').element as HTMLInputElement).value).toBe('Turner');
    expect((wrapper.find('input[placeholder="Invite/verify via email..."]').element as HTMLInputElement).value).toBe('paige@example.com');
  });

  it('keeps OK disabled until name and a valid email are present', async () => {
    const wrapper = mount(VerdocsContactPicker);
    expect(okButton(wrapper)!.attributes('disabled')).toBeDefined();

    await wrapper.find('input[aria-label="First name"]').setValue('Paige');
    await wrapper.find('input[aria-label="Last name"]').setValue('Turner');
    await wrapper.find('input[placeholder="Invite/verify via email..."]').setValue('not-an-email');
    expect(okButton(wrapper)!.attributes('disabled')).toBeDefined();

    await wrapper.find('input[placeholder="Invite/verify via email..."]').setValue('paige@example.com');
    expect(okButton(wrapper)!.attributes('disabled')).toBeUndefined();
  });

  it('emits submit with the completed contact details', async () => {
    const wrapper = mount(VerdocsContactPicker);

    await wrapper.find('input[aria-label="First name"]').setValue('Paige');
    await wrapper.find('input[aria-label="Last name"]').setValue('Turner');
    await wrapper.find('input[placeholder="Invite/verify via email..."]').setValue('paige@example.com');
    await okButton(wrapper)!.trigger('click');

    const [ contact ] = wrapper.emitted('submit')![0] as [IContactSelectEvent];
    expect(contact).toMatchObject({ first_name: 'Paige', last_name: 'Turner', email: 'paige@example.com' });
  });

  it('emits cancel when Cancel is clicked', async () => {
    const wrapper = mount(VerdocsContactPicker);

    await wrapper.findAll('button').find(button => button.text() === 'Cancel')!.trigger('click');

    expect(wrapper.emitted('cancel')).toHaveLength(1);
  });

  it('reveals the phone row only when SMS is an available method', () => {
    const withoutSms = mount(VerdocsContactPicker);
    expect(withoutSms.find('input[placeholder="Invite/verify via SMS..."]').exists()).toBe(false);

    const withSms = mount(VerdocsContactPicker, { props: { availableAuthMethods: [ 'passcode', 'email', 'sms' ] } });
    expect(withSms.find('input[placeholder="Invite/verify via SMS..."]').exists()).toBe(true);
  });

  it('reports the typed name via searchContacts and fills from a chosen suggestion', async () => {
    const wrapper = mount(VerdocsContactPicker, {
      props: { suggestions: [ { id: 's1', first_name: 'Paige', last_name: 'Turner', email: 'paige@example.com' } ] },
      attachTo: document.body,
    });

    await wrapper.find('input[aria-label="First name"]').setValue('Pa');
    expect(wrapper.emitted('searchContacts')!.at(-1)).toEqual([ 'Pa' ]);

    await flushPromises();
    expect(wrapper.findComponent(VerdocsPortal).exists()).toBe(true);

    // The portal teleports the suggestion list to document.body.
    const suggestion = new DOMWrapper(document.body).findAll('button').find(button => button.text().includes('Paige Turner'));
    await suggestion!.trigger('click');
    expect((wrapper.find('input[placeholder="Invite/verify via email..."]').element as HTMLInputElement).value).toBe('paige@example.com');

    wrapper.unmount();
  });
});
