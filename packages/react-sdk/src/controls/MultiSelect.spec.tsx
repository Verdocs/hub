import userEvent from '@testing-library/user-event';
import { render, screen } from '@testing-library/react';
import MultiSelect from './MultiSelect';

const options = [
  { label: 'E-mail', value: 'email' },
  { label: 'SMS', value: 'sms' },
];

describe('MultiSelect', () => {
  it('opens the picker and adds a selection without closing', async () => {
    const onSelectionChanged = vi.fn();
    render(<MultiSelect label="Delivery Methods" options={options} selectedOptions={[]} onSelectionChanged={onSelectionChanged} />);

    expect(screen.getByText('Select...')).toBeInTheDocument();
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /Delivery Methods/ }));
    await userEvent.click(screen.getByRole('checkbox', { name: 'SMS' }));

    expect(onSelectionChanged).toHaveBeenCalledWith(['sms']);
    expect(screen.getByRole('checkbox', { name: 'E-mail' })).toBeInTheDocument();
  });

  it('summarizes selections in the trigger and removes them on uncheck', async () => {
    const onSelectionChanged = vi.fn();
    render(<MultiSelect label="Delivery Methods" options={options} selectedOptions={['email', 'sms']} onSelectionChanged={onSelectionChanged} />);

    expect(screen.queryByText('Select...')).not.toBeInTheDocument();
    expect(screen.getByText('E-mail')).toBeInTheDocument();
    expect(screen.getByText('SMS')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /Delivery Methods/ }));

    const checkbox = screen.getByRole('checkbox', { name: 'E-mail' });
    expect(checkbox).toBeChecked();

    await userEvent.click(checkbox);
    expect(onSelectionChanged).toHaveBeenCalledWith(['sms']);
  });

  it('closes on outside clicks and on Escape', async () => {
    render(<MultiSelect label="Delivery Methods" options={options} />);

    const trigger = screen.getByRole('button', { name: /Delivery Methods/ });

    await userEvent.click(trigger);
    expect(screen.getByRole('checkbox', { name: 'SMS' })).toBeInTheDocument();

    await userEvent.click(document.body);
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();

    await userEvent.click(trigger);
    expect(screen.getByRole('checkbox', { name: 'SMS' })).toBeInTheDocument();

    await userEvent.keyboard('{Escape}');
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
  });
});
