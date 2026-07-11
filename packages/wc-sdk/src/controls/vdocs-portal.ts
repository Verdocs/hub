import { nothing } from 'lit';
import type { PropertyValues } from 'lit';
import { VdocsElement } from '../base/vdocs-element.js';
import { register } from '../base/register.js';

/**
 * Display floating content anchored to another element. The element's markup
 * children are moved into a positioned wrapper appended to document.body, so
 * the content escapes any overflow or stacking context created by its parents
 * and repositions itself as the page scrolls or resizes. Children are consumed
 * once, when the element first connects; disconnecting removes the wrapper and
 * returns the content to the element, so removing the portal from the DOM is
 * how a host dismisses it (the same mount-to-show contract as the React SDK).
 *
 * The anchor is accepted two ways: assign an element reference to the `anchor`
 * property (what Lit hosts do, mirroring the React ref-based contract), or set
 * the `anchor-id` attribute to the id of an element in the document for
 * markup-only hosts. The property wins when both are set, because an element
 * reference is exact where an id lookup can go stale.
 *
 * Because the content lives under document.body, DOM events fired inside it do
 * not bubble through the portal's host ancestors the way React portals retarget
 * them; listen on the content itself, or on the portal for `vdocs-click-away`.
 *
 * ```html
 * <button id="menu-button">Menu</button>
 * <vdocs-portal anchor-id="menu-button">
 *   <div>Floating content</div>
 * </vdocs-portal>
 * ```
 *
 * @fires vdocs-click-away - Fired when the user clicks outside both the content and the anchor.
 */
export class VdocsPortal extends VdocsElement {
  static override properties = {
    anchor: { attribute: false },
    anchorId: { type: String, attribute: 'anchor-id' },
  };

  /** The element the floating content is anchored to. Property-only; wins over anchor-id. */
  declare anchor?: HTMLElement;
  /** The id of the element the floating content is anchored to, for markup-only hosts. */
  declare anchorId: string;

  private content?: ChildNode[];
  private wrapper?: HTMLDivElement;
  private connectedAt = 0;

  // Keeps the wrapper aligned to the anchor: below it and left-aligned when it
  // fits, flipped above when it would cross the bottom of the viewport, pulled
  // back from the right edge when it would overflow. The scroll listener is
  // capture-phase so scrolling any ancestor container repositions the content,
  // not just the window.
  private reposition = () => {
    const anchorEl = this.resolveAnchor();
    if (!anchorEl || !this.wrapper) {
      return;
    }

    const anchorRect = anchorEl.getBoundingClientRect();

    let left = Math.max(anchorRect.left, 0);
    if (left + this.wrapper.offsetWidth > window.innerWidth) {
      left = Math.max(window.innerWidth - this.wrapper.offsetWidth - 20, 0);
    }

    let top = anchorRect.bottom;
    if (top + this.wrapper.offsetHeight > window.innerHeight) {
      top = anchorRect.top - this.wrapper.offsetHeight;
    }

    this.wrapper.style.top = `${top}px`;
    this.wrapper.style.left = `${left}px`;
  };

  private handleDocumentClick = (e: MouseEvent) => {
    // Lit can flush the update that connected us in a microtask checkpoint
    // while the click that opened us is still bubbling toward the document,
    // so any click created before we connected is the opener, not a dismissal.
    if (e.timeStamp <= this.connectedAt) {
      return;
    }

    const target = e.target as Node;

    // Clicks on the anchor are the caller's own toggle, not a click-away.
    // Clicks inside any portal wrapper are skipped too: floating content can
    // open nested portals whose DOM is a sibling of ours in document.body,
    // not a descendant.
    if (this.wrapper?.contains(target) || this.resolveAnchor()?.contains(target)) {
      return;
    }

    if (target instanceof Element && target.closest('.vdocs-portal')) {
      return;
    }

    this.emit('vdocs-click-away');
  };

  constructor() {
    super();
    this.anchorId = '';
  }

  override connectedCallback() {
    super.connectedCallback();
    this.connectedAt = performance.now();

    // Markup children are the floating content. We consume them once, before
    // Lit's first render, because render() owns the element's whole subtree;
    // later connects reuse the same nodes (restored in disconnectedCallback).
    this.content ??= Array.from(this.childNodes);

    const wrapper = document.createElement('div');
    wrapper.className = 'vdocs-portal vdocs:fixed vdocs:z-[10001]';
    wrapper.append(...this.content);
    document.body.appendChild(wrapper);
    this.wrapper = wrapper;
    this.reposition();

    window.addEventListener('scroll', this.reposition, true);
    window.addEventListener('resize', this.reposition);
    document.addEventListener('click', this.handleDocumentClick);
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    window.removeEventListener('scroll', this.reposition, true);
    window.removeEventListener('resize', this.reposition);
    document.removeEventListener('click', this.handleDocumentClick);

    // Return the content so the element still owns it, and can move it out
    // again, if the host re-attaches us.
    if (this.wrapper) {
      this.append(...this.wrapper.childNodes);
      this.wrapper.remove();
      this.wrapper = undefined;
    }
  }

  override updated(changed: PropertyValues<this>) {
    if (changed.has('anchor') || changed.has('anchorId')) {
      this.reposition();
    }
  }

  private resolveAnchor(): HTMLElement | null {
    if (this.anchor) {
      return this.anchor;
    }

    return this.anchorId ? document.getElementById(this.anchorId) : null;
  }

  override render() {
    // The element itself is just the mount point; the content renders in the
    // body wrapper.
    return nothing;
  }
}

register('vdocs-portal', VdocsPortal);

declare global {
  interface HTMLElementTagNameMap {
    'vdocs-portal': VdocsPortal;
  }

  interface GlobalEventHandlersEventMap {
    'vdocs-click-away': CustomEvent<undefined>;
  }
}
