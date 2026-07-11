import type { Meta, StoryObj } from '@storybook/react-vite';
import ButtonPanel from './ButtonPanel';
import { EnvelopeIcon } from './icons';

const meta = {
  title: 'Controls/Button Panel',
  component: ButtonPanel,
  args: {
    icon: <EnvelopeIcon className="vdocs:size-6" />,
    label: 'Message settings',
  },
} satisfies Meta<typeof ButtonPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Basic: Story = {
  render: args => (
    <div style={{ padding: 40 }}>
      <ButtonPanel {...args}>
        <div className="vdocs:pb-2 vdocs:mb-2 vdocs:text-base vdocs:border-0 vdocs:border-b vdocs:border-solid vdocs:border-edge-light">
          Message Settings
        </div>
        <div className="vdocs:font-normal">
          Click the icon to toggle this panel, or click anywhere outside to close it.
        </div>
      </ButtonPanel>
    </div>
  ),
};
