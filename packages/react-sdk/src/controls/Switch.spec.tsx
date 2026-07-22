import userEvent from '@testing-library/user-event';
import { render, screen } from '@testing-library/react';
import Switch from './Switch';

describe('Switch', () => {
  it('renders an accessible switch, off by default', () => {
    render(<Switch label="Send reminders" />);

    expect(screen.getByRole('switch', { name: 'Send reminders' })).not.toBeChecked();
  });

  it('toggles on click and reports the new value through onCheckedChange', async () => {
    const user = userEvent.setup();
    const onCheckedChange = vi.fn();
    render(<Switch label="Send reminders" onCheckedChange={onCheckedChange} />);

    const sw = screen.getByRole('switch', { name: 'Send reminders' });
    await user.click(sw);
    expect(sw).toBeChecked();
    expect(onCheckedChange).toHaveBeenCalledWith(true);

    await user.click(sw);
    expect(sw).not.toBeChecked();
    expect(onCheckedChange).toHaveBeenLastCalledWith(false);
  });

  it('still fires the native onChange', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Switch label="Reminders" onChange={onChange} />);

    await user.click(screen.getByRole('switch', { name: 'Reminders' }));

    expect(onChange).toHaveBeenCalledOnce();
  });

  it('leaves the value to the parent when controlled', async () => {
    const user = userEvent.setup();
    const onCheckedChange = vi.fn();
    render(<Switch label="Controlled" checked onCheckedChange={onCheckedChange} />);

    const sw = screen.getByRole('switch', { name: 'Controlled' });
    expect(sw).toBeChecked();

    await user.click(sw);

    expect(onCheckedChange).toHaveBeenCalledWith(false);
    expect(sw).toBeChecked();
  });

  it('ignores clicks when disabled', async () => {
    const user = userEvent.setup();
    const onCheckedChange = vi.fn();
    render(<Switch label="Locked" disabled onCheckedChange={onCheckedChange} />);

    await user.click(screen.getByRole('switch', { name: 'Locked' }));

    expect(onCheckedChange).not.toHaveBeenCalled();
    expect(screen.getByRole('switch', { name: 'Locked' })).not.toBeChecked();
  });
});
