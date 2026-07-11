import type { Meta, StoryObj } from '@storybook/react-vite';
import Loader from './Loader';

const meta = {
  title: 'Controls/Loader',
  component: Loader,
} satisfies Meta<typeof Loader>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <div style={{ position: 'relative', height: 240 }}>
      <Loader />
    </div>
  ),
};
