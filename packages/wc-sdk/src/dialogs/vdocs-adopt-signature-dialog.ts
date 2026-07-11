import { html, nothing } from 'lit';
import type { PropertyValues } from 'lit';
import { createRef, ref } from 'lit/directives/ref.js';
import type { ITabSelectEvent, ITab } from '../controls/vdocs-tabs.js';
import { signatureXIcon } from '../controls/icons/index.js';
import type { IAdoptedSignature } from './dialog-events.js';
import { VdocsElement } from '../base/vdocs-element.js';
import { register } from '../base/register.js';
import '../controls/vdocs-text-input.js';
import '../controls/vdocs-button.js';
import '../controls/vdocs-tabs.js';
import './vdocs-dialog.js';

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

const MODE_TABS: ITab[] = [
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
      'By clicking "Adopt & Sign", I agree that the signature above will be the electronic representation of my signature for all purposes ' +
      'when I use it to sign documents. Applying it to a document is legally equivalent to signing with a pen on paper.',
  },
  initials: {
    heading: 'Create Your Initial',
    intro: 'Confirm your initials.',
    inputLabel: 'Initials',
    styleLabel: 'Select an initials style',
    previewLabel: 'Initials Preview',
    disclaimer:
      'By clicking "Adopt & Sign", I agree that the initials above will be the electronic representation of my initials for all purposes ' +
      'when I use them to sign documents. Applying them to a document is legally equivalent to signing with a pen on paper.',
  },
};

function getCanvasPoint(e: PointerEvent): IPoint {
  const rect = (e.currentTarget as HTMLCanvasElement).getBoundingClientRect();
  return { x: e.clientX - rect.left, y: e.clientY - rect.top };
}

/**
 * Ask the user to adopt a signature (or initials, via the variant attribute)
 * either by typing their name, rendered in a script font, or by drawing it
 * with a mouse, finger, or stylus. The adopted image comes back through
 * vdocs-adopted as a PNG data URL.
 *
 * This is a presentational element: it never calls the server. Persisting the
 * image (createSignature / createInitials in js-sdk) and stamping it onto a
 * field are the host's job, from the vdocs-adopted event.
 *
 * React prop mapping: fullName is full-name (the seed is captured once, at
 * first render, and the initials variant uppercases it), nameLocked is
 * name-locked, and variant is the same-named attribute.
 *
 * ```html
 * <vdocs-adopt-signature-dialog full-name="Paige Turner"></vdocs-adopt-signature-dialog>
 * ```
 *
 * @fires vdocs-adopted - Fired with the adopted IAdoptedSignature in detail when the user clicks Adopt & Sign (React's onAdopt).
 * @fires vdocs-cancel - Fired when the user cancels or dismisses the dialog (React's onCancel).
 */
export class VdocsAdoptSignatureDialog extends VdocsElement {
  static override properties = {
    fullName: { type: String, attribute: 'full-name' },
    nameLocked: { type: Boolean, attribute: 'name-locked' },
    variant: { type: String },
    mode: { state: true },
    enteredName: { state: true },
    strokes: { state: true },
  };

  /** Seeds the name input. The initials variant uppercases the seed, matching the legacy dialog. */
  declare fullName: string;
  /** If true, the name input is read-only. Used when the sender has locked the recipient's name. */
  declare nameLocked: boolean;
  /** The initials variant swaps the labels and shrinks the preview for initials adoption. */
  declare variant: 'signature' | 'initials';

  private declare mode: 'typed' | 'drawn';
  private declare enteredName: string;
  private declare strokes: IPoint[][];

  private canvasRef = createRef<HTMLCanvasElement>();
  private drawing = false;
  private currentStroke: IPoint[] = [];
  private lastPoint: IPoint | null = null;
  private paintToken = 0;

  constructor() {
    super();
    this.fullName = '';
    this.nameLocked = false;
    this.variant = 'signature';
    this.mode = 'typed';
    this.enteredName = '';
    this.strokes = [];
  }

  override willUpdate() {
    // The seed is captured once, at first render, matching the React port's
    // useState initializer: later fullName changes don't clobber edits.
    if (!this.hasUpdated) {
      this.enteredName = this.variant === 'initials' ? this.fullName.toUpperCase() : this.fullName;
    }
  }

  // Typed as the untyped PropertyValues so the private state keys (mode,
  // enteredName, strokes) are accepted; PropertyValues<this> only exposes
  // public members.
  override updated(changed: PropertyValues) {
    if (changed.has('mode') || changed.has('enteredName') || changed.has('strokes')) {
      this.repaint();
    }
  }

