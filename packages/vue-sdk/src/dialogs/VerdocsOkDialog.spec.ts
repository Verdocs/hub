import { DOMWrapper, mount } from '@vue/test-utils';
import VerdocsOkDialog from './VerdocsOkDialog.vue';

// The dialog teleports to document.body, so assertions and clicks go through a
// body wrapper rather than the mount wrapper.
const body = () => new DOMWrapper(document.body);

const buttonByLabel = (label: string) => body().findAll('button').find(button => button.text() === label);

describe('VerdocsOkDialog', () => {
  it('renders the heading and message and fires ok', async () => {
    const wrapper = mount(VerdocsOkDialog, { props: { heading: "You're Done!", message: 'All set.' } });

    const dialog = body().get('[role="dialog"]');
    expect(dialog.text()).toContain("You're Done!");
    expect(dialog.text()).toContain('All set.');
    expect(buttonByLabel('Cancel')).toBeUndefined();

    await buttonByLabel('OK')!.trigger('click');
    expect(wrapper.emitted('ok')).toHaveLength(1);
    expect(wrapper.emitted('cancel')).toBeUndefined();

    wrapper.unmount();
  });

  it('shows a Cancel button and a custom OK label when asked', async () => {
    const wrapper = mount(VerdocsOkDialog, {
      props: { heading: 'Decline Signing Request', message: 'The sender will be notified.', buttonLabel: 'Decline', showCancel: true },
    });

    expect(buttonByLabel('Decline')).toBeDefined();

    await buttonByLabel('Cancel')!.trigger('click');
    expect(wrapper.emitted('cancel')).toHaveLength(1);
    expect(wrapper.emitted('ok')).toBeUndefined();

    wrapper.unmount();
  });

  it('treats dismissal as a cancel and renders rich content through the default slot', async () => {
    const wrapper = mount(VerdocsOkDialog, { props: { heading: 'T' }, slots: { default: '<p id="rich">Rich message</p>' } });

    expect(body().get('#rich').text()).toBe('Rich message');

    await body().get('button[aria-label="Close"]').trigger('click');
    expect(wrapper.emitted('cancel')).toHaveLength(1);

    wrapper.unmount();
  });
});
