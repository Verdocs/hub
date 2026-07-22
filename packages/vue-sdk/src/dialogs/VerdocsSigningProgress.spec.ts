import type { IEnvelopeField } from '@verdocs/js-sdk';
import { mount, type VueWrapper } from '@vue/test-utils';
import VerdocsSigningProgress from './VerdocsSigningProgress.vue';

const sampleField = (overrides: Partial<IEnvelopeField> = {}): IEnvelopeField => ({
  envelope_id: '83da3d70-7857-4392-b876-c4592a304bc9',
  document_id: '626af9d6-f9d5-4ad9-94c7-13e57d515d43',
  name: 'Buyer-signature-1',
  role_name: 'Recipient 1',
  type: 'signature',
  required: true,
  readonly: false,
  settings: null,
  validator: null,
  label: null,
  prepared: false,
  page: 1,
  x: 120,
  y: 340,
  width: 120,
  height: 40,
  default: null,
  placeholder: null,
  multiline: false,
  group: null,
  options: null,
  value: null,
  is_valid: true,
  ...overrides,
});

const signature = sampleField();
const dateSigned = sampleField({ name: 'Buyer-date-1', type: 'date' });
const comments = sampleField({ name: 'Buyer-textbox-1', type: 'textbox', required: false });

const buttonByLabel = (wrapper: VueWrapper, label: string) => wrapper.findAll('button').find(button => button.text() === label);

describe('VerdocsSigningProgress', () => {
  it('renders counts, the focused field label, and Start Signing in start mode', async () => {
    const wrapper = mount(VerdocsSigningProgress, {
      props: { mode: 'start', fields: [ signature, dateSigned ], focusedField: 'Buyer-signature-1' },
    });

    expect(wrapper.text()).toContain('2 of 2 required fields remaining');
    expect(wrapper.text()).toContain('Required Signature*');

    await buttonByLabel(wrapper, 'Start Signing')!.trigger('click');
    expect(wrapper.emitted('start')).toHaveLength(1);
  });

  it('only shows the optional line when optional fields exist', () => {
    const requiredOnly = mount(VerdocsSigningProgress, { props: { mode: 'signing', fields: [ signature, dateSigned ] } });
    expect(requiredOnly.text()).not.toContain('optional fields remaining');
    requiredOnly.unmount();

    const withOptional = mount(VerdocsSigningProgress, {
      props: { mode: 'signing', fields: [ signature, comments ], focusedField: 'Buyer-textbox-1' },
    });
    expect(withOptional.text()).toContain('1 of 1 optional fields remaining');
    expect(withOptional.text()).toContain('Optional Text Field');
  });

  it('disables Previous on the first field and Next on the last, firing the events between', async () => {
    const onFirst = mount(VerdocsSigningProgress, {
      props: { mode: 'signing', fields: [ signature, dateSigned ], focusedField: 'Buyer-signature-1' },
    });
    expect(buttonByLabel(onFirst, 'Previous')!.attributes('disabled')).toBeDefined();
    await buttonByLabel(onFirst, 'Next')!.trigger('click');
    expect(onFirst.emitted('next')).toHaveLength(1);
    onFirst.unmount();

    const onLast = mount(VerdocsSigningProgress, {
      props: { mode: 'signing', fields: [ signature, dateSigned ], focusedField: 'Buyer-date-1' },
    });
    expect(buttonByLabel(onLast, 'Next')!.attributes('disabled')).toBeDefined();
    await buttonByLabel(onLast, 'Previous')!.trigger('click');
    expect(onLast.emitted('previous')).toHaveLength(1);
  });

  it('counts filled fields as done and offers Submit once every required field is filled', async () => {
    const partial = mount(VerdocsSigningProgress, { props: { mode: 'signing', fields: [ sampleField({ value: 'signed' }), dateSigned ] } });
    expect(partial.text()).toContain('1 of 2 required fields remaining');
    partial.unmount();

    const filled = [ sampleField({ value: 'signed' }), sampleField({ name: 'Buyer-date-1', type: 'date', value: '2026-07-10' }) ];
    const wrapper = mount(VerdocsSigningProgress, { props: { mode: 'signing', fields: filled, focusedField: 'Buyer-date-1' } });

    expect(wrapper.text()).toContain('0 of 2 required fields remaining');
    expect(wrapper.text()).toContain('Ready to submit.');
    expect(buttonByLabel(wrapper, 'Next')).toBeUndefined();

    await buttonByLabel(wrapper, 'Submit')!.trigger('click');
    expect(wrapper.emitted('submit')).toHaveLength(1);
  });

  it('renders the completed card with Submit and no counts', async () => {
    const wrapper = mount(VerdocsSigningProgress, { props: { mode: 'completed', fields: [ signature ] } });

    expect(wrapper.text()).toContain('Ready to Submit');
    expect(wrapper.text()).toContain('You have entered all requested signatures. Select Submit to complete the signing process.');
    expect(wrapper.text()).not.toContain('required fields remaining');

    await buttonByLabel(wrapper, 'Submit')!.trigger('click');
    expect(wrapper.emitted('submit')).toHaveLength(1);
  });

  it('treats a grouped radio as filled only when its own value is selected', () => {
    // js-sdk's isFieldFilled would count the whole group as filled because the
    // sibling is selected; the card's stricter check keeps the focused radio open.
    const radioOn = sampleField({ name: 'Buyer-radio-1', type: 'radio', group: 'choices', value: 'true' });
    const radioOff = sampleField({ name: 'Buyer-radio-2', type: 'radio', group: 'choices', value: null });
    const wrapper = mount(VerdocsSigningProgress, {
      props: { mode: 'signing', fields: [ radioOn, radioOff ], recipientFields: [ radioOn, radioOff ], focusedField: 'Buyer-radio-2' },
    });

    expect(wrapper.text()).toContain('1 of 2 required fields remaining');
    expect(wrapper.text()).toContain('Required Radio Button*');
  });
});
