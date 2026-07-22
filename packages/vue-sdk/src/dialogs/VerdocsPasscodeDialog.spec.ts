import { DOMWrapper, mount } from '@vue/test-utils';
import VerdocsPasscodeDialog from './VerdocsPasscodeDialog.vue';

// The dialog teleports to document.body, so assertions and clicks go through a
// body wrapper rather than the mount wrapper.
const body = () => new DOMWrapper(document.body);

const buttonByLabel = (label: string) => body().findAll('button').find(button => button.text() === label)!;

describe('VerdocsPasscodeDialog', () => {
  it('submits the entered passcode and clears the input for the next attempt', async () => {
    const wrapper = mount(VerdocsPasscodeDialog);

    expect(body().get('[role="dialog"]').text()).toContain('Passcode Required');
    const input = body().get<HTMLInputElement>('input[placeholder="Enter passcode..."]');
    expect(buttonByLabel('Submit').attributes('disabled')).toBeDefined();

    await input.setValue('open-sesame');
    expect(buttonByLabel('Submit').attributes('disabled')).toBeUndefined();

    await buttonByLabel('Submit').trigger('click');
    expect(wrapper.emitted('submit')).toEqual([ [ 'open-sesame' ] ]);
    expect(input.element.value).toBe('');

    wrapper.unmount();
  });

  it('shows the error message when set', () => {
    const wrapper = mount(VerdocsPasscodeDialog, { props: { error: 'Invalid passcode. Please try again.' } });

    expect(body().get('[role="alert"]').text()).toBe('Invalid passcode. Please try again.');

    wrapper.unmount();
  });

  it('cancels from the Cancel button but not the overlay', async () => {
    const wrapper = mount(VerdocsPasscodeDialog);

    // The legacy dialog was persistent: clicking the background does not dismiss it.
    const overlay = body().get('[role="dialog"]').element.parentElement!;
    await new DOMWrapper(overlay).trigger('click');
    expect(wrapper.emitted('cancel')).toBeUndefined();

    await buttonByLabel('Cancel').trigger('click');
    expect(wrapper.emitted('cancel')).toHaveLength(1);

    wrapper.unmount();
  });
});
