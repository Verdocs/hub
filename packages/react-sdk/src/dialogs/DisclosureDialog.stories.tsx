import { useState, type ReactNode } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import DisclosureDialog from './DisclosureDialog';
import Button from '../controls/Button';

const meta = {
  title: 'Dialogs/Disclosure Dialog',
  component: DisclosureDialog,
  parameters: {
    docs: {
      description: {
        component:
          'The e-signature consent gate shown before signing. Proceed unlocks once the acceptance box is checked; the caller handles the outcome via onAgree, onDecline, onDelegate, and onCancel.',
      },
    },
  },
} satisfies Meta<typeof DisclosureDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

function DisclosureLauncher({ delegator = false, disclosures }: { delegator?: boolean; disclosures?: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [outcome, setOutcome] = useState('');

  const handleChoice = (choice: string) => {
    setOutcome(choice);
    setOpen(false);
  };

  return (
    <>
      <Button label="Review Disclosures" onClick={() => setOpen(true)} />
      {outcome && <p>Last outcome: {outcome}</p>}
      {open && (
        <DisclosureDialog
          delegator={delegator}
          disclosures={disclosures}
          onAgree={() => handleChoice('agreed')}
          onDecline={() => handleChoice('declined')}
          onDelegate={() => handleChoice('delegated')}
          onCancel={() => handleChoice('cancelled')}
        />
      )}
    </>
  );
}

export const Basic: Story = {
  render: () => <DisclosureLauncher />,
};

export const WithDelegation: Story = {
  render: () => <DisclosureLauncher delegator />,
};

export const CustomDisclosures: Story = {
  render: () => (
    <DisclosureLauncher
      disclosures={
        <div className="vdocs:mb-4 vdocs:text-sm vdocs:leading-5">
          <p className="vdocs:mt-0">
            Acme Insurance requires your consent to conduct business electronically. By proceeding you agree to receive policy documents, notices, and
            signature requests at the email address on file.
          </p>
          <p className="vdocs:mb-0">You may withdraw this consent at any time by contacting your agent.</p>
        </div>
      }
    />
  ),
};
