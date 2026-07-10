# SDK POC Status

Written at the end of the POC build session on 2026-07-09. Everything below is staged in this repo, nothing is committed. The execution contract was SDK-POC-PLAN.md; this file covers what exists, how to run it, what deviated, and what needs a decision.

## What exists

- `packages/react-sdk` (`@verdocs/react-sdk` 1.0.0): the native React 19 SDK. VerdocsProvider (owns an internal TanStack Query client, accepts an external one), public hooks (`useVerdocs`, `useSession`, `useTemplates`, `useToggleTemplateStar`), VerdocsAuth with full parity (login, signup with EULA links and E.164 phones, email verification, forgot/reset, signed-in state, temp-endpoint pattern), VerdocsTemplatesList (filters with local-filter-while-typing, star mutation, usage counts, contextual date column, ownership badges, pagination, row menu with Sign Now disabled and no delete), and the six exported controls (Button, TextInput, Spinner, QuickFilter, Dropdown, Pagination). Built with tsup (ESM + CJS + d.ts). 24 vitest + testing-library tests.
- Styling: Tailwind 4 as a build-time tool only, `vdocs:` prefix, no preflight, no Shadow DOM. The compiled `dist/styles.css` emits every design token as a `--vdocs-*` custom property on `:root` (Tailwind's prefix feature gives us this for free), so white-labeling is variable overrides, with plain low-specificity CSS as the escape hatch. The legacy Stencil namespace was `--verdocs-*`, so old overrides cannot bleed in.
- `apps/storybook`: Storybook 10.4 on react-vite, pointing at stories colocated in `packages/react-sdk/src/**/*.stories.tsx`. The Auth story does a real login against beta; the templates story reuses the persisted session and renders live data. Controls have stories too.
- `apps/quickstart-react`: Vite + React Router 7, `/login` and `/dashboard` with a session guard, dashboard hosts VerdocsTemplatesList with toast callbacks. Defaults to beta, `VITE_VERDOCS_API_BASE` overrides.
- `packages/angular-sdk` (`@verdocs/angular-sdk` 1.0.0): independent native Angular 22 implementation. Standalone components, signal inputs/outputs, zoneless-compatible, `provideVerdocs()` mirroring the provider, `VerdocsSessionService` signals, and a signal-based `VerdocsTemplatesService` built on `resource()` + `linkedSignal` whose query keys and invalidation semantics match the React hooks. Built with ng-packagr, tested through the official `@angular/build:unit-test` vitest builder (13 tests). Ships its own compiled stylesheet with the same `--vdocs-*` tokens.
- `apps/quickstart-angular`: Angular Router equivalent of the React quickstart, zoneless, `authGuard` built on the session service. API base lives in `src/environments/environment.ts` (the Angular equivalent of the env override; use fileReplacements for per-env builds).
- `packages/conformance`: the curl-vs-SDK harness seed. Four endpoints covered: authenticate (password grant), current user/profile, getTemplates, star toggle. Each is called with real curl in a child process and with the SDK, then status/shape/data are diffed with volatile fields normalized. Runs via `pnpm test:conformance` (needs the gitignored `.env`; `.env.example` is committed), excluded from CI and from the root vitest run.
- Hub root modernization: node >= 24 engines, `packageManager: pnpm@10.34.4`, `.nvmrc`, turbo `test` task with `^build` deps, root vitest projects config, `.github/workflows/ci.yml` (pnpm setup, then turbo lint/check-types/test/build), dead `generate-docs.yml` deleted.

## How to run things

```bash
pnpm install                                       # hub root
pnpm exec turbo run lint check-types test build    # the full gate
pnpm --filter verdocs-quickstart-react dev         # React quickstart (Vite, port 5173)
pnpm --filter verdocs-storybook dev                # Storybook on 6006
pnpm --filter verdocs-quickstart-angular dev       # Angular quickstart on 4200
pnpm test:conformance                              # live against beta, needs .env
```

Angular tooling (angular-sdk build/test, quickstart-angular) needs Node >= 24.15; see deviations.

## Test results

- `turbo run lint check-types test build`: all 22 tasks green across the seven workspaces (js-sdk untouched but participating).
- react-sdk: 24/24 tests. angular-sdk: 13/13 through the official vitest builder. conformance: 5/5 against live beta.
- Live verification (all servers torn down afterward):
  - React quickstart: real login to beta, dashboard listed 10 templates with counts/dates/badges, visibility filter requeried (`visibility=private`), pagination requeried (`page=1`), row menu fired onViewTemplate (toast shown), Sign Now disabled, no Delete, sign-out cleared the session and bounced to /login.
  - Storybook: Auth story performed a real login; TemplatesList story rendered 10 live rows off that persisted session.
  - Angular quickstart: same login/dashboard/filter/menu/sign-out pass, with wire-identical query params to the React SDK.

## Findings (real bugs, caught during the build)

1. **The template star toggle is broken server-side, for every client.** The deployed route is `GET /v2/templates/:id/star` (api/src/endpoints/Templates.ts ~305), but the handler parses `req.body` against `TemplateOperationSchema`, whose only member is the template-duplicate payload, so every request 400s. Browsers cannot even send GET bodies. It also requires EDIT permission to star, which probably should be READ. Separately, js-sdk 6.10.0's `toggleTemplateStar` calls `POST /v2/templates/:id/stars/toggle`, which does not exist (its own doc comment says `POST .../star`, which also does not exist). The conformance harness caught all of this on its first run, which is exactly the job it was built for. Both component SDKs currently ship a small, clearly-marked compat call to the deployed GET route (react-sdk `src/api/templateStar.ts`, angular-sdk `src/lib/templates.ts`), so stars work the moment the API fix lands, and the conformance star check asserts curl/SDK equivalence (green now, still green after the fix). The star DoD item ("toggles and persists") is not demonstrable against beta until then; the UIs surface the 400 through onSdkError as designed. I spawned a follow-up task chip for the platform-side fix.
2. **js-sdk's CJS build is broken.** `dist/index.js` does `require('axios-retry')` without default-export interop, so constructing a VerdocsEndpoint throws under Node's CJS loader. Bundlers use the ESM `dist/index.mjs` (fine), which is why nobody noticed. The react-sdk and conformance vitest configs alias to the ESM build as a workaround. Worth fixing in js-sdk's rollup config when it is next touched.
3. **The shared eslint react-internal config double-registered the @typescript-eslint plugin** (base.js pulls it from `@typescript-eslint/eslint-plugin`, react-internal.js re-added it via the `typescript-eslint` meta-package), which ESLint 9 rejects when the copies are different module instances. Fixed in platform as part of the 1.0.0 prep.

## Deviations from the plan

1. **The config-package publishes did not happen yet.** Both packages are fully prepped in platform at 1.0.0 (new `vite.json` bundler-mode tsconfig + exports, READMEs, the eslint fix above), and dry-runs were pre-verified, but the permission layer requires Chad's in-chat approval for `npm publish` and would not accept the handoff file as authorization. Until then, hub consumes them through a temporary `pnpm.overrides` block in the root package.json (`link:../platform/packages/...`). After publishing, delete those two override lines, run `pnpm install`, and CI becomes self-sufficient. This is the one step keeping hub's CI from passing on a clean checkout.
2. **Angular data layer is hand-rolled signals, not the TanStack Query adapter.** The adapter is still `@tanstack/angular-query-experimental` (breaking changes allowed on patch releases), which fails the plan's production-ready bar, so the plan's own fallback applied. Query keys and invalidation semantics mirror the React hooks as required.
3. **Node 24.18.0 installed via nvm and made the default** (was 24.8.0). Angular CLI 22 requires >= 24.15. Same major, low risk, but it does change the machine default; `.nvmrc` pins 24.
4. **vi.mock is unsupported under Angular's unit-test builder** (it pre-bundles sources; its own error message says to prefer TestBed approaches). The Angular component specs fake the API at the HTTP layer with axios-mock-adapter instead, which also exercises the real js-sdk request path. One gotcha worth remembering: the builder silently skips emit when the spec tsconfig inherits `noEmit: true`, which presents as "file not found in TypeScript compilation"; `tsconfig.spec.json` needs `noEmit: false`.
5. **Signup was verified to the form-and-validation level, not through account creation.** Completing signup requires an emailed verification code, and the flow logic is covered by unit tests; I chose not to create throwaway accounts on beta. If you want a full E2E signup pass, it needs an inbox we control.
6. Small library notes: the list's date column uses `Intl.DateTimeFormat` instead of date-fns (one less dependency), and toasts are the planned minimal internal utility (`showToast`).
7. **Newer majors exist but the plan's pins were kept**: React Router 8.2 and pnpm 11 are out; the POC uses RR 7.18 and pnpm 10.34.4 as specified. Easy bumps later if wanted.

## Open questions for Leadership

1. What is the canonical star-toggle route: fix the deployed GET handler in place, or add the POST route js-sdk expects and align both? (A mutating GET is questionable; the follow-up task chip covers the API fix either way. The SDK compat shims should be deleted once decided.)
2. Approve the `npm publish` of `@verdocs/eslint-config` and `@verdocs/typescript-config` at 1.0.0 (mechanical; blocked only on permissions).
3. Should js-sdk's broken CJS entry be fixed now or with the types-pipeline work? It affects any direct Node/CommonJS consumer of js-sdk today.

## Suggested next steps

- Publish the two config packages, drop the pnpm overrides, re-run `pnpm install`, and push to let CI run.
- Land the star-toggle API fix, then delete the two compat shims and point the conformance star check back at js-sdk's `toggleTemplateStar`.
- Wire conformance into CI once secrets exist (`VERDOCS_API_BASE`, `VERDOCS_TEST_EMAIL`, `VERDOCS_TEST_PASSWORD`).
- Grow conformance coverage endpoint-by-endpoint as SDK work continues; it caught two real bugs in four endpoints.
- When the family grows (`@verdocs/vue-sdk`, `@verdocs/wc-sdk`), the react-sdk package layout and the angular-sdk's independent-implementation pattern are the templates to follow.
