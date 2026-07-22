import { useState } from 'react';
import Button from '../controls/Button';
import Dialog from './Dialog';

export interface QuestionDialogProps {
  /** Initial content for the question box, e.g. a draft the user previously typed. */
  question?: string;
  /** Fired with the entered text when the user clicks OK. The caller delivers the question to the sender. */
  onSubmit?: (question: string) => void;
  /** Fired when the user clicks Cancel, the close button, or the background overlay. */
  onCancel?: () => void;
}

/**
 * Prompts a signer to type a question for the envelope's sender. Purely presentational:
 * the caller renders it conditionally, unmounts it in onSubmit/onCancel, and wires
 * onSubmit to whatever actually delivers the question.
 */
export default function QuestionDialog({ question: initialQuestion = '', onSubmit, onCancel }: QuestionDialogProps) {
  const [question, setQuestion] = useState(initialQuestion);

  // The legacy heading also rendered a chat-bubble icon, but the base dialog styles hid it
  // (the design moved to a plain title plus close button), so we don't port it.
  return (
    <Dialog
      heading="Ask the Sender a Question"
      onClose={onCancel}
      footer={(
        <div className="vdocs:flex vdocs:flex-row vdocs:gap-5">
          <Button label="Cancel" variant="outline" className="vdocs:flex-1" onClick={() => onCancel?.()} />
          <Button label="OK" className="vdocs:flex-1" onClick={() => onSubmit?.(question)} />
        </div>
      )}>
      <textarea
        rows={6}
        aria-label="Question"
        placeholder="Enter your question..."
        value={question}
        onChange={e => setQuestion(e.target.value)}
        className="vdocs:w-full vdocs:box-border vdocs:resize-y vdocs:font-sans vdocs:text-sm vdocs:text-ink vdocs:bg-surface vdocs:p-2.5 vdocs:border vdocs:border-solid vdocs:border-edge vdocs:rounded-ctl vdocs:outline-none vdocs:focus:border-accent"
      />
    </Dialog>
  );
}
