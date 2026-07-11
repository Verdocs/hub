# Vue SDK Standards

This document is binding for `packages/vue-sdk`, our native Vue 3 SDK. It mirrors `@verdocs/react-sdk` independently (same capabilities, same query keys, never generated from it) and works like `react.md`: reviewers cite a rule number instead of re-litigating style, and contributors know what done looks like before opening a PR. The package targets the Vue 3.5 line (peer dependency `^3.5.0`; verified current online 2026-07-10: vue 3.5.39 from June 2026 is the latest stable, 3.6 is beta only and we don't ship on betas) with TanStack Query v5 (`@tanstack/vue-query` 5.101.2, the same line as the React SDK's `@tanstack/react-query` 5.101.2). Components are script setup SFCs with TypeScript, styling comes from the compiled `vdocs` stylesheet, and tests run on Vitest with Vue Test Utils.

## Binding rules

1. Every component is a `<script setup lang="ts">` SFC. No Options API, no mixins, no hand-rolled render functions: one composition style keeps the package greppable and matches the React SDK being hooks-only. A plain `<script lang="ts">` block may sit above it for exported types and injection keys, nothing else.
2. SFC block order is script, template, style. Script first so the component's contract (props, emits, models) is the first thing a reader sees; the style guide only demands a consistent order with style last, so this is our pick, and per rule 14 library components have no style block anyway.
3. One exported component per file, and the filename matches the component name in PascalCase (`VerdocsAuth.vue`). A component is always findable by grepping its name.
4. Every component name starts with `Verdocs`, internal controls included (`VerdocsButton`, not `Button`). Vue's essential rule requires multi-word names so tags never collide with current or future HTML elements, and the prefix namespaces us in consumer templates whether they write `<VerdocsAuth />` or `<verdocs-auth>`.
5. Props use type-based `defineProps<XxxProps>()` against an exported interface with a JSDoc line per prop, defaults via reactive props destructure. Declarations are camelCase; template attributes and docs use kebab-case.
6. Emits use the tuple type syntax (`defineEmits<{ authenticated: [session: ISession] }>()`) with camelCase domain event names, never generic `change` or `input`. `update:xxx` is reserved for models.
7. Two-way binding goes through `defineModel()`, with named models (`defineModel('search')`) for secondary values. Never hand-roll a `modelValue` prop plus `update:modelValue` emit; defineModel is the same contract with less surface.
8. Composables are named `useXxx`, live one concern per file in `src/composables/`, return a plain object of refs (never `reactive()`) so destructuring keeps reactivity, and accept reactive inputs as `MaybeRefOrGetter` read with `toValue()`. Any side effect a composable registers is cleaned up on scope dispose or unmount.
9. The endpoint travels by provide/inject under an exported typed key (`Symbol() as InjectionKey<VerdocsEndpoint>`). `VerdocsProvider` provides it; `useResolvedEndpoint(override?)` injects it, prefers an explicit `endpoint` prop override (how dual-session apps work), and throws an error naming the fix when neither exists. Same names and semantics as the React provider.
10. Server state lives in TanStack Vue Query, never mirrored into local refs. Query keys are the React SDK's keys verbatim, arrays ordered generic to specific with every variable the query function reads: `['templates', 'list', params]`, `['templates', id]`. Reactive params go into the key and are read with `toValue()` in `queryFn`; vue-query tracks refs in keys and unwraps them before hashing, so serialized keys stay interchangeable with React's.
11. Mutations reconcile the cache in `onSuccess`: `setQueryData` for the changed entity, `invalidateQueries` for its list family, returning the invalidation promise so `isPending` holds until the refetch lands. Rule-for-rule identical to the React SDK.
12. `ref()` is the default reactive container, `shallowRef()` where payloads are large. Avoid `reactive()`: it can't be destructured or replaced wholesale, and mixing the two styles makes reactivity loss a guessing game.
13. Derive, don't sync. Anything computable from props or other state is a `computed`; `watch` and `watchEffect` exist only to sync with external systems (endpoint session listeners, browser APIs, timers). A watcher writing a ref that a computed could produce is a bug.
14. Library components ship no `<style>` block, scoped or otherwise. Templates use plain `vdocs` classes resolved by the compiled stylesheet consumers import from `dist/styles.css`; scoping would hash our selectors and block the white-label CSS customers write against component internals. This is the class-based scoping strategy the style guide's essential rule explicitly allows.
15. Template hygiene: every `v-for` is keyed, `v-if` never shares an element with `v-for`, and any expression beyond simple member access moves into a computed.
16. Tests are Vitest plus `@vue/test-utils` with jsdom, colocated as `VerdocsXxx.spec.ts` (or `useXxx.spec.ts`). Assert rendered DOM, emitted events via `wrapper.emitted()`, and user-visible behavior, never internal refs or component state.

