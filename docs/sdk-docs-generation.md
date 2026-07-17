# SDK docs generation

This is the plan for generating reference documentation for our backend language SDKs (`packages/js-sdk`, `sdks/python`, `sdks/csharp`, and whatever we add next) and publishing it into the Fumadocs dev-docs site. It supersedes the earlier per-language-tree design. It is a design doc, not shipped code. Nothing here is built yet.

Scope: the API-client SDKs only. That means `packages/js-sdk` and `sdks/*`. The frontend UI SDKs (`react-sdk`, `angular-sdk`, `vue-sdk`, `wc-sdk`, `web-sdk`) are out of scope; their docs are component and Storybook driven and follow a different track. The REST route reference is already covered by the OpenAPI pipeline, so it is out of scope too.

## What changed, and why

The first version of this plan gave every language its own navigation subtree:

```
sdk
└── languages
    ├── js      (getting-started, endpoints, helpers)
    ├── python  (getting-started, endpoints, helpers)
    └── csharp  (getting-started, endpoints, helpers)
```

That means a reader picks a language up front and stays in a silo, and we maintain three parallel copies of the same conceptual pages. We are dropping it.

The new structure is a single page set, with the language chosen per code snippet rather than per section, the way Stripe's reference works:

```
sdk
├── getting-started
├── endpoints
└── helpers
```

There is one "Create an Envelope" entry, and the code block on it toggles between TypeScript, Python, and C#. The reader never leaves the page to change languages, and we author each conceptual page once.

This changes one thing structurally in the pipeline: instead of each language rendering its own tree, we **merge** the per-language models into one unified model keyed by operation, so a single entry can hold a snippet per language. Everything else (per-language extractors, a shared schema, a single generator) carries over from the previous design.

## The one idea

The REST reference works because there is one machine-readable contract, `openapi.json`, and a generator that turns it into pages. We do the same for SDKs: define one normalized doc model, the `sdk-api` model, as the shared contract; have each language emit into it with a thin extractor; merge those per-language models into one; and run a single generator that turns the merged model into MDX. This is the same "share data, not code" split we already use for conformance, where `packages/conformance/fixtures.json` is the one shared file and each language writes a small adapter against it.

Every language reimplements only the small, language-specific step: reading its own doc format (XML doc comments, docstrings, TypeDoc JSON) and normalizing it. The merge, the generator, and the rendering are written once and never learn anything about a specific language.

## How the REST pipeline works today

Worth stating plainly, because the SDK pipeline mirrors it stage for stage.

1. Source of truth is TSDoc plus custom `@api*` tags on the js-sdk functions.
2. `packages/js-sdk` runs `typedoc` to emit `docs.json` (a reflection AST), then `generated/openapi/generate-openapi.ts` walks that AST and writes `packages/js-sdk/openapi.json` (OpenAPI 3.1).
3. The spec is copied into the dev-docs app at `apps/dev-docs/app/openapi.json` (today a manual `cp` on publish).
4. At build time, dev-docs runs `app/scripts/generate-docs.ts`, which calls `fumadocs-openapi`'s `generateFiles({ per: 'operation', groupBy: 'tag' })` and writes MDX into `content/docs/reference/Rest-API/api-docs/` (gitignored, regenerated every build).
5. Those MDX pages render through `createAPIPage(...)` from `fumadocs-openapi/ui`, registered in `app/mdx-components.tsx`.

The REST generator already emits a language switcher via `x-codeSamples`, built in `generated/openapi/snippets.ts`. Those are raw HTTP snippets (curl, fetch, Ruby, Python http.client), not SDK calls. The SDK reference reuses the same switcher idea but the snippets are real SDK code pulled from each SDK's doc comments.

The catch, same as before: `fumadocs-openapi` is special-cased for OpenAPI specs. There is no built-in Fumadocs integration that reads an SDK's surface and produces a reference. So for SDKs we own the generator (the `generateFiles` equivalent) and the render component (the `createAPIPage` equivalent). The contract, the extractors, and now the merge step are ours regardless.

