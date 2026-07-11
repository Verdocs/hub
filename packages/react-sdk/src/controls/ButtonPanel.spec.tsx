import userEvent from '@testing-library/user-event';
import { render, screen } from '@testing-library/react';
import ButtonPanel from './ButtonPanel';

describe('ButtonPanel', () => {
  it('opens the panel on click and closes it on click-away', async () => {
    const user = userEvent.setup();
    render(
      <div>
        <ButtonPanel icon={<svg aria-hidden="true" />} label="Field settings">
          <div>
            Panel Body
          </div>
        </ButtonPanel>
        <button>
          Outside
        </button>
      </div>,
    );

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Field settings' }));

    const dialog = screen.getByRole('dialog', { name: 'Field settings' });
    expect(dialog).toContainElement(screen.getByText('Panel Body'));
    expect(dialog.closest('.vdocs-portal')?.parentElement).toBe(document.body);

    await user.click(screen.getByRole('button', { name: 'Outside' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('toggles the panel closed when the trigger is clicked again', async () => {
    const user = userEvent.setup();
    render(
      <ButtonPanel icon={<svg aria-hidden="true" />} label="Field settings">
        <div>
          Panel Body
        </div>
      </ButtonPanel>,
    );

    const trigger = screen.getByRole('button', { name: 'Field settings' });
    expect(trigger).toHaveAttribute('aria-expanded', 'false');

    await user.click(trigger);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(trigger).toHaveAttribute('aria-expanded', 'true');

    await user.click(trigger);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });
});
