import { html } from 'lit';
import { page, userEvent } from 'vitest/browser';
import type { IEnvelopeDocument, IEnvelopeField, IKBAQuestion } from '@verdocs/js-sdk';
import type { IAdoptedSignature, IDelegateDetails, IDialogSubmitDetail, IDownloadSelection, IKbaAnswer, IKbaIdentityDetails } from './dialog-events.js';
import { mount } from '../test/helpers.js';
import './vdocs-adopt-signature-dialog.js';
import './vdocs-disclosure-dialog.js';
import './vdocs-signature-dialog.js';
import './vdocs-signing-progress.js';
import './vdocs-delegate-dialog.js';
import './vdocs-download-dialog.js';
import './vdocs-passcode-dialog.js';
import './vdocs-question-dialog.js';
import './vdocs-initial-dialog.js';
import './vdocs-upload-dialog.js';
import './vdocs-kba-dialog.js';
import './vdocs-otp-dialog.js';
import './vdocs-ok-dialog.js';
import './vdocs-dialog.js';

// Dialog compositions render in waves (the dialog element, then the base
// dialog's body panel), all scheduled as microtasks; one rAF tick lands after
// every wave has flushed.
const settle = () => new Promise<void>(resolve => requestAnimationFrame(() => resolve()));

/** The base dialog's panel, appended to document.body. */
const panel = () => document.body.querySelector<HTMLElement>('.vdocs-dialog')!;

/** The base dialog's overlay, appended to document.body. */
const overlay = () => document.body.querySelector<HTMLElement>('.vdocs-dialog-overlay')!;

/** Set a native input's value the way a user edit would, firing the matching event. */
const setNativeValue = (input: HTMLInputElement | HTMLTextAreaElement, value: string) => {
  input.value = value;
  input.dispatchEvent(new Event('input', { bubbles: true }));
};

const button = (name: string | RegExp) => page.getByRole('button', { name }).element() as HTMLButtonElement;

const sampleField = (overrides: Partial<IEnvelopeField> = {}): IEnvelopeField => ({
  envelope_id: '83da3d70-7857-4392-b876-c4592a304bc9',
  document_id: '626af9d6-f9d5-4ad9-94c7-13e57d515d43',
  name: 'Buyer-field-1',
  role_name: 'Recipient 1',
  type: 'textbox',
  required: true,
  readonly: false,
  settings: null,
  validator: null,
  label: null,
  prepared: false,
  page: 1,
  x: 120,
  y: 340,
  width: 150,
  height: 15,
  default: null,
  placeholder: null,
  multiline: false,
  group: null,
  options: null,
  value: null,
  is_valid: true,
  ...overrides,
});

const sampleDocument = (overrides: Partial<IEnvelopeDocument> = {}): IEnvelopeDocument => ({
  id: 'doc-1',
  envelope_id: '83da3d70-7857-4392-b876-c4592a304bc9',
  template_document_id: null,
  order: 1,
  type: 'attachment',
  name: 'NDA.pdf',
  pages: 2,
  mime: 'application/pdf',
  size: 12345,
  signed: false,
  page_sizes: [ { width: 612, height: 792 } ],
  created_at: '2026-07-01T00:00:00.000Z',
  updated_at: '2026-07-01T00:00:00.000Z',
  ...overrides,
});

afterEach(() => {
  document.body.replaceChildren();
});

