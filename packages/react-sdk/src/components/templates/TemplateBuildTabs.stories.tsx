import { useState } from 'react';
import type { ITemplate } from '@verdocs/js-sdk';
import type { Meta, StoryObj } from '@storybook/react-vite';
import type { TemplateBuildTabsProps, TVerdocsBuildStep } from './TemplateBuildTabs';
import TemplateBuildTabs from './TemplateBuildTabs';

const sampleTemplate = (overrides: Partial<ITemplate> = {}): ITemplate =>
  ({
    id: 'sample-template',
    name: 'Purchase Agreement',
    documents: [{ id: 'doc-1' }],
    roles: [{ name: 'Recipient 1' }],
    fields: [{ name: 'textboxP1-1' }],
    ...overrides,
  }) as ITemplate;

const meta = {
  title: 'Templates/Build Tabs',
  component: TemplateBuildTabs,
  args: {
    selectedStep: 'attachments',
    template: sampleTemplate(),
  },
} satisfies Meta<typeof TemplateBuildTabs>;

export default meta;
type Story = StoryObj<typeof meta>;

function StatefulBuildTabs(args: TemplateBuildTabsProps) {
  const [step, setStep] = useState<TVerdocsBuildStep>(args.selectedStep);

  return <TemplateBuildTabs {...args} selectedStep={step} onSelectStep={setStep} />;
}

export const AllStepsEnabled: Story = {
  render: args => <StatefulBuildTabs {...args} />,
};

export const FieldsSelected: Story = {
  args: { selectedStep: 'fields' },
};

export const NewTemplate: Story = {
  args: { selectedStep: 'attachments', template: null },
};

export const DocumentsOnly: Story = {
  args: {
    selectedStep: 'roles',
    template: sampleTemplate({ roles: [], fields: [] }),
  },
};
