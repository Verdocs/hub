# Styling and white-labeling

@verdocs/react-sdk and @verdocs/angular-sdk theme entirely through CSS custom
properties: you override variables, not fork our CSS or fight a Shadow DOM.

## How it works

Tailwind 4 is our build-time tool, not yours. Each package compiles its stylesheet at
build time, so what you receive is plain CSS with no Tailwind dependency:

- Every design token is emitted as a `--vdocs-*` custom property on `:root`.
- Components use single-class utilities prefixed `vdocs:` that read those variables.
- Preflight is not included, so importing the sheet never resets your page styles.

Import it once:

```tsx
// React: app entry point
import '@verdocs/react-sdk/styles.css';
```

```jsonc
// Angular: angular.json build options (or @import the file from a root stylesheet)
"styles": ["node_modules/@verdocs/angular-sdk/styles.css", "src/styles.css"]
```

There is no Shadow DOM. Components render ordinary DOM, so your CSS reaches their
internals directly. Every rule we ship also lives in a cascade layer (`theme`,
`utilities`), while your stylesheet is unlayered, and unlayered CSS beats layered
CSS regardless of specificity. Your selectors always win, no `!important` needed.

That gives you two override layers:

1. Token overrides: set `--vdocs-*` variables on `:root` or any ancestor scope. This covers rebranding.
2. Plain CSS: ordinary selectors scoped by your own wrapper class. This is the escape hatch.

## Token reference

These are the custom properties the compiled stylesheet defines today. The set grows
as components land; the sheet only carries tokens the components actually use.

### Colors

| Token | Default | Drives |
|---|---|---|
| `--vdocs-color-primary` | `#55bc81` | Primary action buttons: fills, borders, tinted hovers |
| `--vdocs-color-primary-dark` | `#2b995b` | Primary button hover state, emphasized primary text |
| `--vdocs-color-accent` | `#654dcb` | Focus borders, links, selected states, filled accent controls |
| `--vdocs-color-accent-light` | `#707ae5` | Accent hover borders and tinted hover fills |
| `--vdocs-color-ink` | `#092c4c` | Main text |
| `--vdocs-color-muted` | `#5c6575` | Secondary text, quiet hover borders |
| `--vdocs-color-surface` | `#ffffff` | Control and menu backgrounds |
| `--vdocs-color-canvas` | `#f5f5fa` | Tinted section backgrounds, hover and disabled fills |
| `--vdocs-color-edge` | `#aeb4bf` | Default control borders, placeholder icons |
| `--vdocs-color-edge-light` | `#dad8dd` | Hairline separators |
| `--vdocs-color-danger` | `#cc0000` | Error text, destructive actions, error toasts |
| `--vdocs-color-success` | `#3dc763` | Success toasts and status accents |
| `--vdocs-color-info` | `#2379c7` | Info toasts and status accents |
| `--vdocs-color-disabled` | `#6c727f` | Disabled text, fills, and borders |
| `--vdocs-color-white` | `#ffffff` | Text and icons on filled buttons |

### Typography

| Token | Default | Drives |
|---|---|---|
| `--vdocs-font-sans` | Inter stack | The one font family every component uses |
| `--vdocs-text-xs` | `0.75rem` | Fine print and badges |
| `--vdocs-text-sm` | `0.875rem` | Most control and list text |
| `--vdocs-text-base` | `1rem` | Standard body text |
| `--vdocs-text-lg` | `1.125rem` | Section headings |
| `--vdocs-text-xl` | `1.25rem` | Titles |
| `--vdocs-font-weight-normal` | `400` | Body weight |
| `--vdocs-font-weight-medium` | `500` | Buttons, labels, emphasis |

Each text size has a paired `--vdocs-text-*--line-height` you can override too.

### Radii, spacing, and motion

