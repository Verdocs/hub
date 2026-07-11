import type { IEnvelopeField } from '@verdocs/js-sdk';
import type { Meta, StoryObj } from '@storybook/react-vite';
import FieldDropdown from './FieldDropdown';

const sampleField = (overrides: Partial<IEnvelopeField> = {}): IEnvelopeField => ({
  envelope_id: '83da3d70-7857-4392-b876-c4592a304bc9',
  document_id: '626af9d6-f9d5-4ad9-94c7-13e57d515d43',
  name: 'Buyer-dropdown-1',
  role_name: 'Recipient 1',
  type: 'dropdown',
  required: false,
  readonly: false,
  settings: null,
  validator: null,
  label: null,
  prepared: false,
  page: 1,
  x: 220,
  y: 500,
  width: 85,
  height: 20,
  default: null,
  placeholder: null,
  multiline: false,
  group: null,
  options: [
    { id: 'purchase', label: 'Purchase' },
    { id: 'refinance', label: 'Refinance' },
    { id: 'cash-out', label: 'Cash Out' },
  ],
  value: null,
  is_valid: true,
  ...overrides,
});

const meta = {
  title: 'Fields/Dropdown',
  component: FieldDropdown,
  args: {
    field: sampleField(),
    signerIndex: 0,
  },
} satisfies Meta<typeof FieldDropdown>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {};

export const Filled: Story = {
  args: { field: sampleField({ value: 'refinance' }) },
};

export const WithLabel: Story = {
  args: { field: sampleField({ label: 'Loan type' }) },
};

export const Required: Story = {
  args: { field: sampleField({ required: true }) },
};

export const Disabled: Story = {
  args: { field: sampleField({ value: 'purchase' }), disabled: true },
};

export const NoOptions: Story = {
  args: { field: sampleField({ options: null }) },
};

export const Done: Story = {
  args: { field: sampleField({ value: 'refinance' }), done: true },
};

export const SecondSigner: Story = {
  args: {
    field: sampleField({ name: 'Seller-dropdown-1', role_name: 'Recipient 2' }),
    signerIndex: 1,
  },
};
