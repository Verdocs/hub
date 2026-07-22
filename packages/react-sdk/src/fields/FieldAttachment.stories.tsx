import type { IEnvelopeField } from '@verdocs/js-sdk';
import type { Meta, StoryObj } from '@storybook/react-vite';
import FieldAttachment from './FieldAttachment';

const sampleField = (overrides: Partial<IEnvelopeField> = {}): IEnvelopeField => ({
  envelope_id: '4d0f8b3a-08c9-4bd1-b2ad-3f5a86d1e9c2',
  document_id: 'b9a7c2e1-55d4-4c3f-9d21-7e6f0a4b8c5d',
  name: 'proof-of-insurance-1',
  role_name: 'Recipient 1',
  type: 'attachment',
  required: false,
  readonly: false,
  settings: null,
  validator: null,
  label: 'Proof of Insurance',
  prepared: false,
  page: 1,
  x: 72,
  y: 590,
  width: 24,
  height: 24,
  default: null,
  placeholder: null,
  multiline: false,
  group: null,
  options: null,
  value: '',
  is_valid: true,
  ...overrides,
});

const meta = {
  title: 'Fields/Attachment',
  component: FieldAttachment,
  args: {
    field: sampleField(),
    signerIndex: 0,
  },
} satisfies Meta<typeof FieldAttachment>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {};

export const Attached: Story = {
  args: { field: sampleField({ value: 'renters-policy.pdf' }) },
};

export const Required: Story = {
  args: { field: sampleField({ required: true }) },
};

export const Disabled: Story = {
  args: { field: sampleField({ value: 'renters-policy.pdf' }), disabled: true },
};

export const SecondSigner: Story = {
  args: { field: sampleField({ role_name: 'Recipient 2', name: 'proof-of-insurance-2' }), signerIndex: 1 },
};

export const Done: Story = {
  args: { field: sampleField({ value: 'renters-policy.pdf' }), done: true },
};
