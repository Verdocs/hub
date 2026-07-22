import type { IEnvelopeField } from '@verdocs/js-sdk';
import type { Meta, StoryObj } from '@storybook/react-vite';
import FieldTimestamp from './FieldTimestamp';

const sampleField = (overrides: Partial<IEnvelopeField> = {}): IEnvelopeField => ({
  envelope_id: '4d0f8b3a-08c9-4bd1-b2ad-3f5a86d1e9c2',
  document_id: 'b9a7c2e1-55d4-4c3f-9d21-7e6f0a4b8c5d',
  name: 'signed-at-1',
  role_name: 'Recipient 1',
  type: 'timestamp',
  required: false,
  readonly: false,
  settings: null,
  validator: null,
  label: 'Signed At',
  prepared: false,
  page: 1,
  x: 360,
  y: 640,
  width: 160,
  height: 15,
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
  title: 'Fields/Timestamp',
  component: FieldTimestamp,
  args: {
    field: sampleField(),
    signerIndex: 0,
    // Signing hosts size fields to their page boxes with inline styles; the story
    // does the same so the field is big enough to see.
    style: { width: 220, height: 24 },
  },
} satisfies Meta<typeof FieldTimestamp>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {};

export const CustomPlaceholder: Story = {
  args: { field: sampleField({ placeholder: 'Stamped on submit' }) },
};

export const Filled: Story = {
  args: { field: sampleField({ value: '2026-07-10T14:32:05.000Z' }) },
};

export const Required: Story = {
  args: { field: sampleField({ required: true }) },
};

export const Disabled: Story = {
  args: { field: sampleField(), disabled: true },
};

export const SecondSigner: Story = {
  args: { field: sampleField({ role_name: 'Recipient 2', name: 'signed-at-2' }), signerIndex: 1 },
};

export const Done: Story = {
  args: { field: sampleField({ value: '2026-07-10T14:32:05.000Z' }), done: true },
};
