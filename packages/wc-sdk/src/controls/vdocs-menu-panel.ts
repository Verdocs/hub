import { nothing } from 'lit';
import { VdocsElement } from '../base/vdocs-element.js';
import { register } from '../base/register.js';

const PANEL_CLASSES = 'vdocs-menu-panel vdocs:fixed vdocs:top-0 vdocs:bottom-0 vdocs:z-[10001] vdocs:overflow-y-auto vdocs:bg-surface vdocs:font-sans ' +
  'vdocs:transition vdocs:duration-[350ms] vdocs:translate-x-0 vdocs:opacity-100 vdocs:starting:opacity-0';

const SIDE_CLASSES: Record<'left' | 'right', string> = {
  right: 'vdocs:right-0 vdocs:starting:translate-x-full',
  left: 'vdocs:left-0 vdocs:starting:-translate-x-full',
};

/**
 * Display a side panel that slides in from the edge of the screen, moved into
 * document.body with an optional overlay dimming the rest of the page. The
 * element's markup children become the panel content, consumed once when the
 * element first connects. Mount it to show it; the host removes the element
 * (typically on vdocs-close) to dismiss it, which also restores the content
 * to the element.
 *
 * ```html
 * <vdocs-menu-panel side="left" width="340">
 *   <div>Panel content</div>
 * </vdocs-menu-panel>
 * ```
 *
 * @fires vdocs-close - Fired when the user clicks outside the panel.
 */
export class VdocsMenuPanel extends VdocsElement {
  static override properties = {
    side: { type: String },
    overlay: { attribute: false },
    width: { type: Number },
  };

  /** Which side of the screen the panel slides in from. */
  declare side: 'left' | 'right';
  /** Whether to dim the rest of the page behind the panel. Property-only (defaults to true). */
  declare overlay: boolean;
  /** The width of the panel in pixels. */
  declare width: number;

  private content?: ChildNode[];
  private panel?: HTMLDivElement;
  private overlayEl?: HTMLDivElement;
  private connectedAt = 0;

  private handleDocumentClick = (e: MouseEvent) => {
    // Lit can flush the update that connected us in a microtask checkpoint
    // while the click that opened the panel is still bubbling toward the
    // document, so any click created before we connected is the opener, not
    // a dismissal.
    if (e.timeStamp <= this.connectedAt) {
      return;
    }

    if (this.panel && !this.panel.contains(e.target as Node)) {
      this.emit('vdocs-close');
    }
  };

  constructor() {
    super();
    this.side = 'right';
    this.overlay = true;
    this.width = 300;
  }

  override connectedCallback() {
    super.connectedCallback();
    this.connectedAt = performance.now();

    // Markup children are the panel content. We consume them once, before
    // Lit's first render, because render() owns the element's whole subtree;
    // later connects reuse the same nodes (restored in disconnectedCallback).
    this.content ??= Array.from(this.childNodes);

    const panel = document.createElement('div');
    panel.setAttribute('role', 'dialog');
    panel.append(...this.content);
    document.body.appendChild(panel);
    this.panel = panel;
    this.syncPanel();

    document.addEventListener('click', this.handleDocumentClick);
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    document.removeEventListener('click', this.handleDocumentClick);

    // Return the content so the element still owns it, and can move it out
    // again, if the host re-attaches us.
    if (this.panel) {
      this.append(...this.panel.childNodes);
      this.panel.remove();
      this.panel = undefined;
    }

    this.overlayEl?.remove();
    this.overlayEl = undefined;
  }

  override updated() {
    this.syncPanel();
  }

  // The panel is imperative DOM rather than Lit output (it lives in the body,
  // not our subtree), so property changes are applied here instead of render().
  private syncPanel() {
    if (!this.panel) {
      return;
    }

    this.panel.className = `${PANEL_CLASSES} ${SIDE_CLASSES[this.side] ?? SIDE_CLASSES.right}`;
    this.panel.style.width = `${this.width}px`;
    this.panel.setAttribute('aria-modal', String(this.overlay));

    if (this.overlay && !this.overlayEl) {
      const overlay = document.createElement('div');
      overlay.setAttribute('aria-hidden', 'true');
      overlay.className = 'vdocs-menu-panel-overlay vdocs:fixed vdocs:inset-0 vdocs:z-[10000] vdocs:bg-[#0000007f]';
      document.body.insertBefore(overlay, this.panel);
      this.overlayEl = overlay;
    } else if (!this.overlay && this.overlayEl) {
      this.overlayEl.remove();
      this.overlayEl = undefined;
    }
  }

  override render() {
    // The element itself is just the mount point; the content renders in the
    // body panel.
    return nothing;
  }
}

register('vdocs-menu-panel', VdocsMenuPanel);

declare global {
  interface HTMLElementTagNameMap {
    'vdocs-menu-panel': VdocsMenuPanel;
  }

  interface GlobalEventHandlersEventMap {
    'vdocs-close': CustomEvent<undefined>;
  }
}
