import userEvent from '@testing-library/user-event';
import { render, screen } from '@testing-library/react';
import MenuPanel from './MenuPanel';

describe('MenuPanel', () => {
  it('renders a dialog into document.body at the requested width', () => {
    const { container } = render(
      <MenuPanel width={280}>
        <div>
          Panel Content
        </div>
      </MenuPanel>,
    );

    const dialog = screen.getByRole('dialog');
    expect(container).not.toContainElement(dialog);
    expect(dialog.parentElement).toBe(document.body);
    expect(dialog).toHaveStyle({ width: '280px' });
    expect(screen.getByText('Panel Content')).toBeInTheDocument();
  });

  it('shows the overlay by default and omits it when disabled', () => {
    const { unmount } = render(
      <MenuPanel>
        <div>
          One
        </div>
      </MenuPanel>,
    );
    expect(document.querySelector('.vdocs-menu-panel-overlay')).toBeInTheDocument();
    unmount();

    render(
      <MenuPanel overlay={false}>
        <div>
          Two
        </div>
      </MenuPanel>,
    );
    expect(document.querySelector('.vdocs-menu-panel-overlay')).not.toBeInTheDocument();
  });

  it('fires onClose for outside clicks but not inside ones', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(
      <MenuPanel onClose={onClose}>
        <button>
          Inside
        </button>
      </MenuPanel>,
    );

    await user.click(screen.getByRole('button', { name: 'Inside' }));
    expect(onClose).not.toHaveBeenCalled();

    const overlay = document.querySelector<HTMLElement>('.vdocs-menu-panel-overlay');
    expect(overlay).not.toBeNull();
    await user.click(overlay as HTMLElement);
    expect(onClose).toHaveBeenCalledOnce();
  });
});
