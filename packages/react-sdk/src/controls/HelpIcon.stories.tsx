import type { Meta, StoryObj } from '@storybook/react-vite';
import { EnvelopeIcon } from './icons';
import HelpIcon from './HelpIcon';

const meta = {
  title: 'Controls/Help Icon',
  component: HelpIcon,
  args: {
    text: 'Sample help text',
  },
} satisfies Meta<typeof HelpIcon>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const CustomIcon: Story = {
  args: { icon: <EnvelopeIcon className="vdocs:size-6" /> },
};