describe('vdocs-dialog', () => {
  it('renders the heading, body children, and footer in a panel appended to document.body', async () => {
    const el = document.createElement('vdocs-dialog');
    el.heading = 'Confirm';
    el.footer = html`<button type="button">Do it</button>`;
    const body = document.createElement('div');
    body.textContent = 'Body content';
    el.appendChild(body);
    await mount(el);
    await settle();

    expect(panel().getAttribute('role')).toBe('dialog');
    expect(panel().getAttribute('aria-modal')).toBe('true');
    expect(overlay().parentElement).toBe(document.body);
    expect(panel().textContent).toContain('Confirm');
    expect(panel().textContent).toContain('Body content');
    expect(panel().textContent).toContain('Do it');
    // The children were consumed into the panel, not left at the mount point.
    expect(el.contains(body)).toBe(false);
    expect(panel().contains(body)).toBe(true);
  });

  it('omits the header row and footer container when heading and footer are not set', async () => {
    const el = document.createElement('vdocs-dialog');
    el.append('Body content');
    await mount(el);
    await settle();

    expect(panel().querySelector('button[aria-label="Close"]')).not.toBeNull();
    expect(panel().querySelector('[class*="border-b"]')).toBeNull();
    expect(panel().querySelector('[class*="pb-6"]')).toBeNull();
  });

  it('dismisses on a direct overlay click but not on panel clicks', async () => {
    const closed = vi.fn();
    const el = document.createElement('vdocs-dialog');
    el.heading = 'Confirm';
    el.addEventListener('vdocs-close', closed);
    await mount(el);
    await settle();

    panel().click();
    expect(closed).not.toHaveBeenCalled();

    overlay().click();
    expect(closed).toHaveBeenCalledOnce();
  });

  it('blocks overlay dismissal when persistent, while the close button still works', async () => {
    const closed = vi.fn();
    const el = document.createElement('vdocs-dialog');
    el.persistent = true;
    el.addEventListener('vdocs-close', closed);
    await mount(el);
    await settle();

    overlay().click();
    expect(closed).not.toHaveBeenCalled();

    await page.getByRole('button', { name: 'Close' }).click();
    expect(closed).toHaveBeenCalledOnce();
  });

  it('removes the overlay and restores its children on disconnect', async () => {
    const el = document.createElement('vdocs-dialog');
    const body = document.createElement('div');
    body.textContent = 'Body content';
    el.appendChild(body);
    await mount(el);
    await settle();

    expect(document.body.querySelector('.vdocs-dialog-overlay')).not.toBeNull();

    el.remove();
    expect(document.body.querySelector('.vdocs-dialog-overlay')).toBeNull();
    expect(el.contains(body)).toBe(true);
  });
});

describe('vdocs-ok-dialog', () => {
  it('renders the message and fires vdocs-ok from the (relabeled) OK button', async () => {
    const ok = vi.fn();
    const el = document.createElement('vdocs-ok-dialog');
    el.heading = 'Heads up';
    el.message = 'Something happened.';
    el.setAttribute('button-label', 'Continue');
    el.addEventListener('vdocs-ok', ok);
    await mount(el);
    await settle();

    expect(panel().textContent).toContain('Heads up');
    expect(panel().textContent).toContain('Something happened.');
    expect(page.getByRole('button', { name: 'Cancel' }).query()).toBeNull();

    await page.getByRole('button', { name: 'Continue' }).click();
    expect(ok).toHaveBeenCalledOnce();
  });

  it('shows Cancel only when requested and fires vdocs-cancel from it', async () => {
    const cancelled = vi.fn();
    const el = document.createElement('vdocs-ok-dialog');
    el.setAttribute('show-cancel', '');
    el.addEventListener('vdocs-cancel', cancelled);
    await mount(el);
    await settle();

    await page.getByRole('button', { name: 'Cancel' }).click();
    expect(cancelled).toHaveBeenCalledOnce();
  });

  it('maps the close button to vdocs-cancel and keeps the base vdocs-close internal', async () => {
    const cancelled = vi.fn();
    const leaked = vi.fn();
    const el = document.createElement('vdocs-ok-dialog');
    el.addEventListener('vdocs-cancel', cancelled);
    el.addEventListener('vdocs-close', leaked);
    await mount(el);
    await settle();

    await page.getByRole('button', { name: 'Close' }).click();
    expect(cancelled).toHaveBeenCalledOnce();
    expect(leaked).not.toHaveBeenCalled();
  });
});

describe('vdocs-question-dialog', () => {
  it('seeds the box from question and submits the edited text', async () => {
    const submits: Array<IDialogSubmitDetail | undefined> = [];
    const el = document.createElement('vdocs-question-dialog');
    el.setAttribute('question', 'Draft');
    el.addEventListener('vdocs-submit', e => submits.push(e.detail));
    await mount(el);
    await settle();

    const textarea = panel().querySelector('textarea')!;
    expect(textarea.value).toBe('Draft');

    setNativeValue(textarea, 'Why is section 2 blank?');
    await settle();

    await page.getByRole('button', { name: 'OK' }).click();
    expect(submits).toEqual([ { value: 'Why is section 2 blank?' } ]);
  });

  it('cancels from the Cancel button', async () => {
    const cancelled = vi.fn();
    const el = document.createElement('vdocs-question-dialog');
    el.addEventListener('vdocs-cancel', cancelled);
    await mount(el);
    await settle();

    await page.getByRole('button', { name: 'Cancel' }).click();
    expect(cancelled).toHaveBeenCalledOnce();
  });
});

