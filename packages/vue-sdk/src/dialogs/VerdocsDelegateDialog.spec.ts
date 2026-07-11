import { DOMWrapper, mount } from '@vue/test-utils';
import VerdocsDelegateDialog from './VerdocsDelegateDialog.vue';

// The dialog teleports to document.body, so assertions and clicks go through a
// body wrapper rather than the mount wrapper.
const body = () => new DOMWrapper(document.body);

const buttonByLabel = (label: string) => body().findAll('button').find(button => button.text() === label)!;

const setByPlaceholder = (placeholder: string, value: string) => body().get(`[placeholder="${placeholder}"]`).setValue(value);

describe('VerdocsDelegateDialog', () => {
  it('disables Delegate until the required fields are filled, then submits the details', async () => {
    const wrapper = mount(VerdocsDelegateDialog);

    expect(body().get('[role="dialog"]').text()).toContain('Delegate Signing');
    expect(buttonByLabel('Delegate').attributes('disabled')).toBeDefined();

    await setByPlaceholder('First name', 'Sue');
    await setByPlaceholder('Last name', 'Ridge');
    expect(buttonByLabel('Delegate').attributes('disabled')).toBeDefined();

    await setByPlaceholder('New recipient email address', 'sue@example.com');
    expect(buttonByLabel('Delegate').attributes('disabled')).toBeUndefined();

    await buttonByLabel('Delegate').trigger('click');
    expect(wrapper.emitted('delegate')).toEqual([
      [ { first_name: 'Sue', last_name: 'Ridge', email: 'sue@example.com', phone: '', message: '' } ],
    ]);

    wrapper.unmount();
  });

  it('includes the optional phone and message when provided', async () => {
    const wrapper = mount(VerdocsDelegateDialog);

    await setByPlaceholder('First name', 'Sue');
    await setByPlaceholder('Last name', 'Ridge');
    await setByPlaceholder('New recipient email address', 'sue@example.com');
    await setByPlaceholder('Optional phone number', '+15555550123');
    await setByPlaceholder('Type message here...', 'Please sign this for me.');

    await buttonByLabel('Delegate').trigger('click');
    expect(wrapper.emitted('delegate')).toEqual([
      [ { first_name: 'Sue', last_name: 'Ridge', email: 'sue@example.com', phone: '+15555550123', message: 'Please sign this for me.' } ],
    ]);

    wrapper.unmount();
  });

  it('cancels from the Cancel button and the overlay', async () => {
    const wrapper = mount(VerdocsDelegateDialog);

    await buttonByLabel('Cancel').trigger('click');
    expect(wrapper.emitted('cancel')).toHaveLength(1);

    const overlay = body().get('[role="dialog"]').element.parentElement!;
    await new DOMWrapper(overlay).trigger('click');
    expect(wrapper.emitted('cancel')).toHaveLength(2);

    wrapper.unmount();
  });
});
