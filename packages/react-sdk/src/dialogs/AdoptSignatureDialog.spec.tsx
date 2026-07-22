import userEvent from '@testing-library/user-event';
import { render, screen } from '@testing-library/react';
import AdoptSignatureDialog from './AdoptSignatureDialog';

// jsdom ships no canvas implementation (getContext returns null), so we stub the
// small slice of the 2D API the dialog touches. The metrics values don't matter:
// the font-fitting loop just needs numbers to compare.
function stubCanvas() {
  const context = {
    setTransform: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    quadraticCurveTo: vi.fn(),
    stroke: vi.fn(),
    fillText: vi.fn(),
    measureText: vi.fn(() => ({ width: 0 } as TextMetrics)),
  };

  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(context as unknown as CanvasRenderingContext2D);
  vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockReturnValue('data:image/png;base64,MOCK');
}

async function drawStroke(user: ReturnType<typeof userEvent.setup>, canvas: HTMLElement) {
  await user.pointer([
    { keys: '[MouseLeft>]', target: canvas, coords: { x: 20, y: 30 } },
    { target: canvas, coords: { x: 60, y: 40 } },
    { target: canvas, coords: { x: 90, y: 25 } },
    '[/MouseLeft]',
  ]);
}

describe('AdoptSignatureDialog', () => {
  beforeEach(() => {
    stubCanvas();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('enables adopt once a name is typed and returns a typed PNG', async () => {
    const user = userEvent.setup();
    const onAdopt = vi.fn();
    render(<AdoptSignatureDialog onAdopt={onAdopt} />);

    const adopt = screen.getByRole('button', { name: 'Adopt & Sign' });
    expect(adopt).toBeDisabled();

    await user.type(screen.getByRole('textbox', { name: /full name/i }), 'Paige Turner');
    expect(adopt).toBeEnabled();

    await user.click(adopt);
    expect(onAdopt).toHaveBeenCalledWith({ type: 'typed', fullName: 'Paige Turner', dataUrl: 'data:image/png;base64,MOCK' });
  });

  it('seeds the name from props and locks it when nameLocked is set', () => {
    render(<AdoptSignatureDialog fullName="Paige Turner" nameLocked />);

    expect(screen.getByRole('textbox', { name: /full name/i })).toHaveValue('Paige Turner');
    expect(screen.getByRole('textbox', { name: /full name/i })).toBeDisabled();
    expect(screen.getByText('Your name has been set by the sender and cannot be changed.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Adopt & Sign' })).toBeEnabled();
  });

  it('requires a drawing in draw mode and returns a drawn PNG', async () => {
    const user = userEvent.setup();
    const onAdopt = vi.fn();
    render(<AdoptSignatureDialog fullName="Paige Turner" onAdopt={onAdopt} />);

    await user.click(screen.getByRole('tab', { name: 'Draw' }));

    const adopt = screen.getByRole('button', { name: 'Adopt & Sign' });
    expect(adopt).toBeDisabled();

    await drawStroke(user, screen.getByRole('img', { name: 'Signature Preview' }));
    expect(adopt).toBeEnabled();

    await user.click(adopt);
    expect(onAdopt).toHaveBeenCalledWith({ type: 'drawn', fullName: 'Paige Turner', dataUrl: 'data:image/png;base64,MOCK' });
  });

  it('clears the drawing and disables adopt again', async () => {
    const user = userEvent.setup();
    render(<AdoptSignatureDialog />);

    await user.click(screen.getByRole('tab', { name: 'Draw' }));

    const clear = screen.getByRole('button', { name: 'Clear' });
    expect(clear).toBeDisabled();

    await drawStroke(user, screen.getByRole('img', { name: 'Signature Preview' }));
    expect(clear).toBeEnabled();

    await user.click(clear);
    expect(clear).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Adopt & Sign' })).toBeDisabled();
  });

  it('cancels from the cancel button and the dialog close button', async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();
    render(<AdoptSignatureDialog onCancel={onCancel} />);

    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onCancel).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole('button', { name: 'Close' }));
    expect(onCancel).toHaveBeenCalledTimes(2);
  });

  it('swaps copy and uppercases the seed for the initials variant', () => {
    render(<AdoptSignatureDialog variant="initials" fullName="pt" />);

    expect(screen.getByText('Create Your Initial')).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: /initials/i })).toHaveValue('PT');
    expect(screen.getByRole('img', { name: 'Initials Preview' })).toBeInTheDocument();
  });
});
