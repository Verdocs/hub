# Verdocs Styled Builder

Demo of a white-labeled template builder. No API calls. The toolbar, field palette, document page, and properties panel are representative markup styled with `--vdocs-*` tokens from `@verdocs/react-sdk`.

Use it to show prospects how their brand would look on the builder surface before you wire up the real embed.

## Run

From the repo root:

```bash
pnpm install
pnpm --filter verdocs-styled-builder start
```

## Walkthrough

1. Click **Brand theme** in the toolbar.
2. Pick a preset (Meridian Trust, Harbor Realty Group, CarePoint Health) or paste your own colors, radius, font stack, logo URL, and company name.
3. The UI restyles live. The document page stays white on purpose, because a real uploaded PDF would not inherit your brand fill.
4. **Reset to Verdocs** restores defaults. Values persist in `localStorage` across refresh.

When the production builder ships in the React SDK, this app swaps stub markup for the real component. The theming approach does not change.

Theming docs: [`packages/react-sdk/README.md`](../../packages/react-sdk/README.md#theming)
