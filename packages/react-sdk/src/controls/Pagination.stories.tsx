import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import Pagination from './Pagination';

const meta = {
  title: 'Controls/Pagination',
  component: Pagination,
} satisfies Meta<typeof Pagination>;

export default meta;
type Story = StoryObj<typeof meta>;

function StatefulPagination(args: React.ComponentProps<typeof Pagination>) {
  const [page, setPage] = useState(0);
  return <Pagination {...args} selectedPage={page} onSelectPage={setPage} />;
}

export const Basic: Story = {
  args: { itemCount: 95, perPage: 10 },
  render: args => <StatefulPagination {...args} />,
};