describe('vdocs-passcode-dialog', () => {
  it('disables Submit until a code is entered, then submits and clears it', async () => {
    const submits: Array<IDialogSubmitDetail | undefined> = [];
    const el = document.createElement('vdocs-passcode-dialog');
    el.addEventListener('vdocs-submit', e => submits.push(e.detail));
    await mount(el);
    await settle();

    expect(button('Submit').disabled).toBe(true);

    const input = panel().querySelector('input')!;
    setNativeValue(input, 'open sesame');
    await settle();
    expect(button('Submit').disabled).toBe(false);

    await page.getByRole('button', { name: 'Submit' }).click();
    await settle();
    expect(submits).toEqual([ { value: 'open sesame' } ]);
    expect(panel().querySelector('input')!.value).toBe('');
  });

  it('shows the error and ignores overlay clicks (persistent)', async () => {
    const cancelled = vi.fn();
    const el = document.createElement('vdocs-passcode-dialog');
    el.error = 'That passcode is not correct.';
    el.addEventListener('vdocs-cancel', cancelled);
    await mount(el);
    await settle();

    expect(panel().querySelector('[role="alert"]')!.textContent).toContain('That passcode is not correct.');

    overlay().click();
    expect(cancelled).not.toHaveBeenCalled();
  });

  it('cancels from the Cancel button', async () => {
    const cancelled = vi.fn();
    const el = document.createElement('vdocs-passcode-dialog');
    el.addEventListener('vdocs-cancel', cancelled);
    await mount(el);
    await settle();

    await page.getByRole('button', { name: 'Cancel' }).click();
    expect(cancelled).toHaveBeenCalledOnce();
  });
});

describe('vdocs-otp-dialog', () => {
  it('locks Resend for 30 seconds after opening and again after resending', async () => {
    vi.useFakeTimers({ toFake: [ 'setTimeout', 'clearTimeout' ] });
    try {
      const resent = vi.fn();
      const el = document.createElement('vdocs-otp-dialog');
      el.addEventListener('vdocs-resend', resent);
      await mount(el);
      await settle();

      expect(button('Resend').disabled).toBe(true);

      vi.advanceTimersByTime(30000);
      await settle();
      expect(button('Resend').disabled).toBe(false);

      await page.getByRole('button', { name: 'Resend' }).click();
      await settle();
      expect(resent).toHaveBeenCalledOnce();
      expect(button('Resend').disabled).toBe(true);
    } finally {
      vi.useRealTimers();
    }
  });

  it('submits the entered code and clears it for the next attempt', async () => {
    const submits: Array<IDialogSubmitDetail | undefined> = [];
    const el = document.createElement('vdocs-otp-dialog');
    el.addEventListener('vdocs-submit', e => submits.push(e.detail));
    await mount(el);
    await settle();

    setNativeValue(panel().querySelector('input')!, '123456');
    await settle();

    await page.getByRole('button', { name: 'Submit' }).click();
    await settle();
    expect(submits).toEqual([ { value: '123456' } ]);
    expect(panel().querySelector('input')!.value).toBe('');
  });

  it('renders the error and cancels from the Cancel button', async () => {
    const cancelled = vi.fn();
    const el = document.createElement('vdocs-otp-dialog');
    el.error = 'That code is not correct.';
    el.addEventListener('vdocs-cancel', cancelled);
    await mount(el);
    await settle();

    expect(panel().querySelector('[role="alert"]')!.textContent).toContain('That code is not correct.');

    await page.getByRole('button', { name: 'Cancel' }).click();
    expect(cancelled).toHaveBeenCalledOnce();
  });
});

