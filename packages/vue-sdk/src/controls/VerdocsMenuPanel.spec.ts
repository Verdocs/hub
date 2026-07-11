import { mount } from '@vue/test-utils';
import VerdocsMenuPanel from './VerdocsMenuPanel.vue';

// The close listener registers one macrotask after mount, so document-level
// clicks in these tests wait a tick first.
const nextMacrotask = () => new Promise(resolve => setTimeout(resolve));

const clickOn = (el: Element) => el.dispatchEvent(new MouseEvent('click', { bubbles: true }));

describe('VerdocsMenuPanel', () => {
  it('teleports a dialog into document.body at the requested width', () => {
    const wrapper = mount(VerdocsMenuPanel, { props: { width: 280 }, slots: { default: '<div>Panel Content</div>' } });

    const dialog = document.body.querySelector<HTMLElement>('[role="dialog"]');
    expect(dialog).not.toBeNull();
    expect(dialog?.parentElement).toBe(document.body);
    expect(dialog?.style.width).toBe('280px');
    expect(dialog?.textContent).toContain('Panel Content');

    wrapper.unmount();
  });

  it('shows the overlay by default and omits it when disabled', () => {
    const withOverlay = mount(VerdocsMenuPanel, { slots: { default: '<div>One</div>' } });
    expect(document.body.querySelector('.vdocs-menu-panel-overlay')).not.toBeNull();
    withOverlay.unmount();

    const without = mount(VerdocsMenuPanel, { props: { overlay: false }, slots: { default: '<div>Two</div>' } });
    expect(document.body.querySelector('.vdocs-menu-panel-overlay')).toBeNull();
    without.unmount();
  });

  it('slides in from the requested side', () => {
    const wrapper = mount(VerdocsMenuPanel, { props: { side: 'left' }, slots: { default: '<div>Panel</div>' } });

    expect(document.body.querySelector('[role="dialog"]')?.className).toContain('vdocs:left-0');

    wrapper.unmount();
  });

  it('emits close for outside clicks but not inside ones', async () => {
    const wrapper = mount(VerdocsMenuPanel, { slots: { default: '<button id="inside">Inside</button>' } });
    await nextMacrotask();

    clickOn(document.getElementById('inside')!);
    expect(wrapper.emitted('close')).toBeUndefined();

    clickOn(document.body.querySelector('.vdocs-menu-panel-overlay')!);
    expect(wrapper.emitted('close')).toHaveLength(1);

    wrapper.unmount();
  });
});
