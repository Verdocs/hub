import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import type { TabsProps } from './Tabs';
import Tabs from './Tabs';

const tabs = [
  { id: 'general', label: 'General' },
  { id: 'fields', label: 'Fields' },
  { id: 'roles', label: 'Roles' },
  { id: 'advanced', label: 'Advanced', disabled: true },
];

const meta = {
  title: 'Controls/Tabs',
  component: Tabs,
  args: { tabs },
} satisfies Meta<typeof Tabs>;

export default meta;
type Story = StoryObj<typeof meta>;

function StatefulTabs(args: TabsProps) {
  const [selected, setSelected] = useState(args.selectedTab ?? 0);

  return <Tabs {...args} selectedTab={selected} onSelectTab={(tab, index) => setSelected(index)} />;
}

export const Basic: Story = {
  render: args => <StatefulTabs {...args} />,
};

export const SecondSelected: Story = {
  args: { selectedTab: 1 },
};
