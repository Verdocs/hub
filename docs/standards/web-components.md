# Web components SDK standards (@verdocs/wc-sdk)

This document is binding for the new web components SDK. The package is authored with Lit, renders to light DOM on purpose (white-label CSS from host pages has to reach our markup, and a shadow root would wall it off), and styles everything through the same compiled vdocs stylesheet the other SDKs ship. It replaces the frozen Stencil web-sdk (`packages/web-sdk`) long term; both must coexist on a page during migration, which drives the naming rules below. Anything not covered here follows current Lit documentation.

## Binding rules

1. Author with Lit 3, the current stable line (3.3.3 is npm `latest`, verified 2026-07-10). Declare `lit` as a regular dependency at `^3.3.0` so host bundlers can dedupe it.
2. Every component renders to light DOM: `createRenderRoot() { return this; }`, inherited from the shared `VdocsElement` base class. No component may opt back into shadow DOM.
3. Tag names use the `vdocs-` prefix, lowercase with hyphens (custom element names must start with a lowercase letter and contain a hyphen). The legacy SDK owns `verdocs-*` forever; never define a `verdocs-*` tag here, or the two SDKs can't load side by side.
4. All styling comes from the shared compiled vdocs stylesheet: Tailwind-generated classes under the `vdocs:` prefix, design tokens as `--vdocs-*` custom properties on `:root`. Components never hardcode a value a token covers.
5. No `static styles`, no `<style>` blocks in templates, and no `:host` or `::slotted` selectors. Without a shadow root, `static styles` is never applied (lit/lit #3541) and `:host` matches nothing.
6. No `<slot>`; it's inert in light DOM (lit/lit #4422). Composition is attribute/property-driven first. When markup children are genuinely the right input, read and consume them before first render (query in `connectedCallback`, then clear), because `render()` owns the element's whole subtree and Lit won't track nodes it didn't create.
7. Declare reactive properties with `static properties`, not decorators. We keep a standard tsconfig (no `experimentalDecorators`), and Lit's own docs say standard decorators compile to significantly larger output than we're willing to ship in an SDK; static properties gets the small output with zero compiler ceremony.
8. TypeScript fields for reactive properties use `declare`, with defaults assigned in the constructor. A plain class field would shadow Lit's generated accessor and kill reactivity.
9. Properties are camelCase, attributes are kebab-case, and every multi-word property sets `attribute: 'kebab-case'` explicitly. Lit's default only lowercases (`envelopeId` would observe `envelopeid`), which isn't our convention.
10. Attributes carry primitives only (string, number, boolean). Objects, arrays, and callbacks go through properties; never design an API that needs JSON stuffed into an attribute.
11. Public events are `CustomEvent`s named with the `vdocs-` prefix in kebab-case (for example `vdocs-sign-complete`), payload in `detail`, typed. The prefix keeps us clear of legacy and host-app event names.
12. Dispatch public events with `bubbles: true, composed: true`. We create no shadow boundaries ourselves, but host apps may mount our components inside their own shadow roots, and composed events still reach their listeners.
13. Never dispatch an event for a change the component owner made itself; setting a property fires nothing, matching native element behavior.
14. Shared cross-component logic ships as `ReactiveController`s: session and endpoint state (mirroring `VerdocsEndpoint`'s user and signing sessions), observers, polling, and async tasks. No mixin chains; `VdocsElement` is the only base class.
15. One element per module, filename equals the tag name (`vdocs-pdf-viewer.ts` defines `vdocs-pdf-viewer`), class name is its PascalCase form (`VdocsPdfViewer`).
16. Every element module augments `HTMLElementTagNameMap` with its tag, so `createElement` and `querySelector` come back typed for consumers.
17. Elements self-define at module scope through the shared `register()` helper, and the module also exports the class. Importing the module is what makes the tag usable (the Material Web and Shoelace convention, and Lit's publishing guidance); exporting the class keeps subclassing and future scoped registries open.
18. `register()` no-ops outside a browser and warns-then-skips when the tag is already defined. `customElements.define` throws on redefinition, and duplicate bundles are a real hazard for self-registering libraries; we degrade instead of crashing.
19. Publish standard ES modules, unbundled. Bundling is the host app's job, and a bundled Lit copy defeats npm dedupe and can double-register elements.
20. The build generates `custom-elements.json` with `@custom-elements-manifest/analyzer` (0.11.x, Lit-aware), and `package.json` points at it via the `customElements` field. The manifest is what editors, docs tooling, and future framework wrappers consume.
21. No server rendering. `@lit-labs/ssr` only supports shadow DOM components (lit/lit #3080, #1994), so wc-sdk components are client-only; the browser guard in `register()` keeps accidental server imports from throwing, and our docs tell SSR-framework users to load components on the client.
22. Component tests run in Vitest browser mode (stable since Vitest 4) with the Playwright provider on Chromium, plugged into the monorepo's vitest workspace. Lit's testing guidance is blunt that shimmed DOMs don't exercise what users run, so jsdom is banned for component tests; plain node environments stay fine for pure logic modules.

## The canonical element module

```ts
// base/vdocs-element.ts
export class VdocsElement extends LitElement {
  protected createRenderRoot() {
    return this; // light DOM: white-label CSS must reach our markup
  }
}
```

```ts
// components/vdocs-pdf-viewer.ts
import {html} from 'lit';
import {VdocsElement} from '../base/vdocs-element';
import {register} from '../base/register';

export class VdocsPdfViewer extends VdocsElement {
  static properties = {
    envelopeId: {type: String, attribute: 'envelope-id'},
    page: {type: Number},
  };

  declare envelopeId: string;
  declare page: number;

  constructor() {
    super();
    this.envelopeId = '';
    this.page = 1;
  }

  render() {
    return html`<div class="vdocs:flex vdocs:flex-col">...</div>`;
  }
}

register('vdocs-pdf-viewer', VdocsPdfViewer);

declare global {
  interface HTMLElementTagNameMap {
    'vdocs-pdf-viewer': VdocsPdfViewer;
  }
}
```

## What light DOM costs us, and why it's still right

Lit's docs call rendering into children "generally not recommended" because you lose DOM scoping, style scoping, and slots. For us that loss is the feature: white-label customers style our components with their own global CSS, which shadow DOM would block. It's a documented, first-class Lit pattern, vendors like Vaadin recommend light DOM exactly when top-down theming is the requirement, and it sidesteps real shadow DOM problems like broken browser form autofill (which matters in an e-signing product). The discipline in return: our markup is part of the host page, so class names stay on the `vdocs:` prefix, we never assume our internals are private, and breaking rendered markup structure is a breaking change.

## Sources

- https://lit.dev/docs/components/shadow-dom/ : createRenderRoot, light DOM pattern and its documented consequences.
- https://lit.dev/docs/components/properties/ : static properties, attribute conversion defaults, declare and class-field pitfalls.
- https://lit.dev/docs/components/decorators/ : experimental vs standard decorators; standard decorator output size warning.
- https://lit.dev/docs/components/events/ : CustomEvent detail, bubbles/composed pairing, no events for owner-made changes.
- https://lit.dev/docs/composition/controllers/ : ReactiveController lifecycle and use cases.
- https://lit.dev/docs/tools/publishing/ : self-defining modules, export the class, ES modules, don't bundle.
- https://lit.dev/docs/tools/testing/ : test in a real browser; DOM shims not recommended.
- https://developer.mozilla.org/en-US/docs/Web/API/Web_components/Using_custom_elements : valid custom element names, define semantics.
- https://github.com/lit/lit/issues/3080 and https://github.com/lit/lit/issues/1994 : Lit SSR supports shadow DOM components only.
- https://github.com/lit/lit/issues/3541 and https://github.com/lit/lit/issues/4422 : static styles and slot are dead in light DOM.
- https://github.com/material-components/material-web (button/filled-button.ts) : module-scope registration plus HTMLElementTagNameMap augmentation.
- https://shoelace.style/getting-started/usage and https://github.com/shoelace-style/shoelace/issues/705 : self-registering imports and the double-define hazard.
- https://vaadin.com/docs/latest/hilla/lit/components/create : vendor guidance recommending light DOM where top-down theming is required.
- https://www.thisdot.co/blog/a-tale-of-form-autofill-litelement-and-the-shadow-dom : shadow DOM vs browser form autofill.
- https://github.com/webcomponents/custom-elements-manifest : custom-elements.json as the standard machine-readable component description.
- npm registry, checked 2026-07-10: lit 3.3.3, vitest 4.1.10, @custom-elements-manifest/analyzer 0.11.0, @lit-labs/ssr 4.1.0.
