import type { IEnvelope } from '@verdocs/js-sdk';
import type { Meta, StoryObj } from '@storybook/react-vite';
import StatusIndicator from './StatusIndicator';

const meta = {
  title: 'Envelopes/Status Indicator',
  component: StatusIndicator,
} satisfies Meta<typeof StatusIndicator>;

export default meta;
type Story = StoryObj<typeof meta>;

const AllStatuses = ['pending', 'in progress', 'complete', 'declined', 'canceled', 'invited', 'opened', 'signed', 'submitted', 'accepted'] as const;

const gridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(3, 180px)',
  gap: 16,
  padding: 16,
};

// A minimal envelope where one of two recipients has submitted, which the
// indicator reports as the derived Partly Signed state.
const partlySignedEnvelope = {
  id: 'demo-envelope',
  name: 'Demo Envelope',
  status: 'in progress',
  recipients: [
    { role_name: 'Signer 1', first_name: 'Paige', last_name: 'Turner', sequence: 1, status: 'submitted' },
    { role_name: 'Signer 2', first_name: 'Rita', last_name: 'Booke', sequence: 2, status: 'invited' },
  ],
} as IEnvelope;

export const AllStatusesLight: Story = {
  args: {},
  render: () => (
    <div style={gridStyle}>
      {AllStatuses.map(status => (
        <StatusIndicator key={status} status={status} />
      ))}
      <StatusIndicator envelope={partlySignedEnvelope} />
    </div>
  ),
};

export const AllStatusesDark: Story = {
  args: { theme: 'dark' },
  render: () => (
    <div style={{ ...gridStyle, background: '#33364b' }}>
      {AllStatuses.map(status => (
        <StatusIndicator key={status} status={status} theme="dark" />
      ))}
      <StatusIndicator envelope={partlySignedEnvelope} theme="dark" />
    </div>
  ),
};

export const SmallSize: Story = {
  args: { size: 'small' },
  render: () => (
    <div style={gridStyle}>
      {AllStatuses.map(status => (
        <StatusIndicator key={status} status={status} size="small" />
      ))}
      <StatusIndicator envelope={partlySignedEnvelope} size="small" />
    </div>
  ),
};