## Navigation and page structure

The generated tree is three pages under `content/docs/reference/SDK/`:

```
content/docs/reference/SDK/
├── getting-started/
├── endpoints/
└── helpers/
```

- **Getting Started**: the most important page. The essentials for standing up the SDK: installing, authentication, creating a template, creating an envelope, and the handful of flows a new caller needs. This page is authored MDX (we own the prose and the ordering) that embeds operations tagged `@sdkGettingStarted`, so the code snippets stay in sync with the source while the narrative stays curated. It is not a home for operations; every featured operation still lives on Endpoints or Helpers.
- **Endpoints**: reference for every HTTP-related SDK function (the ones that call the API). Fully generated.
- **Helpers**: reference for every non-HTTP SDK function (local utilities like `sortFields`, `sortRecipients`). Fully generated.

Within Endpoints and Helpers, `@sdkGroup` drives the sections, exactly as it drives tags on the REST side. On the Endpoints page you get Envelopes, Templates, Organizations, and so on; each section lists that group's operations. This mirrors `groupBy: 'tag'` and keeps the SDK reference visually consistent with the REST reference.

Each entry on Endpoints and Helpers renders the same way: a summary, the signature, a params table, the return value, and a code example, with a language switcher over the languages that document that operation.

## The tag model

Tags live in each SDK's own doc comments (TSDoc in js-sdk, docstrings in Python, XML doc comments in C#). The extractor for each language reads them and fills the shared model. Where a tag has no native equivalent, the extractor supplies the value from context (for example, `@sdkLanguage` is implied by which SDK is being read).

### `@sdkOperation` (required)

The merge key. It ties the same logical operation across every SDK into one unified entry, and it doubles as the entry's URL anchor and cross-reference id. It must be an identical, stable string in all three SDK sources.

This is distinct from OpenAPI's `operationId` field in `openapi.json`. That value is derived by `generate-openapi.ts` from the TypeScript function name (or an `@apiName` override) and lives only in the REST pipeline. `@sdkOperation` is an authored tag on the SDK source, used as the cross-language merge key for the SDK reference.

Convention: `<group>.<functionName>`, lowercase-stable, for example `envelopes.createEnvelope`. When the operation maps to a REST route, keep the value related to the REST `operationId` so the SDK entry and the REST entry can link to each other (for example REST `createEnvelope` alongside SDK `envelopes.createEnvelope`).

```typescript
/**
 * Create an envelope.
 *
 * @sdkOperation envelopes.createEnvelope
 * @sdkGroup Envelopes
 * @sdkPage Endpoints
 */
```

The same operation in the Python SDK carries the same id:

```python
def create_envelope(self, request: CreateEnvelopeRequest) -> Envelope:
    """Create an envelope.

    @sdkOperation envelopes.createEnvelope
    @sdkGroup Envelopes
    @sdkPage Endpoints
    """
```

Two functions in the same language must not share an `@sdkOperation`; that is a collision (see merge semantics). Two functions in different languages sharing an id is the whole point: they are the same operation.

### `resource` ("function" | "interface" | "type" | "class")

Generated metadata describing what kind of SDK surface the entry documents. The SDK reference uses it to pick a page template (callable vs type vs class).

- **function**: free functions and methods (the bulk of the reference).
- **class**: a class entry such as `VerdocsEndpoint`.
- **interface** / **type**: exported interfaces and type aliases documented as their own entries.

Authors do not add an `@sdkResource` tag to doc comments. Each extractor gets the value from its language's native symbol metadata: TypeDoc reflection kinds for JavaScript, DocFX metadata for C#, and Griffe object kinds for Python. The normalized and unified JSON models retain the generated `resource` field.

```typescript
/**
 * @sdkOperation endpoint.VerdocsEndpoint
 * @sdkGroup Endpoint
 * @sdkPage Helpers
 * @sdkGettingStarted
 */
export class VerdocsEndpoint {
  // ...
}
```

