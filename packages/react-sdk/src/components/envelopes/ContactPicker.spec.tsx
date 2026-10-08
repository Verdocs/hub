import type { IRecipient } from '@verdocs/js-sdk';
import userEvent from '@testing-library/user-event';
import { render, screen } from '@testing-library/react';
import ContactPicker, { type TPickerContact } from './ContactPicker';

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

describe('ContactPicker', () => {
  it('submits the completed contact details', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(
      <ContactPicker
        templateRole={sampleRole}
        availableAuthMethods={[ 'passcode', 'email', 'sms' ]}
        onSubmit={onSubmit}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Done' }));

    expect(onSubmit).toHaveBeenCalledWith({
      first_name: 'Paige',
      last_name: 'Turner',
      email: 'paige.turner@example.com',
      phone: '+12025551212',
      message: 'Please sign at your earliest convenience.',
      delegator: false,
      name_locked: false,
      auth_methods: [],
      passcode: '',
    });
  });

  it('requires a name and a valid email before enabling Done', async () => {
    const user = userEvent.setup();
    render(<ContactPicker />);

    const doneButton = screen.getByRole('button', { name: 'Done' });
    expect(doneButton).toBeDisabled();

    await user.type(screen.getByRole('textbox', { name: 'First name' }), 'Paige');
    await user.type(screen.getByRole('textbox', { name: 'Last name' }), 'Turner');
    await user.type(screen.getByRole('textbox', { name: 'Email' }), 'not-an-email');
    expect(doneButton).toBeDisabled();

    await user.clear(screen.getByRole('textbox', { name: 'Email' }));
    await user.type(screen.getByRole('textbox', { name: 'Email' }), 'paige.turner@example.com');
    expect(doneButton).toBeEnabled();
  });

  it('reports name-field text through onSearchContacts', async () => {
    const user = userEvent.setup();
    const onSearchContacts = vi.fn();
    render(<ContactPicker onSearchContacts={onSearchContacts} />);

    await user.type(screen.getByRole('textbox', { name: 'First name' }), 'Pai');
    expect(onSearchContacts).toHaveBeenLastCalledWith('Pai');

    await user.type(screen.getByRole('textbox', { name: 'Last name' }), 'Tu');
    expect(onSearchContacts).toHaveBeenLastCalledWith('Tu');
  });

  it('shows suggestions on focus and fills the form on selection', async () => {
    const user = userEvent.setup();
    render(<ContactPicker suggestions={sampleSuggestions} availableAuthMethods={[ 'passcode', 'email', 'sms' ]} />);

    expect(screen.queryByRole('button', { name: /Paige Turner/ })).not.toBeInTheDocument();

    await user.click(screen.getByRole('textbox', { name: 'First name' }));
    await user.click(screen.getByRole('button', { name: /Paige Turner/ }));

    expect(screen.getByRole('textbox', { name: 'First name' })).toHaveValue('Paige');
    expect(screen.getByRole('textbox', { name: 'Last name' })).toHaveValue('Turner');
    expect(screen.getByRole('textbox', { name: 'Email' })).toHaveValue('paige.turner@example.com');
    expect(screen.getByRole('textbox', { name: 'Phone (optional)' })).toHaveValue('+12025551212');
    expect(screen.queryByRole('button', { name: /Paige Turner/ })).not.toBeInTheDocument();
  });

  it('closes the suggestions on a click outside the picker', async () => {
    const user = userEvent.setup();
    render(
      <div>
        <ContactPicker suggestions={sampleSuggestions} />
        <button type="button">Elsewhere</button>
      </div>,
    );

    await user.click(screen.getByRole('textbox', { name: 'First name' }));
    expect(screen.getByRole('button', { name: /Paige Turner/ })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Elsewhere' }));
    expect(screen.queryByRole('button', { name: /Paige Turner/ })).not.toBeInTheDocument();
  });

  it('filters suggestions by the first-name text', async () => {
    const user = userEvent.setup();
    render(<ContactPicker suggestions={sampleSuggestions} />);

    await user.type(screen.getByRole('textbox', { name: 'First name' }), 'Sue');

    expect(screen.getByRole('button', { name: /Sue Permann/ })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Paige Turner/ })).not.toBeInTheDocument();
  });

  it('requires a passcode once passcode verification is selected', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<ContactPicker templateRole={sampleRole} onSubmit={onSubmit} />);

    expect(screen.queryByRole('textbox', { name: 'Passcode' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Passcode' }));
    expect(screen.getByRole('button', { name: 'Passcode' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Done' })).toBeDisabled();

    await user.type(screen.getByRole('textbox', { name: 'Passcode' }), '1234');
    await user.click(screen.getByRole('button', { name: 'Done' }));

    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ auth_methods: [ 'passcode' ], passcode: '1234' }));
  });

  it('holds Done until every selected verification method is satisfied', async () => {
    const user = userEvent.setup();
    render(<ContactPicker templateRole={sampleRole} />);

    await user.click(screen.getByRole('button', { name: 'Email' }));
    await user.click(screen.getByRole('button', { name: 'Passcode' }));

    // The role already carries an email, so only the empty passcode is holding Done back
    expect(screen.getByRole('button', { name: 'Done' })).toBeDisabled();

    await user.type(screen.getByRole('textbox', { name: 'Passcode' }), '4321');
    expect(screen.getByRole('button', { name: 'Done' })).toBeEnabled();
  });

  it('locks verification methods the account is not entitled to', async () => {
    const user = userEvent.setup();
    render(<ContactPicker templateRole={{ ...sampleRole, auth_methods: [ 'kba' ] }} availableAuthMethods={[ 'passcode', 'email' ]} />);

    expect(screen.getByRole('button', { name: 'Email' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'SMS code' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'ID check' })).toBeDisabled();

    // A locked method that is already selected stays clickable, so it can still be turned off
    const kba = screen.getByRole('button', { name: 'KBA' });
    expect(kba).toBeEnabled();
    expect(kba).toHaveAttribute('aria-pressed', 'true');

    await user.click(kba);
    expect(screen.getByRole('button', { name: 'KBA' })).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByRole('button', { name: 'KBA' })).toBeDisabled();
  });

  it('treats the signing options as a three-way choice', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<ContactPicker templateRole={sampleRole} onSubmit={onSubmit} />);

    expect(screen.getByRole('button', { name: 'None' })).toHaveAttribute('aria-pressed', 'true');

    await user.click(screen.getByRole('button', { name: 'May delegate' }));
    expect(screen.getByRole('button', { name: 'None' })).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByRole('button', { name: 'Name locked' })).toHaveAttribute('aria-pressed', 'false');

    await user.click(screen.getByRole('button', { name: 'Name locked' }));
    expect(screen.getByRole('button', { name: 'May delegate' })).toHaveAttribute('aria-pressed', 'false');
    await user.click(screen.getByRole('button', { name: 'Done' }));
    expect(onSubmit).toHaveBeenLastCalledWith(expect.objectContaining({ delegator: false, name_locked: true }));

    await user.click(screen.getByRole('button', { name: 'None' }));
    await user.click(screen.getByRole('button', { name: 'Done' }));
    expect(onSubmit).toHaveBeenLastCalledWith(expect.objectContaining({ delegator: false, name_locked: false }));
  });

  it('formats the phone number to E.164', async () => {
    const user = userEvent.setup();
    render(<ContactPicker availableAuthMethods={[ 'passcode', 'email', 'sms' ]} />);

    const phone = screen.getByRole('textbox', { name: 'Phone (optional)' });

    await user.type(phone, '2125551212');
    expect(phone).toHaveValue('+12125551212');

    await user.clear(phone);
    await user.click(phone);
    await user.paste('(212) 555-1212');
    expect(phone).toHaveValue('+12125551212');
  });

  it('hides the phone field unless SMS verification is available', () => {
    const { rerender } = render(<ContactPicker />);
    expect(screen.queryByRole('textbox', { name: 'Phone (optional)' })).not.toBeInTheDocument();

    rerender(<ContactPicker availableAuthMethods={[ 'passcode', 'email', 'sms' ]} />);
    expect(screen.getByRole('textbox', { name: 'Phone (optional)' })).toBeInTheDocument();
  });

  it('fires onCancel when the user cancels', async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();
    const onSubmit = vi.fn();
    render(<ContactPicker templateRole={sampleRole} onCancel={onCancel} onSubmit={onSubmit} />);

    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('hides Cancel when the host provides its own way out', () => {
    const { rerender } = render(<ContactPicker templateRole={sampleRole} />);
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();

    rerender(<ContactPicker templateRole={sampleRole} showCancel={false} />);
    expect(screen.queryByRole('button', { name: 'Cancel' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Done' })).toBeInTheDocument();
  });
});
