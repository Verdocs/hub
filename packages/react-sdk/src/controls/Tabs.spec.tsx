import userEvent from '@testing-library/user-event';
import { render, screen } from '@testing-library/react';
import Tabs from './Tabs';

const tabs = [
  { id: 'one', label: 'One' },
  { id: 'two', label: 'Two' },
  { id: 'three', label: 'Three', disabled: true },
  { id: 'four', label: 'Four' },
];

describe('Tabs', () => {
  it('renders a tablist with aria-selected on the selected tab', () => {
    render(<Tabs tabs={tabs} selectedTab={1} />);

    expect(screen.getByRole('tablist')).toBeInTheDocument();

    const rendered = screen.getAllByRole('tab');
    expect(rendered).toHaveLength(4);
    expect(rendered[0]).toHaveAttribute('aria-selected', 'false');
    expect(rendered[1]).toHaveAttribute('aria-selected', 'true');
    expect(rendered[2]).toBeDisabled();
  });

  it('fires onSelectTab on click and ignores disabled tabs', async () => {
    const onSelectTab = vi.fn();
    const user = userEvent.setup();
    render(<Tabs tabs={tabs} selectedTab={0} onSelectTab={onSelectTab} />);

    await user.click(screen.getByRole('tab', { name: 'Two' }));
    expect(onSelectTab).toHaveBeenCalledWith(tabs[1], 1);

    await user.click(screen.getByRole('tab', { name: 'Three' }));
    expect(onSelectTab).toHaveBeenCalledTimes(1);
  });

  it('moves selection with the keyboard, skipping disabled tabs and wrapping', async () => {
    const onSelectTab = vi.fn();
    const user = userEvent.setup();
    render(<Tabs tabs={tabs} selectedTab={1} onSelectTab={onSelectTab} />);

    await user.tab();
    expect(screen.getByRole('tab', { name: 'Two' })).toHaveFocus();

    await user.keyboard('{ArrowRight}');
    expect(onSelectTab).toHaveBeenLastCalledWith(tabs[3], 3);
    expect(screen.getByRole('tab', { name: 'Four' })).toHaveFocus();

    await user.keyboard('{Home}');
    expect(onSelectTab).toHaveBeenLastCalledWith(tabs[0], 0);
    expect(screen.getByRole('tab', { name: 'One' })).toHaveFocus();

    await user.keyboard('{ArrowLeft}');
    expect(onSelectTab).toHaveBeenLastCalledWith(tabs[3], 3);
    expect(onSelectTab).toHaveBeenCalledTimes(3);
  });
});