  // Repaint whenever a preview input changes. Assigning canvas.width both
  // sizes the backing store to the on-screen size times devicePixelRatio (so
  // strokes and text stay crisp on high-DPI screens) and wipes prior content,
  // so every pass draws from scratch. Committed strokes are kept in CSS-pixel
  // space and survive tab switches, mirroring the legacy dialog.
  private repaint() {
    this.paint();

    // If the host registered the script font but it has not finished loading,
    // repaint once it lands so the typed preview upgrades from the fallback.
    // The token drops stale repaints when the inputs change again first.
    const token = ++this.paintToken;
    document.fonts.load(`16px ${SCRIPT_FONT}`).then(
      () => {
        if (token === this.paintToken && this.isConnected) {
          this.paint();
        }
      },
      () => undefined,
    );
  }

  private paint() {
    const canvas = this.canvasRef.value;
    if (!canvas) {
      return;
    }

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

    if (this.mode === 'typed') {
      const text = this.enteredName.trim();
      if (!text) {
        return;
      }

      // Shrink the font until the text fits the preview, the same fitting
      // loop the legacy dialog used, with a floor so odd metrics cannot spin
      // forever.
      let fontSize = 100;
      let metrics: TextMetrics;
      do {
        fontSize -= 2;
        ctx.font = `${fontSize}px ${SCRIPT_FONT_STACK}`;
        metrics = ctx.measureText(text);
      } while (
        fontSize > 12 &&
        (metrics.width > width - 24 || (metrics.actualBoundingBoxAscent ?? 0) + (metrics.actualBoundingBoxDescent ?? 0) + 24 > height)
      );

      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, width / 2, height / 2);
      return;
    }

    for (const stroke of this.strokes) {
      const [ first, ...rest ] = stroke;
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
  }

  private handlePointerDown = (e: PointerEvent) => {
    if (this.mode !== 'drawn') {
      return;
    }

    e.preventDefault();

    const canvas = e.currentTarget as HTMLCanvasElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return;
    }

    const point = getCanvasPoint(e);
    this.drawing = true;
    this.currentStroke = [ point ];
    this.lastPoint = point;

    ctx.beginPath();
    ctx.moveTo(point.x, point.y);

