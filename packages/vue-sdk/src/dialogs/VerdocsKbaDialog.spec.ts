import type { IKBAQuestion } from '@verdocs/js-sdk';
import { DOMWrapper, mount } from '@vue/test-utils';
import VerdocsKbaDialog from './VerdocsKbaDialog.vue';

const QUESTIONS: IKBAQuestion[] = [
  { type: 'q-address', prompt: 'Select your most recent address.', answer: [ '553 Arbor Dr', '18 Lacey Ln', '23A Ball Ct' ] },
  { type: 'q-county', prompt: 'Select the county you have lived in.', answer: [ 'Marion', 'Baldwin', 'None of the above' ] },
];

const FULL_DETAILS = {
  first_name: 'Paige',
  last_name: 'Turner',
  address: '123 Main St',
  zip: '62704',
  ssn_last_4: '1234',
  dob: '1990-05-15',
};

// The dialog teleports to document.body, so assertions and clicks go through a
// body wrapper rather than the mount wrapper.
const body = () => new DOMWrapper(document.body);

const buttonByLabel = (label: string) => body().findAll('button').find(button => button.text() === label);

const setByPlaceholder = (placeholder: string, value: string) => body().get(`input[placeholder="${placeholder}"]`).setValue(value);

describe('VerdocsKbaDialog identity mode', () => {
  it('renders the identity form with no cancel button', () => {
    const wrapper = mount(VerdocsKbaDialog, { props: { mode: 'identity' } });

    const dialog = body().get('[role="dialog"]');
    expect(dialog.text()).toContain('Please Confirm Your Identity');
    expect(body().find('input[aria-label="First name"]').exists()).toBe(true);
    expect(body().find('input[aria-label="Last name"]').exists()).toBe(true);
    expect(body().find('input[placeholder="Address..."]').exists()).toBe(true);
    expect(body().find('select').exists()).toBe(true);
    expect(body().find('input[type="date"]').exists()).toBe(true);
    expect(body().find('input[type="checkbox"]').exists()).toBe(true);
    expect(dialog.text()).toContain('I agree to provide my personal information');

    // The legacy identity form offered no cancel button, only the dialog dismiss affordances.
    expect(buttonByLabel('Cancel')).toBeUndefined();

    wrapper.unmount();
  });

  it('collects the entered details and fires submitIdentity', async () => {
    const wrapper = mount(VerdocsKbaDialog, { props: { mode: 'identity' } });

    expect(buttonByLabel('Submit')!.attributes('disabled')).toBeDefined();

    await setByPlaceholder('First name...', 'Paige');
    await setByPlaceholder('Last name...', 'Turner');
    await setByPlaceholder('Address...', '123 Main St');
    await setByPlaceholder('City...', 'Springfield');
    await body().get('select').setValue('IL');
    await setByPlaceholder('Zip Code...', '62704');
    await setByPlaceholder('Last 4 digits of your Social Security Number...', '1234');
    await body().get('input[type="date"]').setValue('1990-05-15');

    // Everything is filled in but the agreement box gates submission.
    expect(buttonByLabel('Submit')!.attributes('disabled')).toBeDefined();
    await body().get('input[type="checkbox"]').setValue();
    expect(buttonByLabel('Submit')!.attributes('disabled')).toBeUndefined();

    await buttonByLabel('Submit')!.trigger('click');
    expect(wrapper.emitted('submitIdentity')).toEqual([
      [
        {
          first_name: 'Paige',
          last_name: 'Turner',
          address: '123 Main St',
          city: 'Springfield',
          state: 'IL',
          zip: '62704',
          ssn_last_4: '1234',
          dob: '1990-05-15',
        },
      ],
    ]);

    wrapper.unmount();
  });

  it('requires everything except city and state', async () => {
    const complete = mount(VerdocsKbaDialog, { props: { mode: 'identity', initialDetails: FULL_DETAILS } });
    await body().get('input[type="checkbox"]').setValue();
    expect(buttonByLabel('Submit')!.attributes('disabled')).toBeUndefined();
    complete.unmount();

    const missingSsn = mount(VerdocsKbaDialog, { props: { mode: 'identity', initialDetails: { ...FULL_DETAILS, ssn_last_4: '' } } });
    await body().get('input[type="checkbox"]').setValue();
    expect(buttonByLabel('Submit')!.attributes('disabled')).toBeDefined();
    missingSsn.unmount();
  });
});

describe('VerdocsKbaDialog questions mode', () => {
  it('shows the help box, choices, and step counter', () => {
    const wrapper = mount(VerdocsKbaDialog, { props: { mode: 'questions', helpTitle: 'Verify your identity', questions: QUESTIONS } });

    const dialog = body().get('[role="dialog"]');
    expect(dialog.text()).toContain('Verify your identity');
    expect(dialog.text()).toContain('Select your most recent address.');
    expect(dialog.text()).toContain('(1/2)');
    expect(buttonByLabel('553 Arbor Dr')).toBeDefined();
    expect(buttonByLabel('Next')!.attributes('disabled')).toBeDefined();

    wrapper.unmount();
  });

  it('steps through the questions, reporting each answer', async () => {
    const wrapper = mount(VerdocsKbaDialog, { props: { mode: 'questions', questions: QUESTIONS } });

    await buttonByLabel('18 Lacey Ln')!.trigger('click');
    expect(buttonByLabel('18 Lacey Ln')!.attributes('aria-pressed')).toBe('true');
    await buttonByLabel('Next')!.trigger('click');
    expect(wrapper.emitted('answerQuestion')).toEqual([ [ { questionType: 'q-address', choice: '18 Lacey Ln' } ] ]);

    // The second (last) question resets the selection and switches the action to Submit.
    const dialog = body().get('[role="dialog"]');
    expect(dialog.text()).toContain('(2/2)');
    expect(dialog.text()).toContain('Select the county you have lived in.');
    expect(buttonByLabel('Submit')!.attributes('disabled')).toBeDefined();

    await buttonByLabel('Marion')!.trigger('click');
    await buttonByLabel('Submit')!.trigger('click');
    expect(wrapper.emitted('answerQuestion')).toEqual([
      [ { questionType: 'q-address', choice: '18 Lacey Ln' } ],
      [ { questionType: 'q-county', choice: 'Marion' } ],
    ]);

    wrapper.unmount();
  });

  it('hides the step counter for a single question and cancels from the button', async () => {
    const wrapper = mount(VerdocsKbaDialog, { props: { mode: 'questions', questions: QUESTIONS.slice(0, 1) } });

    expect(body().get('[role="dialog"]').text()).not.toContain('(1/1)');
    expect(buttonByLabel('Submit')!.attributes('disabled')).toBeDefined();

    await buttonByLabel('Cancel')!.trigger('click');
    expect(wrapper.emitted('cancel')).toHaveLength(1);

    wrapper.unmount();
  });
});
