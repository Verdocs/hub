import { DOMWrapper, mount } from '@vue/test-utils';
import VerdocsOtpDialog from './VerdocsOtpDialog.vue';

// The dialog teleports to document.body, so assertions and clicks go through a
// body wrapper rather than the mount wrapper.
const body = () => new DOMWrapper(document.body);

const buttonByLabel = (label: string) => body().findAll('button').find(button => button.text() === label)!;

describe('VerdocsOtpDialog', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('submits the entered code and clears the input for the next attempt', async () => {
    const wrapper = mount(VerdocsOtpDialog);

    expect(body().get('[role="dialog"]').text()).toContain('Verification Required');
    const input = body().get<HTMLInputElement>('input[placeholder="Enter your one-time code..."]');
    expect(buttonByLabel('Submit').attributes('disabled')).toBeDefined();

    await input.setValue('123456');
    expect(buttonByLabel('Submit').attributes('disabled')).toBeUndefined();

    await buttonByLabel('Submit').trigger('click');
    expect(wrapper.emitted('submit')).toEqual([ [ '123456' ] ]);
    expect(input.element.value).toBe('');

    wrapper.unmount();
  });

  it('unlocks Resend after the cooldown and locks it again after resending', async () => {
    vi.useFakeTimers();
    const wrapper = mount(VerdocsOtpDialog);

    expect(buttonByLabel('Resend').attributes('disabled')).toBeDefined();

    vi.advanceTimersByTime(30000);
    await wrapper.vm.$nextTick();
    expect(buttonByLabel('Resend').attributes('disabled')).toBeUndefined();

    await buttonByLabel('Resend').trigger('click');
    expect(wrapper.emitted('resend')).toHaveLength(1);
    expect(buttonByLabel('Resend').attributes('disabled')).toBeDefined();

    wrapper.unmount();
  });

  it('shows the error message when set', () => {
    const wrapper = mount(VerdocsOtpDialog, { props: { error: 'Invalid verification code. Please try again.' } });

    expect(body().get('[role="alert"]').text()).toBe('Invalid verification code. Please try again.');

    wrapper.unmount();
  });

  it('cancels from the Cancel button but not the overlay', async () => {
    const wrapper = mount(VerdocsOtpDialog);

    // The legacy dialog was persistent: clicking the background does not dismiss it.
    const overlay = body().get('[role="dialog"]').element.parentElement!;
    await new DOMWrapper(overlay).trigger('click');
    expect(wrapper.emitted('cancel')).toBeUndefined();

    await buttonByLabel('Cancel').trigger('click');
    expect(wrapper.emitted('cancel')).toHaveLength(1);

    wrapper.unmount();
  });
});
