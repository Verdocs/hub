import { page } from 'vitest/browser';
import type { IRecipient } from '@verdocs/js-sdk';
import type { IContactSelectEvent, TPickerContact } from './vdocs-contact-picker.js';
import { mount } from '../test/helpers.js';
import './vdocs-contact-picker.js';

const sampleRole: Partial<IRecipient> = {
  role_name: 'Recipient 1',
  first_name: 'Paige',
  last_name: 'Turner',
  email: 'paige.turner@example.com',
  phone: '+12025551212',
  message: 'Please sign at your earliest convenience.',
};

const sampleSuggestions: TPickerContact[] = [
  { id: 'contact-1', first_name: 'Paige', last_name: 'Turner', email: 'paige.turner@example.com', phone: '+12025551212' },
  { id: 'contact-2', first_name: 'Sue', last_name: 'Permann', email: 'sue.permann@example.com' },
];

describe('vdocs-contact-picker', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  const mountPicker = async (configure?: (el: HTMLElementTagNameMap['vdocs-contact-picker']) => void) => {
    const el = document.createElement('vdocs-contact-picker');
    configure?.(el);
    return mount(el);
  };

  const buttonNamed = (el: HTMLElement, name: string) => Array.from(el.querySelectorAll('button')).find(button => button.textContent?.trim() === name);

  const inputLabeled = (el: HTMLElement, label: string) => el.querySelector<HTMLInputElement>(`input[aria-label="${label}"]`);

  const fieldValue = (el: HTMLElement, id: string) => el.querySelector<HTMLInputElement>(`input[id$="-${id}"]`)?.value;

  it('submits the completed contact details', async () => {
    const submissions: IContactSelectEvent[] = [];
    const el = await mountPicker(picker => {
      picker.templateRole = sampleRole;
      picker.availableAuthMethods = [ 'passcode', 'email', 'sms' ];
    });
    el.addEventListener('vdocs-submit-contact', e => submissions.push(e.detail));

    await page.getByRole('button', { name: 'Done' }).click();

    expect(submissions).toEqual([ {
      first_name: 'Paige',
      last_name: 'Turner',
      email: 'paige.turner@example.com',
      phone: '+12025551212',
      message: 'Please sign at your earliest convenience.',
      delegator: false,
      name_locked: false,
      auth_methods: [],
      passcode: '',
    } ]);
  });

  it('requires a name and a valid email before enabling Done', async () => {
    const el = await mountPicker();

    expect(buttonNamed(el, 'Done')?.disabled).toBe(true);

    await page.getByLabelText('First name').fill('Paige');
    await page.getByLabelText('Last name').fill('Turner');
    await page.getByLabelText('Email').fill('not-an-email');
    await vi.waitFor(() => expect(buttonNamed(el, 'Done')?.disabled).toBe(true));

    await page.getByLabelText('Email').fill('paige.turner@example.com');
    await vi.waitFor(() => expect(buttonNamed(el, 'Done')?.disabled).toBe(false));
  });

  it('reports name-field text through vdocs-search-contacts', async () => {
    const queries: string[] = [];
    const el = await mountPicker();
    el.addEventListener('vdocs-search-contacts', e => queries.push(e.detail));

    await page.getByLabelText('First name').fill('Pai');
    expect(queries.at(-1)).toBe('Pai');

    await page.getByLabelText('Last name').fill('Tu');
    expect(queries.at(-1)).toBe('Tu');
  });

  it('shows suggestions on focus and fills the form on selection', async () => {
    const el = await mountPicker(picker => {
      picker.suggestions = sampleSuggestions;
      picker.availableAuthMethods = [ 'passcode', 'email', 'sms' ];
    });

    expect(el.textContent).not.toContain('paige.turner@example.com');

    await page.getByLabelText('First name').click();
    await vi.waitFor(() => expect(el.textContent).toContain('paige.turner@example.com'));

    await page.getByText('Paige Turner').click();

    await vi.waitFor(() => {
      expect(fieldValue(el, 'first-name')).toBe('Paige');
    });
    expect(fieldValue(el, 'last-name')).toBe('Turner');
    expect(fieldValue(el, 'email')).toBe('paige.turner@example.com');
    expect(fieldValue(el, 'phone')).toBe('+12025551212');
    expect(el.textContent).not.toContain('sue.permann@example.com');
  });

  it('closes the suggestions on a click outside the picker', async () => {
    const outside = document.createElement('button');
    outside.textContent = 'Elsewhere';
    document.body.appendChild(outside);

    const el = await mountPicker(picker => {
      picker.suggestions = sampleSuggestions;
    });

    await page.getByLabelText('First name').click();
    await vi.waitFor(() => expect(el.textContent).toContain('sue.permann@example.com'));

    await page.getByRole('button', { name: 'Elsewhere' }).click();
    await vi.waitFor(() => expect(el.textContent).not.toContain('sue.permann@example.com'));
  });

  it('filters suggestions by the first-name text', async () => {
    const el = await mountPicker(picker => {
      picker.suggestions = sampleSuggestions;
    });

    await page.getByLabelText('First name').fill('Sue');

    await vi.waitFor(() => expect(el.textContent).toContain('sue.permann@example.com'));
    expect(el.textContent).not.toContain('paige.turner@example.com');
  });

  it('requires a passcode once passcode verification is selected', async () => {
    const submissions: IContactSelectEvent[] = [];
    const el = await mountPicker(picker => {
      picker.templateRole = sampleRole;
    });
    el.addEventListener('vdocs-submit-contact', e => submissions.push(e.detail));

    expect(inputLabeled(el, 'Passcode')).toBeNull();

    await page.getByRole('button', { name: 'Passcode' }).click();
    await vi.waitFor(() => expect(buttonNamed(el, 'Passcode')?.getAttribute('aria-pressed')).toBe('true'));
    expect(buttonNamed(el, 'Done')?.disabled).toBe(true);

    await page.getByLabelText('Passcode').fill('1234');
    await vi.waitFor(() => expect(buttonNamed(el, 'Done')?.disabled).toBe(false));

    await page.getByRole('button', { name: 'Done' }).click();
    expect(submissions.at(-1)).toEqual(expect.objectContaining({ auth_methods: [ 'passcode' ], passcode: '1234' }));
  });

  it('blocks the submit when a selected method has nothing to work with', async () => {
    const el = await mountPicker(picker => {
      picker.templateRole = sampleRole;
      picker.availableAuthMethods = [ 'passcode', 'email', 'sms' ];
    });

    await page.getByLabelText(/Phone/).fill('');
    await page.getByRole('button', { name: 'SMS code' }).click();

    await vi.waitFor(() => expect(buttonNamed(el, 'Done')?.disabled).toBe(true));

    await page.getByLabelText(/Phone/).fill('2125551212');
    await vi.waitFor(() => expect(buttonNamed(el, 'Done')?.disabled).toBe(false));
  });

  it('locks verification methods the account is not entitled to', async () => {
    const el = await mountPicker(picker => {
      picker.templateRole = { ...sampleRole, auth_methods: [ 'kba' ] };
      picker.availableAuthMethods = [ 'passcode', 'email' ];
    });

    expect(buttonNamed(el, 'Email')?.disabled).toBe(false);
    expect(buttonNamed(el, 'SMS code')?.disabled).toBe(true);
    expect(buttonNamed(el, 'ID check')?.disabled).toBe(true);

    // A locked method that is already selected stays clickable, so it can still be turned off.
    expect(buttonNamed(el, 'KBA')?.disabled).toBe(false);
    expect(buttonNamed(el, 'KBA')?.getAttribute('aria-pressed')).toBe('true');

    await page.getByRole('button', { name: 'KBA' }).click();

    await vi.waitFor(() => expect(buttonNamed(el, 'KBA')?.getAttribute('aria-pressed')).toBe('false'));
    expect(buttonNamed(el, 'KBA')?.disabled).toBe(true);
  });

  it('treats the signing options as a three-way choice', async () => {
    const submissions: IContactSelectEvent[] = [];
    const el = await mountPicker(picker => {
      picker.templateRole = sampleRole;
    });
    el.addEventListener('vdocs-submit-contact', e => submissions.push(e.detail));

    expect(buttonNamed(el, 'None')?.getAttribute('aria-pressed')).toBe('true');

    await page.getByRole('button', { name: 'May delegate' }).click();
    await vi.waitFor(() => expect(buttonNamed(el, 'None')?.getAttribute('aria-pressed')).toBe('false'));
    expect(buttonNamed(el, 'Name locked')?.getAttribute('aria-pressed')).toBe('false');

    await page.getByRole('button', { name: 'Name locked' }).click();
    await vi.waitFor(() => expect(buttonNamed(el, 'May delegate')?.getAttribute('aria-pressed')).toBe('false'));

    await page.getByRole('button', { name: 'Done' }).click();
    expect(submissions.at(-1)).toEqual(expect.objectContaining({ delegator: false, name_locked: true }));

    await page.getByRole('button', { name: 'None' }).click();
    await page.getByRole('button', { name: 'Done' }).click();
    expect(submissions.at(-1)).toEqual(expect.objectContaining({ delegator: false, name_locked: false }));
  });

  it('formats the phone number to E.164', async () => {
    const el = await mountPicker(picker => {
      picker.availableAuthMethods = [ 'passcode', 'email', 'sms' ];
    });

    await page.getByLabelText(/Phone/).fill('(212) 555-1212');

    await vi.waitFor(() => expect(fieldValue(el, 'phone')).toBe('+12125551212'));
  });

  it('hides the phone field unless SMS verification is available', async () => {
    const el = await mountPicker();

    expect(fieldValue(el, 'phone')).toBeUndefined();

    el.availableAuthMethods = [ 'passcode', 'email', 'sms' ];
    await el.updateComplete;

    expect(fieldValue(el, 'phone')).toBe('');
  });

  it('fires vdocs-cancel when the user cancels', async () => {
    const submissions: IContactSelectEvent[] = [];
    let canceled = 0;
    const el = await mountPicker(picker => {
      picker.templateRole = sampleRole;
    });
    el.addEventListener('vdocs-cancel', () => {
      canceled++;
    });
    el.addEventListener('vdocs-submit-contact', e => submissions.push(e.detail));

    await page.getByRole('button', { name: 'Cancel' }).click();

    expect(canceled).toBe(1);
    expect(submissions).toHaveLength(0);
  });

  it('hides Cancel when the host provides its own way out', async () => {
    const el = await mountPicker(picker => {
      picker.templateRole = sampleRole;
    });

    expect(buttonNamed(el, 'Cancel')).toBeDefined();

    el.showCancel = false;
    await el.updateComplete;

    expect(buttonNamed(el, 'Cancel')).toBeUndefined();
    expect(buttonNamed(el, 'Done')).toBeDefined();
  });
});
