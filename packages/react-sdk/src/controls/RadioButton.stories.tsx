import type { Meta, StoryObj } from '@storybook/react-vite';
import RadioButton from './RadioButton';

const meta = {
  title: 'Controls/Radio Button',
  component: RadioButton,
  args: {
    label: 'Choice A',
    disabled: false,
  },
} satisfies Meta<typeof RadioButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Unselected: Story = {};

export const Selected: Story = {
  args: { defaultChecked: true },
};

export const Disabled: Story = {
  args: { disabled: true },
};

export const DisabledSelected: Story = {
  args: { disabled: true, defaultChecked: true },
};

export const Group: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <RadioButton name="mode" value="type" label="Typed with a keyboard" defaultChecked />
      <RadioButton name="mode" value="draw" label="Drawn with touch, mouse, or stylus" />
      <RadioButton name="mode" value="upload" label="Uploaded image" />
    </div>
  ),
};
