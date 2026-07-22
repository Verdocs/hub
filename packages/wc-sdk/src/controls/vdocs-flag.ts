import { html, nothing } from 'lit';
import { VdocsElement } from '../base/vdocs-element.js';
import { register } from '../base/register.js';

export type TFlagVariant = 'fill' | 'next';

const BASE_CLASSES = 'vdocs:absolute vdocs:left-full vdocs:h-6 vdocs:flex vdocs:bg-[#13a10e] vdocs:font-sans vdocs:text-white vdocs:font-semibold ' +
  'vdocs:text-xs vdocs:leading-none vdocs:hover:drop-shadow-[0_3px_3px_rgba(0,0,0,0.3)] vdocs:hover:-translate-x-px';

const VARIANT_CLASSES: Record<TFlagVariant, string> = {
  // The 14px clip-path values keep the arrow a constant size regardless of the flag's width.
  fill: 'vdocs:w-[110px] vdocs:pl-3.5 vdocs:[clip-path:polygon(0px_50%,14px_0,100%_0,100%_100%,14px_100%)]',
  // No arrow: the width and margin shrink by the 14px the arrow would have occupied.
  next: 'vdocs:w-24 vdocs:ml-3.5',
};

/**
 * Display a flag prompting the signer to act on a field, e.g. FILL or NEXT.
 * The flag positions itself to the right of its nearest positioned ancestor.
 * Clicks on the flag body surface as plain click events on the element;
 * React's onSkip callback is this element's vdocs-skip event.
 *
 * @fires vdocs-skip - Fired when the SKIP link is clicked.
 */
export class VdocsFlag extends VdocsElement {
  static override properties = {
    variant: { type: String },
    label: { type: String },
    showSkip: { type: Boolean, attribute: 'show-skip' },
  };

  /** The type of flag to display. */
  declare variant: TFlagVariant;
  /** The text label to display in the flag. */
  declare label: string;
  /** If true, shows an "or SKIP" link. */
  declare showSkip: boolean;

  constructor() {
    super();
    this.variant = 'fill';
    this.label = 'FILL';
    this.showSkip = false;
  }

  override connectedCallback() {
    super.connectedCallback();
    // The flag box is the host element itself, so the flag never occupies
    // space in the field layout it decorates.
    this.classList.add(...BASE_CLASSES.split(' '));
  }

  override updated() {
    const active = VARIANT_CLASSES[this.variant] ? this.variant : 'fill';
    (Object.keys(VARIANT_CLASSES) as TFlagVariant[]).forEach(variant => {
      VARIANT_CLASSES[variant].split(' ').forEach(cls => this.classList.toggle(cls, variant === active));
    });
  }

  private handleSkip(e: Event) {
    // The flag body typically has its own click handler (focus the field), so
    // a skip click must not bubble into it.
    e.stopPropagation();
    this.emit('vdocs-skip');
  }

  override render() {
    return html`
      <div class="vdocs:flex vdocs:items-center vdocs:justify-center vdocs:w-full vdocs:gap-1">
        ${this.label}
        ${this.showSkip ?
          html`
            <span>
              or
              <button
                type="button"
                class="vdocs:font-sans vdocs:text-white vdocs:text-xs vdocs:leading-none vdocs:font-normal vdocs:underline vdocs:hover:no-underline vdocs:cursor-pointer vdocs:bg-transparent vdocs:border-none vdocs:p-0"
                @click=${this.handleSkip}>
                SKIP
              </button>
            </span>` :
          nothing}
      </div>`;
  }
}

register('vdocs-flag', VdocsFlag);

declare global {
  interface HTMLElementTagNameMap {
    'vdocs-flag': VdocsFlag;
  }

  interface GlobalEventHandlersEventMap {
    'vdocs-skip': CustomEvent<undefined>;
  }
}