describe('vdocs-upload-dialog', () => {
  it('enables Upload once files are selected and fires vdocs-upload with them, keeping the picker event internal', async () => {
    const uploads: Array<{ files: File[] }> = [];
    const leaked = vi.fn();
    document.addEventListener('vdocs-select-files', leaked);
    const el = document.createElement('vdocs-upload-dialog');
    el.addEventListener('vdocs-upload', e => uploads.push(e.detail));
    await mount(el);
    await settle();

    expect(button('Upload').disabled).toBe(true);

    const file = new File([ new Uint8Array(1000) ], 'contract.pdf', { type: 'application/pdf' });
    await userEvent.upload(panel().querySelector('input[type="file"]')!, file);
    await settle();
    expect(button('Upload').disabled).toBe(false);

    await page.getByRole('button', { name: 'Upload' }).click();
    expect(uploads.map(upload => upload.files.map(f => f.name))).toEqual([ [ 'contract.pdf' ] ]);
    expect(leaked).not.toHaveBeenCalled();
    document.removeEventListener('vdocs-select-files', leaked);
  });

  it('blocks uploads over max-size with a limit message derived from the actual limit', async () => {
    const el = document.createElement('vdocs-upload-dialog');
    el.setAttribute('max-size', '1024');
    await mount(el);
    await settle();

    const file = new File([ new Uint8Array(2000) ], 'too-big.pdf', { type: 'application/pdf' });
    await userEvent.upload(panel().querySelector('input[type="file"]')!, file);
    await settle();

    expect(panel().textContent).toContain('Total file size must not exceed 1KB.');
    expect(button('Upload').disabled).toBe(true);
  });

  it('cancels from the close button', async () => {
    const cancelled = vi.fn();
    const el = document.createElement('vdocs-upload-dialog');
    el.addEventListener('vdocs-cancel', cancelled);
    await mount(el);
    await settle();

    await page.getByRole('button', { name: 'Close' }).click();
    expect(cancelled).toHaveBeenCalledOnce();
  });
});

describe('vdocs-delegate-dialog', () => {
  it('requires first name, last name, and email before enabling Delegate, then fires the details', async () => {
    const delegations: Array<IDelegateDetails | undefined> = [];
    const el = document.createElement('vdocs-delegate-dialog');
    el.addEventListener('vdocs-delegate', e => delegations.push(e.detail));
    await mount(el);
    await settle();

    expect(button('Delegate').disabled).toBe(true);

    setNativeValue(panel().querySelector<HTMLInputElement>('input[placeholder="First name"]')!, 'Paige');
    setNativeValue(panel().querySelector<HTMLInputElement>('input[placeholder="Last name"]')!, 'Turner');
    await settle();
    expect(button('Delegate').disabled).toBe(true);

    setNativeValue(panel().querySelector<HTMLInputElement>('input[placeholder="New recipient email address"]')!, 'paige@example.com');
    setNativeValue(panel().querySelector<HTMLInputElement>('input[placeholder="Optional phone number"]')!, '555-1212');
    setNativeValue(panel().querySelector('textarea')!, 'Please sign in my place.');
    await settle();
    expect(button('Delegate').disabled).toBe(false);

    await page.getByRole('button', { name: 'Delegate' }).click();
    expect(delegations).toEqual([
      { first_name: 'Paige', last_name: 'Turner', email: 'paige@example.com', phone: '555-1212', message: 'Please sign in my place.' },
    ]);
  });

  it('cancels from the Cancel button', async () => {
    const cancelled = vi.fn();
    const el = document.createElement('vdocs-delegate-dialog');
    el.addEventListener('vdocs-cancel', cancelled);
    await mount(el);
    await settle();

    await page.getByRole('button', { name: 'Cancel' }).click();
    expect(cancelled).toHaveBeenCalledOnce();
  });
});

