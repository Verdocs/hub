import userEvent from '@testing-library/user-event';
import { render, screen } from '@testing-library/react';
import ToggleButton from './ToggleButton';

describe('ToggleButton', () => {
  it('reflects the pressed state and requests the opposite on click', async () => {
    const onToggle = vi.fn();
    const user = userEvent.setup();
    render(<ToggleButton label="Bold" active={false} onToggle={onToggle} />);

    const button = screen.getByRole('button', { name: 'Bold' });
    expect(button).toHaveAttribute('aria-pressed', 'false');

    await user.click(button);
    expect(onToggle).toHaveBeenCalledWith(true);
  });

  it('renders pressed when active', () => {
    render(<ToggleButton label="Bold" active />);

    expect(screen.getByRole('button', { name: 'Bold' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('uses the label as the accessible name for icon buttons', () => {
    const { container } = render(
      <ToggleButton
        icon={<svg aria-hidden="true" />}
        label="Bold"
        active={false}
      />,
    );

    const button = screen.getByRole('button', { name: 'Bold' });
    expect(button).not.toHaveTextContent('Bold');
    expect(container.querySelector('svg')).toBeInTheDocument();
  });
});
