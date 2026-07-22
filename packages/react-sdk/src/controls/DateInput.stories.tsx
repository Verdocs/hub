import type { Meta, StoryObj } from '@storybook/react-vite';
import DateInput from './DateInput';

const meta = {
  title: 'Controls/Date Input',
  component: DateInput,
} satisfies Meta<typeof DateInput>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Basic: Story = {
  args: { label: 'Date of Birth' },
};

export const Prefilled: Story = {
  args: { label: 'Expiration Date', defaultValue: '2026-12-31', description: 'The envelope can no longer be signed after this date.' },
};

export const Required: Story = {
  args: { label: 'Effective Date', required: true },
};

export const Disabled: Story = {
  args: { label: 'Created', defaultValue: '2026-07-10', disabled: true },
};
