import userEvent from '@testing-library/user-event';
import { render, screen } from '@testing-library/react';
import ToolbarIcon from './ToolbarIcon';

describe('ToolbarIcon', () => {
  it('renders a button named for its tooltip text and handles clicks', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<ToolbarIcon text="Add signature" icon={<svg />} onClick={onClick} />);

    await user.click(screen.getByRole('button', { name: 'Add signature' }));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('shows the tooltip on hover and hides it again', async () => {
    const user = userEvent.setup();
    render(<ToolbarIcon text="Add signature" icon={<svg />} />);

    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();

    await user.hover(screen.getByRole('button', { name: 'Add signature' }));
    expect(screen.getByRole('tooltip')).toHaveTextContent('Add signature');

    await user.unhover(screen.getByRole('button', { name: 'Add signature' }));
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  it('shows the tooltip on keyboard focus and hides it on blur', async () => {
    const user = userEvent.setup();
    render(<ToolbarIcon text="Add signature" icon={<svg />} />);

    await user.tab();
    expect(screen.getByRole('button', { name: 'Add signature' })).toHaveFocus();
    expect(screen.getByRole('tooltip')).toHaveTextContent('Add signature');

    await user.tab();
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  it('never shows an empty tooltip', async () => {
    const user = userEvent.setup();
    render(<ToolbarIcon icon={<svg />} />);

    await user.hover(screen.getByRole('button'));
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });
});
