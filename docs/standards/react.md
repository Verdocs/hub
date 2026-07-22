# React SDK Standards

This document is binding for `packages/react-sdk`, our native React 19 SDK. It exists so the package reads like one person wrote it: reviewers cite a rule number instead of re-litigating style, and contributors know what done looks like before opening a PR. The package targets React 19 with TanStack Query v5 (verified current on npm 2026-07-10: react 19.2.7, @tanstack/react-query 5.101.2, matching our package.json), builds with tsup, styles with build-time Tailwind 4 under the `vdocs:` prefix, and tests with Vitest and Testing Library. The POC-era files were swept to these rules when the doc landed; there is no legacy style to preserve.

## Binding rules

1. Components are function declarations with a typed props object, never `React.FC` and never arrow consts. Declarations hoist, name themselves in stack traces, and `FC` adds nothing in modern React.
2. One exported component per file, the filename matches the component name, and the component is the file's `export default function`. A component is always findable by grepping its name.
3. Non-exported helper components may colocate in the same file. The moment a helper earns an export, it earns its own file.
4. Props are an exported `interface` named `XxxProps`, declared in the component's file, with a JSDoc line per prop. Interface over type alias because it extends native attribute types cleanly; exported because consumers import and extend these, which makes them public API.
5. Components that wrap a DOM element extend the native attributes (`ComponentProps<'button'>`, or `ButtonHTMLAttributes` with `Omit` for anything we replace) and spread `...rest` onto the element. Callers get `className`, `disabled`, ARIA, and data attributes for free.
6. `ref` is a regular prop. `forwardRef` is banned: React 19 passes `ref` through props, and forwardRef is slated for deprecation.
7. Callback props are named `onXxx` and handler functions inside a component are named `handleXxx`. Component-specific events get domain names (`onAuthenticated`, `onSdkError`), not generic ones.
8. Custom hooks are named `useXxx` and call at least one other hook. A function that calls no hooks stays a plain function without the prefix, so it can be called conditionally.
9. Server state lives in TanStack Query, never mirrored into `useState`. Query keys are arrays ordered generic to specific and include every variable the query function reads: `['templates', 'list', params]`, `['templates', id]`.
10. Mutations reconcile the cache in `onSuccess` (`setQueryData` for the changed entity, `invalidateQueries` for its lists) and return the invalidation promise, so `isPending` holds until the refetch lands.
11. Derive, don't duplicate. Anything computable from props or other state is computed during render (memoized with `useMemo` only when measurably expensive), never stored in state and synced with an effect.
12. Effects synchronize with external systems only: endpoint session listeners, browser APIs, timers. Data transforms belong in render, responses to user actions in event handlers, and parent notifications in the handler that caused the change.
13. Tests query like a user: `getByRole` first, `getByLabelText` and `getByText` next, `getByTestId` last. Interactions go through `@testing-library/user-event` (never `fireEvent`), and snapshot-only tests aren't coverage: every test asserts behavior.
14. Stories and tests colocate with the code: `ComponentName.stories.tsx` for every visual component, `ComponentName.spec.tsx` (or `useXxx.spec.tsx`) beside what they test.
15. Styling is build-time Tailwind 4 with the `vdocs:` prefix, nothing else. No runtime CSS-in-JS and no inline style objects for anything a class can express; everything compiles into the `dist/styles.css` consumers import.

## Layout

`src/index.ts` is the public entry. If it's re-exported there, it's public API and changes to it follow semver.

- `src/controls/`: small design-system controls as flat files (`Button.tsx`, `Button.stories.tsx`).
- `src/components/`: composite feature components, one folder each (`VerdocsAuth/VerdocsAuth.tsx` with its stories and specs).
- `src/hooks/`: shared hooks, one concern per file (`useSession.ts`, `useTemplates.ts`).
- `src/api/`: thin request helpers covering js-sdk gaps.
- `src/provider/`: the provider and its context.
- `src/utils/` and `src/types.ts`: shared helpers and cross-cutting types.
- `src/test/setup.ts`: Vitest setup (jsdom, jest-dom matchers).

## Queries and mutations

Data hooks wrap `@verdocs/js-sdk` calls; they never hand-roll fetching. Every data hook takes an optional trailing `endpointOverride?: VerdocsEndpoint` resolved through `useResolvedEndpoint`, which is how dual-session (user plus signing) apps work. List queries set `placeholderData: keepPreviousData` so page and filter changes don't flash empty states. Keep key families hierarchical so one `invalidateQueries({ queryKey: ['templates', 'list'] })` catches every filtered variant.

## Testing

Vitest with jsdom, `globals: true`, and setup in `src/test/setup.ts`. Hooks are tested with `renderHook` plus `waitFor`, and state changes triggered outside React are wrapped in `act`. Component tests follow the user-event setup pattern: `const user = userEvent.setup()` before `render`, then `await user.click(...)`. Tests construct a non-persisting `VerdocsEndpoint` so session state never leaks between cases.

## Stories

Stories use the `satisfies Meta<typeof Component>` pattern from `@storybook/react-vite`, with `title` mirroring the folder (`Controls/Button`). Give every meaningful variant its own named export; a variant a designer can't click through in Storybook isn't done.

## Sources

Consulted 2026-07-10:

- https://react.dev/versions confirmed React 19.2 is the current stable line (latest patch 19.2.7, June 2026).
- https://registry.npmjs.org confirmed react 19.2.7 and @tanstack/react-query 5.101.2 as the latest published versions.
- https://react.dev/reference/react/forwardRef states forwardRef is unnecessary in React 19 and will be deprecated; ref is a prop (rule 6).
- https://react.dev/learn/you-might-not-need-an-effect informed rules 11 and 12: effects are for external systems, derive during render, handle events in handlers.
- https://react.dev/learn/reusing-logic-with-custom-hooks informed rule 8: the use prefix marks functions that call hooks, and only those.
- https://react.dev/learn/responding-to-events informed rule 7: onXxx props, handleXxx functions, domain-named events on custom components.
- https://tanstack.com/query/v5/docs/framework/react/guides/query-keys informed rule 9: array keys, generic to specific, include every dependency.
- https://tanstack.com/query/v5/docs/framework/react/guides/invalidations-from-mutations informed rule 10: invalidate in onSuccess and return the promise to hold isPending.
- https://testing-library.com/docs/queries/about/ informed rule 13: query priority, role first, test id last.
- https://testing-library.com/docs/user-event/intro/ informed rule 13 and the Testing section: user-event over fireEvent, the setup() pattern.
- https://github.com/shadcn-ui/ui (new-york-v4 button.tsx) shows function declarations with native ComponentProps spreads and no forwardRef on its React 19 line (rules 1, 5, 6).
- https://github.com/mantinedev/mantine (core Button.tsx) shows the exported XxxProps interface convention (rule 4).
- https://github.com/radix-ui/primitives (switch.tsx) shows exported per-part props interfaces and domain event names like onCheckedChange (rules 4, 7).