### `@sdkPage` ("Endpoints" | "Helpers")

Which reference page the operation belongs to. Exactly one of these two; never Getting Started.

- If omitted, the extractor infers it: an operation with an `@api` tag (an HTTP call) defaults to **Endpoints**; everything else defaults to **Helpers**.

```typescript
/**
 * Create an envelope.
 *
 * @sdkOperation envelopes.createEnvelope
 * @sdkGroup Envelopes
 * @sdkPage Endpoints
 * @api POST /v2/envelopes Create Envelope
 */
```

### `@sdkGettingStarted` (optional)

Presence-only flag. When present, the operation is also featured on the Getting Started page. It does not move the operation off Endpoints or Helpers; the reference page from `@sdkPage` remains its home.

```typescript
/**
 * Create an envelope.
 *
 * @sdkOperation envelopes.createEnvelope
 * @sdkGroup Envelopes
 * @sdkPage Endpoints
 * @sdkGettingStarted
 * @api POST /v2/envelopes Create Envelope
 */
```

The example above appears under Envelopes on the Endpoints page and again in the Getting Started narrative.

### `@sdkGroup` (already in use)

The section within a page. This is the tag js-sdk already uses (`@sdkGroup Envelopes`, `@sdkGroup Templates`). C# groups by namespace or the same logical area; Python by resource namespace. The extractor maps whatever the language expresses onto a group name, so a group reads identically across languages.

### `@example` and fenced code

The per-language example. Prefer a fenced code block in the summary (the js-sdk house style) over a bare `@example` tag; both are accepted. The language comes from the fence, and the extractor stamps that language onto the snippet automatically:

```typescript
/**
 * Create an envelope.
 *
 * ```typescript
 * import {Envelopes} from '@verdocs/js-sdk/Envelopes';
 *
 * const {id} = await Envelopes.createEnvelope(VerdocsEndpoint.getDefault(), request);
 * ```
 *
 * @sdkOperation envelopes.createEnvelope
 * @sdkGroup Envelopes
 * @sdkPage Endpoints
 */
```

The switcher on the rendered entry offers exactly the languages that shipped an example for that `@sdkOperation`. A Python example authored in the Python SDK highlights with the Python grammar; the C# one with C#. We do not hand-write another language's example inside the js-sdk source.

### `@param`

Documents an SDK function argument (`endpoint`, `request`, and so on). This is the SDK function's own parameter list and feeds the params table on the entry. It is distinct from the OpenAPI `@apiParam` / `@apiBody` / `@apiQuery` tags, which describe the HTTP request and still feed `openapi.json`. An HTTP-bound function keeps both: `@param` for the SDK signature, `@api*` for the REST spec.

```typescript
/**
 * @param endpoint The VerdocsEndpoint carrying the caller's session.
 * @param request The envelope to create.
 */
```



### `@sdkLanguage` (optional override)

Normally unnecessary. Each extractor already knows its own language, and fenced code blocks self-identify, so the model is populated without it. Use `@sdkLanguage` only to override that inference, for example when an authored Getting Started snippet needs to be tagged as a language other than the file it lives in. If you find yourself reaching for it on ordinary reference functions, the fence should carry the language instead.

### Tag summary


| Tag                  | Required | Role                                                                         |
| -------------------- | -------- | ---------------------------------------------------------------------------- |
| `@sdkOperation`      | Yes      | Merge key across languages, URL anchor, cross-reference id                   |
| `@sdkPage`           | Yes      | Endpoints or Helpers; inferred from `@api` when omitted                      |
| `@sdkGettingStarted` | No       | Presence flag; also feature the operation on Getting Started                 |
| `@sdkGroup`          | Yes      | Section within a page; defaults per language convention if omitted           |
| `@example` / fence   | Yes      | Per-language code snippet; language read from the fence                      |
| `@param`             | Yes      | SDK argument docs; separate from the REST `@apiParam`/`@apiBody`/`@apiQuery` |
| `@sdkLanguage`       | No       | Override for the inferred snippet language; rarely needed                    |

