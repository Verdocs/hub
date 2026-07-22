import { useState } from 'react';
import { Button, TextInput } from '@verdocs/react-sdk';

export interface AdoptSignatureModalProps {
  /** Name to prefill, typically the value the signer already typed. */
  initialName: string;
  /** Called with the confirmed name when the signer adopts. */
  onAdopt: (name: string) => void;
  /** Called when the signer cancels. */
  onClose: () => void;
}

/**
 * A canvas-free stand-in for the adopt-signature step: the typed name renders
 * in a script face above a baseline, which is enough to sell the moment in a
 * demo without a drawing surface.
 */
export default function AdoptSignatureModal({ initialName, onAdopt, onClose }: AdoptSignatureModalProps) {
  const [name, setName] = useState(initialName);

  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div
        className="dialog-panel adopt-panel"
        role="dialog"
        aria-modal="true"
        aria-label="Adopt your signature"
        onClick={event => event.stopPropagation()}>
        <div className="dialog-header">
          <h2>
            Adopt your signature
          </h2>
          <button type="button" className="dialog-close" aria-label="Close" onClick={onClose}>
            <svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true">
              <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" />
            </svg>
          </button>
        </div>

        <TextInput label="Full name" value={name} onChange={event => setName(event.target.value)} />

        <div className="sig-preview">
          <span className={name.trim() ? 'sig-preview-script' : 'sig-preview-empty'}>
            {name.trim() || 'Your signature'}
          </span>
          <span className="sig-preview-line" aria-hidden="true" />
        </div>

        <p className="adopt-legal">
          By selecting Adopt and sign, I agree that this signature will be the electronic
          representation of my signature for all purposes on this document, just the same
          as a pen-and-paper signature.
        </p>

        <div className="dialog-footer">
          <Button label="Cancel" variant="outline" size="small" onClick={onClose} />
          <Button label="Adopt and sign" size="small" disabled={!name.trim()} onClick={() => onAdopt(name.trim())} />
        </div>
      </div>
    </div>
  );
}
