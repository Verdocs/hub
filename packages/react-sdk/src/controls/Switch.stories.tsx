import type { Meta, StoryObj } from '@storybook/react-vite';
import Switch from './Switch';

const meta = {
  title: 'Controls/Switch',
  component: Switch,
  args: {
    'theme': 'primary',
    'disabled': false,
    'aria-label': 'Toggle the option',
  },
} satisfies Meta<typeof Switch>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Off: Story = {};

export const On: Story = {
  args: { defaultChecked: true },
};

export const Secondary: Story = {
  args: { theme: 'secondary', defaultChecked: true },
};

export const Disabled: Story = {
  args: { disabled: true, defaultChecked: true },
};

export const WithLabel: Story = {
  args: { 'label': 'Send reminders', 'aria-label': undefined },
};
