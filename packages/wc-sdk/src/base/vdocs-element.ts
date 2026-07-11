import { LitElement } from 'lit';

/**
 * Base class for every wc-sdk element. Renders to light DOM so white-label
 * CSS from the host page reaches our markup; see
 * docs/standards/web-components.md for the rationale and the rules that
 * follow from it (no static styles, no slots, vdocs: utility classes only).
 */
export class VdocsElement extends LitElement {
  protected override createRenderRoot() {
    return this; // light DOM: white-label CSS must reach our markup
  }

  /**
   * Dispatch a public vdocs- event. Composed so listeners still receive it
   * when a host app mounts us inside its own shadow root.
   * @ignore
   */
  protected emit<T>(type: `vdocs-${string}`, detail?: T) {
    // The @ignore keeps the analyzer from reporting a bogus event literally
    // named "type"; each element documents its real events with @fires.
    /** @ignore */
    this.dispatchEvent(new CustomEvent<T>(type, { detail, bubbles: true, composed: true }));
  }
}
