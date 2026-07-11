import userEvent from '@testing-library/user-event';
import { render, screen } from '@testing-library/react';
import HelpIcon from './HelpIcon';

describe('HelpIcon', () => {
  it('shows the tooltip on hover and hides it again', async () => {
    const user = userEvent.setup();
    render(<HelpIcon text="Sample help text" />);

    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();

    await user.hover(screen.getByRole('img', { name: 'Help' }));
    expect(screen.getByRole('tooltip')).toHaveTextContent('Sample help text');

    await user.unhover(screen.getByRole('img', { name: 'Help' }));
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  it('shows the tooltip on keyboard focus and hides it on blur', async () => {
    const user = userEvent.setup();
    render(<HelpIcon text="Keyboard help" />);

    await user.tab();
    expect(screen.getByRole('img', { name: 'Help' })).toHaveFocus();
    expect(screen.getByRole('tooltip')).toHaveTextContent('Keyboard help');

    await user.tab();
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  it('renders a caller-supplied icon in place of the default', () => {
    render(<HelpIcon text="Custom" icon={<svg data-testid="custom-icon" />} />);

    expect(screen.getByTestId('custom-icon')).toBeInTheDocument();
  });
});
