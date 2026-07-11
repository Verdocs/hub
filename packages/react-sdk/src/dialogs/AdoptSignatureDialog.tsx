import { useEffect, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import SignatureXIcon from '../controls/icons/SignatureXIcon';
import TextInput from '../controls/TextInput';
import Button from '../controls/Button';
import Tabs from '../controls/Tabs';
import Dialog from './Dialog';

/**
 * The image the user adopted. The initials variant reuses this shape, with
 * fullName carrying the entered initials.
 */
export interface IAdoptedSignature {
  /** Which mode produced the image. */
  type: 'typed' | 'drawn';
  /** The name (or initials) as entered when the image was adopted. */
  fullName: string;
  /** PNG data URL of the adopted image, on a transparent background. */
  dataUrl: string;
}

export interface AdoptSignatureDialogProps {
  /** Seeds the name input. The initials variant uppercases the seed, matching the legacy dialog. */
  fullName?: string;
  /** If true, the name input is read-only. Used when the sender has locked the recipient's name. */
  nameLocked?: boolean;
  /** The initials variant swaps the labels and shrinks the preview for initials adoption. */
  variant?: 'signature' | 'initials';
  /** Called with the adopted image when the user clicks Adopt & Sign. */
  onAdopt?: (adopted: IAdoptedSignature) => void;
  /** Called when the user cancels or dismisses the dialog. */
  onCancel?: () => void;
}

interface IPoint {
  x: number;
  y: number;
}

// The legacy dialogs fetched the Dancing Script webfont from Google Fonts at
// runtime. This port stays network-free: it renders with the host page's copy
// when that face is registered and falls back to the platform cursive font.
const SCRIPT_FONT = "'Dancing Script'";
const SCRIPT_FONT_STACK = `${SCRIPT_FONT}, cursive`;

// Signature ink is always black, matching the legacy pen color. It is not a
// themable token on purpose: adopted images must look like ink on paper.
const INK_COLOR = '#000000';

const MODE_TABS = [
  { id: 'typed', label: 'Type' },
  { id: 'drawn', label: 'Draw' },
];

const COPY = {
  signature: {
    heading: 'Adopt Your Signature',
    intro: 'Confirm your name and signature.',
    inputLabel: 'Full Name',
    styleLabel: 'Select a signature style',
    previewLabel: 'Signature Preview',
    disclaimer:
      'By clicking "Adopt & Sign", I agree that the signature above will be the electronic representation of my signature for all purposes '
      + 'when I use it to sign documents. Applying it to a document is legally equivalent to signing with a pen on paper.',
  },
  initials: {
    heading: 'Create Your Initial',
    intro: 'Confirm your initials.',
    inputLabel: 'Initials',
    styleLabel: 'Select an initials style',
    previewLabel: 'Initials Preview',
    disclaimer:
      'By clicking "Adopt & Sign", I agree that the initials above will be the electronic representation of my initials for all purposes '
      + 'when I use them to sign documents. Applying them to a document is legally equivalent to signing with a pen on paper.',
  },
};

function getCanvasPoint(e: ReactPointerEvent<HTMLCanvasElement>): IPoint {
  const rect = e.currentTarget.getBoundingClientRect();
  return { x: e.clientX - rect.left, y: e.clientY - rect.top };
}

/**
 * Ask the user to adopt a signature (or initials, via the variant prop) either by
 * typing their name, rendered in a script font, or by drawing it with a mouse,
 * finger, or stylus. The adopted image is returned as a PNG data URL.
 *
 * This is a presentational component: it never calls the server. Persisting the
 * image (createSignature / createInitials in js-sdk) and stamping it onto a field
 * are the caller's job, inside onAdopt:
 *
 * ```tsx
 * <AdoptSignatureDialog
 *   fullName="Paige Turner"
 *   onAdopt={async ({ dataUrl }) => {
 *     const blob = await (await fetch(dataUrl)).blob();
 *     await createSignature(endpoint, 'signature', blob);
 *   }}
 *   onCancel={() => setAdopting(false)}
 * />
 * ```
 */
export default function AdoptSignatureDialog({ fullName = '', nameLocked = false, variant = 'signature', onAdopt, onCancel }: AdoptSignatureDialogProps) {
  const copy = COPY[variant];

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawingRef = useRef(false);
  const currentStrokeRef = useRef<IPoint[]>([]);
  const lastPointRef = useRef<IPoint | null>(null);

  const [mode, setMode] = useState<'typed' | 'drawn'>('typed');
  const [enteredName, setEnteredName] = useState(() => (variant === 'initials' ? fullName.toUpperCase() : fullName));
  const [strokes, setStrokes] = useState<IPoint[][]>([]);

  const hasDrawn = strokes.length > 0;
  const adoptDisabled = mode === 'typed' ? enteredName.trim().length === 0 : !hasDrawn;

  // Repaint whenever a preview input changes. Assigning canvas.width both sizes
  // the backing store to the on-screen size times devicePixelRatio (so strokes
  // and text stay crisp on high-DPI screens) and wipes prior content, so every
  // pass draws from scratch. Committed strokes are kept in CSS-pixel space and
  // survive tab switches, mirroring the legacy dialog.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return undefined;
    }

    const paint = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.max(1, Math.round(rect.width * dpr));
      canvas.height = Math.max(1, Math.round(rect.height * dpr));

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        return;
      }

      // Draw in CSS pixels; the transform maps them onto the scaled backing store.
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.strokeStyle = INK_COLOR;
      ctx.fillStyle = INK_COLOR;
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      const width = rect.width || canvas.width;
      const height = rect.height || canvas.height;

      if (mode === 'typed') {
        const text = enteredName.trim();
        if (!text) {
          return;
        }

        // Shrink the font until the text fits the preview, the same fitting loop
        // the legacy dialog used, with a floor so odd metrics cannot spin forever.
        let fontSize = 100;
        let metrics: TextMetrics;
        do {
          fontSize -= 2;
          ctx.font = `${fontSize}px ${SCRIPT_FONT_STACK}`;
          metrics = ctx.measureText(text);
        } while (
          fontSize > 12
          && (metrics.width > width - 24 || (metrics.actualBoundingBoxAscent ?? 0) + (metrics.actualBoundingBoxDescent ?? 0) + 24 > height)
        );

        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, width / 2, height / 2);
        return;
      }

      for (const stroke of strokes) {
        const [first, ...rest] = stroke;
        if (!first) {
          continue;
        }

        ctx.beginPath();
        ctx.moveTo(first.x, first.y);

        // The same quadratic-midpoint smoothing the live handlers use, so a
        // committed stroke looks identical to one in progress.
        let prev = first;
        for (const point of rest) {
          ctx.quadraticCurveTo(prev.x, prev.y, (prev.x + point.x) / 2, (prev.y + point.y) / 2);
          prev = point;
        }

        if (rest.length > 0) {
          ctx.lineTo(prev.x, prev.y);
        }

        ctx.stroke();
      }
    };

    paint();

    // If the host registered the script font but it has not finished loading,
    // repaint once it lands so the typed preview upgrades from the fallback.
    // jsdom has no FontFaceSet, hence the guard.
    let disposed = false;
    const fonts = document.fonts as FontFaceSet | undefined;
    if (fonts) {
      fonts.load(`16px ${SCRIPT_FONT}`).then(
        () => {
          if (!disposed) {
            paint();
          }
        },
        () => undefined,
      );
    }

    return () => {
      disposed = true;
    };
  }, [mode, enteredName, strokes]);

  const handlePointerDown = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    if (mode !== 'drawn') {
      return;
    }

    e.preventDefault();

    const canvas = e.currentTarget;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return;
    }

    const point = getCanvasPoint(e);
    drawingRef.current = true;
    currentStrokeRef.current = [point];
    lastPointRef.current = point;

    ctx.beginPath();
    ctx.moveTo(point.x, point.y);

    // Capture the pointer so the stroke keeps tracking when it leaves the canvas.
    // jsdom does not implement pointer capture, hence the optional call.
    canvas.setPointerCapture?.(e.pointerId);
  };

  const handlePointerMove = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current) {
      return;
    }

    e.preventDefault();

    const ctx = e.currentTarget.getContext('2d');
    const last = lastPointRef.current;
    if (!ctx || !last) {
      return;
    }

    const point = getCanvasPoint(e);
    currentStrokeRef.current.push(point);

    // Drawing a quadratic curve to the midpoint smooths out the raw pointer
    // samples, which otherwise render as jagged line segments.
    ctx.quadraticCurveTo(last.x, last.y, (last.x + point.x) / 2, (last.y + point.y) / 2);
    ctx.stroke();

    lastPointRef.current = point;
  };

  const handlePointerUp = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current) {
      return;
    }

    e.preventDefault();

    const ctx = e.currentTarget.getContext('2d');
    const last = lastPointRef.current;
    if (ctx && last) {
      ctx.lineTo(last.x, last.y);
      ctx.stroke();
    }

    const stroke = currentStrokeRef.current;
    drawingRef.current = false;
    currentStrokeRef.current = [];
    lastPointRef.current = null;
    e.currentTarget.releasePointerCapture?.(e.pointerId);

    if (stroke.length > 0) {
      setStrokes(prev => [...prev, stroke]);
    }
  };

  // Interrupted strokes (an incoming call, a palm touch) are dropped rather
  // than committed, matching the legacy behavior.
  const handlePointerCancel = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    drawingRef.current = false;
    currentStrokeRef.current = [];
    lastPointRef.current = null;
    e.currentTarget.releasePointerCapture?.(e.pointerId);
  };

  const handleClear = () => {
    drawingRef.current = false;
    currentStrokeRef.current = [];
    lastPointRef.current = null;
    // Dropping the strokes retriggers the paint effect, which wipes the canvas.
    setStrokes([]);
  };

  const handleAdopt = () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    onAdopt?.({ type: mode, fullName: enteredName, dataUrl: canvas.toDataURL('image/png') });
  };

  const footer = (
    <div className="vdocs:flex vdocs:flex-row vdocs:gap-5">
      <Button label="Cancel" variant="outline" className="vdocs:flex-1" onClick={() => onCancel?.()} />
      <Button label="Adopt & Sign" className="vdocs:flex-1" disabled={adoptDisabled} onClick={handleAdopt} />
    </div>
  );

  return (
    <Dialog heading={copy.heading} onClose={onCancel} footer={footer}>
      <div className="vdocs:flex vdocs:flex-col">
        <div className="vdocs:mb-2.5 vdocs:text-[13px] vdocs:font-light vdocs:text-ink">
          {copy.intro}
        </div>

        <TextInput
          label={copy.inputLabel}
          value={enteredName}
          disabled={nameLocked}
          description={nameLocked ? 'Your name has been set by the sender and cannot be changed.' : undefined}
          onChange={e => setEnteredName(e.target.value)}
        />

        <div className="vdocs:mb-1.5 vdocs:text-[13px] vdocs:text-ink">
          {copy.styleLabel}
        </div>

        <Tabs tabs={MODE_TABS} selectedTab={mode === 'typed' ? 0 : 1} onSelectTab={tab => setMode(tab.id === 'drawn' ? 'drawn' : 'typed')} />

        <div className="vdocs:mt-2.5 vdocs:flex vdocs:min-h-[26px] vdocs:items-center vdocs:justify-between">
          <div className="vdocs:text-[13px] vdocs:text-ink">
            {copy.previewLabel}
          </div>
          {mode === 'drawn' && <Button label="Clear" variant="text" size="xsmall" disabled={!hasDrawn} onClick={handleClear} />}
        </div>

        <div
          className={`vdocs:relative vdocs:my-2.5 vdocs:rounded-ctl vdocs:border vdocs:border-solid vdocs:border-edge-light vdocs:bg-canvas ${
            variant === 'initials' ? 'vdocs:max-w-[50%]' : ''
          }`}>
          {/* The guide sits behind the transparent canvas so it shows through
              on screen without appearing in the adopted PNG. */}
          <div aria-hidden="true" className="vdocs:pointer-events-none vdocs:absolute vdocs:inset-x-[9px] vdocs:bottom-[9px] vdocs:z-[1] vdocs:flex vdocs:h-7 vdocs:items-end vdocs:gap-0.5">
            <SignatureXIcon className="vdocs:h-7 vdocs:w-[25px] vdocs:shrink-0 vdocs:text-edge-light" />
            <div className="vdocs:h-px vdocs:flex-1 vdocs:bg-[linear-gradient(to_right,var(--vdocs-color-edge-light)_50%,transparent_50%)] vdocs:bg-[length:16px_1px] vdocs:bg-repeat-x" />
          </div>
          <canvas
            ref={canvasRef}
            role="img"
            aria-label={copy.previewLabel}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerCancel}
            className={`vdocs:relative vdocs:z-[2] vdocs:block vdocs:h-[79px] vdocs:w-full vdocs:touch-none vdocs:bg-transparent ${
              mode === 'drawn' ? 'vdocs:cursor-crosshair' : ''
            }`}
          />
        </div>

        <div className="vdocs:py-2 vdocs:text-justify vdocs:text-[11px] vdocs:leading-[14px] vdocs:text-muted">
          {copy.disclaimer}
        </div>
      </div>
    </Dialog>
  );
}
