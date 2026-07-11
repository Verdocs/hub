import userEvent from '@testing-library/user-event';
import { render, screen } from '@testing-library/react';
import Flag from './Flag';

describe('Flag', () => {
  it('renders its label and handles body clicks', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<Flag label="FILL" onClick={onClick} />);

    await user.click(screen.getByText('FILL'));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('fires onSkip without triggering the body click handler', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    const onSkip = vi.fn();
    render(<Flag label="FILL" showSkip onClick={onClick} onSkip={onSkip} />);

    await user.click(screen.getByRole('button', { name: 'SKIP' }));
    expect(onSkip).toHaveBeenCalledOnce();
    expect(onClick).not.toHaveBeenCalled();
  });

  it('omits the skip link unless requested', () => {
    render(<Flag label="NEXT" variant="next" />);

    expect(screen.getByText('NEXT')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'SKIP' })).not.toBeInTheDocument();
  });
});
