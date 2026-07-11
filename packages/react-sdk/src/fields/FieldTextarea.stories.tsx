import type { IEnvelopeField } from '@verdocs/js-sdk';
import type { Meta, StoryObj } from '@storybook/react-vite';
import FieldTextarea from './FieldTextarea';

const sampleField = (overrides: Partial<IEnvelopeField> = {}): IEnvelopeField => ({
  envelope_id: '4d0f8b3a-08c9-4bd1-b2ad-3f5a86d1e9c2',
  document_id: 'b9a7c2e1-55d4-4c3f-9d21-7e6f0a4b8c5d',
  name: 'special-instructions-1',
  role_name: 'Recipient 1',
  type: 'textarea',
  required: false,
  readonly: false,
  settings: null,
  validator: null,
  label: 'Special Instructions',
  prepared: false,
  page: 1,
  x: 120,
  y: 480,
  width: 150,
  height: 45,
  default: null,
  placeholder: 'Anything the property manager should know',
  multiline: true,
  group: null,
  options: null,
  value: '',
  is_valid: true,
  ...overrides,
});

const meta = {
  title: 'Fields/Textarea',
  component: FieldTextarea,
  args: {
    field: sampleField(),
    signerIndex: 0,
    // Signing hosts size fields to their page boxes with inline styles; the story
    // does the same so the field is big enough to see.
    style: { width: 240, height: 72 },
  },
} satisfies Meta<typeof FieldTextarea>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {};

export const Filled: Story = {
  args: { field: sampleField({ value: 'Gate code is 4482. Please schedule the walkthrough after 5pm.' }) },
};

export const Required: Story = {
  args: { field: sampleField({ required: true }) },
};

export const Disabled: Story = {
  args: { field: sampleField({ value: 'Gate code is 4482.' }), disabled: true },
};

export const SecondSigner: Story = {
  args: { field: sampleField({ role_name: 'Recipient 2', name: 'special-instructions-2' }), signerIndex: 1 },
};

export const Done: Story = {
  args: { field: sampleField({ value: 'Gate code is 4482. Please schedule the walkthrough after 5pm.' }), done: true },
};
