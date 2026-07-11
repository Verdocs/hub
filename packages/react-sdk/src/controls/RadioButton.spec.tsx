import type { ChangeEvent } from 'react';
import userEvent from '@testing-library/user-event';
import { render, screen } from '@testing-library/react';
import RadioButton from './RadioButton';

describe('RadioButton', () => {
  it('renders a labeled radio button, unselected by default', () => {
    render(<RadioButton label="Typed" name="mode" value="type" />);

    expect(screen.getByRole('radio', { name: 'Typed' })).not.toBeChecked();
  });

  it('selects on click and fires onChange with its value', async () => {
    const user = userEvent.setup();
    let reportedValue = '';
    const onChange = vi.fn((e: ChangeEvent<HTMLInputElement>) => {
      reportedValue = e.target.value;
    });
    render(<RadioButton label="Drawn" name="mode" value="draw" onChange={onChange} />);

    await user.click(screen.getByRole('radio', { name: 'Drawn' }));

    expect(screen.getByRole('radio', { name: 'Drawn' })).toBeChecked();
    expect(onChange).toHaveBeenCalledOnce();
    expect(reportedValue).toBe('draw');
  });

  it('moves the selection within a named group', async () => {
    const user = userEvent.setup();
    render(
      <>
        <RadioButton label="Typed" name="mode" value="type" defaultChecked />
        <RadioButton label="Drawn" name="mode" value="draw" />
      </>,
    );

    await user.click(screen.getByRole('radio', { name: 'Drawn' }));

    expect(screen.getByRole('radio', { name: 'Drawn' })).toBeChecked();
    expect(screen.getByRole('radio', { name: 'Typed' })).not.toBeChecked();
  });

  it('cannot be selected when disabled', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<RadioButton label="Locked" name="mode" value="x" disabled onChange={onChange} />);

    await user.click(screen.getByRole('radio', { name: 'Locked' }));

    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByRole('radio', { name: 'Locked' })).not.toBeChecked();
  });
});
