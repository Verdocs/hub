import type { IRecipient } from '@verdocs/js-sdk';
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils';
import type { IContactSelectEvent, TPickerContact } from './VerdocsContactPicker.vue';
import VerdocsContactPicker from './VerdocsContactPicker.vue';

const sampleRole: Partial<IRecipient> = {
  role_name: 'Recipient 1',
  first_name: 'Paige',
  last_name: 'Turner',
  email: 'paige.turner@example.com',
  phone: '+12025551212',
  message: 'Please sign at your earliest convenience.',
};

const sampleSuggestions: TPickerContact[] = [
  { id: 'contact-1', first_name: 'Paige', last_name: 'Turner', email: 'paige.turner@example.com', phone: '+12025551212' },
  { id: 'contact-2', first_name: 'Sue', last_name: 'Permann', email: 'sue.permann@example.com' },
];

type Wrapper = VueWrapper<InstanceType<typeof VerdocsContactPicker>>;

const button = (wrapper: Wrapper, label: string) => wrapper.findAll('button').find(candidate => candidate.text() === label);

const suggestion = (wrapper: Wrapper, name: string) => wrapper.findAll('button').find(candidate => candidate.text().includes(name));

// Fields are labelled rather than aria-labelled, so we go via the label's for attribute. The
// passcode field is the exception and carries an aria-label.
const field = (wrapper: Wrapper, labelText: string) => {
  const label = wrapper.findAll('label').find(candidate => candidate.text().replace(/\s+/g, ' ').trim() === labelText);
  return wrapper.find(`#${label!.attributes('for')}`);
};

const value = (wrapper: Wrapper, labelText: string) => (field(wrapper, labelText).element as HTMLInputElement).value;

