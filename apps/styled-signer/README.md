# Verdocs Styled Signer

Demo of a white-labeled signing ceremony. No API calls — header, progress bar, document page, sign flag, footer, and adopt-signature modal are representative markup styled with `--vdocs-*` tokens from `@verdocs/react-sdk`.

Use it to show prospects how their brand would look on the signing surface.

## Run

From the repo root:

```bash
pnpm install
pnpm --filter verdocs-styled-signer start
```

## Walkthrough

1. Click **Brand theme** in the header.
2. Pick a preset or paste your own brand values.
3. Walk the flow: the flag points at the next field, fields complete on click, the signature field opens the adopt-signature modal with a script preview of the typed name. **Next** in the footer advances; the progress bar tracks along.
4. The document page stays white on purpose. **Reset to Verdocs** restores defaults; values persist in `localStorage`.

When the production signing embed ships in the React SDK, this app swaps stubs for the real component. The theming approach does not change.

Theming docs: [`packages/react-sdk/README.md`](../../packages/react-sdk/README.md#theming)
