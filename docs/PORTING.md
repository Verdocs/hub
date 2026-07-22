# Porting the legacy catalog

How we port components from the frozen Stencil web-sdk into the native SDKs. The Stencil source under `packages/web-sdk/verdocs-web-sdk/src/components` is the behavioral reference (read-only, never modified); PARITY.md tracks coverage. Ports are independent native implementations per the standards docs, not transliterations.

## Order

Controls, then fields, then dialogs, then the templates group, then the envelopes group. Controls are leaf dependencies; fields reference controls and the field-properties panel; dialogs nest the base dialog; templates and envelopes compose all of it. Embeds are out of scope (the styled apps stub them). Anything star-related is frozen: no ports, no fixes.

## Translation rules (React)

1. Everything in docs/standards/react.md applies: function declaration, default export, XxxProps interface, colocated story and spec.
2. Stencil attribute-style prop names become camelCase (`fieldname` to `fieldName`, `sourceid` to `sourceId`, `pagenumber` to `pageNumber`).
3. Stencil `@Event` emitters become `onXxx` callback props with domain names: `settingsChanged` to `onSettingsChanged`, dialog `next`/`exit` to `onOk`/`onCancel` (or the domain equivalent). Payloads stay structurally identical unless the Stencil shape only existed to serve CustomEvent plumbing.
4. Stencil `@Method` imperative APIs are dropped unless the behavior cannot be expressed with props. Focus becomes an `autoFocus` prop or a ref; show/hide panels become controlled props.
5. The Stencil `Store.getField` pattern dies: field components receive their data via props (`field: IEnvelopeField | ITemplateField`) and never reach into a global store.
6. Builder-only affordances in fields (interact.js drag/move, the hover settings popover, `moveable`, `editable`, `xscale`/`yscale`) are omitted from the ports. They exist to serve the build embed, which is out of scope this weekend. Fields port their display and signing behavior: value rendering, required/disabled/done/focused states, change callbacks. TemplateFieldProperties itself still gets ported in the templates group as a standalone component. Recorded as a deviation in WEEKEND-STATUS.md.
7. SCSS translates to build-time Tailwind under the `vdocs:` prefix, matching the token usage in the existing conversions (Button, TextInput, Pagination). Read the legacy scss for intent (spacing, states, colors), then express it with our tokens. Never import scss, never hardcode hex values that have a token.
8. Signer-index coloring (`signer-N` classes) and other theme-critical hooks keep working through the compiled stylesheet: if a legacy class is part of the white-label contract (documented overrides), preserve an equivalent class name on the element alongside the Tailwind classes.
9. Inline SVG strings in Stencil sources become icon components in `src/controls/icons/` following that folder's pattern, shared across ports.
10. Toasts go through `showToast`. Console noise is not ported.
11. Every js-sdk endpoint a ported component calls gets a conformance case if one does not exist (see packages/conformance). Presentational components usually touch none; list/CRUD components do.

## Mirror rules (Angular, Vue, WC)

The React port defines the component contract (props, events, visual states). Mirrors implement that contract natively per their own standards doc: signals and services in Angular, script setup and provide/inject in Vue, Lit reactive properties without shadow DOM in WC. Query keys and cache invalidation semantics must match the React hooks exactly. A mirror is done when its quickstart (or a story, for React) can exercise the same flows.

## Agent working rules

Port work runs as parallel subagent batches on disjoint components. To keep merges clean, port agents never edit shared files: src/index.ts barrels, PARITY.md, package.json, and eslint configs are updated by the coordinating session per batch. Port agents run package-scoped lint/typecheck/tests for their files only; the coordinator runs the full turbo gate per batch. No git commands, no dev servers.
