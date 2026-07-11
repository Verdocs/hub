import { html } from 'lit';
import { VdocsElement } from '../base/vdocs-element.js';
import { register } from '../base/register.js';

// The legacy loader animated a ring of box-shadows through eight keyframe
// stops. Spinning a static ring of dots with the stock spin animation looks
// the same and saves us defining bespoke keyframes in the shared stylesheet.
// The first dot is the bright head; the last two entries are the tail fading
// behind it as the ring rotates clockwise.
const DOT_CLASSES = [
  'vdocs:top-[-60px] vdocs:left-0 vdocs:bg-edge',
  'vdocs:top-[-42px] vdocs:left-[42px] vdocs:bg-ink/20',
  'vdocs:top-0 vdocs:left-[60px] vdocs:bg-ink/20',
  'vdocs:top-[42px] vdocs:left-[42px] vdocs:bg-ink/20',
  'vdocs:top-[60px] vdocs:left-0 vdocs:bg-ink/20',
  'vdocs:top-[42px] vdocs:left-[-42px] vdocs:bg-ink/20',
  'vdocs:top-0 vdocs:left-[-60px] vdocs:bg-ink/30',
  'vdocs:top-[-42px] vdocs:left-[-42px] vdocs:bg-ink/40',
];

/**
 * Animated loader placeholder. It centers itself within the nearest positioned
 * ancestor. There are currently no configuration options for this control.
 *
 * ```html
 * <vdocs-loader></vdocs-loader>
 * ```
 */
export class VdocsLoader extends VdocsElement {
  override connectedCallback() {
    super.connectedCallback();
    // The react-sdk's root is the absolutely positioned box itself. Display:
    // contents keeps the host from adding a box of its own, so the ring still
    // centers within the nearest positioned ancestor.
    this.classList.add('vdocs:contents');
  }

  override render() {
    return html`
      <div role="status" aria-label="Loading" class="vdocs:absolute vdocs:top-1/2 vdocs:left-1/2 vdocs:-mt-3 vdocs:-ml-3 vdocs:size-6">
        <div class="vdocs:relative vdocs:size-6 vdocs:animate-spin">
          ${DOT_CLASSES.map(dot => html`<div class="vdocs:absolute vdocs:size-6 vdocs:rounded-full ${dot}"></div>`)}
        </div>
      </div>`;
  }
}

register('vdocs-loader', VdocsLoader);

declare global {
  interface HTMLElementTagNameMap {
    'vdocs-loader': VdocsLoader;
  }
}
