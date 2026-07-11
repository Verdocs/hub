import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import QuickFilter from './QuickFilter';

const meta = {
  title: 'Controls/QuickFilter',
  component: QuickFilter,
} satisfies Meta<typeof QuickFilter>;

export default meta;
type Story = StoryObj<typeof meta>;

const options = [
  { value: 'all', label: 'All' },
  { value: 'starred', label: 'Starred' },
  { value: 'unstarred', label: 'Not Starred' },
];

function StatefulQuickFilter(args: React.ComponentProps<typeof QuickFilter>) {
  const [value, setValue] = useState(args.value);
  return <QuickFilter {...args} value={value} onChange={option => setValue(option.value)} />;
}

export const Basic: Story = {
  args: { label: 'Starred', options, value: 'all' },
  render: args => <StatefulQuickFilter {...args} />,
};
