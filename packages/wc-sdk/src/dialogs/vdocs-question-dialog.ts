import { html } from 'lit';
import { live } from 'lit/directives/live.js';
import type { IDialogSubmitDetail } from './dialog-events.js';
import { VdocsElement } from '../base/vdocs-element.js';
import { register } from '../base/register.js';
import '../controls/vdocs-button.js';
import './vdocs-dialog.js';

/**
 * Prompts a signer to type a question for the envelope's sender. Purely
 * presentational: the host mounts it conditionally, removes it on
 * vdocs-submit/vdocs-cancel, and delivers the question to the sender itself.
 *
 * React prop mapping: question is the same-named property; the element tracks
 * edits in it as the user types (setting it programmatically fires nothing).
 *
 * @fires vdocs-submit - Fired with the entered text in detail.value when the user clicks OK (React's onSubmit).
 * @fires vdocs-cancel - Fired when the user clicks Cancel, the close button, or the background overlay (React's onCancel).
 */
export class VdocsQuestionDialog extends VdocsElement {
  static override properties = {
    question: { type: String },
  };

  /** Initial content for the question box, e.g. a draft the user previously typed. Tracks edits as the user types. */
  declare question: string;

  constructor() {
    super();
    this.question = '';
  }

  // Footer templates run with the base dialog as their event host, so these
  // handlers are arrow properties; see vdocs-dialog.
  private handleClose = (e: Event) => {
    e.stopPropagation();
    this.emit('vdocs-cancel');
  };

  private handleCancel = () => {
    this.emit('vdocs-cancel');
  };

  private handleSubmit = () => {
    this.emit<IDialogSubmitDetail>('vdocs-submit', { value: this.question });
  };

  private handleInput = (e: Event) => {
    this.question = (e.target as HTMLTextAreaElement).value;
  };

  override render() {
    // The legacy heading also rendered a chat-bubble icon, but the base dialog
    // styles hid it (the design moved to a plain title plus close button), so
    // we don't port it. The footer buttons stretch: flex-1 sizes the host and
    // the arbitrary variant reaches the control's inner native button.
    const footer = html`
      <div class="vdocs:flex vdocs:flex-row vdocs:gap-5">
        <vdocs-button label="Cancel" variant="outline" class="vdocs:flex-1 vdocs:[&>button]:w-full" @click=${this.handleCancel}></vdocs-button>
        <vdocs-button label="OK" class="vdocs:flex-1 vdocs:[&>button]:w-full" @click=${this.handleSubmit}></vdocs-button>
      </div>`;

    return html`
      <vdocs-dialog heading="Ask the Sender a Question" .footer=${footer} @vdocs-close=${this.handleClose}>
        <textarea
          rows="6"
          aria-label="Question"
          placeholder="Enter your question..."
          .value=${live(this.question)}
          @input=${this.handleInput}
          class="vdocs:w-full vdocs:box-border vdocs:resize-y vdocs:font-sans vdocs:text-sm vdocs:text-ink vdocs:bg-surface vdocs:p-2.5 vdocs:border vdocs:border-solid vdocs:border-edge vdocs:rounded-ctl vdocs:outline-none vdocs:focus:border-accent"></textarea>
      </vdocs-dialog>`;
  }
}

register('vdocs-question-dialog', VdocsQuestionDialog);

declare global {
  interface HTMLElementTagNameMap {
    'vdocs-question-dialog': VdocsQuestionDialog;
  }
}
