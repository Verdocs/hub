import type { IEnvelopeField } from '@verdocs/js-sdk';
import type { Meta, StoryObj } from '@storybook/react-vite';
import FieldPayment from './FieldPayment';

const paymentField: IEnvelopeField = {
  envelope_id: '8d1e9f30-2c5b-4a77-9c3e-5f0a1b2c3d4e',
  document_id: 'a7b8c9d0-4321-4e5f-8a9b-0c1d2e3f4a5b',
  name: 'recipient-1-payment-1',
  role_name: 'Recipient 1',
  type: 'payment',
  required: false,
  readonly: false,
  settings: null,
  validator: null,
  label: null,
  prepared: false,
  page: 1,
  x: 220,
  y: 300,
  width: 24,
  height: 24,
  default: null,
  placeholder: null,
  multiline: false,
  group: null,
  options: null,
  value: null,
  is_valid: true,
};

const meta = {
  title: 'Fields/Payment',
  component: FieldPayment,
  args: {
    field: paymentField,
    signerIndex: 0,
  },
} satisfies Meta<typeof FieldPayment>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Unpaid: Story = {};

export const Paid: Story = {
  args: { paid: true },
};

// Payment fields have no required border treatment in the legacy stylesheet; this story
// exists to show that a required payment field renders the same as an optional one.
export const Required: Story = {
  args: { field: { ...paymentField, required: true } },
};

export const Disabled: Story = {
  args: { disabled: true },
};

export const Done: Story = {
  args: { done: true },
};

export const SecondSigner: Story = {
  args: { field: { ...paymentField, role_name: 'Recipient 2', name: 'recipient-2-payment-1' }, signerIndex: 1 },
};
