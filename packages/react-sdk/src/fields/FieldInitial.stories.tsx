import type { IEnvelopeField } from '@verdocs/js-sdk';
import type { Meta, StoryObj } from '@storybook/react-vite';
import FieldInitial from './FieldInitial';

const initialField: IEnvelopeField = {
  envelope_id: '8d1e9f30-2c5b-4a77-9c3e-5f0a1b2c3d4e',
  document_id: 'a7b8c9d0-4321-4e5f-8a9b-0c1d2e3f4a5b',
  name: 'recipient-1-initial-1',
  role_name: 'Recipient 1',
  type: 'initial',
  required: false,
  readonly: false,
  settings: null,
  validator: null,
  label: null,
  prepared: false,
  page: 1,
  x: 480,
  y: 640,
  width: 83,
  height: 36,
  default: null,
  placeholder: null,
  multiline: false,
  group: null,
  options: null,
  value: null,
  is_valid: true,
};

// A hand-drawn-looking pair of strokes so the initialed states have something to show
// without fetching a real initials blob.
const FAKE_INITIALS_URL =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 60">' +
      '<path d="M12 48 C 18 10, 28 10, 24 46 M 14 32 L 32 32 M 44 14 C 66 6, 66 28, 48 30 C 68 32, 66 54, 42 48" fill="none" stroke="#1c2f6e" stroke-width="3" stroke-linecap="round"/>' +
      '</svg>',
  );

const meta = {
  title: 'Fields/Initial',
  component: FieldInitial,
  args: {
    field: initialField,
    signerIndex: 0,
  },
} satisfies Meta<typeof FieldInitial>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Unsigned: Story = {};

export const Initialed: Story = {
  args: { initialUrl: FAKE_INITIALS_URL },
};

export const WithLabel: Story = {
  args: { field: { ...initialField, label: 'Initial here' } },
  render: args => (
    <div style={{ paddingTop: 20 }}>
      <FieldInitial {...args} />
    </div>
  ),
};

export const Required: Story = {
  args: { field: { ...initialField, required: true } },
};

export const Disabled: Story = {
  args: { disabled: true },
};

export const Done: Story = {
  args: { done: true, initialUrl: FAKE_INITIALS_URL },
};

export const SecondSigner: Story = {
  args: { field: { ...initialField, role_name: 'Recipient 2', name: 'recipient-2-initial-1' }, signerIndex: 1 },
};
