import { useState } from 'react';
import { VerdocsEndpoint } from '@verdocs/js-sdk';
import { QueryClient } from '@tanstack/react-query';
import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ITemplate, ITemplateField } from '@verdocs/js-sdk';
import TemplateFieldProperties from './TemplateFieldProperties';
import VerdocsProvider from '../../provider/VerdocsProvider';
import { TEST_API_BASE } from '../../test/setup';
import { showToast } from '../../utils/toast';

const sampleField = (overrides: Partial<ITemplateField> = {}): ITemplateField => ({
  name: 'textboxP1-1',
  role_name: 'Recipient 1',
  template_id: 'sample-template',
  document_id: 'doc-1',
  type: 'textbox',
  required: true,
  readonly: false,
  settings: null,
  page: 1,
  validator: null,
  label: 'Legal name',
  x: 100,
  y: 200,
  width: 150,
  height: 15,
  default: null,
  placeholder: 'Full name',
  multiline: false,
  group: null,
  options: null,
  ...overrides,
});

const sampleTemplate = (field: ITemplateField): ITemplate =>
  ({
    id: 'sample-template',
    name: 'Purchase Agreement',
    roles: [{ name: 'Recipient 1' }, { name: 'Recipient 2' }],
    fields: [field],
  }) as ITemplate;

// The panel reads its field from the template detail cache, so the story
// primes that cache with an inline sample instead of hitting the API. Saves
// and deletes still fire real requests, which fail against the sample IDs;
// the point here is the form itself, and the callbacks log via toasts.
function SampleData({ field, children }: { field: ITemplateField; children: React.ReactNode }) {
  const [endpoint] = useState(() => new VerdocsEndpoint({ baseURL: TEST_API_BASE, persist: false }));
  const [queryClient] = useState(() => {
    const client = new QueryClient({ defaultOptions: { queries: { staleTime: Infinity, retry: false } } });
    client.setQueryData(['templates', 'sample-template'], sampleTemplate(field));
    return client;
  });

  return (
    <VerdocsProvider endpoint={endpoint} queryClient={queryClient}>
      {children}
    </VerdocsProvider>
  );
}

const loggedCallbacks = {
  onClose: () => showToast('onClose', { style: 'info' }),
  onDelete: ({ fieldName }: { fieldName: string }) => showToast(`onDelete: ${fieldName}`, { style: 'info' }),
  onSettingsChanged: ({ fieldName }: { fieldName: string }) => showToast(`onSettingsChanged: ${fieldName}`, { style: 'info' }),
  onSdkError: (error: Error) => showToast(`onSdkError: ${error.message}`, { style: 'error' }),
};

const meta = {
  title: 'Templates/Field Properties',
  component: TemplateFieldProperties,
  args: {
    templateId: 'sample-template',
    fieldName: 'textboxP1-1',
    ...loggedCallbacks,
  },
} satisfies Meta<typeof TemplateFieldProperties>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Textbox: Story = {
  render: args => (
    <SampleData field={sampleField()}>
      <TemplateFieldProperties {...args} />
    </SampleData>
  ),
};

export const Dropdown: Story = {
  render: args => (
    <SampleData
      field={sampleField({
        name: 'dropdownP1-1',
        type: 'dropdown',
        label: null,
        placeholder: null,
        options: [
          { id: 'yes', label: 'Yes' },
          { id: 'no', label: 'No' },
        ],
      })}>
      <TemplateFieldProperties {...args} fieldName="dropdownP1-1" />
    </SampleData>
  ),
};

export const Radio: Story = {
  render: args => (
    <SampleData field={sampleField({ name: 'radioP1-1', type: 'radio', group: 'color', label: null, placeholder: null })}>
      <TemplateFieldProperties {...args} fieldName="radioP1-1" />
    </SampleData>
  ),
};

export const WithHelp: Story = {
  render: args => (
    <SampleData field={sampleField()}>
      <TemplateFieldProperties
        {...args}
        helpText="Text boxes collect a single line of text. Mark the field required to block submission until it is filled in."
      />
    </SampleData>
  ),
};
