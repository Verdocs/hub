import userEvent from '@testing-library/user-event';
import { render, screen } from '@testing-library/react';
import Checkbox from './Checkbox';

describe('Checkbox', () => {
  it('renders a labeled checkbox, unchecked by default', () => {
    render(<Checkbox label="Accept the terms" />);

    expect(screen.getByRole('checkbox', { name: 'Accept the terms' })).not.toBeChecked();
  });

  it('toggles when clicked and fires onChange', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Checkbox label="Accept" onChange={onChange} />);

    const box = screen.getByRole('checkbox', { name: 'Accept' });
    await user.click(box);
    expect(box).toBeChecked();
    expect(onChange).toHaveBeenCalledOnce();

    await user.click(box);
    expect(box).not.toBeChecked();
  });

  it('toggles when the label text is clicked', async () => {
    const user = userEvent.setup();
    render(<Checkbox label="Click my label" />);

    await user.click(screen.getByText('Click my label'));
    expect(screen.getByRole('checkbox', { name: 'Click my label' })).toBeChecked();
  });

  it('leaves the value to the parent when controlled', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Checkbox label="Controlled" checked={false} onChange={onChange} />);

    const box = screen.getByRole('checkbox', { name: 'Controlled' });
    await user.click(box);

    expect(onChange).toHaveBeenCalledOnce();
    expect(box).not.toBeChecked();
  });

  it('cannot be toggled when disabled', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Checkbox label="Locked" disabled onChange={onChange} />);

    await user.click(screen.getByRole('checkbox', { name: 'Locked' }));

    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByRole('checkbox', { name: 'Locked' })).not.toBeChecked();
  });
});
