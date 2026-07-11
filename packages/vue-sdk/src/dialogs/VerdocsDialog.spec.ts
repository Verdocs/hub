import { DOMWrapper, mount } from '@vue/test-utils';
import VerdocsDialog from './VerdocsDialog.vue';

// The dialog teleports to document.body, so assertions and clicks go through a
// body wrapper rather than the mount wrapper.
const body = () => new DOMWrapper(document.body);

const overlay = () => new DOMWrapper(body().get('[role="dialog"]').element.parentElement!);

describe('VerdocsDialog', () => {
  it('teleports a modal with heading, body, and footer content into document.body', () => {
    const wrapper = mount(VerdocsDialog, {
      props: { heading: 'Test Title' },
      slots: { default: 'Body text', footer: '<button type="button">Confirm</button>' },
    });

    const dialog = body().get('[role="dialog"]');
    expect(dialog.attributes('aria-modal')).toBe('true');
    expect(overlay().element.parentElement).toBe(document.body);
    expect(dialog.text()).toContain('Test Title');
    expect(dialog.text()).toContain('Body text');
    expect(body().findAll('button').some(button => button.text() === 'Confirm')).toBe(true);

    wrapper.unmount();
  });

  it('closes via the close button and the overlay, but not body clicks', async () => {
    const wrapper = mount(VerdocsDialog, { props: { heading: 'T' }, slots: { default: '<p id="content">Body</p>' } });

    await body().get('#content').trigger('click');
    expect(wrapper.emitted('close')).toBeUndefined();

    await body().get('button[aria-label="Close"]').trigger('click');
    expect(wrapper.emitted('close')).toHaveLength(1);

    await overlay().trigger('click');
    expect(wrapper.emitted('close')).toHaveLength(2);

    wrapper.unmount();
  });

  it('ignores overlay clicks when persistent', async () => {
    const wrapper = mount(VerdocsDialog, { props: { heading: 'T', persistent: true }, slots: { default: 'Body' } });

    await overlay().trigger('click');
    expect(wrapper.emitted('close')).toBeUndefined();

    // The explicit close button still works on persistent dialogs.
    await body().get('button[aria-label="Close"]').trigger('click');
    expect(wrapper.emitted('close')).toHaveLength(1);

    wrapper.unmount();
  });

  it('renders rich headings through the heading slot and hides the header row without one', () => {
    const plain = mount(VerdocsDialog, { slots: { default: 'Body' } });
    expect(body().get('[role="dialog"]').text()).toBe('Body');
    plain.unmount();

    const rich = mount(VerdocsDialog, { slots: { default: 'Body', heading: '<em>Rich</em> Heading' } });
    expect(body().get('em').text()).toBe('Rich');
    expect(body().get('[role="dialog"]').text()).toContain('Rich Heading');
    rich.unmount();
  });
});