describe('vdocs-disclosure-dialog', () => {
  it('renders the default disclosures and gates Proceed behind the acceptance box', async () => {
    const agreed = vi.fn();
    const el = document.createElement('vdocs-disclosure-dialog');
    el.addEventListener('vdocs-agree', agreed);
    await mount(el);
    await settle();

    expect(panel().textContent).toContain('End User License Agreement');
    expect(button('Proceed').disabled).toBe(true);

    await page.getByRole('checkbox').click();
    await settle();
    expect(button('Proceed').disabled).toBe(false);

    await page.getByRole('button', { name: 'Proceed' }).click();
    expect(agreed).toHaveBeenCalledOnce();
  });

  it('fires vdocs-decline, and offers no Delegate button by default', async () => {
    const declined = vi.fn();
    const el = document.createElement('vdocs-disclosure-dialog');
    el.addEventListener('vdocs-decline', declined);
    await mount(el);
    await settle();

    expect(page.getByRole('button', { name: 'Delegate' }).query()).toBeNull();

    await page.getByRole('button', { name: 'Decline' }).click();
    expect(declined).toHaveBeenCalledOnce();
  });

  it('shows Delegate for delegators and fires vdocs-delegate', async () => {
    const delegated = vi.fn();
    const el = document.createElement('vdocs-disclosure-dialog');
    el.setAttribute('delegator', '');
    el.addEventListener('vdocs-delegate', delegated);
    await mount(el);
    await settle();

    await page.getByRole('button', { name: 'Delegate' }).click();
    expect(delegated).toHaveBeenCalledOnce();
  });
});

describe('vdocs-download-dialog', () => {
  it('lists attachments plus the envelope-level options, pending until signed', async () => {
    const el = document.createElement('vdocs-download-dialog');
    el.documents = [
      sampleDocument({ id: 'doc-1', name: 'NDA.pdf', order: 1 }),
      sampleDocument({ id: 'doc-2', name: 'Lease.pdf', order: 2 }),
    ];
    await mount(el);
    await settle();

    const options = Array.from(panel().querySelectorAll<HTMLButtonElement>('button')).filter(b => b.getAttribute('aria-label') !== 'Close');
    expect(options).toHaveLength(5);
    // The attachments stay clickable while unsigned, but show the busy
    // spinner; the certificate-dependent options are disabled outright.
    expect(options.filter(b => b.disabled)).toHaveLength(3);
    expect(panel().querySelector('[class*="animate-spin"]')).not.toBeNull();
  });

  it('fires vdocs-download with the source document and variant', async () => {
    const selections: IDownloadSelection[] = [];
    const el = document.createElement('vdocs-download-dialog');
    el.documents = [
      sampleDocument({ id: 'doc-1', name: 'NDA.pdf', signed: true }),
      sampleDocument({ id: 'cert-1', name: 'certificate.pdf', type: 'certificate', order: 2, signed: true }),
    ];
    el.signed = true;
    el.addEventListener('vdocs-download', e => selections.push(e.detail));
    await mount(el);
    await settle();

    await page.getByRole('button', { name: /^NDA\.pdf/ }).click();
    await page.getByRole('button', { name: /^All Files/ }).click();

    expect(selections).toHaveLength(2);
    expect(selections[0]?.document?.id).toBe('doc-1');
    expect(selections[0]?.variant).toBe('document');
    expect(selections[1]?.document).toBeUndefined();
    expect(selections[1]?.variant).toBe('zip');
  });

  it('shows the ZIP guidance instead of individual entries when more than two attachments', async () => {
    const el = document.createElement('vdocs-download-dialog');
    el.documents = [
      sampleDocument({ id: 'doc-1', name: 'One.pdf', order: 1 }),
      sampleDocument({ id: 'doc-2', name: 'Two.pdf', order: 2 }),
      sampleDocument({ id: 'doc-3', name: 'Three.pdf', order: 3 }),
    ];
    await mount(el);
    await settle();

    expect(panel().textContent).toContain('Multiple documents attached.');
    const options = Array.from(panel().querySelectorAll<HTMLButtonElement>('button')).filter(b => b.getAttribute('aria-label') !== 'Close');
    expect(options).toHaveLength(3);
  });

  it('offers the certificate through has-certificate but keeps Combined waiting for the document itself', async () => {
    const selections: IDownloadSelection[] = [];
    const el = document.createElement('vdocs-download-dialog');
    el.documents = [ sampleDocument({ id: 'doc-1', name: 'NDA.pdf', signed: true }) ];
    el.signed = true;
    el.setAttribute('has-certificate', '');
    el.addEventListener('vdocs-download', e => selections.push(e.detail));
    await mount(el);
    await settle();

    expect(button(/^Combined/).disabled).toBe(true);
    expect(button(/^Certificate/).disabled).toBe(false);

    await page.getByRole('button', { name: /^Certificate/ }).click();
    expect(selections[0]?.document).toBeUndefined();
    expect(selections[0]?.variant).toBe('certificate');
  });
});

