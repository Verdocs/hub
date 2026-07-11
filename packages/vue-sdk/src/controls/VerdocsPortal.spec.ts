import { mount } from '@vue/test-utils';
import VerdocsPortal from './VerdocsPortal.vue';

// The click-away listener registers one macrotask after mount, so document-level
// clicks in these tests wait a tick first.
const nextMacrotask = () => new Promise(resolve => setTimeout(resolve));

const clickOn = (el: Element) => el.dispatchEvent(new MouseEvent('click', { bubbles: true }));

const addAnchor = () => {
  const anchor = document.createElement('button');
  document.body.appendChild(anchor);
  return anchor;
};

describe('VerdocsPortal', () => {
  it('teleports its content into document.body', () => {
    const anchor = addAnchor();
    const wrapper = mount(VerdocsPortal, { props: { anchor }, slots: { default: '<div id="tip">Portal Content</div>' } });

    const content = document.body.querySelector('#tip');
    expect(content).not.toBeNull();
    expect(wrapper.element.contains(content)).toBe(false);
    expect(content?.closest('.vdocs-portal')?.parentElement).toBe(document.body);

    wrapper.unmount();
  });

  it('positions the wrapper from the anchor rect', async () => {
    const anchor = addAnchor();
    anchor.getBoundingClientRect = () =>
      ({ top: 80, bottom: 100, left: 50, right: 90, width: 40, height: 20, x: 50, y: 80, toJSON: () => ({}) }) as DOMRect;

    const wrapper = mount(VerdocsPortal, { props: { anchor }, slots: { default: '<div>Tip</div>' } });
    await wrapper.vm.$nextTick();

    const portal = document.body.querySelector<HTMLElement>('.vdocs-portal');
    expect(portal?.style.top).toBe('100px');
    expect(portal?.style.left).toBe('50px');

    wrapper.unmount();
  });

  it('emits clickAway only for clicks outside the content and anchor', async () => {
    const anchor = addAnchor();
    const outside = document.createElement('button');
    document.body.appendChild(outside);

    const wrapper = mount(VerdocsPortal, { props: { anchor }, slots: { default: '<div id="content">Portal Content</div>' } });
    await nextMacrotask();

    clickOn(document.getElementById('content')!);
    clickOn(anchor);
    expect(wrapper.emitted('clickAway')).toBeUndefined();

    clickOn(outside);
    expect(wrapper.emitted('clickAway')).toHaveLength(1);

    wrapper.unmount();
  });

  it('ignores clicks inside sibling portal wrappers', async () => {
    const anchor = addAnchor();
    const nested = document.createElement('div');
    nested.className = 'vdocs-portal';
    const nestedButton = document.createElement('button');
    nested.appendChild(nestedButton);
    document.body.appendChild(nested);

    const wrapper = mount(VerdocsPortal, { props: { anchor }, slots: { default: '<div>Content</div>' } });
    await nextMacrotask();

    clickOn(nestedButton);
    expect(wrapper.emitted('clickAway')).toBeUndefined();

    wrapper.unmount();
  });
});
