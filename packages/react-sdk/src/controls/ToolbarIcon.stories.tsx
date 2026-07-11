import type { Meta, StoryObj } from '@storybook/react-vite';
import ToolbarIcon from './ToolbarIcon';
import { EnvelopeIcon } from './icons';

const meta = {
  title: 'Controls/Toolbar Icon',
  component: ToolbarIcon,
  args: {
    text: 'Sample tooltip text',
    icon: <EnvelopeIcon className="vdocs:size-6" />,
    placement: 'bottom',
  },
} satisfies Meta<typeof ToolbarIcon>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: args => (
    <div style={{ padding: 60, display: 'flex', justifyContent: 'center' }}>
      <ToolbarIcon {...args} />
    </div>
  ),
};

export const Placements: Story = {
  render: args => (
    <div style={{ padding: 100, display: 'flex', gap: 120, justifyContent: 'center' }}>
      <ToolbarIcon {...args} text="Top" placement="top" />
      <ToolbarIcon {...args} text="Bottom" placement="bottom" />
      <ToolbarIcon {...args} text="Left" placement="left" />
      <ToolbarIcon {...args} text="Right" placement="right" />
    </div>
  ),
};
