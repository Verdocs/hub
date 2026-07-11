import { useRef } from 'react';
import userEvent from '@testing-library/user-event';
import { render, screen } from '@testing-library/react';
import Portal from './Portal';

function Harness({ onClickAway }: { onClickAway?: () => void }) {
  const anchorRef = useRef<HTMLButtonElement>(null);

  return (
    <div>
      <button ref={anchorRef}>
        Anchor
      </button>
      <button>
        Outside
      </button>
      <Portal anchor={anchorRef} onClickAway={onClickAway}>
        <div>
          Portal Content
        </div>
      </Portal>
    </div>
  );
}

describe('Portal', () => {
  it('renders its content into document.body', () => {
    const { container } = render(<Harness />);

    const content = screen.getByText('Portal Content');
    expect(container).not.toContainElement(content);
    expect(content.closest('.vdocs-portal')?.parentElement).toBe(document.body);
  });

  it('fires onClickAway only for clicks outside the content and anchor', async () => {
    const onClickAway = vi.fn();
    const user = userEvent.setup();
    render(<Harness onClickAway={onClickAway} />);

    await user.click(screen.getByText('Portal Content'));
    await user.click(screen.getByRole('button', { name: 'Anchor' }));
    expect(onClickAway).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: 'Outside' }));
    expect(onClickAway).toHaveBeenCalledOnce();
  });

  it('positions the wrapper from the anchor rect', () => {
    const anchor = document.createElement('button');
    anchor.getBoundingClientRect = () =>
      ({ top: 80, bottom: 100, left: 50, right: 90, width: 40, height: 20, x: 50, y: 80, toJSON: () => ({}) }) as DOMRect;
    document.body.appendChild(anchor);

    render(
      <Portal anchor={anchor}>
        <div>
          Tip
        </div>
      </Portal>,
    );

    expect(screen.getByText('Tip').closest('.vdocs-portal')).toHaveStyle({ top: '100px', left: '50px' });

    anchor.remove();
  });
});
