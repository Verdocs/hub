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

    await user.click(screen.getByRole('button', { name: 'OK' }));

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

  it('requires a name and a valid email before enabling OK', async () => {
    const user = userEvent.setup();
    render(<ContactPicker />);

    const okButton = screen.getByRole('button', { name: 'OK' });
    expect(okButton).toBeDisabled();

    await user.type(screen.getByRole('textbox', { name: 'First name' }), 'Paige');
    await user.type(screen.getByRole('textbox', { name: 'Last name' }), 'Turner');
    await user.type(screen.getByRole('textbox', { name: 'Email:' }), 'not-an-email');
    expect(okButton).toBeDisabled();

    await user.clear(screen.getByRole('textbox', { name: 'Email:' }));
    await user.type(screen.getByRole('textbox', { name: 'Email:' }), 'paige.turner@example.com');
    expect(okButton).toBeEnabled();
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
    expect(screen.getByRole('textbox', { name: 'Email:' })).toHaveValue('paige.turner@example.com');
    expect(screen.getByRole('textbox', { name: 'Phone:' })).toHaveValue('+12025551212');
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

    expect(screen.queryByRole('textbox', { name: 'Passcode:' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('checkbox', { name: 'Passcode' }));
    expect(screen.getByRole('button', { name: 'OK' })).toBeDisabled();

    await user.type(screen.getByRole('textbox', { name: 'Passcode:' }), '1234');
    await user.click(screen.getByRole('button', { name: 'OK' }));

    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ auth_methods: [ 'passcode' ], passcode: '1234' }));
  });

  it('treats delegator and name-locked as mutually exclusive', async () => {
    const user = userEvent.setup();
    render(<ContactPicker />);

    const delegator = screen.getByRole('checkbox', { name: 'May delegate signing' });
    const nameLocked = screen.getByRole('checkbox', { name: 'Name locked' });

    await user.click(delegator);
    expect(nameLocked).toBeDisabled();

    await user.click(delegator);
    expect(nameLocked).toBeEnabled();

    await user.click(nameLocked);
    expect(delegator).toBeDisabled();
  });

  it('formats the phone number to E.164', async () => {
    const user = userEvent.setup();
    render(<ContactPicker availableAuthMethods={[ 'passcode', 'email', 'sms' ]} />);

    const phone = screen.getByRole('textbox', { name: 'Phone:' });

    await user.type(phone, '2125551212');
    expect(phone).toHaveValue('+12125551212');

    await user.clear(phone);
    await user.click(phone);
    await user.paste('(212) 555-1212');
    expect(phone).toHaveValue('+12125551212');
  });

  it('hides the phone row unless SMS verification is available', () => {
    const { rerender } = render(<ContactPicker />);
    expect(screen.queryByRole('textbox', { name: 'Phone:' })).not.toBeInTheDocument();

    rerender(<ContactPicker availableAuthMethods={[ 'passcode', 'email', 'sms' ]} />);
    expect(screen.getByRole('textbox', { name: 'Phone:' })).toBeInTheDocument();
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
});