describe('vdocs-kba-dialog', () => {
  const questions: IKBAQuestion[] = [
    { type: 'city.of.residence', prompt: 'Which of these cities have you lived in?', answer: [ 'Springfield', 'Shelbyville', 'None of the above' ] },
    { type: 'car.owned', prompt: 'Which of these cars have you owned?', answer: [ 'Civic', 'Corolla' ] },
  ];

  it('gates the identity submit behind the required fields and the agreement', async () => {
    const submitted: IKbaIdentityDetails[] = [];
    const el = document.createElement('vdocs-kba-dialog');
    el.addEventListener('vdocs-submit-identity', e => submitted.push(e.detail));
    await mount(el);
    await settle();

    setNativeValue(panel().querySelector<HTMLInputElement>('input[placeholder="First name..."]')!, 'Paige');
    setNativeValue(panel().querySelector<HTMLInputElement>('input[placeholder="Last name..."]')!, 'Turner');
    setNativeValue(panel().querySelector<HTMLInputElement>('input[placeholder="Address..."]')!, '123 Main St');
    setNativeValue(panel().querySelector<HTMLInputElement>('input[placeholder="Zip Code..."]')!, '02134');
    setNativeValue(panel().querySelector<HTMLInputElement>('input[placeholder="Last 4 digits of your Social Security Number..."]')!, '1234');
    setNativeValue(panel().querySelector<HTMLInputElement>('input[type="date"]')!, '1990-01-01');
    await settle();
    expect(button('Submit').disabled).toBe(true);

    await page.getByRole('checkbox').click();
    await settle();
    expect(button('Submit').disabled).toBe(false);

    await page.getByRole('button', { name: 'Submit' }).click();
    expect(submitted).toEqual([
      { first_name: 'Paige', last_name: 'Turner', address: '123 Main St', city: '', state: '', zip: '02134', ssn_last_4: '1234', dob: '1990-01-01' },
    ]);
  });

  it('prefills the identity form from initialDetails', async () => {
    const el = document.createElement('vdocs-kba-dialog');
    el.initialDetails = { first_name: 'Paige', zip: '02134' };
    await mount(el);
    await settle();

    expect(panel().querySelector<HTMLInputElement>('input[placeholder="First name..."]')!.value).toBe('Paige');
    expect(panel().querySelector<HTMLInputElement>('input[placeholder="Zip Code..."]')!.value).toBe('02134');
  });

  it('steps through the questions, firing vdocs-answer-question for each answer', async () => {
    const answers: IKbaAnswer[] = [];
    const el = document.createElement('vdocs-kba-dialog');
    el.setAttribute('mode', 'questions');
    el.setAttribute('help-title', 'Verify your identity');
    el.questions = questions;
    el.addEventListener('vdocs-answer-question', e => answers.push(e.detail));
    await mount(el);
    await settle();

    expect(panel().textContent).toContain('(1/2)');
    expect(panel().textContent).toContain('Verify your identity');
    expect(panel().textContent).toContain('Which of these cities have you lived in?');
    expect(button('Next').disabled).toBe(true);

    await page.getByRole('button', { name: 'Springfield' }).click();
    await settle();
    expect(button('Next').disabled).toBe(false);

    await page.getByRole('button', { name: 'Next' }).click();
    await settle();
    expect(answers).toEqual([ { questionType: 'city.of.residence', choice: 'Springfield' } ]);

    // The dialog advanced to the last question, with the choice reset and the
    // action relabeled.
    expect(panel().textContent).toContain('(2/2)');
    expect(panel().textContent).toContain('Which of these cars have you owned?');
    expect(button('Submit').disabled).toBe(true);

    await page.getByRole('button', { name: 'Corolla' }).click();
    await settle();
    await page.getByRole('button', { name: 'Submit' }).click();
    expect(answers).toHaveLength(2);
    expect(answers[1]).toEqual({ questionType: 'car.owned', choice: 'Corolla' });
  });

  it('cancels via the close button', async () => {
    const cancelled = vi.fn();
    const el = document.createElement('vdocs-kba-dialog');
    el.addEventListener('vdocs-cancel', cancelled);
    await mount(el);
    await settle();

    await page.getByRole('button', { name: 'Close' }).click();
    expect(cancelled).toHaveBeenCalledOnce();
  });
});

