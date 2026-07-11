import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ToggleButtonProps } from './ToggleButton';
import ToggleButton from './ToggleButton';
import { EnvelopeIcon } from './icons';

const meta = {
  title: 'Controls/Toggle Button',
  component: ToggleButton,
} satisfies Meta<typeof ToggleButton>;

export default meta;
type Story = StoryObj<typeof meta>;

function StatefulToggleButton(args: ToggleButtonProps) {
  const [active, setActive] = useState(args.active ?? false);

  return <ToggleButton {...args} active={active} onToggle={setActive} />;
}

export const WithIcon: Story = {
  args: { icon: <EnvelopeIcon />, label: 'Toggle notifications' },
  render: args => <StatefulToggleButton {...args} />,
};

export const WithLabel: Story = {
  args: { label: 'On' },
  render: args => <StatefulToggleButton {...args} />,
};

export const Small: Story = {
  args: { icon: <EnvelopeIcon />, label: 'Toggle notifications', size: 'small' },
  render: args => <StatefulToggleButton {...args} />,
};

export const Active: Story = {
  args: { label: 'On', active: true },
};
