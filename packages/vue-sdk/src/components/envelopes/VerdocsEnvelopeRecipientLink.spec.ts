import { mount } from '@vue/test-utils';
import type { IRecipient } from '@verdocs/js-sdk';
import VerdocsEnvelopeRecipientLink from './VerdocsEnvelopeRecipientLink.vue';

const recipient = {
  envelope_id: 'envelope-1',
  role_name: 'Signer 1',
  first_name: 'Paige',
  last_name: 'Turner',
  email: 'paige@example.com',
  sequence: 1,
  status: 'invited',
} as IRecipient;

const findButton = (wrapper: ReturnType<typeof mount>, label: string) =>
  wrapper.findAll('button').find(button => button.text() === label);

describe('VerdocsEnvelopeRecipientLink', () => {
  it('renders the recipient name, contact, and role', () => {
    const wrapper = mount(VerdocsEnvelopeRecipientLink, { props: { recipient } });

    expect(wrapper.text()).toContain('Signer 1');
    expect(wrapper.text()).toContain('Paige Turner');
    expect(wrapper.text()).toContain('paige@example.com');
  });

  it('emits getLink with the recipient when Get Link is clicked', async () => {
    const wrapper = mount(VerdocsEnvelopeRecipientLink, { props: { recipient } });

    await findButton(wrapper, 'Get Link')!.trigger('click');

    const [ emitted ] = wrapper.emitted('getLink')![0] as [IRecipient];
    expect(emitted.role_name).toBe('Signer 1');
  });

  it('shows a loading label and disables the button while fetching', () => {
    const wrapper = mount(VerdocsEnvelopeRecipientLink, { props: { recipient, gettingLink: true } });

    const button = findButton(wrapper, 'Loading...');
    expect(button).toBeTruthy();
    expect(button!.attributes('disabled')).toBeDefined();
  });

  it('shows the link and a Copy button once a link is provided, hiding Get Link', () => {
    const wrapper = mount(VerdocsEnvelopeRecipientLink, { props: { recipient, link: 'https://verdocs.com/sign/abc' } });

    expect(wrapper.text()).toContain('https://verdocs.com/sign/abc');
    expect(findButton(wrapper, 'Copy')).toBeTruthy();
    expect(findButton(wrapper, 'Get Link')).toBeFalsy();
  });

  it('copies the link to the clipboard when Copy is clicked', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });

    const wrapper = mount(VerdocsEnvelopeRecipientLink, { props: { recipient, link: 'https://verdocs.com/sign/abc' } });
    await findButton(wrapper, 'Copy')!.trigger('click');

    expect(writeText).toHaveBeenCalledWith('https://verdocs.com/sign/abc');
  });

  it('emits done when Done is clicked', async () => {
    const wrapper = mount(VerdocsEnvelopeRecipientLink, { props: { recipient } });

    await findButton(wrapper, 'Done')!.trigger('click');

    expect(wrapper.emitted('done')).toHaveLength(1);
  });
});
