import type { Meta, StoryObj } from '@storybook/react-vite';
import type { IOrganization, ITemplate, ITemplateDocument } from '@verdocs/js-sdk';
import { showToast } from '../../utils/toast';
import TemplateCard from './TemplateCard';

const SampleOrganization = {
  id: '2f1b6a52-8c5a-4d3e-9d6d-6f5a4b3c2d1e',
  name: 'Acme Document Co',
} as IOrganization;

const SampleDocument = {
  id: 'd-1',
  name: 'onboarding-packet.pdf',
  pages: 3,
} as ITemplateDocument;

const SampleTemplate = {
  id: 't-1',
  name: 'Onboarding Packet',
  counter: 12,
  star_counter: 4,
  organization: SampleOrganization,
  documents: [SampleDocument],
} as ITemplate;

const meta = {
  title: 'Templates/Template Card',
  component: TemplateCard,
  args: {
    template: SampleTemplate,
    onClick: template => showToast(`Clicked: ${template.name}`, { style: 'info' }),
  },
} satisfies Meta<typeof TemplateCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Basic: Story = {};

export const PublicTemplate: Story = {
  args: {
    template: { ...SampleTemplate, organization: undefined },
  },
};

export const NeverUsed: Story = {
  args: {
    template: { ...SampleTemplate, counter: 0, star_counter: 0, documents: undefined },
  },
};
