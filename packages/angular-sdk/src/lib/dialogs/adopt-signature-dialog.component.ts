import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DOCUMENT,
  effect,
  ElementRef,
  inject,
  input,
  linkedSignal,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { VerdocsTabsComponent, type ITab } from '../controls/tabs.component';
import { VerdocsTextInputComponent } from '../controls/text-input.component';
import { VerdocsButtonComponent } from '../controls/button.component';
import { VerdocsDialogComponent } from './dialog.component';

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

function getCanvasPoint(event: PointerEvent): IPoint {
  const rect = (event.currentTarget as HTMLCanvasElement).getBoundingClientRect();
  return { x: event.clientX - rect.left, y: event.clientY - rect.top };
}

/**
 * Ask the user to adopt a signature (or initials, via the variant input) either by
 * typing their name, rendered in a script font, or by drawing it with a mouse,
 * finger, or stylus. The adopted image comes back through the adopted event as a
 * PNG data URL (React's onAdopt callback; onCancel is the cancel output).
 *
 * This is a presentational component: it never calls the server. Persisting the
 * image (createSignature / createInitials in js-sdk) and stamping it onto a field
 * are the caller's job, from the adopted event:
 *
 * ```html
 * <verdocs-adopt-signature-dialog fullName="Paige Turner" (adopted)="persist($event)" (cancel)="adopting.set(false)" />
 * ```
 */
@Component({
  selector: 'verdocs-adopt-signature-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ VerdocsDialogComponent, VerdocsButtonComponent, VerdocsTextInputComponent, VerdocsTabsComponent ],
  template: `
    <verdocs-dialog [heading]="copy().heading" [footer]="footerTpl" (closed)="cancel.emit()">
      <div class="vdocs:flex vdocs:flex-col">
        <div class="vdocs:mb-2.5 vdocs:text-[13px] vdocs:font-light vdocs:text-ink">{{ copy().intro }}</div>

        <verdocs-text-input
          [label]="copy().inputLabel"
          [(value)]="enteredName"
          [disabled]="nameLocked()"
          [description]="nameLocked() ? 'Your name has been set by the sender and cannot be changed.' : ''" />

        <div class="vdocs:mb-1.5 vdocs:text-[13px] vdocs:text-ink">{{ copy().styleLabel }}</div>

        <verdocs-tabs [tabs]="modeTabs" [(selectedTab)]="selectedTab" />

        <div class="vdocs:mt-2.5 vdocs:flex vdocs:min-h-[26px] vdocs:items-center vdocs:justify-between">
          <div class="vdocs:text-[13px] vdocs:text-ink">{{ copy().previewLabel }}</div>
          @if (mode() === 'drawn') {
            <verdocs-button label="Clear" variant="text" size="xsmall" [disabled]="!hasDrawn()" (click)="clear()" />
          }
        </div>

        <div [class]="previewClasses()">
          <!-- The guide sits behind the transparent canvas so it shows through
               on screen without appearing in the adopted PNG. -->
          <div
            aria-hidden="true"
            class="vdocs:pointer-events-none vdocs:absolute vdocs:inset-x-[9px] vdocs:bottom-[9px] vdocs:z-[1] vdocs:flex vdocs:h-7 vdocs:items-end vdocs:gap-0.5">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 25 28" fill="currentColor" class="vdocs:h-7 vdocs:w-[25px] vdocs:shrink-0 vdocs:text-edge-light" aria-hidden="true">
              <path
                d="M24.0625 28.0078H18.4961L12.7539 17.7344C12.5846 17.4219 12.3958 16.9792 12.1875 16.4062H12.1094C11.9922 16.6927 11.7969 17.1354 11.5234 17.7344L5.60547 28.0078H0L9.17969 13.9258L0.742188 0H6.42578L11.4844 9.45312C11.8099 10.0781 12.1029 10.7031 12.3633 11.3281H12.4219C12.7995 10.5078 13.125 9.85677 13.3984 9.375L18.6523 0H23.8867L15.2539 13.8867L24.0625 28.0078Z" />
            </svg>
            <div class="vdocs:h-px vdocs:flex-1 vdocs:bg-[linear-gradient(to_right,var(--vdocs-color-edge-light)_50%,transparent_50%)] vdocs:bg-[length:16px_1px] vdocs:bg-repeat-x"></div>
          </div>
          <canvas
            #canvas
            role="img"
            [attr.aria-label]="copy().previewLabel"
            [class]="canvasClasses()"
            (pointerdown)="onPointerDown($event)"
            (pointermove)="onPointerMove($event)"
            (pointerup)="onPointerUp($event)"
            (pointercancel)="onPointerCancel($event)"></canvas>
        </div>

        <div class="vdocs:py-2 vdocs:text-justify vdocs:text-[11px] vdocs:leading-[14px] vdocs:text-muted">{{ copy().disclaimer }}</div>
      </div>
    </verdocs-dialog>

    <ng-template #footerTpl>
      <div class="vdocs:flex vdocs:flex-row vdocs:gap-5">
        <verdocs-button label="Cancel" variant="outline" class="vdocs:flex-1" (click)="cancel.emit()" />
        <verdocs-button [label]="'Adopt & Sign'" class="vdocs:flex-1" [disabled]="adoptDisabled()" (click)="adopt()" />
      </div>
    </ng-template>
  `,
})
export class VerdocsAdoptSignatureDialogComponent {
  private readonly document = inject(DOCUMENT);

