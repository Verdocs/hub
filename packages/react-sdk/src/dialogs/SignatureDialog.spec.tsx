import userEvent from '@testing-library/user-event';
import { render, screen } from '@testing-library/react';
import SignatureDialog from './SignatureDialog';

describe('SignatureDialog', () => {
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

  it('hosts the signature adopt flow and returns the adopted image', async () => {
    const user = userEvent.setup();
    const onAdopt = vi.fn();
    render(<SignatureDialog fullName="Paige Turner" onAdopt={onAdopt} />);

    expect(screen.getByText('Adopt Your Signature')).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Type' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Draw' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Adopt & Sign' }));
    expect(onAdopt).toHaveBeenCalledWith({ type: 'typed', fullName: 'Paige Turner', dataUrl: 'data:image/png;base64,MOCK' });
  });

  it('fires onCancel from the cancel button', async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();
    render(<SignatureDialog onCancel={onCancel} />);

    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
