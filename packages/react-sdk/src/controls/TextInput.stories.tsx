import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import TextInput from './TextInput';

const meta = {
  title: 'Controls/TextInput',
  component: TextInput,
} satisfies Meta<typeof TextInput>;

export default meta;
type Story = StoryObj<typeof meta>;

function StatefulInput(props: React.ComponentProps<typeof TextInput>) {
  const [value, setValue] = useState(String(props.value ?? ''));
  return <TextInput {...props} value={value} onChange={e => setValue(e.target.value)} onClear={() => setValue('')} />;
}

export const Basic: Story = {
  render: () => <StatefulInput label="Name" placeholder="Enter your name..." />,
};

export const Required: Story = {
  render: () => <StatefulInput label="Email Address" type="email" required description="We will never share your email." />,
};

export const Password: Story = {
  render: () => <StatefulInput label="Password" type="password" value="hunter22!" />,
};

export const Clearable: Story = {
  render: () => <StatefulInput label="Filter" clearable value="some text" />,
};

export const Copyable: Story = {
  render: () => <StatefulInput label="API Key" copyable value="vd-1234-abcd" />,
};

export const Disabled: Story = {
  render: () => <TextInput label="Locked" value="read only" disabled onChange={() => undefined} />,
};
