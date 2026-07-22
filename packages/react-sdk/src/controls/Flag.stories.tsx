import type { Meta, StoryObj } from '@storybook/react-vite';
import Flag from './Flag';

const meta = {
  title: 'Controls/Flag',
  component: Flag,
  args: {
    variant: 'fill',
    label: 'FILL',
    showSkip: false,
  },
  // The flag pins itself to the right edge of its nearest positioned ancestor,
  // so every story renders it against a stand-in field.
  render: args => (
    <div
      style={{
        position: 'relative',
        width: 200,
        height: 24,
        marginTop: 20,
        background: '#f5f5fa',
        border: '1px solid #dad8dd',
      }}>
      <Flag {...args} />
    </div>
  ),
} satisfies Meta<typeof Flag>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Fill: Story = {};

export const Next: Story = {
  args: { variant: 'next', label: 'NEXT' },
};

export const WithSkip: Story = {
  args: { showSkip: true },
};