    // Capture the pointer so the stroke keeps tracking when it leaves the canvas.
    canvas.setPointerCapture(e.pointerId);
  };

  private handlePointerMove = (e: PointerEvent) => {
    if (!this.drawing) {
      return;
    }

    e.preventDefault();

    const ctx = (e.currentTarget as HTMLCanvasElement).getContext('2d');
    const last = this.lastPoint;
    if (!ctx || !last) {
      return;
    }

    const point = getCanvasPoint(e);
    this.currentStroke.push(point);

    // Drawing a quadratic curve to the midpoint smooths out the raw pointer
    // samples, which otherwise render as jagged line segments.
    ctx.quadraticCurveTo(last.x, last.y, (last.x + point.x) / 2, (last.y + point.y) / 2);
    ctx.stroke();

    this.lastPoint = point;
  };

  private handlePointerUp = (e: PointerEvent) => {
    if (!this.drawing) {
      return;
    }

    e.preventDefault();

    const canvas = e.currentTarget as HTMLCanvasElement;
    const ctx = canvas.getContext('2d');
    const last = this.lastPoint;
    if (ctx && last) {
      ctx.lineTo(last.x, last.y);
      ctx.stroke();
    }

    const stroke = this.currentStroke;
    this.drawing = false;
    this.currentStroke = [];
    this.lastPoint = null;
    canvas.releasePointerCapture(e.pointerId);

    if (stroke.length > 0) {
      this.strokes = [ ...this.strokes, stroke ];
    }
  };

  // Interrupted strokes (an incoming call, a palm touch) are dropped rather
  // than committed, matching the legacy behavior.
  private handlePointerCancel = (e: PointerEvent) => {
    this.drawing = false;
    this.currentStroke = [];
    this.lastPoint = null;
    (e.currentTarget as HTMLCanvasElement).releasePointerCapture(e.pointerId);
  };

  private handleSelectTab = (e: CustomEvent<ITabSelectEvent>) => {
    // The composed controls' events are implementation details; the dialog's
    // public contract is vdocs-adopted.
    e.stopPropagation();
    this.mode = e.detail.tab.id === 'drawn' ? 'drawn' : 'typed';
  };

  private handleNameInput = (e: CustomEvent<{ value: string }>) => {
    e.stopPropagation();
    this.enteredName = e.detail.value;
  };

  private handleClear = () => {
    this.drawing = false;
    this.currentStroke = [];
    this.lastPoint = null;
    // Dropping the strokes retriggers the repaint, which wipes the canvas.
    this.strokes = [];
  };

  // Footer templates run with the base dialog as their event host, so these
  // handlers are arrow properties; see vdocs-dialog.
  private handleClose = (e: Event) => {
    e.stopPropagation();
    this.emit('vdocs-cancel');
  };

  private handleCancel = () => {
    this.emit('vdocs-cancel');
  };

  private handleAdopt = () => {
    const canvas = this.canvasRef.value;
    if (!canvas) {
      return;
    }

    this.emit<IAdoptedSignature>('vdocs-adopted', { type: this.mode, fullName: this.enteredName, dataUrl: canvas.toDataURL('image/png') });
  };

  override render() {
    const copy = COPY[this.variant] ?? COPY.signature;
    const hasDrawn = this.strokes.length > 0;
    const adoptDisabled = this.mode === 'typed' ? this.enteredName.trim().length === 0 : !hasDrawn;

    // The footer buttons stretch: flex-1 sizes the host and the arbitrary
    // variant reaches the control's inner native button.
    const footer = html`
      <div class="vdocs:flex vdocs:flex-row vdocs:gap-5">
        <vdocs-button label="Cancel" variant="outline" class="vdocs:flex-1 vdocs:[&>button]:w-full" @click=${this.handleCancel}></vdocs-button>
        <vdocs-button
          .label=${'Adopt & Sign'}
          class="vdocs:flex-1 vdocs:[&>button]:w-full"
          .disabled=${adoptDisabled}
          @click=${this.handleAdopt}></vdocs-button>
      </div>`;

    // The guide sits behind the transparent canvas so it shows through on
    // screen without appearing in the adopted PNG.
    return html`
      <vdocs-dialog .heading=${copy.heading} .footer=${footer} @vdocs-close=${this.handleClose}>
        <div class="vdocs:flex vdocs:flex-col">
          <div class="vdocs:mb-2.5 vdocs:text-[13px] vdocs:font-light vdocs:text-ink">${copy.intro}</div>

          <vdocs-text-input
            label=${copy.inputLabel}
            .value=${this.enteredName}
            .disabled=${this.nameLocked}
            description=${this.nameLocked ? 'Your name has been set by the sender and cannot be changed.' : ''}
            @vdocs-input=${this.handleNameInput}></vdocs-text-input>

          <div class="vdocs:mb-1.5 vdocs:text-[13px] vdocs:text-ink">${copy.styleLabel}</div>

          <vdocs-tabs .tabs=${MODE_TABS} .selectedTab=${this.mode === 'typed' ? 0 : 1} @vdocs-select-tab=${this.handleSelectTab}></vdocs-tabs>

          <div class="vdocs:mt-2.5 vdocs:flex vdocs:min-h-[26px] vdocs:items-center vdocs:justify-between">
            <div class="vdocs:text-[13px] vdocs:text-ink">${copy.previewLabel}</div>
            ${this.mode === 'drawn' ?
              html`<vdocs-button label="Clear" variant="text" size="xsmall" .disabled=${!hasDrawn} @click=${this.handleClear}></vdocs-button>` :
              nothing}
          </div>

          <div
            class="vdocs:relative vdocs:my-2.5 vdocs:rounded-ctl vdocs:border vdocs:border-solid vdocs:border-edge-light vdocs:bg-canvas ${this.variant === 'initials' ? 'vdocs:max-w-[50%]' : ''}">
            <div
              aria-hidden="true"
              class="vdocs:pointer-events-none vdocs:absolute vdocs:inset-x-[9px] vdocs:bottom-[9px] vdocs:z-[1] vdocs:flex vdocs:h-7 vdocs:items-end vdocs:gap-0.5">
              ${signatureXIcon({ className: 'vdocs:h-7 vdocs:w-[25px] vdocs:shrink-0 vdocs:text-edge-light' })}
              <div class="vdocs:h-px vdocs:flex-1 vdocs:bg-[linear-gradient(to_right,var(--vdocs-color-edge-light)_50%,transparent_50%)] vdocs:bg-[length:16px_1px] vdocs:bg-repeat-x"></div>
            </div>
            <canvas
              ${ref(this.canvasRef)}
              role="img"
              aria-label=${copy.previewLabel}
              @pointerdown=${this.handlePointerDown}
              @pointermove=${this.handlePointerMove}
              @pointerup=${this.handlePointerUp}
              @pointercancel=${this.handlePointerCancel}
              class="vdocs:relative vdocs:z-[2] vdocs:block vdocs:h-[79px] vdocs:w-full vdocs:touch-none vdocs:bg-transparent ${this.mode === 'drawn' ? 'vdocs:cursor-crosshair' : ''}"></canvas>
          </div>

          <div class="vdocs:py-2 vdocs:text-justify vdocs:text-[11px] vdocs:leading-[14px] vdocs:text-muted">${copy.disclaimer}</div>
        </div>
      </vdocs-dialog>`;
  }
}

register('vdocs-adopt-signature-dialog', VdocsAdoptSignatureDialog);

declare global {
  interface HTMLElementTagNameMap {
    'vdocs-adopt-signature-dialog': VdocsAdoptSignatureDialog;
  }
}
