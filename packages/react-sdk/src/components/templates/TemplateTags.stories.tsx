import type { Meta, StoryObj } from '@storybook/react-vite';
import TemplateTags from './TemplateTags';

const meta = {
  title: 'Templates/Template Tags',
  component: TemplateTags,
  args: {
    tags: ['onboarding', 'human-resources', 'signed-2026'],
  },
} satisfies Meta<typeof TemplateTags>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Basic: Story = {};

export const SingleTag: Story = {
  args: {
    tags: ['legal'],
  },
};

export const Empty: Story = {
  args: {
    tags: [],
  },
};
