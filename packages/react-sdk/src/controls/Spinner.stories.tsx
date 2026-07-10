import type { Meta, StoryObj } from '@storybook/react-vite';
import { Spinner } from './Spinner';

const meta = {
  title: 'Controls/Spinner',
  component: Spinner,
} satisfies Meta<typeof Spinner>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Dark: Story = {
  args: { mode: 'dark', size: 32 },
};

export const Light: Story = {
  args: { mode: 'light', size: 32 },
  render: args => (
    <div style={{ background: '#33364b', padding: 20, display: 'inline-block' }}>
      <Spinner {...args} />
    </div>
  ),
};
