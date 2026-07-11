import type { IEnvelopeField } from '@verdocs/js-sdk';
import type { Meta, StoryObj } from '@storybook/react-vite';
import FieldRadio from './FieldRadio';

const sampleField = (overrides: Partial<IEnvelopeField> = {}): IEnvelopeField => ({
  envelope_id: '83da3d70-7857-4392-b876-c4592a304bc9',
  document_id: '626af9d6-f9d5-4ad9-94c7-13e57d515d43',
  name: 'Buyer-financing-cash',
  role_name: 'Recipient 1',
  type: 'radio',
  required: false,
  readonly: false,
  settings: null,
  validator: null,
  label: null,
  prepared: false,
  page: 1,
  x: 150,
  y: 410,
  width: 14,
  height: 14,
  default: null,
  placeholder: null,
  multiline: false,
  group: 'financing-choice',
  options: null,
  value: null,
  is_valid: true,
  ...overrides,
});

const meta = {
  title: 'Fields/Radio Button',
  component: FieldRadio,
  args: {
    field: sampleField(),
    signerIndex: 0,
  },
} satisfies Meta<typeof FieldRadio>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {};

export const Selected: Story = {
  args: { field: sampleField({ value: 'true' }) },
};

export const WithLabel: Story = {
  args: { field: sampleField({ label: 'Cash' }) },
};

export const Required: Story = {
  args: { field: sampleField({ required: true }) },
};

export const Disabled: Story = {
  args: { field: sampleField({ value: 'true' }), disabled: true },
};

export const Done: Story = {
  args: { field: sampleField({ value: 'true' }), done: true },
};

export const DoneUnselected: Story = {
  args: { field: sampleField(), done: true },
};

export const SecondSigner: Story = {
  args: {
    field: sampleField({ name: 'Seller-financing-loan', role_name: 'Recipient 2' }),
    signerIndex: 1,
  },
};
