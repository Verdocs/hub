<script lang="ts">
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

/**
 * Ask the user to adopt a signature (or initials, via the variant prop) either
 * by typing their name, rendered in a script font, or by drawing it with a
 * mouse, finger, or stylus. The adopted image comes back through the adopted
 * event as a PNG data URL. React's onAdopt/onCancel callbacks are the adopted
 * and cancel emits.
 *
 * This is a presentational component: it never calls the server. Persisting
 * the image (createSignature / createInitials in js-sdk) and stamping it onto
 * a field are the caller's job, in the adopted handler:
 *
 * ```vue
 * <VerdocsAdoptSignatureDialog
 *   full-name="Paige Turner"
 *   @adopted="saveSignature"
 *   @cancel="adopting = false"
 * />
 * ```
 *
 * ```typescript
 * const saveSignature = async ({ dataUrl }: IAdoptedSignature) => {
 *   const blob = await (await fetch(dataUrl)).blob();
 *   await createSignature(endpoint, 'signature', blob);
 * };
 * ```
 */
export interface VerdocsAdoptSignatureDialogProps {
  /** Seeds the name input. The initials variant uppercases the seed, matching the legacy dialog. */
  fullName?: string;
  /** If true, the name input is read-only. Used when the sender has locked the recipient's name. */
  nameLocked?: boolean;
  /** The initials variant swaps the labels and shrinks the preview for initials adoption. */
  variant?: 'signature' | 'initials';
}
</script>

<script setup lang="ts">
import { computed, ref, shallowRef, watchEffect } from 'vue';
import VerdocsTextInput from '../controls/VerdocsTextInput.vue';
import VerdocsButton from '../controls/VerdocsButton.vue';
import VerdocsTabs, { type ITab } from '../controls/VerdocsTabs.vue';
import { VerdocsSignatureXIcon } from '../controls/icons';
import VerdocsDialog from './VerdocsDialog.vue';

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

const { fullName = '', nameLocked = false, variant = 'signature' } = defineProps<VerdocsAdoptSignatureDialogProps>();

const emit = defineEmits<{
  /** Fired with the adopted image when the user clicks Adopt & Sign. */
  adopted: [adopted: IAdoptedSignature];
  /** Fired when the user cancels or dismisses the dialog. */
  cancel: [];
}>();

const copy = computed(() => COPY[variant]);

const canvasRef = ref<HTMLCanvasElement | null>(null);

// The stroke in progress renders imperatively and never drives the template,
// so plain variables beat refs here.
let drawing = false;
let currentStroke: IPoint[] = [];
let lastPoint: IPoint | null = null;

const mode = ref<'typed' | 'drawn'>('typed');
// The prop only seeds the input; edits after mount belong to the signer.
const enteredName = ref(variant === 'initials' ? fullName.toUpperCase() : fullName);
// Committed strokes are replaced wholesale on every commit, so a shallowRef is enough.
const strokes = shallowRef<IPoint[][]>([]);

const hasDrawn = computed(() => strokes.value.length > 0);
const adoptDisabled = computed(() => (mode.value === 'typed' ? enteredName.value.trim().length === 0 : !hasDrawn.value));

const selectedTabIndex = computed({
  get: () => (mode.value === 'drawn' ? 1 : 0),
  set: (index) => {
    mode.value = index === 1 ? 'drawn' : 'typed';
  },
});

