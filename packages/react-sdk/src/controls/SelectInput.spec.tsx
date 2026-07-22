import userEvent from '@testing-library/user-event';
import { render, screen } from '@testing-library/react';
import SelectInput from './SelectInput';

const options = [
  { label: 'Contract', value: 'contract' },
  { label: 'Invoice', value: 'invoice' },
  { label: 'Purchase Order', value: 'po' },
];

describe('SelectInput', () => {
  it('renders a labeled select and reports changes', async () => {
    let value = '';
    render(
      <SelectInput
        label="Document Type"
        options={options}
        defaultValue="contract"
        onChange={e => (value = e.target.value)}
      />,
    );

    const select = screen.getByLabelText(/Document Type/);
    expect(screen.getByRole('option', { name: 'Purchase Order' })).toBeInTheDocument();

    await userEvent.selectOptions(select, 'invoice');

    expect(select).toHaveValue('invoice');
    expect(value).toBe('invoice');
  });

  it('marks required fields and wires required/disabled to the element', () => {
    render(<SelectInput label="Document Type" options={options} required disabled />);

    const select = screen.getByLabelText(/Document Type/);
    expect(select).toBeRequired();
    expect(select).toBeDisabled();
    expect(screen.getByText('*')).toBeInTheDocument();
  });
});
