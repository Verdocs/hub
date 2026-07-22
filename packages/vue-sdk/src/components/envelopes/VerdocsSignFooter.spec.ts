import { DOMWrapper, mount } from '@vue/test-utils';
import VerdocsQuestionDialog from '../../dialogs/VerdocsQuestionDialog.vue';
import VerdocsSignFooter from './VerdocsSignFooter.vue';

const findButton = (wrapper: ReturnType<typeof mount>, label: string) =>
  wrapper.findAll('button').find(button => button.text().includes(label));

// The question dialog teleports to document.body, so its fields are queried there.
const body = () => new DOMWrapper(document.body);

describe('VerdocsSignFooter', () => {
  it('renders the three convenience actions by default', () => {
    const wrapper = mount(VerdocsSignFooter);

    expect(wrapper.text()).toContain('Ask Sender a Question');
    expect(wrapper.text()).toContain('Decline Signing');
    expect(wrapper.text()).toContain('Finish Later');
  });

  it('emits decline and finishLater when those actions are clicked', async () => {
    const wrapper = mount(VerdocsSignFooter);

    await findButton(wrapper, 'Decline Signing')!.trigger('click');
    await findButton(wrapper, 'Finish Later')!.trigger('click');

    expect(wrapper.emitted('decline')).toHaveLength(1);
    expect(wrapper.emitted('finishLater')).toHaveLength(1);
  });

  it('opens the question dialog and emits askQuestion with the entered text', async () => {
    const wrapper = mount(VerdocsSignFooter);

    await findButton(wrapper, 'Ask Sender a Question')!.trigger('click');

    expect(wrapper.findComponent(VerdocsQuestionDialog).exists()).toBe(true);

    await body().get('textarea[aria-label="Question"]').setValue('When is this due?');
    await body().findAll('button').find(button => button.text() === 'OK')!.trigger('click');

    expect(wrapper.emitted('askQuestion')![0]).toEqual([ 'When is this due?' ]);
    expect(wrapper.findComponent(VerdocsQuestionDialog).exists()).toBe(false);
  });

  it('hides the action buttons once signing is done', () => {
    const wrapper = mount(VerdocsSignFooter, { props: { isDone: true } });

    expect(wrapper.text()).not.toContain('Decline Signing');
  });

  it('renders white-label branding links from the organization', () => {
    const wrapper = mount(VerdocsSignFooter, {
      props: {
        organization: {
          powered_by_label: 'Powered by Acme',
          powered_by_url: 'https://acme.example',
          terms_use_url: 'https://acme.example/terms',
          privacy_policy_url: 'https://acme.example/privacy',
        },
      },
    });

    expect(wrapper.text()).toContain('Powered by Acme');
    const hrefs = wrapper.findAll('a').map(anchor => anchor.attributes('href'));
    expect(hrefs).toContain('https://acme.example/terms');
    expect(hrefs).toContain('https://acme.example/privacy');
  });
});
