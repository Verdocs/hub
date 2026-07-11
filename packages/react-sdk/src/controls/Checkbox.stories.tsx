import type { Meta, StoryObj } from '@storybook/react-vite';
import Checkbox from './Checkbox';

const meta = {
  title: 'Controls/Checkbox',
  component: Checkbox,
  args: {
    label: 'Check Me',
    theme: 'light',
    size: 'normal',
    disabled: false,
  },
} satisfies Meta<typeof Checkbox>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Unchecked: Story = {};

export const Checked: Story = {
  args: { defaultChecked: true },
};

export const Small: Story = {
  args: { size: 'small', defaultChecked: true },
};

export const Disabled: Story = {
  args: { disabled: true, defaultChecked: true },
};

export const Dark: Story = {
  args: { theme: 'dark' },
  render: args => (
    <div style={{ background: '#092c4c', color: '#ffffff', padding: 20 }}>
      <Checkbox {...args} />
    </div>
  ),
};

export const WithoutLabel: Story = {
  args: { 'label': '', 'aria-label': 'Enable the option' },
};
