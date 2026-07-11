import type { IEnvelopeField } from '@verdocs/js-sdk';
import type { Meta, StoryObj } from '@storybook/react-vite';
import FieldSignature from './FieldSignature';

const signatureField: IEnvelopeField = {
  envelope_id: '8d1e9f30-2c5b-4a77-9c3e-5f0a1b2c3d4e',
  document_id: 'a7b8c9d0-4321-4e5f-8a9b-0c1d2e3f4a5b',
  name: 'recipient-1-signature-1',
  role_name: 'Recipient 1',
  type: 'signature',
  required: false,
  readonly: false,
  settings: null,
  validator: null,
  label: null,
  prepared: false,
  page: 1,
  x: 120,
  y: 480,
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

// A hand-drawn-looking squiggle so the signed states have something to show without
// fetching a real signature blob.
const FAKE_SIGNATURE_URL =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 60">' +
      '<path d="M10 45 C 25 8, 38 55, 52 32 S 78 12, 92 34 S 120 52, 150 14" fill="none" stroke="#1c2f6e" stroke-width="3" stroke-linecap="round"/>' +
      '</svg>',
  );

const meta = {
  title: 'Fields/Signature',
  component: FieldSignature,
  args: {
    field: signatureField,
    signerIndex: 0,
  },
} satisfies Meta<typeof FieldSignature>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Unsigned: Story = {};

export const Signed: Story = {
  args: { signatureUrl: FAKE_SIGNATURE_URL },
};

export const WithLabel: Story = {
  args: { field: { ...signatureField, label: 'Sign here' } },
  render: args => (
    <div style={{ paddingTop: 20 }}>
      <FieldSignature {...args} />
    </div>
  ),
};

export const Required: Story = {
  args: { field: { ...signatureField, required: true } },
};

export const Disabled: Story = {
  args: { disabled: true },
};

export const Done: Story = {
  args: { done: true, signatureUrl: FAKE_SIGNATURE_URL },
};

export const SecondSigner: Story = {
  args: { field: { ...signatureField, role_name: 'Recipient 2', name: 'recipient-2-signature-1' }, signerIndex: 1 },
};
