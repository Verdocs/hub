import type { Meta, StoryObj } from '@storybook/react-vite';
import SelectInput from './SelectInput';

const meta = {
  title: 'Controls/Select Input',
  component: SelectInput,
  args: {
    label: 'Document Type',
    options: [
      { label: 'Contract', value: 'contract' },
      { label: 'Invoice', value: 'invoice' },
      { label: 'Purchase Order', value: 'po' },
    ],
  },
} satisfies Meta<typeof SelectInput>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Basic: Story = {
  args: { defaultValue: 'contract' },
};

export const Required: Story = {
  args: { required: true, description: 'Pick the closest match.' },
};

export const Disabled: Story = {
  args: { defaultValue: 'invoice', disabled: true },
};
