import userEvent from '@testing-library/user-event';
import { render, screen } from '@testing-library/react';
import { QuickFilter } from './QuickFilter';
import { Pagination } from './Pagination';
import { TextInput } from './TextInput';
import { Dropdown } from './Dropdown';
import { Button } from './Button';

describe('Button', () => {
  it('renders its label and handles clicks', async () => {
    const onClick = vi.fn();
    render(<Button label="Click Me" onClick={onClick} />);

    await userEvent.click(screen.getByRole('button', { name: 'Click Me' }));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('does not fire when disabled', async () => {
    const onClick = vi.fn();
    render(<Button label="Nope" disabled onClick={onClick} />);

    await userEvent.click(screen.getByRole('button', { name: 'Nope' }));
    expect(onClick).not.toHaveBeenCalled();
  });
});

describe('TextInput', () => {
  it('renders a labeled input and clears via the clear button', async () => {
    const onClear = vi.fn();
    const onChange = vi.fn();
    render(<TextInput label="Name" clearable value="abc" onChange={onChange} onClear={onClear} />);

    expect(screen.getByLabelText(/Name/)).toHaveValue('abc');

    await userEvent.click(screen.getByRole('button', { name: 'Clear' }));
    expect(onClear).toHaveBeenCalledOnce();
  });

  it('toggles password visibility', async () => {
    render(<TextInput label="Password" type="password" value="secret" onChange={() => undefined} />);

    const input = screen.getByLabelText(/Password/);
    expect(input).toHaveAttribute('type', 'password');

    await userEvent.click(screen.getByRole('button', { name: 'Show password' }));
    expect(input).toHaveAttribute('type', 'text');
  });
});

describe('QuickFilter', () => {
  const options = [
    { value: 'all', label: 'All' },
    { value: 'starred', label: 'Starred' },
  ];

  it('shows the selected option and fires onChange', async () => {
    const onChange = vi.fn();
    render(<QuickFilter label="Starred" value="all" options={options} onChange={onChange} />);

    await userEvent.click(screen.getByRole('button', { name: /Starred.*All/ }));
    await userEvent.click(screen.getByRole('option', { name: 'Starred' }));

    expect(onChange).toHaveBeenCalledWith(options[1]);
  });
});

describe('Dropdown', () => {
  it('opens a menu, skips separators, and fires onSelect', async () => {
    const onSelect = vi.fn();
    render(
      <Dropdown
        options={[
          { label: 'Preview / Send', id: 'send' },
          { label: '' },
          { label: 'Edit', id: 'edit', disabled: true },
        ]}
        onSelect={onSelect}
      />,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Open menu' }));

    expect(screen.getByRole('menuitem', { name: 'Edit' })).toBeDisabled();

    await userEvent.click(screen.getByRole('menuitem', { name: 'Preview / Send' }));
    expect(onSelect).toHaveBeenCalledWith({ label: 'Preview / Send', id: 'send' });
  });
});

describe('Pagination', () => {
  it('renders pages and navigates', async () => {
    const onSelectPage = vi.fn();
    render(<Pagination selectedPage={0} itemCount={45} perPage={10} onSelectPage={onSelectPage} />);

    expect(screen.getByRole('button', { name: 'Page 1' })).toHaveAttribute('aria-current', 'page');
    expect(screen.queryByRole('button', { name: 'First page' })).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Last page' }));
    expect(onSelectPage).toHaveBeenCalledWith(4);
  });

  it('shows the first-page shortcut when beyond page one', () => {
    render(<Pagination selectedPage={3} itemCount={100} perPage={10} onSelectPage={() => undefined} />);

    expect(screen.getByRole('button', { name: 'First page' })).toBeInTheDocument();
  });
});
