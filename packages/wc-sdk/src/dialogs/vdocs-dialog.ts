import type { TemplateResult } from 'lit';
import { html, nothing, render } from 'lit';
import { createRef, ref } from 'lit/directives/ref.js';
import { VdocsElement } from '../base/vdocs-element.js';
import { clearIcon } from '../controls/icons/index.js';
import { register } from '../base/register.js';

const OVERLAY_CLASSES = 'vdocs-dialog-overlay vdocs:fixed vdocs:inset-0 vdocs:z-[10000] vdocs:flex vdocs:items-center vdocs:justify-center ' +
  'vdocs:bg-ink/40 vdocs:font-sans vdocs:box-border';

const PANEL_CLASSES = 'vdocs-dialog vdocs:relative vdocs:flex vdocs:w-[520px] vdocs:max-w-[95%] vdocs:flex-col vdocs:overflow-hidden ' +
  'vdocs:rounded-lg vdocs:bg-surface vdocs:shadow-lg';

/**
 * The base modal dialog: a centered panel over a dimmed overlay, moved into
 * document.body so it escapes any overflow or stacking context created by its
 * parents (the same machinery as vdocs-menu-panel). The element's markup
 * children become the dialog body, consumed once when the element first
 * connects. Mount it to show it; the host removes the element (typically on
 * vdocs-close) to dismiss it, which also restores the content to the element.
 *
 * The heading takes a plain string, which gets the title treatment and can
 * come through the attribute, or a TemplateResult assigned to the property
 * for rich content (the KBA dialog's step counter). The footer is a
 * property-only TemplateResult, the same property-template pattern as
 * vdocs-button's startIcon and vdocs-button-panel's icon. The header row and
 * footer padding only render when content was actually supplied, matching the
 * React component's "prop is undefined" semantics.
 *
 * Heading and footer templates are rendered with this element as their event
 * host, so a composing dialog's handlers referenced in them by bare method
 * name would run with the wrong `this`; the dialogs in this folder use
 * arrow-function class properties (or inline arrows) for anything wired
 * inside a footer.
 *
 * ```html
 * <vdocs-dialog heading="Are you sure?">
 *   <div>Body content</div>
 * </vdocs-dialog>
 * ```
 *
 * @fires vdocs-close - Fired when the user dismisses via the overlay or the close button (React's onClose).
 */
export class VdocsDialog extends VdocsElement {
  static override properties = {
    heading: {},
    footer: { attribute: false },
    persistent: { type: Boolean },
  };

  /** Rendered in the header row. Plain strings get the title treatment; a TemplateResult supplies rich content. */
  declare heading?: string | TemplateResult;
  /** Rendered below the body, typically an action button row. Property-only. */
  declare footer?: TemplateResult;
  /** If true, clicking the background overlay will not close the dialog. */
  declare persistent: boolean;

  private content?: ChildNode[];
  private overlay?: HTMLDivElement;
  private panel?: HTMLDivElement;
  private bodyRef = createRef<HTMLDivElement>();

  private handleOverlayClick = (e: MouseEvent) => {
    // Only a direct overlay click dismisses; clicks inside the panel land on
    // descendants and stay put.
    if (!this.persistent && e.target === e.currentTarget) {
      e.preventDefault();
      this.emit('vdocs-close');
    }
  };

  // The close button always works, even for persistent dialogs: persistent
  // only guards the overlay against accidental clicks.
  private handleClose = () => {
    this.emit('vdocs-close');
  };

  constructor() {
    super();
    this.persistent = false;
  }

  override connectedCallback() {
    super.connectedCallback();

    // Markup children are the dialog body. We consume them once, before Lit's
    // first render, because render() owns the element's whole subtree; later
    // connects reuse the same nodes (restored in disconnectedCallback).
    this.content ??= Array.from(this.childNodes);

    const overlay = document.createElement('div');
    overlay.className = OVERLAY_CLASSES;
    overlay.addEventListener('click', this.handleOverlayClick);

    const panel = document.createElement('div');
    panel.className = PANEL_CLASSES;
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-modal', 'true');
    overlay.appendChild(panel);

    document.body.appendChild(overlay);
    this.overlay = overlay;
    this.panel = panel;
    this.syncPanel();
  }

  override disconnectedCallback() {
    super.disconnectedCallback();

    // Return the content so the element still owns it, and can move it out
    // again, if the host re-attaches us.
    if (this.content) {
      this.append(...this.content);
    }

    this.overlay?.remove();
    this.overlay = undefined;
    this.panel = undefined;
  }

  override updated() {
    this.syncPanel();
  }

  // The panel lives in document.body rather than our subtree, so property
  // changes are applied by re-rendering it here instead of through render().
  // Passing the host keeps @event bindings in our own panel template bound to
  // this element.
  private syncPanel() {
    if (!this.panel) {
      return;
    }

    render(this.renderPanel(), this.panel, { host: this });

    // The body's markup children are moved into the ref'd container
    // imperatively, never through a Lit ChildPart. Lit leaves a static ref'd
    // div's children untouched across re-renders, and moving them out on
    // disconnect can't eject any part markers, which a ChildPart value would.
    const body = this.bodyRef.value;
    if (body && this.content && this.content[0] && !body.contains(this.content[0])) {
      body.append(...this.content);
    }
  }

  private renderPanel() {
    return html`
      <button
        type="button"
        aria-label="Close"
        @click=${this.handleClose}
        class="vdocs:absolute vdocs:top-4 vdocs:right-4 vdocs:z-20 vdocs:flex vdocs:size-6 vdocs:cursor-pointer vdocs:items-center vdocs:justify-center vdocs:border-none vdocs:bg-transparent vdocs:p-0 vdocs:text-edge vdocs:transition-colors vdocs:hover:text-muted">
        ${clearIcon({ className: 'vdocs:size-5' })}
      </button>

      ${this.heading !== undefined ?
        html`
          <div class="vdocs:flex vdocs:items-center vdocs:justify-between vdocs:border-b vdocs:border-solid vdocs:border-edge-light vdocs:px-6 vdocs:py-4">
            <div class="vdocs:text-2xl vdocs:font-medium vdocs:text-ink vdocs:leading-8">${this.heading}</div>
          </div>` :
        nothing}

      <div ${ref(this.bodyRef)} class="vdocs:p-6 vdocs:text-sm vdocs:text-ink"></div>

      ${this.footer !== undefined ? html`<div class="vdocs:px-6 vdocs:pb-6">${this.footer}</div>` : nothing}`;
  }

  override render() {
    // The element itself is just the mount point; the content renders in the
    // body panel.
    return nothing;
  }
}

register('vdocs-dialog', VdocsDialog);

declare global {
  interface HTMLElementTagNameMap {
    'vdocs-dialog': VdocsDialog;
  }
}
