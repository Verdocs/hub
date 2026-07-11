import { nextTick } from 'vue';
import { mount } from '@vue/test-utils';
import VerdocsButtonPanel from './VerdocsButtonPanel.vue';

// The portal's click-away listener registers one macrotask after it opens, so
// document-level clicks in these tests wait a tick first.
const nextMacrotask = () => new Promise(resolve => setTimeout(resolve));

const mountPanel = () =>
  mount(VerdocsButtonPanel, {
    props: { label: 'Field settings' },
    slots: { icon: '<svg aria-hidden="true" />', default: '<div>Panel Body</div>' },
    attachTo: document.body,
  });

describe('VerdocsButtonPanel', () => {
  it('opens the panel on click, teleported to document.body', async () => {
    const wrapper = mountPanel();

    expect(document.body.querySelector('[role="dialog"]')).toBeNull();

    await wrapper.get('button[aria-label="Field settings"]').trigger('click');

    const dialog = document.body.querySelector('[role="dialog"]');
    expect(dialog?.textContent).toContain('Panel Body');
    expect(dialog?.getAttribute('aria-label')).toBe('Field settings');
    expect(dialog?.closest('.vdocs-portal')?.parentElement).toBe(document.body);

    wrapper.unmount();
  });

  it('toggles the panel closed when the trigger is clicked again', async () => {
    const wrapper = mountPanel();
    const trigger = wrapper.get('button[aria-label="Field settings"]');

    expect(trigger.attributes('aria-expanded')).toBe('false');

    await trigger.trigger('click');
    expect(document.body.querySelector('[role="dialog"]')).not.toBeNull();
    expect(trigger.attributes('aria-expanded')).toBe('true');

    await trigger.trigger('click');
    expect(document.body.querySelector('[role="dialog"]')).toBeNull();
    expect(trigger.attributes('aria-expanded')).toBe('false');

    wrapper.unmount();
  });

  it('closes the panel on click-away', async () => {
    const outside = document.createElement('button');
    document.body.appendChild(outside);

    const wrapper = mountPanel();
    await wrapper.get('button[aria-label="Field settings"]').trigger('click');
    await nextMacrotask();

    outside.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await nextTick();

    expect(document.body.querySelector('[role="dialog"]')).toBeNull();
    expect(wrapper.get('button[aria-label="Field settings"]').attributes('aria-expanded')).toBe('false');

    wrapper.unmount();
  });
});