## Layout

`src/index.ts` is the public entry. If it's re-exported there, it's public API and changes to it follow semver.

- `src/controls/`: small design-system controls as flat files (`VerdocsButton.vue`).
- `src/components/`: composite feature components, one folder each (`VerdocsAuth/VerdocsAuth.vue` with its specs and stories).
- `src/composables/`: shared composables, one concern per file (`useSession.ts`, `useTemplates.ts`).
- `src/api/`: thin request helpers covering js-sdk gaps.
- `src/provider/`: `VerdocsProvider.vue`, the injection keys, and `useResolvedEndpoint`.
- `src/test/setup.ts`: Vitest setup.

Stories colocate as `VerdocsXxx.stories.ts` on `@storybook/vue3-vite`, with the React SDK's bar: every meaningful variant gets a named export a designer can click through.

## Queries and mutations

Data composables wrap `@verdocs/js-sdk` calls; they never hand-roll fetching. Every data composable takes its params as `MaybeRefOrGetter` plus an optional trailing `endpointOverride?: VerdocsEndpoint`, and list queries set `placeholderData: keepPreviousData` so page and filter changes don't flash empty states. `useQuery` returns an object of refs, so composables can pass its result straight through and callers destructure safely. `VerdocsProvider` mirrors the React provider's props (`baseUrl`, `endpoint`, `queryClient`): it owns an internal `QueryClient` with the same defaults as the React provider (retry 1, staleTime 60s, refetch on window focus) and accepts the host app's client so an app already on vue-query shares one cache. Keep key families hierarchical so one `invalidateQueries({ queryKey: ['templates', 'list'] })` catches every filtered variant.

## Testing

We use `@vue/test-utils` rather than `@testing-library/vue` because that's what vuejs.org's testing guide currently recommends for component testing, it's maintained by the Vue team alongside Vue itself, and the testing-library wrapper sits on top of it anyway. Keep the user-first spirit regardless: assert what a user sees and does (rendered text, disabled states, emitted events), not implementation details. Tests provide the endpoint key through `mount`'s `global.provide` with a non-persisting `VerdocsEndpoint` so session state never leaks between cases, use a fresh `QueryClient` per test, and settle async queries with `flushPromises`.

## Sources

Consulted 2026-07-10:

- https://github.com/vuejs/core/releases confirmed vue 3.5.39 (June 25, 2026) as the latest stable, with 3.6 still in beta.
- https://vuejs.org/about/releases documents the release model (minors every 3 to 6 months, always through beta first), backing the stable-minors-only stance.
- https://github.com/TanStack/query/releases confirmed @tanstack/vue-query 5.101.2 (June 27, 2026), matching the react-sdk's query dependency line.
- https://vuejs.org/style-guide/rules-essential informed rules 4, 14, and 15: multi-word names, detailed props, keyed v-for, no v-if with v-for, and the class-based scoping strategy.
- https://vuejs.org/style-guide/rules-strongly-recommended informed rules 3 and 5: PascalCase SFC filenames, camelCase prop declarations, kebab-case template attributes.
- https://vuejs.org/style-guide/rules-recommended informed rule 2: consistent SFC block order with style last.
- https://vuejs.org/guide/reusability/composables.html informed rule 8: the use prefix, returning a plain object of refs, toValue over manual unwrapping.
- https://vuejs.org/guide/typescript/composition-api.html informed rules 5, 6, 7, and 9: type-based defineProps/defineEmits, reactive props destructure defaults, defineModel, and InjectionKey.
- https://vuejs.org/guide/scaling-up/testing informed rule 16: Vitest as the recommended runner and @vue/test-utils as the recommended component testing library.
- https://tanstack.com/query/latest/docs/framework/vue/guides/query-keys informed rule 10: array keys hashed deterministically, refs included in keys and tracked.
- https://tanstack.com/query/latest/docs/framework/vue/guides/query-invalidation informed rule 11: useQueryClient plus prefix matching on key families.
- https://tanstack.com/query/latest/docs/framework/vue/quick-start shows useQuery returning destructurable refs and invalidation inside mutation onSuccess.
- https://github.com/unovue/reka-ui (v2, Dialog/DialogRoot.vue) models rules 1, 2, 5, 6, 9, and 14 in a shipping library: script-first SFCs, exported JSDoc'd props interfaces, tuple-typed emits, typed provide/inject context, no style blocks.
- https://vueuse.org/guidelines informed rules 8 and 12: ref over reactive, shallowRef for large data, side-effect cleanup on scope dispose.
