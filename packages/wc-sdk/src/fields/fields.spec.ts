import { page } from 'vitest/browser';
import type { IEnvelopeField } from '@verdocs/js-sdk';
import type { IFieldChangeDetail } from './field-base.js';
import { mount } from '../test/helpers.js';
import './vdocs-field-attachment.js';
import './vdocs-field-signature.js';
import './vdocs-field-timestamp.js';
import './vdocs-field-checkbox.js';
import './vdocs-field-dropdown.js';
import './vdocs-field-textarea.js';
import './vdocs-field-initial.js';
import './vdocs-field-payment.js';
import './vdocs-field-textbox.js';
import './vdocs-field-radio.js';
import './vdocs-field-date.js';

const sampleField = (overrides: Partial<IEnvelopeField> = {}): IEnvelopeField => ({
  envelope_id: '83da3d70-7857-4392-b876-c4592a304bc9',
  document_id: '626af9d6-f9d5-4ad9-94c7-13e57d515d43',
  name: 'Buyer-field-1',
  role_name: 'Recipient 1',
  type: 'textbox',
  required: false,
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

// A 1x1 transparent gif, so filled signature and initial fields have a real
// src without network fetches.
const IMAGE_URL = 'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==';

afterEach(() => {
  document.body.replaceChildren();
});

describe('vdocs-field-checkbox', () => {
  it('renders the composed control unchecked by default, with the field and signer classes', async () => {
    const el = document.createElement('vdocs-field-checkbox');
    el.field = sampleField({ type: 'checkbox', name: 'Buyer-checkbox-1' });
    await mount(el);

    const input = el.querySelector('input')!;
    expect(input.type).toBe('checkbox');
    expect(input.checked).toBe(false);
    expect(input.name).toBe('Buyer-checkbox-1');
    expect(el.classList.contains('vdocs-field')).toBe(true);
    expect(el.classList.contains('vdocs-signer-1')).toBe(true);
  });

  it('renders checked from the field value', async () => {
    const el = document.createElement('vdocs-field-checkbox');
    el.field = sampleField({ type: 'checkbox', value: 'true' });
    await mount(el);

    expect(el.querySelector('input')!.checked).toBe(true);
  });

  it('fires vdocs-field-change with the new checked state and keeps the control event internal', async () => {
    const changes: IFieldChangeDetail[] = [];
    const leaked = vi.fn();
    const el = document.createElement('vdocs-field-checkbox');
    el.field = sampleField({ type: 'checkbox' });
    el.addEventListener('vdocs-field-change', e => changes.push(e.detail));
    el.addEventListener('vdocs-checked-change', leaked);
    await mount(el);

    await page.getByRole('checkbox').click();
    await page.getByRole('checkbox').click();

    expect(changes).toEqual([ { value: true }, { value: false } ]);
    expect(leaked).not.toHaveBeenCalled();
  });

  it('disables the input when disabled or the field is readonly', async () => {
    const changed = vi.fn();
    const el = document.createElement('vdocs-field-checkbox');
    el.field = sampleField({ type: 'checkbox' });
    el.disabled = true;
    el.addEventListener('vdocs-field-change', changed);
    await mount(el);

    const input = el.querySelector('input')!;
    expect(input.disabled).toBe(true);
    input.click();
    expect(changed).not.toHaveBeenCalled();

    const readonly = document.createElement('vdocs-field-checkbox');
    readonly.field = sampleField({ type: 'checkbox', readonly: true });
    await mount(readonly);
    expect(readonly.querySelector('input')!.disabled).toBe(true);
  });

  it('renders the final glyph instead of an input when done', async () => {
    const el = document.createElement('vdocs-field-checkbox');
    el.field = sampleField({ type: 'checkbox', value: 'true' });
    el.done = true;
    await mount(el);

    expect(el.querySelector('input')).toBeNull();
    expect(el.querySelector('svg')!.getAttribute('aria-label')).toBe('Checked');

    el.field = sampleField({ type: 'checkbox' });
    await el.updateComplete;
    expect(el.querySelector('svg')!.getAttribute('aria-label')).toBe('Unchecked');
  });

  it('maps signer-index to the wrapping vdocs-signer-N class', async () => {
    const el = document.createElement('vdocs-field-checkbox');
    el.field = sampleField({ type: 'checkbox' });
    el.setAttribute('signer-index', '3');
    await mount(el);
    expect(el.classList.contains('vdocs-signer-4')).toBe(true);

    el.signerIndex = 10;
    await el.updateComplete;
    expect(el.classList.contains('vdocs-signer-1')).toBe(true);
    expect(el.classList.contains('vdocs-signer-4')).toBe(false);
  });
});

describe('vdocs-field-radio', () => {
  it('renders the composed control unselected by default, grouped by the field group', async () => {
    const el = document.createElement('vdocs-field-radio');
    el.field = sampleField({ type: 'radio', name: 'Buyer-radio-1', group: 'purchase-options' });
    await mount(el);

    const input = el.querySelector('input')!;
    expect(input.type).toBe('radio');
    expect(input.checked).toBe(false);
    expect(input.name).toBe('purchase-options');
    expect(el.classList.contains('vdocs-signer-1')).toBe(true);
  });

  it('renders selected from the field value', async () => {
    const el = document.createElement('vdocs-field-radio');
    el.field = sampleField({ type: 'radio', value: 'true' });
    await mount(el);

    expect(el.querySelector('input')!.checked).toBe(true);
  });

  it('fires vdocs-field-change with the field name on selection', async () => {
    const changes: IFieldChangeDetail[] = [];
    const el = document.createElement('vdocs-field-radio');
    el.field = sampleField({ type: 'radio', name: 'Buyer-radio-1' });
    el.addEventListener('vdocs-field-change', e => changes.push(e.detail));
    await mount(el);

    await page.getByRole('radio').click();

    expect(changes).toEqual([ { value: 'Buyer-radio-1' } ]);
  });

  it('disables the input for readonly fields', async () => {
    const changed = vi.fn();
    const el = document.createElement('vdocs-field-radio');
    el.field = sampleField({ type: 'radio', readonly: true });
    el.addEventListener('vdocs-field-change', changed);
    await mount(el);

    const input = el.querySelector('input')!;
    expect(input.disabled).toBe(true);
    input.click();
    expect(changed).not.toHaveBeenCalled();
  });

  it('renders the final glyph instead of an input when done', async () => {
    const el = document.createElement('vdocs-field-radio');
    el.field = sampleField({ type: 'radio', value: 'true' });
    el.done = true;
    await mount(el);

    expect(el.querySelector('input')).toBeNull();
    expect(el.querySelector('svg')!.getAttribute('aria-label')).toBe('Selected');

    el.field = sampleField({ type: 'radio' });
    await el.updateComplete;
    expect(el.querySelector('svg')!.getAttribute('aria-label')).toBe('Not selected');
  });
});

describe('vdocs-field-textbox', () => {
  it('seeds the input from the field value, with placeholder, signer, and required classes', async () => {
    const el = document.createElement('vdocs-field-textbox');
    el.field = sampleField({ value: 'Hello', placeholder: 'Type here', required: true });
    await mount(el);

    const input = el.querySelector('input')!;
    expect(input.value).toBe('Hello');
    expect(input.placeholder).toBe('Type here');
    expect(input.required).toBe(true);
    expect(el.classList.contains('vdocs-signer-1')).toBe(true);
    expect(el.classList.contains('vdocs:border-danger')).toBe(true);
  });

  it('fires vdocs-field-change with the full text on input', async () => {
    const changes: IFieldChangeDetail[] = [];
    const el = document.createElement('vdocs-field-textbox');
    el.field = sampleField();
    el.addEventListener('vdocs-field-change', e => changes.push(e.detail));
    await mount(el);

    await page.getByRole('textbox').fill('Hi there');

    expect(changes.at(-1)).toEqual({ value: 'Hi there' });
  });

  it('caps input length from the field width at 5px per character', async () => {
    const el = document.createElement('vdocs-field-textbox');
    el.field = sampleField({ width: 100 });
    await mount(el);

    expect(el.querySelector('input')!.maxLength).toBe(20);
  });

  it('disables the input when disabled or the field is readonly', async () => {
    const el = document.createElement('vdocs-field-textbox');
    el.field = sampleField({ readonly: true });
    await mount(el);
    expect(el.querySelector('input')!.disabled).toBe(true);

    const disabled = document.createElement('vdocs-field-textbox');
    disabled.field = sampleField();
    disabled.disabled = true;
    await mount(disabled);
    expect(disabled.querySelector('input')!.disabled).toBe(true);
  });

  it('renders the value as plain text when done', async () => {
    const el = document.createElement('vdocs-field-textbox');
    el.field = sampleField({ value: 'Signed value' });
    el.done = true;
    await mount(el);

    expect(el.querySelector('input')).toBeNull();
    expect(el.textContent).toContain('Signed value');
  });

  it('moves keyboard focus onto the input when focused flips on', async () => {
    const el = document.createElement('vdocs-field-textbox');
    el.field = sampleField();
    await mount(el);

    el.focused = true;
    await el.updateComplete;

    expect(document.activeElement).toBe(el.querySelector('input'));
    expect(el.classList.contains('vdocs:ring-2')).toBe(true);
  });
});

describe('vdocs-field-textarea', () => {
  it('seeds the textarea from the field value', async () => {
    const el = document.createElement('vdocs-field-textarea');
    el.field = sampleField({ type: 'textarea', multiline: true, value: 'Line one' });
    await mount(el);

    expect(el.querySelector('textarea')!.value).toBe('Line one');
    expect(el.classList.contains('vdocs-signer-1')).toBe(true);
  });

  it('fires vdocs-field-change with the full text on edit', async () => {
    const changes: IFieldChangeDetail[] = [];
    const el = document.createElement('vdocs-field-textarea');
    el.field = sampleField({ type: 'textarea', multiline: true });
    el.addEventListener('vdocs-field-change', e => changes.push(e.detail));
    await mount(el);

    await page.getByRole('textbox').fill('Edited');

    expect(changes.at(-1)).toEqual({ value: 'Edited' });
  });

  it('disables the textarea for readonly fields', async () => {
    const el = document.createElement('vdocs-field-textarea');
    el.field = sampleField({ type: 'textarea', multiline: true, readonly: true });
    await mount(el);

    expect(el.querySelector('textarea')!.disabled).toBe(true);
  });

  it('renders the value as plain text with the done class when done', async () => {
    const el = document.createElement('vdocs-field-textarea');
    el.field = sampleField({ type: 'textarea', multiline: true, value: 'Final text' });
    el.done = true;
    await mount(el);

    expect(el.querySelector('textarea')).toBeNull();
    expect(el.textContent).toContain('Final text');
    expect(el.classList.contains('vdocs-field-done')).toBe(true);
  });

  it('draws the focused treatment while the textarea has focus', async () => {
    const el = document.createElement('vdocs-field-textarea');
    el.field = sampleField({ type: 'textarea', multiline: true });
    await mount(el);

    const textarea = el.querySelector('textarea')!;
    textarea.focus();
    await el.updateComplete;
    expect(el.classList.contains('vdocs-field-focused')).toBe(true);

    textarea.blur();
    await el.updateComplete;
    expect(el.classList.contains('vdocs-field-focused')).toBe(false);
  });
});

describe('vdocs-field-date', () => {
  it('seeds the input with the value trimmed to yyyy-mm-dd', async () => {
    const el = document.createElement('vdocs-field-date');
    el.field = sampleField({ type: 'date', value: '2025-04-05T12:00:00Z' });
    await mount(el);

    expect(el.querySelector('input')!.value).toBe('2025-04-05');
    expect(el.classList.contains('vdocs-signer-1')).toBe(true);
  });

  it('fires vdocs-field-change with the ISO date on input', async () => {
    const changes: IFieldChangeDetail[] = [];
    const el = document.createElement('vdocs-field-date');
    el.field = sampleField({ type: 'date' });
    el.addEventListener('vdocs-field-change', e => changes.push(e.detail));
    await mount(el);

    const input = el.querySelector('input')!;
    input.value = '2025-06-01';
    input.dispatchEvent(new Event('input', { bubbles: true }));

    expect(changes).toEqual([ { value: '2025-06-01' } ]);
  });

  it('disables the input when disabled or the field is readonly', async () => {
    const el = document.createElement('vdocs-field-date');
    el.field = sampleField({ type: 'date', readonly: true });
    await mount(el);

    expect(el.querySelector('input')!.disabled).toBe(true);
  });

  it('renders the picked date in the local format when done', async () => {
    const el = document.createElement('vdocs-field-date');
    el.field = sampleField({ type: 'date', value: '2025-04-05' });
    el.done = true;
    await mount(el);

    expect(el.querySelector('input')).toBeNull();
    expect(el.textContent).toContain(new Date(2025, 3, 5).toLocaleDateString());
    expect(el.classList.contains('vdocs-field-done')).toBe(true);
  });

  it('marks required fields on the host', async () => {
    const el = document.createElement('vdocs-field-date');
    el.field = sampleField({ type: 'date', required: true });
    await mount(el);

    expect(el.classList.contains('vdocs-field-required')).toBe(true);
    expect(el.querySelector('input')!.required).toBe(true);
  });
});

describe('vdocs-field-dropdown', () => {
  const options = [ { id: 'opt-1', label: 'One' }, { id: 'opt-2', label: 'Two' } ];

  it('renders the options with the field value selected', async () => {
    const el = document.createElement('vdocs-field-dropdown');
    el.field = sampleField({ type: 'dropdown', options, value: 'opt-2' });
    await mount(el);

    const select = el.querySelector('select')!;
    expect(select.value).toBe('opt-2');
    expect([ ...select.options ].map(option => option.textContent)).toEqual([ 'Select...', 'One', 'Two' ]);
  });

  it('offers only an N/A option when the field has none', async () => {
    const el = document.createElement('vdocs-field-dropdown');
    el.field = sampleField({ type: 'dropdown' });
    await mount(el);

    expect([ ...el.querySelectorAll('option') ].map(option => option.value)).toEqual([ '', 'NA' ]);
  });

  it('fires vdocs-field-change with the selected option id', async () => {
    const changes: IFieldChangeDetail[] = [];
    const el = document.createElement('vdocs-field-dropdown');
    el.field = sampleField({ type: 'dropdown', options });
    el.addEventListener('vdocs-field-change', e => changes.push(e.detail));
    await mount(el);

    const select = el.querySelector('select')!;
    select.value = 'opt-1';
    select.dispatchEvent(new Event('change', { bubbles: true }));

    expect(changes).toEqual([ { value: 'opt-1' } ]);
  });

  it('disables the select for readonly fields', async () => {
    const el = document.createElement('vdocs-field-dropdown');
    el.field = sampleField({ type: 'dropdown', options, readonly: true });
    await mount(el);

    expect(el.querySelector('select')!.disabled).toBe(true);
  });

  it('renders the stored value as plain text when done', async () => {
    const el = document.createElement('vdocs-field-dropdown');
    el.field = sampleField({ type: 'dropdown', options, value: 'opt-1' });
    el.done = true;
    await mount(el);

    expect(el.querySelector('select')).toBeNull();
    expect(el.textContent).toContain('opt-1');
  });

  it('draws the caret affordance and the signer class', async () => {
    const el = document.createElement('vdocs-field-dropdown');
    el.field = sampleField({ type: 'dropdown', options });
    el.setAttribute('signer-index', '2');
    await mount(el);

    expect(el.querySelector('svg')).not.toBeNull();
    expect(el.classList.contains('vdocs-signer-3')).toBe(true);
  });
});

describe('vdocs-field-initial', () => {
  it('renders the Initial affordance and fires vdocs-begin-signing on click', async () => {
    const begin = vi.fn();
    const el = document.createElement('vdocs-field-initial');
    el.field = sampleField({ type: 'initial' });
    el.addEventListener('vdocs-begin-signing', begin);
    await mount(el);

    await page.getByRole('button', { name: 'Initial' }).click();

    expect(begin).toHaveBeenCalledOnce();
  });

  it('draws the adopted image instead of the button once initial-url is set', async () => {
    const el = document.createElement('vdocs-field-initial');
    el.field = sampleField({ type: 'initial' });
    el.initialUrl = IMAGE_URL;
    await mount(el);

    expect(el.querySelector('button')).toBeNull();
    expect(el.querySelector('img')!.src).toBe(IMAGE_URL);
    expect(el.classList.contains('vdocs-filled')).toBe(true);
  });

  it('ignores clicks when disabled', async () => {
    const begin = vi.fn();
    const el = document.createElement('vdocs-field-initial');
    el.field = sampleField({ type: 'initial' });
    el.disabled = true;
    el.addEventListener('vdocs-begin-signing', begin);
    await mount(el);

    const button = el.querySelector('button')!;
    expect(button.disabled).toBe(true);
    button.click();
    expect(begin).not.toHaveBeenCalled();
    expect(el.classList.contains('vdocs-disabled')).toBe(true);
  });

  it('renders only the image when done, and nothing without one', async () => {
    const el = document.createElement('vdocs-field-initial');
    el.field = sampleField({ type: 'initial' });
    el.initialUrl = IMAGE_URL;
    el.done = true;
    await mount(el);

    expect(el.querySelector('button')).toBeNull();
    expect(el.querySelector('img')).not.toBeNull();
    expect(el.classList.contains('vdocs-done')).toBe(true);

    const empty = document.createElement('vdocs-field-initial');
    empty.field = sampleField({ type: 'initial' });
    empty.done = true;
    await mount(empty);
    expect(empty.querySelector('img')).toBeNull();
  });

  it('marks required fields and the signer on the host', async () => {
    const el = document.createElement('vdocs-field-initial');
    el.field = sampleField({ type: 'initial', required: true });
    el.setAttribute('signer-index', '1');
    await mount(el);

    expect(el.classList.contains('vdocs-required')).toBe(true);
    expect(el.classList.contains('vdocs-signer-2')).toBe(true);
  });
});

describe('vdocs-field-signature', () => {
  it('renders the Signature affordance and fires vdocs-begin-signing on click', async () => {
    const begin = vi.fn();
    const el = document.createElement('vdocs-field-signature');
    el.field = sampleField({ type: 'signature' });
    el.addEventListener('vdocs-begin-signing', begin);
    await mount(el);

    await page.getByRole('button', { name: 'Signature' }).click();

    expect(begin).toHaveBeenCalledOnce();
  });

  it('draws the adopted image instead of the button once signature-url is set', async () => {
    const el = document.createElement('vdocs-field-signature');
    el.field = sampleField({ type: 'signature' });
    el.signatureUrl = IMAGE_URL;
    await mount(el);

    expect(el.querySelector('button')).toBeNull();
    expect(el.querySelector('img')!.src).toBe(IMAGE_URL);
    expect(el.classList.contains('vdocs-filled')).toBe(true);
  });

  it('ignores clicks when disabled', async () => {
    const begin = vi.fn();
    const el = document.createElement('vdocs-field-signature');
    el.field = sampleField({ type: 'signature' });
    el.disabled = true;
    el.addEventListener('vdocs-begin-signing', begin);
    await mount(el);

    const button = el.querySelector('button')!;
    expect(button.disabled).toBe(true);
    button.click();
    expect(begin).not.toHaveBeenCalled();
    expect(el.classList.contains('vdocs-disabled')).toBe(true);
  });

  it('renders only the image when done, and nothing without one', async () => {
    const el = document.createElement('vdocs-field-signature');
    el.field = sampleField({ type: 'signature' });
    el.signatureUrl = IMAGE_URL;
    el.done = true;
    await mount(el);

    expect(el.querySelector('button')).toBeNull();
    expect(el.querySelector('img')).not.toBeNull();
    expect(el.classList.contains('vdocs-done')).toBe(true);

    const empty = document.createElement('vdocs-field-signature');
    empty.field = sampleField({ type: 'signature' });
    empty.done = true;
    await mount(empty);
    expect(empty.querySelector('img')).toBeNull();
  });

  it('marks required fields and the signer on the host', async () => {
    const el = document.createElement('vdocs-field-signature');
    el.field = sampleField({ type: 'signature', required: true });
    el.setAttribute('signer-index', '4');
    await mount(el);

    expect(el.classList.contains('vdocs-required')).toBe(true);
    expect(el.classList.contains('vdocs-signer-5')).toBe(true);
  });
});

describe('vdocs-field-timestamp', () => {
  it('shows what will happen when the field has no value yet', async () => {
    const el = document.createElement('vdocs-field-timestamp');
    el.field = sampleField({ type: 'timestamp' });
    await mount(el);
    expect(el.textContent).toContain('Filled at signing');

    const hinted = document.createElement('vdocs-field-timestamp');
    hinted.field = sampleField({ type: 'timestamp', placeholder: 'Stamped later' });
    await mount(hinted);
    expect(hinted.textContent).toContain('Stamped later');
  });

  it('renders a stored value in the local format', async () => {
    const stamp = '2025-01-02T03:04:05Z';
    const el = document.createElement('vdocs-field-timestamp');
    el.field = sampleField({ type: 'timestamp', value: stamp });
    await mount(el);

    expect(el.textContent).toContain(new Date(stamp).toLocaleString());
  });

  it('renders the value full-strength when done', async () => {
    const stamp = '2025-01-02T03:04:05Z';
    const el = document.createElement('vdocs-field-timestamp');
    el.field = sampleField({ type: 'timestamp', value: stamp });
    el.done = true;
    await mount(el);

    expect(el.textContent).toContain(new Date(stamp).toLocaleString());
    expect(el.classList.contains('vdocs-field-done')).toBe(true);
    expect(el.querySelector('.vdocs\\:opacity-50')).toBeNull();
  });

  it('marks required fields and the signer on the host', async () => {
    const el = document.createElement('vdocs-field-timestamp');
    el.field = sampleField({ type: 'timestamp', required: true });
    el.setAttribute('signer-index', '5');
    await mount(el);

    expect(el.classList.contains('vdocs-field-required')).toBe(true);
    expect(el.classList.contains('vdocs:border-danger')).toBe(true);
    expect(el.classList.contains('vdocs-signer-6')).toBe(true);
  });
});

describe('vdocs-field-attachment', () => {
  it('renders the paperclip affordance with no remove button when empty', async () => {
    const el = document.createElement('vdocs-field-attachment');
    el.field = sampleField({ type: 'attachment' });
    await mount(el);

    expect(el.querySelectorAll('button')).toHaveLength(1);
    expect(el.querySelector('button')!.title).toBe('');
    expect(el.classList.contains('vdocs-signer-1')).toBe(true);
  });

  it('shows the attached treatment, file name tooltip, and remove button once a file is stored', async () => {
    const el = document.createElement('vdocs-field-attachment');
    el.field = sampleField({ type: 'attachment', value: 'contract.pdf' });
    await mount(el);

    expect(el.querySelector('button')!.title).toBe('contract.pdf');
    expect(el.querySelector('button[aria-label="Remove attachment"]')).not.toBeNull();
  });

  it('fires vdocs-select-file with the chosen file', async () => {
    const files: File[] = [];
    const el = document.createElement('vdocs-field-attachment');
    el.field = sampleField({ type: 'attachment' });
    el.addEventListener('vdocs-select-file', e => files.push(e.detail.file));
    await mount(el);

    const transfer = new DataTransfer();
    transfer.items.add(new File([ 'hello' ], 'hello.pdf', { type: 'application/pdf' }));
    const picker = el.querySelector<HTMLInputElement>('input[type="file"]')!;
    picker.files = transfer.files;
    picker.dispatchEvent(new Event('change', { bubbles: true }));

    expect(files).toHaveLength(1);
    expect(files[0]?.name).toBe('hello.pdf');
  });

  it('fires vdocs-delete-file when the remove button is clicked', async () => {
    const deleted = vi.fn();
    const el = document.createElement('vdocs-field-attachment');
    el.field = sampleField({ type: 'attachment', value: 'contract.pdf' });
    el.addEventListener('vdocs-delete-file', deleted);
    await mount(el);

    await page.getByRole('button', { name: 'Remove attachment' }).click();

    expect(deleted).toHaveBeenCalledOnce();
  });

  it('disables picking and hides the remove button when inactive', async () => {
    const el = document.createElement('vdocs-field-attachment');
    el.field = sampleField({ type: 'attachment', value: 'contract.pdf', readonly: true });
    await mount(el);

    expect(el.querySelector('button')!.disabled).toBe(true);
    expect(el.querySelector<HTMLInputElement>('input[type="file"]')!.disabled).toBe(true);
    expect(el.querySelector('button[aria-label="Remove attachment"]')).toBeNull();
  });

  it('renders only a status icon when done', async () => {
    const el = document.createElement('vdocs-field-attachment');
    el.field = sampleField({ type: 'attachment', value: 'contract.pdf' });
    el.done = true;
    await mount(el);
    expect(el.querySelector('button')).toBeNull();
    expect(el.querySelector('svg title')!.textContent).toBe('File attached');

    const empty = document.createElement('vdocs-field-attachment');
    empty.field = sampleField({ type: 'attachment' });
    empty.done = true;
    await mount(empty);
    expect(empty.querySelector('svg title')!.textContent).toBe('No file attached');
  });
});

describe('vdocs-field-payment', () => {
  it('renders the payment affordance and fires vdocs-begin-payment on click', async () => {
    const begin = vi.fn();
    const el = document.createElement('vdocs-field-payment');
    el.field = sampleField({ type: 'payment' });
    el.addEventListener('vdocs-begin-payment', begin);
    await mount(el);

    await page.getByRole('button', { name: 'Payment' }).click();

    expect(begin).toHaveBeenCalledOnce();
  });

  it('renders the collected treatment instead of the button when paid', async () => {
    const el = document.createElement('vdocs-field-payment');
    el.field = sampleField({ type: 'payment' });
    el.paid = true;
    await mount(el);

    expect(el.querySelector('button')).toBeNull();
    expect(el.querySelector('[role="img"]')!.getAttribute('aria-label')).toBe('Paid');
    expect(el.classList.contains('vdocs-filled')).toBe(true);
  });

  it('ignores clicks when disabled', async () => {
    const begin = vi.fn();
    const el = document.createElement('vdocs-field-payment');
    el.field = sampleField({ type: 'payment' });
    el.disabled = true;
    el.addEventListener('vdocs-begin-payment', begin);
    await mount(el);

    const button = el.querySelector('button')!;
    expect(button.disabled).toBe(true);
    button.click();
    expect(begin).not.toHaveBeenCalled();
    expect(el.classList.contains('vdocs-disabled')).toBe(true);
  });

  it('renders the collected treatment when done', async () => {
    const el = document.createElement('vdocs-field-payment');
    el.field = sampleField({ type: 'payment' });
    el.done = true;
    await mount(el);

    expect(el.querySelector('[role="img"]')!.getAttribute('aria-label')).toBe('Paid');
    expect(el.classList.contains('vdocs-done')).toBe(true);
  });

  it('maps signer-index to the vdocs-signer-N class', async () => {
    const el = document.createElement('vdocs-field-payment');
    el.field = sampleField({ type: 'payment' });
    el.setAttribute('signer-index', '7');
    await mount(el);

    expect(el.classList.contains('vdocs-signer-8')).toBe(true);
  });
});