// Repainting reassigns canvas.width, which both sizes the backing store to the
// on-screen size times devicePixelRatio (so strokes and text stay crisp on
// high-DPI screens) and wipes prior content, so every pass draws from scratch.
// Committed strokes are kept in CSS-pixel space and survive tab switches,
// mirroring the legacy dialog.
const paint = () => {
  const canvas = canvasRef.value;
  const currentMode = mode.value;
  const enteredText = enteredName.value.trim();
  const committedStrokes = strokes.value;
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

  if (currentMode === 'typed') {
    if (!enteredText) {
      return;
    }

    // Shrink the font until the text fits the preview, the same fitting loop
    // the legacy dialog used, with a floor so odd metrics cannot spin forever.
    let fontSize = 100;
    let metrics: TextMetrics;
    do {
      fontSize -= 2;
      ctx.font = `${fontSize}px ${SCRIPT_FONT_STACK}`;
      metrics = ctx.measureText(enteredText);
    } while (
      fontSize > 12
      && (metrics.width > width - 24 || (metrics.actualBoundingBoxAscent ?? 0) + (metrics.actualBoundingBoxDescent ?? 0) + 24 > height)
    );

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(enteredText, width / 2, height / 2);
    return;
  }

  for (const stroke of committedStrokes) {
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

// Repaint whenever a preview input changes: paint reads the canvas ref, the
// mode, the entered name, and the committed strokes, so the effect tracks all
// of them. Post flush waits for the canvas to be in the DOM.
watchEffect(
  (onCleanup) => {
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

    onCleanup(() => {
      disposed = true;
    });
  },
  { flush: 'post' },
);

const getCanvasPoint = (e: PointerEvent): IPoint => {
  const rect = (e.currentTarget as HTMLCanvasElement).getBoundingClientRect();
  return { x: e.clientX - rect.left, y: e.clientY - rect.top };
};

const handlePointerDown = (e: PointerEvent) => {
  if (mode.value !== 'drawn') {
    return;
  }

  e.preventDefault();

  const canvas = e.currentTarget as HTMLCanvasElement;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return;
  }

  const point = getCanvasPoint(e);
  drawing = true;
  currentStroke = [point];
  lastPoint = point;

  ctx.beginPath();
  ctx.moveTo(point.x, point.y);

  // Capture the pointer so the stroke keeps tracking when it leaves the canvas.
  // jsdom does not implement pointer capture, hence the optional call.
  canvas.setPointerCapture?.(e.pointerId);
};

const handlePointerMove = (e: PointerEvent) => {
  if (!drawing) {
    return;
  }

  e.preventDefault();

  const ctx = (e.currentTarget as HTMLCanvasElement).getContext('2d');
  const last = lastPoint;
  if (!ctx || !last) {
    return;
  }

  const point = getCanvasPoint(e);
  currentStroke.push(point);

  // Drawing a quadratic curve to the midpoint smooths out the raw pointer
  // samples, which otherwise render as jagged line segments.
  ctx.quadraticCurveTo(last.x, last.y, (last.x + point.x) / 2, (last.y + point.y) / 2);
  ctx.stroke();

  lastPoint = point;
};

const handlePointerUp = (e: PointerEvent) => {
  if (!drawing) {
    return;
  }

  e.preventDefault();

  const canvas = e.currentTarget as HTMLCanvasElement;
  const ctx = canvas.getContext('2d');
  const last = lastPoint;
  if (ctx && last) {
    ctx.lineTo(last.x, last.y);
    ctx.stroke();
  }

  const stroke = currentStroke;
  drawing = false;
  currentStroke = [];
  lastPoint = null;
  canvas.releasePointerCapture?.(e.pointerId);

  if (stroke.length > 0) {
    strokes.value = [ ...strokes.value, stroke ];
  }
};

// Interrupted strokes (an incoming call, a palm touch) are dropped rather
// than committed, matching the legacy behavior.
const handlePointerCancel = (e: PointerEvent) => {
  drawing = false;
  currentStroke = [];
  lastPoint = null;
  (e.currentTarget as HTMLCanvasElement).releasePointerCapture?.(e.pointerId);
};

const handleClear = () => {
  drawing = false;
  currentStroke = [];
  lastPoint = null;
  // Dropping the strokes retriggers the paint effect, which wipes the canvas.
  strokes.value = [];
};

const handleAdopt = () => {
  const canvas = canvasRef.value;
  if (!canvas) {
    return;
  }

  emit('adopted', { type: mode.value, fullName: enteredName.value, dataUrl: canvas.toDataURL('image/png') });
};
</script>

<template>
  <VerdocsDialog
    :heading="copy.heading"
    @close="emit('cancel')"
  >
    <div class="vdocs:flex vdocs:flex-col">
      <div class="vdocs:mb-2.5 vdocs:text-[13px] vdocs:font-light vdocs:text-ink">
        {{ copy.intro }}
      </div>

      <VerdocsTextInput
        v-model="enteredName"
        :label="copy.inputLabel"
        :disabled="nameLocked"
        :description="nameLocked ? 'Your name has been set by the sender and cannot be changed.' : undefined"
      />

      <div class="vdocs:mb-1.5 vdocs:text-[13px] vdocs:text-ink">
        {{ copy.styleLabel }}
      </div>

      <VerdocsTabs
        v-model:selected-tab="selectedTabIndex"
        :tabs="MODE_TABS"
      />

      <div class="vdocs:mt-2.5 vdocs:flex vdocs:min-h-[26px] vdocs:items-center vdocs:justify-between">
        <div class="vdocs:text-[13px] vdocs:text-ink">
          {{ copy.previewLabel }}
        </div>
        <VerdocsButton
          v-if="mode === 'drawn'"
          label="Clear"
          variant="text"
          size="xsmall"
          :disabled="!hasDrawn"
          @click="handleClear"
        />
      </div>

      <div
        :class="[
          'vdocs:relative vdocs:my-2.5 vdocs:rounded-ctl vdocs:border vdocs:border-solid vdocs:border-edge-light vdocs:bg-canvas',
          variant === 'initials' ? 'vdocs:max-w-[50%]' : '',
        ]"
      >
        <!-- The guide sits behind the transparent canvas so it shows through
             on screen without appearing in the adopted PNG. -->
        <div
          aria-hidden="true"
          class="vdocs:pointer-events-none vdocs:absolute vdocs:inset-x-[9px] vdocs:bottom-[9px] vdocs:z-[1] vdocs:flex vdocs:h-7 vdocs:items-end vdocs:gap-0.5"
        >
          <VerdocsSignatureXIcon class="vdocs:h-7 vdocs:w-[25px] vdocs:shrink-0 vdocs:text-edge-light" />
          <div class="vdocs:h-px vdocs:flex-1 vdocs:bg-[linear-gradient(to_right,var(--vdocs-color-edge-light)_50%,transparent_50%)] vdocs:bg-[length:16px_1px] vdocs:bg-repeat-x" />
        </div>
        <canvas
          ref="canvasRef"
          role="img"
          :aria-label="copy.previewLabel"
          :class="[
            'vdocs:relative vdocs:z-[2] vdocs:block vdocs:h-[79px] vdocs:w-full vdocs:touch-none vdocs:bg-transparent',
            mode === 'drawn' ? 'vdocs:cursor-crosshair' : '',
          ]"
          @pointerdown="handlePointerDown"
          @pointermove="handlePointerMove"
          @pointerup="handlePointerUp"
          @pointercancel="handlePointerCancel"
        />
      </div>

      <div class="vdocs:py-2 vdocs:text-justify vdocs:text-[11px] vdocs:leading-[14px] vdocs:text-muted">
        {{ copy.disclaimer }}
      </div>
    </div>

    <template #footer>
      <div class="vdocs:flex vdocs:flex-row vdocs:gap-5">
        <VerdocsButton
          label="Cancel"
          variant="outline"
          class="vdocs:flex-1"
          @click="emit('cancel')"
        />
        <VerdocsButton
          label="Adopt & Sign"
          class="vdocs:flex-1"
          :disabled="adoptDisabled"
          @click="handleAdopt"
        />
      </div>
    </template>
  </VerdocsDialog>
</template>
