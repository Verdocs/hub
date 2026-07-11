import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import QuestionDialog from './QuestionDialog';
import Button from '../controls/Button';

const meta = {
  title: 'Dialogs/Question Dialog',
  component: QuestionDialog,
  parameters: {
    docs: {
      description: {
        component: 'Prompts a signer to type a question for the envelope sender. Render it conditionally; the caller delivers the question via onSubmit.',
      },
    },
  },
} satisfies Meta<typeof QuestionDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

function QuestionDialogLauncher({ question }: { question?: string }) {
  const [open, setOpen] = useState(false);
  const [submitted, setSubmitted] = useState('');

  return (
    <>
      <Button label="Ask a Question" onClick={() => setOpen(true)} />
      {submitted && (
        <p>
          {`Submitted: ${submitted}`}
        </p>
      )}
      {open && (
        <QuestionDialog
          question={question}
          onSubmit={(value) => {
            setSubmitted(value);
            setOpen(false);
          }}
          onCancel={() => setOpen(false)}
        />
      )}
    </>
  );
}

export const Basic: Story = {
  render: () => <QuestionDialogLauncher />,
};

export const Prefilled: Story = {
  render: () => <QuestionDialogLauncher question="Should I use my legal name or my preferred name?" />,
};
