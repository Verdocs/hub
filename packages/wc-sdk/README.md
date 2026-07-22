# @verdocs/wc-sdk

Native web components for building document workflows with Verdocs, written with Lit 3. This is the framework-free mirror of `@verdocs/react-sdk`: same visual states, same events (as DOM CustomEvents), same wire behavior.

## Usage

```ts
import '@verdocs/wc-sdk/styles.css';
import '@verdocs/wc-sdk';
import { VerdocsEndpoint } from '@verdocs/js-sdk';

new VerdocsEndpoint({ baseURL: 'https://api.verdocs.com' }).setDefault();

document.body.innerHTML = '<vdocs-auth></vdocs-auth>';
document.querySelector('vdocs-auth')!.addEventListener('vdocs-authenticated', e => {
  console.log('session state', e.detail);
});
```

There is no provider tree in plain HTML, so the js-sdk's default endpoint singleton plays that role: configure it once at startup. Every component that talks to the API also accepts an `endpoint` property override for dual-session scenarios (a signing flow inside a user app).

## Design notes

- Components render to light DOM on purpose: white-label CSS from the host page reaches our markup. Styling comes entirely from the compiled stylesheet (`vdocs:`-prefixed utilities, `--vdocs-*` tokens on `:root`), so theming is a matter of overriding CSS variables.
- Public events use the `vdocs-` prefix, bubble, and are composed: `vdocs-authenticated`, `vdocs-sdk-error`, `vdocs-view-template`, and so on, with typed payloads in `detail`.
- Objects and arrays travel through properties, not attributes. A couple of booleans that default to true (`visible` on vdocs-auth, `showPagination` on vdocs-templates-list) are property-only, since a boolean attribute cannot express false-by-absence against a true default.
- Elements self-register at module scope. Importing `@verdocs/wc-sdk` (or an individual element module) is what makes the tags usable; registration no-ops on the server and warns instead of throwing when a tag is already defined.
- No SSR: Lit's server renderer only supports shadow DOM components, so load these on the client.

See `docs/standards/web-components.md` in the repo for the full rules, and `apps/quickstart-wc` for a runnable login + dashboard example.
