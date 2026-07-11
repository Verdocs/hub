import type { Meta, StoryObj } from '@storybook/react-vite';
import ProgressBar from './ProgressBar';

const meta = {
  title: 'Controls/Progress Bar',
  component: ProgressBar,
  args: {
    label: '',
    showPercent: false,
    percent: 50,
  },
} satisfies Meta<typeof ProgressBar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Basic: Story = {};

export const WithLabel: Story = {
  args: { label: 'Uploading...' },
};

export const WithPercent: Story = {
  args: { label: 'Uploading...', showPercent: true, percent: 54 },
};

export const Complete: Story = {
  args: { label: 'Done', showPercent: true, percent: 100 },
};
