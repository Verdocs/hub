import userEvent from '@testing-library/user-event';
import { render, screen } from '@testing-library/react';
import InitialDialog from './InitialDialog';

describe('InitialDialog', () => {
  beforeEach(() => {
    // jsdom has no canvas; stub just enough of the 2D API for the preview paint
    // and the adopt-time PNG capture.
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
      setTransform: vi.fn(),
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      quadraticCurveTo: vi.fn(),
      stroke: vi.fn(),
      fillText: vi.fn(),
      measureText: vi.fn(() => ({ width: 0 } as TextMetrics)),
    } as unknown as CanvasRenderingContext2D);
    vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockReturnValue('data:image/png;base64,MOCK');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders the initials variant seeded with uppercased initials', async () => {
    const user = userEvent.setup();
    const onAdopt = vi.fn();
    render(<InitialDialog initials="pt" onAdopt={onAdopt} />);

    expect(screen.getByText('Create Your Initial')).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: /initials/i })).toHaveValue('PT');

    await user.click(screen.getByRole('button', { name: 'Adopt & Sign' }));
    expect(onAdopt).toHaveBeenCalledWith({ type: 'typed', fullName: 'PT', dataUrl: 'data:image/png;base64,MOCK' });
  });

  it('disables adopt until initials are entered', async () => {
    const user = userEvent.setup();
    render(<InitialDialog />);

    const adopt = screen.getByRole('button', { name: 'Adopt & Sign' });
    expect(adopt).toBeDisabled();

    await user.type(screen.getByRole('textbox', { name: /initials/i }), 'PT');
    expect(adopt).toBeEnabled();
  });

  it('fires onCancel from the cancel button', async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();
    render(<InitialDialog onCancel={onCancel} />);

    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