  /** Seeds the name input. The initials variant uppercases the seed, matching the legacy dialog. */
  readonly fullName = input('');
  /** If true, the name input is read-only. Used when the sender has locked the recipient's name. */
  readonly nameLocked = input(false);
  /** The initials variant swaps the labels and shrinks the preview for initials adoption. */
  readonly variant = input<'signature' | 'initials'>('signature');

  /** Emitted with the adopted image when the user clicks Adopt & Sign. */
  readonly adopted = output<IAdoptedSignature>();
  /** Emitted when the user cancels or dismisses the dialog. */
  readonly cancel = output<void>();

  protected readonly modeTabs = MODE_TABS;
  protected readonly copy = computed(() => COPY[this.variant()]);

  protected readonly selectedTab = signal(0);
  protected readonly mode = computed<'typed' | 'drawn'>(() => (this.selectedTab() === 1 ? 'drawn' : 'typed'));

  protected readonly enteredName = linkedSignal(() => (this.variant() === 'initials' ? this.fullName().toUpperCase() : this.fullName()));
  protected readonly strokes = signal<IPoint[][]>([]);

  protected readonly hasDrawn = computed(() => this.strokes().length > 0);
  protected readonly adoptDisabled = computed(() => (this.mode() === 'typed' ? this.enteredName().trim().length === 0 : !this.hasDrawn()));

  protected readonly previewClasses = computed(
    () =>
      'vdocs:relative vdocs:my-2.5 vdocs:rounded-ctl vdocs:border vdocs:border-solid vdocs:border-edge-light vdocs:bg-canvas ' +
      (this.variant() === 'initials' ? 'vdocs:max-w-[50%]' : ''),
  );

  protected readonly canvasClasses = computed(
    () =>
      'vdocs:relative vdocs:z-[2] vdocs:block vdocs:h-[79px] vdocs:w-full vdocs:touch-none vdocs:bg-transparent ' +
      (this.mode() === 'drawn' ? 'vdocs:cursor-crosshair' : ''),
  );

  private readonly canvas = viewChild<ElementRef<HTMLCanvasElement>>('canvas');

  private drawing = false;
  private currentStroke: IPoint[] = [];
  private lastPoint: IPoint | null = null;

  constructor() {
    // Repaint whenever a preview input changes. Committed strokes are kept in
    // CSS-pixel space and survive tab switches, mirroring the legacy dialog.
    effect(onCleanup => {
      const canvas = this.canvas()?.nativeElement;
      const mode = this.mode();
      const text = this.enteredName();
      const strokes = this.strokes();
      if (!canvas) {
        return;
      }

      this.paint(canvas, mode, text, strokes);

      // If the host registered the script font but it has not finished loading,
      // repaint once it lands so the typed preview upgrades from the fallback.
      // jsdom has no FontFaceSet, hence the guard.
      let disposed = false;
      const fonts = this.document.fonts as FontFaceSet | undefined;
      if (fonts) {
        fonts.load(`16px ${SCRIPT_FONT}`).then(
          () => {
            if (!disposed) {
              this.paint(canvas, mode, text, strokes);
            }
          },
          () => undefined,
        );
      }

      onCleanup(() => {
        disposed = true;
      });
    });
  }

