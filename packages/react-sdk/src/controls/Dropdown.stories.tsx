import type { Meta, StoryObj } from '@storybook/react-vite';
import Dropdown from './Dropdown';

const meta = {
  title: 'Controls/Dropdown',
  component: Dropdown,
} satisfies Meta<typeof Dropdown>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Basic: Story = {
  args: {
    options: [
      { label: 'Preview / Send', id: 'send' },
      { label: 'Sign Now', id: 'signnow', disabled: true },
      { label: '' },
      { label: 'Submissions', id: 'submitted' },
      { label: '' },
      { label: 'Edit', id: 'edit' },
    ],
  },
};