The generated model also carries `resource` (`function`, `interface`, `type`, or `class`). This is inferred from native symbol metadata and is not an authored tag.




## The normalized doc model

One JSON schema, `sdk-api.schema.json`, describes the shape every language emits, before the merge. It is a symbol tree: groups holding symbols, each symbol one documentable thing (a method, a free function, a helper). Any field an extractor cannot fill is omitted.

```json
{
  "$schema": "./sdk-api.schema.json",
  "language": "typescript",
  "package": "@verdocs/js-sdk",
  "version": "5.0.0",
  "groups": [
    {
      "id": "envelopes",
      "name": "Envelopes",
      "summary": "Create and manage envelopes.",
      "symbols": [
        {
          "sdkOperation": "envelopes.createEnvelope",
          "kind": "method",
          "name": "createEnvelope",
          "page": "Endpoints",
          "gettingStarted": true,
          "resource": "function",
          "signature": "createEnvelope(endpoint: VerdocsEndpoint, request: TCreateEnvelopeRequest): Promise<IEnvelope>",
          "summary": "Create an envelope.",
          "params": [
            {"name": "endpoint", "type": "VerdocsEndpoint", "description": "The caller's session.", "optional": false},
            {"name": "request", "type": "TCreateEnvelopeRequest", "description": "The envelope to create.", "optional": false}
          ],
          "returns": {"type": "Promise<IEnvelope>", "description": "The newly-created envelope."},
          "example": {"language": "typescript", "code": "const {id} = await Envelopes.createEnvelope(VerdocsEndpoint.getDefault(), request);"},
          "deprecated": false,
          "since": "1.0.0"
        }
      ]
    }
  ]
}
```

Each language emits one of these (`model.js.json`, `model.python.json`, `model.csharp.json`). The `language` at the top, and the `example.language` on each symbol, are what the merge and the switcher key off of.

## The merged model

The merge step reads every `model.<lang>.json` and produces one `sdk-unified.json`. It groups symbols by `@sdkOperation` and collects each language's contribution into a `variants` array. The prose fields (summary, group, page, gettingStarted) come from a canonical language (js-sdk first, since it is the flagship and the most complete), and each variant carries the language-specific signature, params, and example.

```json
{
  "$schema": "./sdk-unified.schema.json",
  "operations": [
    {
      "sdkOperation": "envelopes.createEnvelope",
      "group": "Envelopes",
      "page": "Endpoints",
      "gettingStarted": true,
      "summary": "Create an envelope.",
      "variants": [
        {
          "language": "typescript",
          "signature": "createEnvelope(endpoint: VerdocsEndpoint, request: TCreateEnvelopeRequest): Promise<IEnvelope>",
          "params": [ /* ... */ ],
          "returns": {"type": "Promise<IEnvelope>", "description": "The newly-created envelope."},
          "example": {"code": "const {id} = await Envelopes.createEnvelope(VerdocsEndpoint.getDefault(), request);"}
        },
        {
          "language": "python",
          "signature": "create_envelope(request: CreateEnvelopeRequest) -> Envelope",
          "params": [ /* ... */ ],
          "returns": {"type": "Envelope", "description": "The newly-created envelope."},
          "example": {"code": "envelope = client.envelopes.create_envelope(request)"}
        }
      ]
    }
  ]
}
```

The generator consumes only this unified model. It does not know or care how many languages contributed.

## Merge semantics

The rules the merge step follows, and how it handles the messy cases.

