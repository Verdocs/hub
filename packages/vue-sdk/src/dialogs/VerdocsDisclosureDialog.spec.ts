import { DOMWrapper, mount } from '@vue/test-utils';
import VerdocsDisclosureDialog from './VerdocsDisclosureDialog.vue';

// The dialog teleports to document.body, so assertions and clicks go through a
// body wrapper rather than the mount wrapper.
const body = () => new DOMWrapper(document.body);

const buttonByLabel = (label: string) => body().findAll('button').find(button => button.text() === label);

const linkByText = (text: string) => body().findAll('a').find(link => link.text() === text);

describe('VerdocsDisclosureDialog', () => {
  it('renders the heading and the default disclosure content', () => {
    const wrapper = mount(VerdocsDisclosureDialog);

    expect(body().get('[role="dialog"]').text()).toContain('e-Signature Disclosures');
    expect(linkByText('Electronic Record and Signatures Disclosure')?.attributes('href'))
      .toBe('https://verdocs.com/en/electronic-record-signature-disclosure/');
    expect(linkByText('End User License Agreement')).toBeDefined();
    expect(linkByText('Privacy Policy')).toBeDefined();

    wrapper.unmount();
  });

  it('renders custom disclosure content in place of the default', () => {
    const wrapper = mount(VerdocsDisclosureDialog, { slots: { default: '<p>Acme custom consent text</p>' } });

    expect(body().get('[role="dialog"]').text()).toContain('Acme custom consent text');
    expect(linkByText('End User License Agreement')).toBeUndefined();

    wrapper.unmount();
  });

  it('keeps Proceed disabled until the acceptance box is checked, then fires agree', async () => {
    const wrapper = mount(VerdocsDisclosureDialog);

    expect(buttonByLabel('Proceed')!.attributes('disabled')).toBeDefined();
    await buttonByLabel('Proceed')!.trigger('click');
    expect(wrapper.emitted('agree')).toBeUndefined();

    await body().get('input[type="checkbox"]').setValue();
    expect(buttonByLabel('Proceed')!.attributes('disabled')).toBeUndefined();

    await buttonByLabel('Proceed')!.trigger('click');
    expect(wrapper.emitted('agree')).toHaveLength(1);

    wrapper.unmount();
  });

  it('fires decline without requiring acceptance', async () => {
    const wrapper = mount(VerdocsDisclosureDialog);

    await buttonByLabel('Decline')!.trigger('click');
    expect(wrapper.emitted('decline')).toHaveLength(1);

    wrapper.unmount();
  });

  it('only offers Delegate when the recipient is a delegator, and fires delegate', async () => {
    const plain = mount(VerdocsDisclosureDialog);
    expect(buttonByLabel('Delegate')).toBeUndefined();
    plain.unmount();

    const wrapper = mount(VerdocsDisclosureDialog, { props: { delegator: true } });
    await buttonByLabel('Delegate')!.trigger('click');
    expect(wrapper.emitted('delegate')).toHaveLength(1);

    wrapper.unmount();
  });

  it('fires cancel when dismissed via the close button', async () => {
    const wrapper = mount(VerdocsDisclosureDialog);

    await body().get('button[aria-label="Close"]').trigger('click');
    expect(wrapper.emitted('cancel')).toHaveLength(1);

    wrapper.unmount();
  });
});
