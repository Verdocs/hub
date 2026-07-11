import type { IEnvelopeField } from '@verdocs/js-sdk';
import type { Meta, StoryObj } from '@storybook/react-vite';
import SigningProgress from './SigningProgress';

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

const meta = {
  title: 'Dialogs/Signing Progress',
  component: SigningProgress,
  parameters: {
    docs: {
      description: {
        component:
          'The floating progress card for the signing flow. It normally pins itself top-left over the document viewer; these stories keep it in normal flow via className.',
      },
    },
  },
  args: {
    // Keep the card in the story flow instead of pinned to the viewport.
    className: 'vdocs:static!',
    fields: [signature, dateSigned],
    focusedField: 'Buyer-signature-1',
  },
} satisfies Meta<typeof SigningProgress>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Start: Story = {
  args: { mode: 'start' },
};

export const Signing: Story = {
  args: { mode: 'signing' },
};

export const PartiallyComplete: Story = {
  args: {
    mode: 'signing',
    fields: [sampleField({ value: 'signed' }), dateSigned],
    focusedField: 'Buyer-date-1',
  },
};

export const WithOptionalFields: Story = {
  args: {
    mode: 'signing',
    fields: [signature, dateSigned, comments],
  },
};

export const ReadyToSubmit: Story = {
  args: {
    mode: 'signing',
    fields: [sampleField({ value: 'signed' }), sampleField({ name: 'Buyer-date-1', type: 'date', value: '2026-07-10' })],
    focusedField: 'Buyer-date-1',
  },
};

export const Completed: Story = {
  args: { mode: 'completed' },
};
