# Verdocs Styled Signer

A sales-demo stub of the signing experience, built to show what a customer's white-labeled
signing ceremony could look like. Nothing here talks to an API: the header, progress bar,
document page, floating sign flag, footer, and adopt-signature modal are representative DOM
styled entirely with the `--vdocs-*` design tokens from `@verdocs/react-sdk`, so restyling
the whole app is just a matter of overriding those custom properties on the document element.

## Run it

```bash
pnpm install
pnpm --filter verdocs-styled-signer dev
```

## What to demo

1. Click "Brand theme" in the header.
2. Click a preset (Meridian Trust, Harbor Realty Group, CarePoint Health) to dress the
   ceremony as a fictional customer in one click, or paste a prospect's real values:
   colors, corner radius, font stack, logo URL, company name.
3. Walk the flow: the flag points at the next field, clicking a field completes it, and
   the signature field opens the adopt-signature modal with a script preview of the typed
   name. Next in the footer advances the same way, and the progress bar tracks along.
4. Everything restyles live except the document page, which stays white on purpose
   because a real PDF would not change with the brand. "Reset to Verdocs" puts the stock
   theme back, and the last values persist in localStorage across refreshes.

The real signing embed is not ported to the React SDK yet. When it lands, this app swaps
its stub components for the real one and the theming story stays exactly the same.