- **Join key**: `@sdkOperation`, exact string match. All symbols sharing an id become the `variants` of one operation.
- **Canonical prose**: `summary`, `group`, `page`, and `gettingStarted` are taken from a priority order of languages (js-sdk, then python, then csharp). If two languages disagree on `group`, `page`, or `gettingStarted` for the same id, the canonical one wins and the merge emits a warning so the drift gets fixed at the source. This is the same "one source wins, warn on drift" stance the REST generator already takes when `@apiParam` tags disagree with the `@api` path template.
- **Missing a language**: an operation documented in js-sdk but not yet in python simply has fewer `variants`. The entry still renders; the switcher offers only the languages present. This is expected while the SDKs are at different maturities, not an error.
- **Language-only operations**: a helper that exists only in js-sdk (say a browser-oriented utility) renders with a single variant. Fine.
- **Collision (same language, same id)**: two symbols in the same model claiming one `@sdkOperation` is an authoring bug. The merge fails loudly and names both symbols, because we cannot know which one the entry should be.
- **Ordering**: within an operation, `variants` are ordered by the canonical language priority so the switcher's default tab is consistent (TypeScript first today).



## Per-language extractors

An extractor is the only language-specific code in the pipeline. It runs the language's native doc tool, normalizes the output into the `sdk-api` model, and validates it against the schema. Extractors live next to the SDK they read.


| Language                | Extraction tech                          | Notes                                                                                                                                                                                                                                              |
| ----------------------- | ---------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| JavaScript / TypeScript | TypeDoc AST (via `docs.json`)            | The js-sdk already emits `docs.json`, and `generated/openapi/generate-openapi.ts` already walks it. The JS extractor reuses that AST and emits the `sdk-api` model. This is the reference implementation to build first: the input already exists. |
| C#                      | `docfx metadata` (over the XML doc file) | `GenerateDocumentationFile` plus `-warnaserror` on missing docs guarantees coverage. `docfx metadata` emits YAML API metadata; a normalizer maps it to the model. DocFX is free and open source. Extractor home: `sdks/csharp/docs/`.              |
| Python                  | `griffe`                                 | Google-style docstrings on every public callable, `py.typed` shipped. `griffe` (what `mkdocstrings` is built on) dumps the API surface with parsed docstring sections. A normalizer maps it to the model. Extractor home: `sdks/python/docs/`.     |
| Go (later)              | `go/doc` or `gomarkdoc`                  | Not in the repo yet. Sketch only.                                                                                                                                                                                                                  |
| Java (later)            | javadoc doclet or `javaparser`           | Not in the repo yet. Sketch only. Adding a language stays "an extractor plus a schema check"; nothing downstream changes.                                                                                                                          |




## Where the pieces live

Following the conformance precedent (one shared contract, adapters next to each SDK):

- `packages/sdk-docs` (new, `@verdocs/sdk-docs`): owns `sdk-api.schema.json` and `sdk-unified.schema.json`, the shared TypeScript types generated from them, a validator, and the merge step (`sdk-docs merge`). It holds the committed artifacts (`models/js.json`, `models/python.json`, `models/csharp.json`, and the merged `models/unified.json`) so the contract and its instances live together and CI can diff them.
- `packages/js-sdk` and `sdks/<lang>/docs/`: each extractor, run by that SDK's own toolchain, writing its `models/<lang>.json` into the shared package.

Handoff to platform dev-docs: prefer publishing `@verdocs/sdk-docs` to npm and having dev-docs depend on it, the same way dev-docs already depends on `@verdocs/js-sdk`. Then refreshing the SDK reference is a version bump visible in a lockfile diff. Copying the merged JSON in is the fallback.

## Generating the docs in dev-docs

Mirror the REST generator.

Add `apps/dev-docs/app/scripts/generate-sdk-docs.ts`, a sibling of `generate-docs.ts`, wired into the existing `generate` script next to `generate:openapi`. It:

