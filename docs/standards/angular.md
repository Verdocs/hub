# Angular SDK Standards

This document is binding for `packages/angular-sdk`, our native Angular SDK. Same purpose as its React sibling: the package should read like one person wrote it, reviewers cite a rule number instead of re-litigating style, and contributors know what done looks like before opening a PR. The package targets Angular 22, the current stable major (verified on npm 2026-07-10: @angular/core latest is 22.0.6, matching our ^22.0.6 pins), builds with ng-packagr through `@angular/build:ng-packagr`, styles with build-time Tailwind 4 under the `vdocs:` prefix, and tests with Vitest through the official `@angular/build:unit-test` builder. The signal-based service layer deliberately mirrors the React SDK's TanStack Query hooks; where the two SDKs can match, they must. The SDK is new enough that there's no legacy exemption: every file complies.

## Binding rules

1. Standalone only. Components, directives, and pipes are standalone (the default since v19), so never write `standalone: true` and never create an NgModule. The library's only wiring surface is `provideVerdocs()`, which returns `EnvironmentProviders`.
2. Inputs and outputs are the signal functions: `input()`, `input.required()`, `output()`, and `model()` for two-way bindings. The `@Input`/`@Output` decorators are banned; the Angular team recommends the signal forms, and they're what makes OnPush and zoneless work.
3. Mark every Angular-initialized property (inputs, outputs, models, queries) `readonly`, and use `protected` for members the template reads but consumers shouldn't. Both straight from the current style guide.
4. Use `inject()` for dependencies, never constructor parameters. Helpers that must run in an injection context are named `injectXxx` (`injectVerdocsEndpoint`) so call sites signal the constraint.
5. Templates use built-in control flow only: `@if`, `@for`, `@switch`. The structural directives `*ngIf`/`*ngFor`/`*ngSwitch` were deprecated in v20 and never appear here. `@for` tracks a stable identity (`track template.id`), not `$index`, unless the collection is truly static.
6. Every component declares `changeDetection: ChangeDetectionStrategy.OnPush` and must run correctly zoneless. Zoneless is the default for new Angular apps since v21, so assume consumers have no zone.js: all template state lives in signals, and we never touch NgZone.
7. Host bindings and listeners go in the decorator's `host` object, never `@HostBinding`/`@HostListener`. The style guide and Angular Material's coding standards both prefer the object form.
8. Selectors are `verdocs-` prefixed kebab-case (the `prefix` in angular.json), classes are `VerdocsXxxComponent`/`VerdocsXxxService`, and outputs get domain event names without an `on` prefix (`viewTemplate`, `sdkError`). React's `onViewTemplate` is this SDK's `viewTemplate`.
9. One component per file. Component files are `kebab-case.component.ts`; the current style guide made type suffixes optional, but we keep `.component.ts` so component files stand apart from the domain service files they sit near (`templates.ts` is the service, `templates-list.component.ts` the component).
10. Templates are inline, always: no `templateUrl`, no `styleUrl`. A single file keeps a component greppable and reviewable; when a template outgrows readability, extract a child component, not an html file.
11. Derive, don't duplicate. `computed()` for anything computable from other state; `linkedSignal()` when local state follows an input until the user overrides it (the `initialVisibility` pattern) or when a previous value should survive a reload. Never store what you can derive.
12. `effect()` synchronizes with external systems only: endpoint session listeners, browser APIs. Deriving state belongs in `computed`, and emitting outputs belongs in the handler for the user action that caused them. An effect that writes signals from other signals is a bug.
13. Server state goes through `resource()` in the service layer (stable as of v22), never hand-rolled fetching in components. The resource's `params` computation produces a key tuple that mirrors the React SDK's TanStack keys exactly: `['templates', 'list', params]`. If the React key changes shape, this SDK changes with it.
14. The public API speaks signals, not observables. No `Observable` returns from public methods, and rxjs stays out of our peer dependencies; interop is the consumer's job.
15. Tests use TestBed with the real `provideVerdocs()` and fake the network with axios-mock-adapter. `vi.mock` doesn't work here and is banned: the unit-test builder pre-bundles specs, so Vitest never sees the module graph and throws on it anyway.

