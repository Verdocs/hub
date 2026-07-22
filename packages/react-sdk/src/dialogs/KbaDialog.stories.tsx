import { useState } from 'react';
import type { IKBAQuestion } from '@verdocs/js-sdk';
import type { Meta, StoryObj } from '@storybook/react-vite';
import Button from '../controls/Button';
import KbaDialog from './KbaDialog';

const meta = {
  title: 'Dialogs/KBA Dialog',
  component: KbaDialog,
  parameters: {
    docs: {
      description: {
        component:
          'The knowledge-based authentication challenge dialog. Identity mode collects the signer details the KBA identity endpoint needs; questions mode steps through the multiple-choice challenge questions the provider returned.',
      },
    },
  },
} satisfies Meta<typeof KbaDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

function IdentityLauncher() {
  const [open, setOpen] = useState(false);
  const [submitted, setSubmitted] = useState('');

  return (
    <>
      <Button label="Open KBA Identity Dialog" onClick={() => setOpen(true)} />
      {open && (
        <KbaDialog
          mode="identity"
          initialDetails={{ first_name: 'Paige', last_name: 'Turner' }}
          onSubmitIdentity={(details) => {
            setSubmitted(`${details.first_name} ${details.last_name}, ${details.address}, ${details.zip}`);
            setOpen(false);
          }}
          onCancel={() => setOpen(false)}
        />
      )}
      {submitted && (
        <p>
          {`Submitted: ${submitted}`}
        </p>
      )}
    </>
  );
}

const SAMPLE_QUESTIONS: IKBAQuestion[] = [
  {
    type: 'current.county.b',
    prompt: 'Please select the county you have most recently lived in.',
    answer: ['Marion', 'Baldwin', 'Dekalb', 'Jefferson', 'None of the above'],
  },
  {
    type: 'previous.address.b',
    prompt: 'Please select the address below that you have most recently lived at.',
    answer: ['553 Arbor Dr', '18 Lacey Ln', '23A Ball Ct', '2375 Cavallo Blvd', '23-1 RR-7', '151 Boulder Rd'],
  },
];

function QuestionsLauncher() {
  const [open, setOpen] = useState(false);
  const [answers, setAnswers] = useState<string[]>([]);

  const handleOpen = () => {
    setAnswers([]);
    setOpen(true);
  };

  const handleAnswer = (questionType: string, choice: string) => {
    const next = [...answers, `${questionType}: ${choice}`];
    setAnswers(next);
    if (next.length >= SAMPLE_QUESTIONS.length) {
      setOpen(false);
    }
  };

  return (
    <>
      <Button label="Open KBA Questions Dialog" onClick={handleOpen} />
      {open && (
        <KbaDialog
          mode="questions"
          helpTitle="Your identity requires additional verification"
          questions={SAMPLE_QUESTIONS}
          onAnswerQuestion={handleAnswer}
          onCancel={() => setOpen(false)}
        />
      )}
      {!open && answers.map(answer => (
        <p key={answer}>
          {answer}
        </p>
      ))}
    </>
  );
}

export const IdentityMode: Story = {
  args: { mode: 'identity' },
  render: () => <IdentityLauncher />,
};

export const QuestionsMode: Story = {
  args: { mode: 'questions' },
  render: () => <QuestionsLauncher />,
};
