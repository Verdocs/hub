import type { IEnvelopeField } from '@verdocs/js-sdk';
import type { Meta, StoryObj } from '@storybook/react-vite';
import FieldTextbox from './FieldTextbox';

const sampleField = (overrides: Partial<IEnvelopeField> = {}): IEnvelopeField => ({
  envelope_id: '83da3d70-7857-4392-b876-c4592a304bc9',
  document_id: '626af9d6-f9d5-4ad9-94c7-13e57d515d43',
  name: 'Buyer-textbox-1',
  role_name: 'Recipient 1',
  type: 'textbox',
  required: false,
  readonly: false,
  settings: null,
  validator: null,
  label: null,
  prepared: false,
  page: 1,
  x: 180,
  y: 260,
  width: 150,
  height: 15,
  default: null,
  placeholder: 'Full name',
  multiline: false,
  group: null,
  options: null,
  value: null,
  is_valid: true,
  ...overrides,
});

const meta = {
  title: 'Fields/Textbox',
  component: FieldTextbox,
  args: {
    field: sampleField(),
    signerIndex: 0,
  },
} satisfies Meta<typeof FieldTextbox>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {};

export const Filled: Story = {
  args: { field: sampleField({ value: 'Jane Smith' }) },
};

export const WithLabel: Story = {
  args: { field: sampleField({ label: 'Legal name' }) },
};

export const Required: Story = {
  args: { field: sampleField({ required: true }) },
};

export const Disabled: Story = {
  args: { field: sampleField({ value: 'Jane Smith' }), disabled: true },
};

export const Small: Story = {
  args: { field: sampleField({ height: 12, width: 100 }) },
};

export const Done: Story = {
  args: { field: sampleField({ value: 'Jane Smith' }), done: true },
};

export const SecondSigner: Story = {
  args: {
    field: sampleField({ name: 'Seller-textbox-1', role_name: 'Recipient 2' }),
    signerIndex: 1,
  },
};
