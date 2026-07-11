import userEvent from '@testing-library/user-event';
import { render, screen } from '@testing-library/react';
import DateInput from './DateInput';

describe('DateInput', () => {
  it('renders a labeled date input and reports typed dates', async () => {
    let value = '';
    render(<DateInput label="Expiration Date" onChange={e => (value = e.target.value)} />);

    const input = screen.getByLabelText(/Expiration Date/);
    expect(input).toHaveAttribute('type', 'date');

    await userEvent.type(input, '2026-07-04');

    expect(input).toHaveValue('2026-07-04');
    expect(value).toBe('2026-07-04');
  });

  it('marks required fields and wires required/disabled to the element', () => {
    render(<DateInput label="Effective Date" required disabled />);

    const input = screen.getByLabelText(/Effective Date/);
    expect(input).toBeRequired();
    expect(input).toBeDisabled();
    expect(screen.getByText('*')).toBeInTheDocument();
  });
});
