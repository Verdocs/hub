import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import type { MenuPanelProps } from './MenuPanel';
import MenuPanel from './MenuPanel';
import Button from './Button';

const meta = {
  title: 'Controls/Menu Panel',
  component: MenuPanel,
} satisfies Meta<typeof MenuPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

function MenuPanelDemo(args: MenuPanelProps) {
  const [open, setOpen] = useState(false);

  return (
    <div style={{ padding: 40 }}>
      <Button label="Open panel" onClick={() => setOpen(true)} />

      {open && (
        <MenuPanel {...args} onClose={() => setOpen(false)}>
          <div style={{ padding: 20 }}>
            Menu panel content. Click outside the panel to close it.
          </div>
        </MenuPanel>
      )}
    </div>
  );
}

export const Right: Story = {
  render: args => <MenuPanelDemo {...args} />,
};

export const Left: Story = {
  args: { side: 'left' },
  render: args => <MenuPanelDemo {...args} />,
};

export const NoOverlay: Story = {
  args: { overlay: false },
  render: args => <MenuPanelDemo {...args} />,
};

export const Wide: Story = {
  args: { width: 420 },
  render: args => <MenuPanelDemo {...args} />,
};