1. Reads `models/unified.json` (from the `@verdocs/sdk-docs` dependency or the committed copy) and validates it against `sdk-unified.schema.json`, failing the build loudly on drift.
2. Wipes and regenerates `content/docs/reference/SDK/endpoints/` and `content/docs/reference/SDK/helpers/`, the same wipe-and-regenerate contract `generate-docs.ts` uses for `api-docs/`, so those folders are pure build artifacts and stay gitignored. It leaves `content/docs/reference/SDK/getting-started/` alone, since that page is authored.
3. Emits MDX per group (one page listing that group's operations) or per operation, plus a generated `meta.json` to order the sidebar sections.

Rendering is the `createAPIPage` analog we own. Add an `SdkReference` (and a smaller `SdkOperation`) React component, registered in `app/mdx-components.tsx` alongside `APIPage`. It renders an operation's summary, signature, params table, return, and example, with a **language switcher** over the operation's `variants`, using the same Shiki setup the REST pages use so a C# signature and a Python example each highlight in their own grammar. The switcher default follows the canonical language order.

Getting Started stays authored MDX and pulls operations tagged `@sdkGettingStarted` through the same `SdkOperation` / `SdkReference` components, so its snippets track the source while its prose stays curated. Those operations still render on their `@sdkPage` home as well.

Per-operation versus per-group MDX granularity is an implementation choice: per-group keeps the tree shallow for small SDKs (where we are today), per-operation scales better and gives every operation its own URL. Start per-group and split later.

## CI and the handoff

Three checks keep the models honest, all modeled on gates we already run.

- **Schema validation**: every committed `models/<lang>.json` validates against `sdk-api.schema.json`, and `models/unified.json` against `sdk-unified.schema.json`. Fast, offline, runs on every PR touching the package.
- **Merge integrity**: re-run the merge in CI and diff against the committed `unified.json`. A collision (same language, same `@sdkOperation`) fails the build; a `group`/`page` disagreement across languages surfaces as the warning the merge already prints.
- **Staleness**: regenerate each model from source in CI and diff against the committed copy, the same idea as `pnpm --filter @verdocs/collections check` flagging a stale `openapi.json`. If a doc comment changed but the model was not regenerated, the check fails and names the command to run. Path-filtered so a docs-only change does not rebuild every SDK.

On the dev-docs side the build already runs `generate` before `next build`; `generate-sdk-docs.ts` slots in next to `generate:openapi`, so a deploy always regenerates the SDK reference from whatever model version dev-docs depends on. Publishing `@verdocs/sdk-docs` (or copying `unified.json`) is the seam between the two repos, the one manual-ish step, exactly as `openapi.json` is today.

## Phased rollout

Phase 1: define `sdk-api.schema.json`, `sdk-unified.schema.json`, and the `@verdocs/sdk-docs` package (schemas, types, validator, merge step). Build the JS extractor by reusing the existing TypeDoc AST. Build `generate-sdk-docs.ts` and the `SdkReference` component with the language switcher in dev-docs. Ship the js-sdk reference natively (single variant per operation for now) and retire the current TypeDoc iframe. This proves the whole pipeline end to end against the SDK we know best, including the switcher with one language in it.

Phase 2: add the C# extractor (`docfx metadata`) and the Python extractor (`griffe`), each emitting a validated model. The merge starts producing multi-variant operations, and the switcher lights up with real alternates. The generator and component do not change; they already handle any number of variants.

Phase 3: add the merge-integrity and staleness CI checks, publish `@verdocs/sdk-docs` to npm and switch dev-docs to depend on it, and add Go and Java extractors when those SDKs land.

## Open questions

- **Getting Started authoring**: confirmed as authored MDX that embeds `@sdkGettingStarted` operations. Who owns keeping its narrative and the chosen operations current as the SDK grows?
- `@sdkOperation` **naming**: proposed `<group>.<functionName>`. Confirm this holds up where the same logical operation has different function names across languages (`createEnvelope` vs `create_envelope` vs `CreateEnvelopeAsync`); the id is the constant, the names differ per variant.
- **Canonical language for prose**: js-sdk first is the default. Revisit if another SDK ends up with better-maintained summaries.
- **Per-operation versus per-group MDX granularity**: start per-group.
- **npm package versus committed-copy handoff**: recommend the package; copy is the fallback.
- **JS extractor sharing with** `generate-openapi.ts`: both walk the same `docs.json`. They can share the AST-walking code; decide whether the JS extractor replaces or runs alongside the OpenAPI generator.
