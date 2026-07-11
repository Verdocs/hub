import type { Meta, StoryObj } from '@storybook/react-vite';
import ComponentError from './ComponentError';

const meta = {
  title: 'Controls/Component Error',
  component: ComponentError,
  args: {
    message: 'Something went wrong. Please try again later.',
  },
} satisfies Meta<typeof ComponentError>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
