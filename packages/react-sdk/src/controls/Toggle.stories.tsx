import type { Meta, StoryObj } from '@storybook/react-vite';
import { EnvelopeIcon, GlobeAltIcon, StarOutlineIcon } from './icons';
import Toggle from './Toggle';

const buttons = [
  { id: 'envelopes', label: 'Envelopes', icon: <EnvelopeIcon /> },
  { id: 'starred', label: 'Starred', icon: <StarOutlineIcon /> },
  { id: 'public', label: 'Public', icon: <GlobeAltIcon /> },
];

const meta = {
  title: 'Controls/Toggle',
  component: Toggle,
  args: {
    label: 'View',
    buttons,
  },
} satisfies Meta<typeof Toggle>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Basic: Story = {};

export const SecondSelected: Story = {
  args: { defaultSelection: 1 },
};

export const WithoutLabel: Story = {
  args: { label: undefined },
};
