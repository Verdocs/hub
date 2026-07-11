import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import MultiSelect, { type MultiSelectProps } from './MultiSelect';

const meta = {
  title: 'Controls/MultiSelect',
  component: MultiSelect,
  args: {
    label: 'Delivery Methods',
    options: [
      { label: 'E-mail', value: 'email' },
      { label: 'SMS', value: 'sms' },
      { label: 'In-App', value: 'inapp' },
    ],
  },
} satisfies Meta<typeof MultiSelect>;

export default meta;
type Story = StoryObj<typeof meta>;

function StatefulMultiSelect(props: MultiSelectProps) {
  const [selected, setSelected] = useState(props.selectedOptions ?? []);
  return <MultiSelect {...props} selectedOptions={selected} onSelectionChanged={setSelected} />;
}

export const Basic: Story = {
  render: args => <StatefulMultiSelect {...args} />,
};

export const Preselected: Story = {
  args: { selectedOptions: ['email', 'sms'] },
  render: args => <StatefulMultiSelect {...args} />,
};
