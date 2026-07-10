import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from './Button';

const meta = {
  title: 'Controls/Button',
  component: Button,
  args: {
    label: 'Click Me',
    size: 'normal',
    variant: 'standard',
    disabled: false,
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Standard: Story = {};

export const Outline: Story = {
  args: { variant: 'outline' },
};

export const Text: Story = {
  args: { variant: 'text' },
};

export const Disabled: Story = {
  args: { disabled: true },
};

export const Sizes: Story = {
  render: args => (
    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
      <Button {...args} label="XSmall" size="xsmall" />
      <Button {...args} label="Small" size="small" />
      <Button {...args} label="Normal" size="normal" />
      <Button {...args} label="Medium" size="medium" />
      <Button {...args} label="Large" size="large" />
    </div>
  ),
};