## Layout

`src/public-api.ts` is the ng-packagr entry. If it's re-exported there, it's public API and changes follow semver.

- `src/lib/controls/`: small design-system controls as flat files (`button.component.ts`).
- `src/lib/components/`: feature components, in their own folder once they have companions (`templates-list/` holds the list, its star sub-component, and its spec).
- `src/lib/`: domain services as plain files (`templates.ts`, `session.ts`, `toast.ts`), plus `provide-verdocs.ts`, `types.ts`, and `test-support.ts`.
- Specs colocate as `*.spec.ts` beside what they test.

## Services and data

Services are `@Injectable({ providedIn: 'root' })` and expose query factories that take a `Signal` of params plus an optional `Signal` endpoint override. Every data API takes that override; it's how dual-session (user plus signing) apps work, matching React's `endpointOverride`. Factories must be called from an injection context (field initializer or constructor) and register their cleanup on `DestroyRef`. Inside, `resource()` does the fetching, and a `linkedSignal` keeps the previous page while the next loads, our equivalent of TanStack's `keepPreviousData`, so paginated UIs never flash empty. Query objects expose `data`, `isPending`, `isFetching`, `error`, and `reload` with TanStack's meanings, and mutations reload every active list query afterward, the same invalidation the React SDK gets from `invalidateQueries({ queryKey: ['templates', 'list'] })`.

## Testing

The `test` target runs `@angular/build:unit-test`, which drives Vitest (the CLI default runner since v21) in jsdom. Because the builder compiles specs to chunks before Vitest runs, module mocking doesn't exist here; fake at the HTTP layer instead: `new MockAdapter(axios)` over the js-sdk's axios instance, route stubs per test, `mock.restore()` in `afterEach`. Configure with `TestBed.configureTestingModule({ providers: [provideVerdocs({...})] })`, drive with `fixture.detectChanges()` and `await fixture.whenStable()`, and assert through the DOM. Clear `localStorage` in `beforeEach`: the endpoint persists sessions, and state must never leak between cases.

## Sources

Consulted 2026-07-10:

- https://www.npmjs.com/package/@angular/core dist-tags confirmed v22 is the current stable major (latest 22.0.6, matching our pins; v21 in LTS).
- https://angular.dev/style-guide informed rules 3, 4, and 9: hyphenated file names, one concept per file, inject() over constructor params, protected template members, readonly Angular-initialized properties.
- https://angular.dev/guide/components/inputs states the Angular team recommends signal input() over @Input, with input.required(), transforms, and model() for two-way (rule 2).
- https://angular.dev/guide/templates/control-flow documents @if/@for/@switch and the mandatory track expression (rule 5).
- https://blog.ninja-squad.com/2025/05/28/what-is-new-angular-20.0 confirms *ngIf/*ngFor/*ngSwitch were deprecated in v20 and linkedSignal went stable in v20 (rules 5, 11).
- https://angular.dev/guide/zoneless covers zoneless as the v21+ default, what keeps a component compatible, and the NgZone APIs that never fire (rule 6).
- https://angular.dev/guide/signals/resource documents resource() params/loader semantics, reload(), status, and request aborting (rule 13).
- https://blog.ninja-squad.com/2026/06/03/what-is-new-angular-22.0 confirms the resource API went stable in v22 (rule 13).
- https://blog.angular.dev/announcing-angular-v21-57946c34f14b announced zoneless by default for new apps and stable Vitest support (rules 6, 15).
- https://angular.dev/guide/testing documents the @angular/build:unit-test builder with Vitest and jsdom as the defaults (rule 15).
- https://github.com/angular/angular-cli/issues/31609 tracks vi.mock being unsupported under the builder, which pre-bundles specs before Vitest sees them (rule 15).
- https://github.com/angular/components/blob/main/CODING_STANDARDS.md: Material prefers the host object over @HostBinding/@HostListener and hyphenated component selectors (rules 7, 8).
- https://github.com/spartan-ng/spartan (libs/helm/button/src/lib/hlm-button.ts) shows a modern standalone library built on signal inputs, host objects, and inject-based config (rules 1, 2, 7).
