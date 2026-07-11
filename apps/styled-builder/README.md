# Verdocs Styled Builder

A sales-demo stub of the template builder, built to show what a customer's white-labeled
builder could look like. Nothing here talks to an API: the toolbar, fields palette, document
page, and properties panel are representative DOM styled entirely with the `--vdocs-*` design
tokens from `@verdocs/react-sdk`, so restyling the whole app is just a matter of overriding
those custom properties on the document element.

## Run it

```bash
pnpm install
pnpm --filter verdocs-styled-builder dev
```

## What to demo

1. Click "Brand theme" in the toolbar.
2. Click a preset (Meridian Trust, Harbor Realty Group, CarePoint Health) to dress the
   builder as a fictional customer in one click, or paste a prospect's real values:
   colors, corner radius, font stack, logo URL, company name.
3. Everything restyles live: SDK controls, panels, the placed field tints, all of it. The
   document page itself stays white on purpose, because a real uploaded PDF would not
   change with the brand.
4. "Reset to Verdocs" puts the stock theme back. The last values persist in localStorage,
   so a refresh keeps the demo dressed.

The real builder embed is not ported to the React SDK yet. When it lands, this app swaps
its stub components for the real one and the theming story stays exactly the same.