describe('vdocs-adopt-signature-dialog', () => {
  it('enables adopt once a name is typed and returns a typed PNG', async () => {
    const adopted: IAdoptedSignature[] = [];
    const el = document.createElement('vdocs-adopt-signature-dialog');
    el.addEventListener('vdocs-adopted', e => adopted.push(e.detail));
    await mount(el);
    await settle();

    expect(button('Adopt & Sign').disabled).toBe(true);

    setNativeValue(panel().querySelector('input')!, 'Paige Turner');
    await settle();
    expect(button('Adopt & Sign').disabled).toBe(false);

    await page.getByRole('button', { name: 'Adopt & Sign' }).click();
    expect(adopted).toHaveLength(1);
    expect(adopted[0]?.type).toBe('typed');
    expect(adopted[0]?.fullName).toBe('Paige Turner');
    expect(adopted[0]?.dataUrl.startsWith('data:image/png')).toBe(true);
  });

  it('seeds the name from full-name and locks it when name-locked is set', async () => {
    const el = document.createElement('vdocs-adopt-signature-dialog');
    el.setAttribute('full-name', 'Paige Turner');
    el.setAttribute('name-locked', '');
    await mount(el);
    await settle();

    const input = panel().querySelector('input')!;
    expect(input.value).toBe('Paige Turner');
    expect(input.disabled).toBe(true);
    expect(panel().textContent).toContain('Your name has been set by the sender and cannot be changed.');
    expect(button('Adopt & Sign').disabled).toBe(false);
  });

  it('requires a drawing in draw mode and returns a drawn PNG', async () => {
    const adopted: IAdoptedSignature[] = [];
    const el = document.createElement('vdocs-adopt-signature-dialog');
    el.setAttribute('full-name', 'Paige Turner');
    el.addEventListener('vdocs-adopted', e => adopted.push(e.detail));
    await mount(el);
    await settle();

    await page.getByRole('tab', { name: 'Draw' }).click();
    await settle();
    expect(button('Adopt & Sign').disabled).toBe(true);

    // A real click delivers trusted pointerdown/pointerup, which commits a
    // one-point stroke.
    await page.getByRole('img', { name: 'Signature Preview' }).click();
    await settle();
    expect(button('Adopt & Sign').disabled).toBe(false);

    await page.getByRole('button', { name: 'Adopt & Sign' }).click();
    expect(adopted[0]?.type).toBe('drawn');
    expect(adopted[0]?.fullName).toBe('Paige Turner');
    expect(adopted[0]?.dataUrl.startsWith('data:image/png')).toBe(true);
  });

  it('clears the drawing and disables adopt again', async () => {
    const el = document.createElement('vdocs-adopt-signature-dialog');
    await mount(el);
    await settle();

    await page.getByRole('tab', { name: 'Draw' }).click();
    await settle();
    expect(button('Clear').disabled).toBe(true);

    await page.getByRole('img', { name: 'Signature Preview' }).click();
    await settle();
    expect(button('Clear').disabled).toBe(false);

    await page.getByRole('button', { name: 'Clear' }).click();
    await settle();
    expect(button('Clear').disabled).toBe(true);
    expect(button('Adopt & Sign').disabled).toBe(true);
  });

  it('swaps copy and uppercases the seed for the initials variant', async () => {
    const el = document.createElement('vdocs-adopt-signature-dialog');
    el.setAttribute('variant', 'initials');
    el.setAttribute('full-name', 'pt');
    await mount(el);
    await settle();

    expect(panel().textContent).toContain('Create Your Initial');
    expect(panel().querySelector('input')!.value).toBe('PT');
    expect(panel().querySelector('canvas')!.getAttribute('aria-label')).toBe('Initials Preview');
  });
});