  // Assigning canvas.width both sizes the backing store to the on-screen size
  // times devicePixelRatio (so strokes and text stay crisp on high-DPI screens)
  // and wipes prior content, so every pass draws from scratch.
  private paint(canvas: HTMLCanvasElement, mode: 'typed' | 'drawn', text: string, strokes: IPoint[][]) {
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
      const trimmed = text.trim();
      if (!trimmed) {
        return;
      }

      // Shrink the font until the text fits the preview, the same fitting loop
      // the legacy dialog used, with a floor so odd metrics cannot spin forever.
      let fontSize = 100;
      let metrics: TextMetrics;
      do {
        fontSize -= 2;
        ctx.font = `${fontSize}px ${SCRIPT_FONT_STACK}`;
        metrics = ctx.measureText(trimmed);
      } while (
        fontSize > 12 &&
        (metrics.width > width - 24 || (metrics.actualBoundingBoxAscent ?? 0) + (metrics.actualBoundingBoxDescent ?? 0) + 24 > height)
      );

      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(trimmed, width / 2, height / 2);
      return;
    }

    for (const stroke of strokes) {
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

  protected onPointerDown(event: PointerEvent) {
    if (this.mode() !== 'drawn') {
      return;
    }

    event.preventDefault();

    const canvas = event.currentTarget as HTMLCanvasElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return;
    }

    const point = getCanvasPoint(event);
    this.drawing = true;
    this.currentStroke = [ point ];
    this.lastPoint = point;

    ctx.beginPath();
    ctx.moveTo(point.x, point.y);

    // Capture the pointer so the stroke keeps tracking when it leaves the canvas.
    // jsdom does not implement pointer capture, hence the optional call.
    canvas.setPointerCapture?.(event.pointerId);
  }

  protected onPointerMove(event: PointerEvent) {
    if (!this.drawing) {
      return;
    }

    event.preventDefault();

    const ctx = (event.currentTarget as HTMLCanvasElement).getContext('2d');
    const last = this.lastPoint;
    if (!ctx || !last) {
      return;
    }

    const point = getCanvasPoint(event);
    this.currentStroke.push(point);

    // Drawing a quadratic curve to the midpoint smooths out the raw pointer
    // samples, which otherwise render as jagged line segments.
    ctx.quadraticCurveTo(last.x, last.y, (last.x + point.x) / 2, (last.y + point.y) / 2);
    ctx.stroke();

    this.lastPoint = point;
  }

  protected onPointerUp(event: PointerEvent) {
    if (!this.drawing) {
      return;
    }

    event.preventDefault();

    const canvas = event.currentTarget as HTMLCanvasElement;
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
    canvas.releasePointerCapture?.(event.pointerId);

    if (stroke.length > 0) {
      this.strokes.update(prev => [ ...prev, stroke ]);
    }
  }

  // Interrupted strokes (an incoming call, a palm touch) are dropped rather
  // than committed, matching the legacy behavior.
  protected onPointerCancel(event: PointerEvent) {
    this.drawing = false;
    this.currentStroke = [];
    this.lastPoint = null;
    (event.currentTarget as HTMLCanvasElement).releasePointerCapture?.(event.pointerId);
  }

  protected clear() {
    this.drawing = false;
    this.currentStroke = [];
    this.lastPoint = null;
    // Dropping the strokes retriggers the paint effect, which wipes the canvas.
    this.strokes.set([]);
  }

  protected adopt() {
    const canvas = this.canvas()?.nativeElement;
    if (!canvas) {
      return;
    }

    this.adopted.emit({ type: this.mode(), fullName: this.enteredName(), dataUrl: canvas.toDataURL('image/png') });
  }
}
