import { DOMWrapper, mount } from '@vue/test-utils';
import VerdocsQuestionDialog from './VerdocsQuestionDialog.vue';

// The dialog teleports to document.body, so assertions and clicks go through a
// body wrapper rather than the mount wrapper.
const body = () => new DOMWrapper(document.body);

const buttonByLabel = (label: string) => body().findAll('button').find(button => button.text() === label);

describe('VerdocsQuestionDialog', () => {
  it('submits the typed question', async () => {
    const wrapper = mount(VerdocsQuestionDialog);

    expect(body().get('[role="dialog"]').text()).toContain('Ask the Sender a Question');

    await body().get('textarea[aria-label="Question"]').setValue('What is the deadline?');
    await buttonByLabel('OK')!.trigger('click');

    expect(wrapper.emitted('submit')).toEqual([ [ 'What is the deadline?' ] ]);
    expect(wrapper.emitted('cancel')).toBeUndefined();

    wrapper.unmount();
  });

  it('prefills the question box and cancels without submitting', async () => {
    const wrapper = mount(VerdocsQuestionDialog, { props: { question: 'Draft question' } });

    expect(body().get<HTMLTextAreaElement>('textarea').element.value).toBe('Draft question');

    await buttonByLabel('Cancel')!.trigger('click');
    expect(wrapper.emitted('cancel')).toHaveLength(1);
    expect(wrapper.emitted('submit')).toBeUndefined();

    wrapper.unmount();
  });

  it('treats dismissal as a cancel', async () => {
    const wrapper = mount(VerdocsQuestionDialog);

    await body().get('button[aria-label="Close"]').trigger('click');
    expect(wrapper.emitted('cancel')).toHaveLength(1);

    wrapper.unmount();
  });
});