describe('VerdocsContactPicker', () => {
  it('submits the completed contact details', async () => {
    const wrapper = mount(VerdocsContactPicker, { props: { templateRole: sampleRole, availableAuthMethods: [ 'passcode', 'email', 'sms' ] } });

    expect(value(wrapper, 'First name')).toBe('Paige');
    expect(value(wrapper, 'Last name')).toBe('Turner');
    expect(value(wrapper, 'Email')).toBe('paige.turner@example.com');

    await button(wrapper, 'Done')!.trigger('click');

    const [ contact ] = wrapper.emitted('submit')![0] as [IContactSelectEvent];
    expect(contact).toEqual({
      first_name: 'Paige',
      last_name: 'Turner',
      email: 'paige.turner@example.com',
      phone: '+12025551212',
      message: 'Please sign at your earliest convenience.',
      delegator: false,
      name_locked: false,
      auth_methods: [],
      passcode: '',
    });
  });

  it('requires a name and a valid email before enabling Done', async () => {
    const wrapper = mount(VerdocsContactPicker);
    expect(button(wrapper, 'Done')!.attributes('disabled')).toBeDefined();

    await field(wrapper, 'First name').setValue('Paige');
    await field(wrapper, 'Last name').setValue('Turner');
    await field(wrapper, 'Email').setValue('not-an-email');
    expect(button(wrapper, 'Done')!.attributes('disabled')).toBeDefined();

    await field(wrapper, 'Email').setValue('paige.turner@example.com');
    expect(button(wrapper, 'Done')!.attributes('disabled')).toBeUndefined();
  });

  it('reports name-field text through searchContacts', async () => {
    const wrapper = mount(VerdocsContactPicker);

    await field(wrapper, 'First name').setValue('Pai');
    expect(wrapper.emitted('searchContacts')!.at(-1)).toEqual([ 'Pai' ]);

    await field(wrapper, 'Last name').setValue('Tu');
    expect(wrapper.emitted('searchContacts')!.at(-1)).toEqual([ 'Tu' ]);
  });

  it('shows suggestions on focus and fills the form on selection', async () => {
    const wrapper = mount(VerdocsContactPicker, { props: { suggestions: sampleSuggestions, availableAuthMethods: [ 'passcode', 'email', 'sms' ] } });

    expect(suggestion(wrapper, 'Paige Turner')).toBeUndefined();

    await field(wrapper, 'First name').trigger('focus');
    await suggestion(wrapper, 'Paige Turner')!.trigger('click');

    expect(value(wrapper, 'First name')).toBe('Paige');
    expect(value(wrapper, 'Last name')).toBe('Turner');
    expect(value(wrapper, 'Email')).toBe('paige.turner@example.com');
    expect(value(wrapper, 'Phone (optional)')).toBe('+12025551212');
    expect(suggestion(wrapper, 'Paige Turner')).toBeUndefined();
  });

  it('closes the suggestions on a click outside the picker', async () => {
    const wrapper = mount(VerdocsContactPicker, { props: { suggestions: sampleSuggestions }, attachTo: document.body });

    await field(wrapper, 'First name').trigger('focus');
    expect(suggestion(wrapper, 'Paige Turner')).toBeDefined();

    // The outside-click listener is registered once the list opens, so let that watcher settle.
    await flushPromises();
    document.body.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await flushPromises();

    expect(suggestion(wrapper, 'Paige Turner')).toBeUndefined();

    wrapper.unmount();
  });

  it('closes the suggestions when the body scrolls', async () => {
    const wrapper = mount(VerdocsContactPicker, { props: { suggestions: sampleSuggestions } });

    await field(wrapper, 'First name').trigger('focus');
    expect(suggestion(wrapper, 'Paige Turner')).toBeDefined();

    // The scrolling body is the first child of the group wrapper inside the form.
    await wrapper.find('form > div > div').trigger('scroll');

    expect(suggestion(wrapper, 'Paige Turner')).toBeUndefined();
  });

  it('filters suggestions by the first-name text', async () => {
    const wrapper = mount(VerdocsContactPicker, { props: { suggestions: sampleSuggestions } });

    await field(wrapper, 'First name').setValue('Sue');

    expect(suggestion(wrapper, 'Sue Permann')).toBeDefined();
    expect(suggestion(wrapper, 'Paige Turner')).toBeUndefined();
  });

  it('requires a passcode once passcode verification is selected', async () => {
    const wrapper = mount(VerdocsContactPicker, { props: { templateRole: sampleRole } });

    expect(wrapper.find('input[aria-label="Passcode"]').exists()).toBe(false);

    await button(wrapper, 'Passcode')!.trigger('click');
    expect(button(wrapper, 'Passcode')!.attributes('aria-pressed')).toBe('true');
    expect(button(wrapper, 'Done')!.attributes('disabled')).toBeDefined();
    expect(wrapper.text()).toContain('PIN or passcode already known by the recipient');

    await wrapper.find('input[aria-label="Passcode"]').setValue('1234');
    await button(wrapper, 'Done')!.trigger('click');

    const [ contact ] = wrapper.emitted('submit')![0] as [IContactSelectEvent];
    expect(contact).toMatchObject({ auth_methods: [ 'passcode' ], passcode: '1234' });
  });

  it('requires every selected method to be satisfied, not just one of them', async () => {
    const wrapper = mount(VerdocsContactPicker, {
      props: { templateRole: { ...sampleRole, phone: '' }, availableAuthMethods: [ 'passcode', 'email', 'sms' ] },
    });

    // Email is satisfied by the role's address, but SMS has no number to text.
    await button(wrapper, 'Email')!.trigger('click');
    await button(wrapper, 'SMS code')!.trigger('click');
    expect(button(wrapper, 'Done')!.attributes('disabled')).toBeDefined();

    await field(wrapper, 'Phone (optional)').setValue('2125551212');
    expect(button(wrapper, 'Done')!.attributes('disabled')).toBeUndefined();
  });

  it('locks verification methods the account is not entitled to', async () => {
    const wrapper = mount(VerdocsContactPicker, {
      props: { templateRole: { ...sampleRole, auth_methods: [ 'kba' ] }, availableAuthMethods: [ 'passcode', 'email' ] },
    });

    expect(button(wrapper, 'Email')!.attributes('disabled')).toBeUndefined();
    expect(button(wrapper, 'SMS code')!.attributes('disabled')).toBeDefined();
    expect(button(wrapper, 'ID check')!.attributes('disabled')).toBeDefined();
    expect(button(wrapper, 'SMS code')!.attributes('title')).toBe('Not included in your plan');

    // A locked method that is already selected stays clickable, so it can still be turned off.
    expect(button(wrapper, 'KBA')!.attributes('disabled')).toBeUndefined();
    expect(button(wrapper, 'KBA')!.attributes('aria-pressed')).toBe('true');

    await button(wrapper, 'KBA')!.trigger('click');
    expect(button(wrapper, 'KBA')!.attributes('aria-pressed')).toBe('false');
    expect(button(wrapper, 'KBA')!.attributes('disabled')).toBeDefined();
  });

  it('treats the signing options as a three-way choice', async () => {
    const wrapper = mount(VerdocsContactPicker, { props: { templateRole: sampleRole } });

    expect(button(wrapper, 'None')!.attributes('aria-pressed')).toBe('true');

    await button(wrapper, 'May delegate')!.trigger('click');
    expect(button(wrapper, 'None')!.attributes('aria-pressed')).toBe('false');
    expect(button(wrapper, 'Name locked')!.attributes('aria-pressed')).toBe('false');

    await button(wrapper, 'Name locked')!.trigger('click');
    expect(button(wrapper, 'May delegate')!.attributes('aria-pressed')).toBe('false');
    await button(wrapper, 'Done')!.trigger('click');
    expect(wrapper.emitted('submit')!.at(-1)![0]).toMatchObject({ delegator: false, name_locked: true });

    await button(wrapper, 'None')!.trigger('click');
    await button(wrapper, 'Done')!.trigger('click');
    expect(wrapper.emitted('submit')!.at(-1)![0]).toMatchObject({ delegator: false, name_locked: false });
  });

  it('formats the phone number to E.164', async () => {
    const wrapper = mount(VerdocsContactPicker, { props: { availableAuthMethods: [ 'passcode', 'email', 'sms' ] } });

    await field(wrapper, 'Phone (optional)').setValue('2125551212');
    expect(value(wrapper, 'Phone (optional)')).toBe('+12125551212');

    // Clearing first because the field only re-renders when the converted value actually changes,
    // and both of these inputs convert to the same number.
    await field(wrapper, 'Phone (optional)').setValue('');
    await field(wrapper, 'Phone (optional)').setValue('(212) 555-1212');
    expect(value(wrapper, 'Phone (optional)')).toBe('+12125551212');
  });

  it('hides the phone field unless SMS verification is available', async () => {
    const wrapper = mount(VerdocsContactPicker);
    expect(wrapper.findAll('label').some(label => label.text().includes('Phone'))).toBe(false);

    await wrapper.setProps({ availableAuthMethods: [ 'passcode', 'email', 'sms' ] });
    expect(wrapper.findAll('label').some(label => label.text().includes('Phone'))).toBe(true);
  });

  it('emits cancel when the user cancels', async () => {
    const wrapper = mount(VerdocsContactPicker, { props: { templateRole: sampleRole } });

    await button(wrapper, 'Cancel')!.trigger('click');

    expect(wrapper.emitted('cancel')).toHaveLength(1);
    expect(wrapper.emitted('submit')).toBeUndefined();
  });

  it('hides Cancel when the host provides its own way out', async () => {
    const wrapper = mount(VerdocsContactPicker, { props: { templateRole: sampleRole } });
    expect(button(wrapper, 'Cancel')).toBeDefined();

    await wrapper.setProps({ showCancel: false });
    expect(button(wrapper, 'Cancel')).toBeUndefined();
    expect(button(wrapper, 'Done')).toBeDefined();
  });
});
