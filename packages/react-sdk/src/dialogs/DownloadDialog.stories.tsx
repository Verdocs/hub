import { useState } from 'react';
import type { IEnvelopeDocument } from '@verdocs/js-sdk';
import type { Meta, StoryObj } from '@storybook/react-vite';
import DownloadDialog, { type TDownloadVariant } from './DownloadDialog';
import Button from '../controls/Button';

const sampleDocument = (overrides: Partial<IEnvelopeDocument> = {}): IEnvelopeDocument => ({
  id: 'a2ce2f1c-3f9d-4a91-b7c2-b3a1de23a6d1',
  envelope_id: '83da3d70-7857-4392-b876-c4592a304bc9',
  template_document_id: null,
  order: 1,
  type: 'attachment',
  name: 'Purchase Agreement.pdf',
  pages: 4,
  mime: 'application/pdf',
  size: 182044,
  signed: true,
  page_sizes: [{ width: 612, height: 792 }],
  created_at: '2026-07-01T17:24:05.000Z',
  updated_at: '2026-07-01T17:31:12.000Z',
  ...overrides,
});

const contract = sampleDocument();
const addendum = sampleDocument({ id: 'b7f1a044-51f5-4f5e-8f52-9a41f9f2b902', order: 2, name: 'Addendum.pdf', pages: 1, size: 48210 });
const exhibit = sampleDocument({ id: 'c91d2be6-0d9e-4a04-9a3d-2b7f7c1f3a55', order: 3, name: 'Exhibit A.pdf', pages: 2, size: 90562 });
const certificate = sampleDocument({ id: 'd44e8c72-6a1b-4b6e-b1de-5f0a2f9f61c8', order: 4, type: 'certificate', name: 'Certificate.pdf', pages: 1, size: 33017 });

const meta = {
  title: 'Dialogs/Download Dialog',
  component: DownloadDialog,
  parameters: {
    docs: {
      description: {
        component:
          'Download choices for an envelope. Presentational: the caller supplies the documents and resolves the actual file when onDownload fires with the chosen document and variant.',
      },
    },
  },
} satisfies Meta<typeof DownloadDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

interface LauncherProps {
  documents: IEnvelopeDocument[];
  signed?: boolean;
  polling?: boolean;
  hasCertificate?: boolean;
}

function DownloadLauncher({ documents, signed = false, polling = false, hasCertificate = false }: LauncherProps) {
  const [open, setOpen] = useState(false);
  const [lastPick, setLastPick] = useState('');

  const handleDownload = (document: IEnvelopeDocument | undefined, variant: TDownloadVariant) => {
    setLastPick(`${variant}${document ? `: ${document.name}` : ''}`);
  };

  return (
    <>
      <Button label="Download Documents" onClick={() => setOpen(true)} />
      {lastPick && <p>Last pick: {lastPick}</p>}
      {open && (
        <DownloadDialog
          documents={documents}
          signed={signed}
          polling={polling}
          hasCertificate={hasCertificate}
          onDownload={handleDownload}
          onCancel={() => setOpen(false)}
        />
      )}
    </>
  );
}

export const ReadyToDownload: Story = {
  render: () => <DownloadLauncher documents={[contract, addendum, certificate]} signed />,
};

export const AwaitingSignatures: Story = {
  render: () => <DownloadLauncher documents={[contract, addendum]} />,
};

export const GeneratingFiles: Story = {
  render: () => <DownloadLauncher documents={[contract]} signed hasCertificate polling />,
};

export const ManyDocuments: Story = {
  render: () => <DownloadLauncher documents={[contract, addendum, exhibit, certificate]} signed />,
};