| Token | Default | Drives |
|---|---|---|
| `--vdocs-radius-ctl` | `4px` | Buttons, inputs, and other controls |
| `--vdocs-radius-row` | `5px` | List rows |
| `--vdocs-radius-md` | `0.375rem` | Menus and popovers |
| `--vdocs-spacing` | `0.25rem` | Base unit; all padding, margin, gap, and size math multiplies it |
| `--vdocs-animate-spin` | 1s linear spin | Spinners |
| `--vdocs-animate-pulse` | 2s pulse | Loading placeholders |

## Override patterns

### Rebrand the whole app

```css
:root {
  --vdocs-color-primary: #0f62fe;
  --vdocs-color-primary-dark: #0043ce;
  --vdocs-color-accent: #a56eff;
  --vdocs-font-sans: 'Sohne', 'Helvetica Neue', sans-serif;
  --vdocs-radius-ctl: 8px;
}
```

### Scope two brands on one page

Custom properties inherit, so setting them on an ancestor themes only that subtree:

```css
.brand-acme { --vdocs-color-primary: #b8860b; --vdocs-color-accent: #7a5c00; }
.brand-globex { --vdocs-color-primary: #1e6fd9; --vdocs-color-accent: #123f7d; }
```

Components inside a `.brand-acme` wrapper and a `.brand-globex` wrapper each pick up their own palette.

### Dark variant

There is no built-in dark theme; you own it with the same tokens. Flip the neutrals
together so contrast holds, and keep your primary dark enough for white button text:

```css
@media (prefers-color-scheme: dark) {
  :root {
    --vdocs-color-surface: #12161c;
    --vdocs-color-canvas: #1a212a;
    --vdocs-color-ink: #e8edf4;
    --vdocs-color-muted: #9aa6b4;
    --vdocs-color-edge: #3c4654;
    --vdocs-color-edge-light: #2a323d;
  }
}
```

Use a class scope (`.dark { ... }`) instead if you toggle themes in JS.

### Per-component tweaks

Scope with your own wrapper class and target semantic elements and states; low specificity is enough:

```css
.sidebar-templates button { text-transform: uppercase; }
.signup-pane input:focus { box-shadow: 0 0 0 3px #a56eff40; }
```

### What not to do

- Do not target `vdocs:`-prefixed class names. They are Tailwind build artifacts,
  tree-shaken per release, and can change without notice.
- Do not use `!important`. Your unlayered CSS already wins.
- Do not carry over `--verdocs-*` variables from the legacy SDK. That namespace
  does nothing here (see the migration note below).

## Styling hooks coming with the signing ports

The signing components are not in these SDKs yet. The ports will keep these theming
commitments, stated here so you can plan for them:

- Signing fields: per-signer color coding will be tokenized (`--vdocs-*` equivalents
  of the legacy `--signer-1-color` through `--signer-10-color` set), and the
  required, completed, focused, and error field states will each be overridable.
- Signing toolbar: the primary action button takes its prominence from the primary
  tokens, and the progress indicator will be token-driven.
- Signing footer: sticky positioning and mobile layout stay overridable with plain CSS, not pinned by inline styles.

## Migrating from the Stencil web-sdk

The legacy @verdocs/web-sdk themed mostly at compile time with Sass variables
(`$verdocs-green`, `$verdocs-purple`, and friends), plus runtime overrides in a
`--verdocs-*` namespace. The new namespace is `--vdocs-*`, disjoint by design: old
override sheets silently stop applying instead of half-applying, so you never get a
mixed theme. Redeclare your brand against the new tokens:

| Legacy | New token |
|---|---|
| `--verdocs-primary-font` | `--vdocs-font-sans` |
| `$verdocs-green` | `--vdocs-color-primary` |
| `$verdocs-purple` | `--vdocs-color-accent` |
| `$verdocs-grey-0` | `--vdocs-color-ink` |
| `$verdocs-grey-2` | `--vdocs-color-edge` |
| `$verdocs-grey-3` | `--vdocs-color-canvas` |
| `$verdocs-red-1` | `--vdocs-color-danger` |
| `$verdocs-button-disabled` | `--vdocs-color-disabled` |