describe('vdocs-signature-dialog', () => {
  it('composes the adopt dialog and bubbles vdocs-adopted', async () => {
    const adopted: IAdoptedSignature[] = [];
    const el = document.createElement('vdocs-signature-dialog');
    el.setAttribute('full-name', 'Paige Turner');
    el.addEventListener('vdocs-adopted', e => adopted.push(e.detail));
    await mount(el);
    await settle();

    expect(panel().textContent).toContain('Adopt Your Signature');

    await page.getByRole('button', { name: 'Adopt & Sign' }).click();
    expect(adopted[0]?.type).toBe('typed');
    expect(adopted[0]?.fullName).toBe('Paige Turner');
  });

  it('bubbles vdocs-cancel from the composed dialog', async () => {
    const cancelled = vi.fn();
    const el = document.createElement('vdocs-signature-dialog');
    el.addEventListener('vdocs-cancel', cancelled);
    await mount(el);
    await settle();

    await page.getByRole('button', { name: 'Cancel' }).click();
    expect(cancelled).toHaveBeenCalledOnce();
  });
});

describe('vdocs-initial-dialog', () => {
  it('renders the initials variant with the seed uppercased', async () => {
    const el = document.createElement('vdocs-initial-dialog');
    el.setAttribute('initials', 'pt');
    await mount(el);
    await settle();

    expect(panel().textContent).toContain('Create Your Initial');
    expect(panel().querySelector('input')!.value).toBe('PT');
  });

  it('bubbles vdocs-adopted with the initials payload', async () => {
    const adopted: IAdoptedSignature[] = [];
    const el = document.createElement('vdocs-initial-dialog');
    el.setAttribute('initials', 'pt');
    el.addEventListener('vdocs-adopted', e => adopted.push(e.detail));
    await mount(el);
    await settle();

    await page.getByRole('button', { name: 'Adopt & Sign' }).click();
    expect(adopted[0]?.type).toBe('typed');
    expect(adopted[0]?.fullName).toBe('PT');
  });
});

describe('vdocs-signing-progress', () => {
  const fields = () => [
    sampleField({ name: 'field-1', value: 'done' }),
    sampleField({ name: 'field-2' }),
    sampleField({ name: 'field-3', required: false }),
  ];

  it('start mode shows the remaining counts and fires vdocs-start', async () => {
    const started = vi.fn();
    const el = document.createElement('vdocs-signing-progress');
    el.fields = fields();
    el.addEventListener('vdocs-start', started);
    await mount(el);
    await settle();

    expect(el.textContent).toContain('1 of 2 required fields remaining');
    expect(el.textContent).toContain('1 of 1 optional fields remaining');

    await page.getByRole('button', { name: 'Start Signing' }).click();
    expect(started).toHaveBeenCalledOnce();
  });

  it('signing mode shows the focused field label and pages with Previous/Next', async () => {
    const next = vi.fn();
    const el = document.createElement('vdocs-signing-progress');
    el.setAttribute('mode', 'signing');
    el.setAttribute('focused-field', 'field-1');
    el.fields = fields();
    el.addEventListener('vdocs-next', next);
    await mount(el);
    await settle();

    expect(el.textContent).toContain('Required Text Field*');
    expect(button('Previous').disabled).toBe(true);

    await page.getByRole('button', { name: 'Next' }).click();
    expect(next).toHaveBeenCalledOnce();
  });

  it('offers Submit once every required field is filled', async () => {
    const submitted = vi.fn();
    const el = document.createElement('vdocs-signing-progress');
    el.setAttribute('mode', 'signing');
    el.setAttribute('focused-field', 'field-2');
    el.fields = [
      sampleField({ name: 'field-1', value: 'done' }),
      sampleField({ name: 'field-2', value: 'also done' }),
      sampleField({ name: 'field-3', required: false }),
    ];
    el.addEventListener('vdocs-submit', submitted);
    await mount(el);
    await settle();

    expect(el.textContent).toContain('0 of 2 required fields remaining');

    await page.getByRole('button', { name: 'Submit' }).click();
    expect(submitted).toHaveBeenCalledOnce();
  });

  it('completed mode renders the ready card and fires vdocs-submit', async () => {
    const submitted = vi.fn();
    const el = document.createElement('vdocs-signing-progress');
    el.setAttribute('mode', 'completed');
    el.addEventListener('vdocs-submit', submitted);
    await mount(el);
    await settle();

    expect(el.textContent).toContain('Ready to Submit');

    await page.getByRole('button', { name: 'Submit' }).click();
    expect(submitted).toHaveBeenCalledOnce();
  });
});
