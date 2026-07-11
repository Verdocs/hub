import userEvent from '@testing-library/user-event';
import { render, screen } from '@testing-library/react';
import Toggle from './Toggle';

const buttons = [
  { id: 'one', label: 'One', icon: <svg aria-hidden="true" /> },
  { id: 'two', label: 'Two', icon: <svg aria-hidden="true" /> },
];

describe('Toggle', () => {
  it('renders a labeled group with the first button selected by default', () => {
    render(<Toggle label="View" buttons={buttons} />);

    expect(screen.getByRole('group', { name: 'View' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'One' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Two' })).toHaveAttribute('aria-pressed', 'false');
  });

  it('starts from defaultSelection', () => {
    render(<Toggle label="View" buttons={buttons} defaultSelection={1} />);

    expect(screen.getByRole('button', { name: 'Two' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('moves the selection on click and fires onChange', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Toggle label="View" buttons={buttons} onChange={onChange} />);

    await user.click(screen.getByRole('button', { name: 'Two' }));

    expect(screen.getByRole('button', { name: 'Two' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'One' })).toHaveAttribute('aria-pressed', 'false');
    expect(onChange).toHaveBeenCalledWith(buttons[1], 1);
  });

  it('leaves the selection to the parent when controlled', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Toggle label="View" buttons={buttons} selection={0} onChange={onChange} />);

    await user.click(screen.getByRole('button', { name: 'Two' }));

    expect(onChange).toHaveBeenCalledWith(buttons[1], 1);
    expect(screen.getByRole('button', { name: 'One' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Two' })).toHaveAttribute('aria-pressed', 'false');
  });
});
