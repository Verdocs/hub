# Multi-language SDK CI

Ideas for validating Python and C# SDKs in CI (with room for more languages later), using free and open-source tooling. js-sdk stays hand-maintained; other language SDKs are produced by an AI agent from patch diffs against that source of truth. The shared conformance fixtures in this package are the cross-language gate.

## Starting point

We already have most of the pieces:

### `fixtures.json`:

shared cases every language lane should run

```ts
fixtures.cases = [
  ...fixtures.cases,
  {
    "id": "users-me",
    "sdk": "getMyUser",
    "method": "GET",
    "path": "/v2/users/me",
    "auth": true
  },
]
```



### Use Native Test Runners


| Language   | Test Runner |
| ---------- | ----------- |
| TypeScript | Vitest      |
| Python     | pytest      |
| C#         | xunit       |


- Same check per case: raw HTTP vs SDK, normalize volatile fields, compare status / shape / data
- OpenAPI from js-sdk (`packages/js-sdk/openapi.json`) as the wire contract
- Unit tests that never hit the network (respx in Python, fake handlers in C#)

CI should lean on that, not invent a second source of truth.

## Goals

1. Catch AI-generation drift early: a patch that lands in js-sdk should produce equivalent behavior in Python and C#.
2. Keep PR feedback fast and free of flaky live-API noise.
3. Still exercise the real public beta API on a schedule.
4. Add a new language later without redesigning the harness.

Non-goals for now: browser E2E, paid codegen platforms as CI gates, publishing gates.

## Test layers

Think in four layers. Only the first two are PR blockers by default.


| Layer               | What it checks                                          | When it runs        | Needs live API?       |
| ------------------- | ------------------------------------------------------- | ------------------- | --------------------- |
| Unit / lint         | Language idioms, models, client plumbing, mocked HTTP   | Every PR            | No                    |
| Contract (optional) | Requests/responses match OpenAPI when talking to a mock | Every PR or nightly | No (Prism / WireMock) |
| Conformance         | Each `fixtures.json` case: raw HTTP vs SDK against beta | Nightly / `main`    | Yes (bearer token)    |
| Smoke (optional)    | Tiny "authenticate + one read" health check             | Nightly             | Yes                   |


Keep the success bar simple for v1: **every fixture case passes in every language lane**. No shared golden snapshots across languages yet.

## Auth for live lanes

Beta is public; CI does not need a private network path. What it needs is a durable way to authenticate.

Recommended v1:

- Store a long-lived **bearer token** (or a refreshable token pair) in GitHub Actions secrets, e.g. `VERDOCS_CONFORMANCE_TOKEN`.
- Keep `VERDOCS_API_BASE` as a variable (public beta URL is fine in the clear).
- Prefer fixture cases that are **auth: true** and read-only once a token exists, so nightly runs do not depend on password grant every time.
- Keep password-grant / signup lanes optional and gated (they create accounts and are heavier). The existing IMAP signup lane stays opt-in.

Migration note: `fixtures.json` and the runners still speak `VERDOCS_TEST_EMAIL` / `VERDOCS_TEST_PASSWORD` today. Either:

- have each runner accept `VERDOCS_CONFORMANCE_TOKEN` and skip the authenticate case when a token is already present, or
- keep password grant only for obtaining a token at the start of the job, with credentials in secrets.

Either works. Token-first is simpler for scheduled CI.

## Suggested CI shape



### Pull requests (cheap)

Path-filtered jobs so a docs-only change does not spin every SDK:

1. **Hub JS lane** (existing): `pnpm exec turbo run lint typecheck test build`, plus collections staleness.
2. **Python lane** when `sdks/python/`** or shared fixtures / OpenAPI change: ruff + pytest (unit only; no `-m conformance`).
3. **C# lane** when `sdks/csharp/`** or shared fixtures / OpenAPI change: `dotnet build -warnaserror` + `dotnet test` (conformance filter stays skipped).

Optional later on PRs:

- Stand up [Prism](https://github.com/stoplightio/prism) against `openapi.json` and point unit/integration tests at `localhost`. Good when you want request-shape coverage without beta.
- [Spectral](https://github.com/stoplightio/spectral) or [Redocly CLI](https://redocly.com/docs/cli) lint on OpenAPI when the spec changes.



### Nightly / main (live)

A scheduled workflow (and optionally on push to `main`):

1. Checkout, set up Python and .NET in a **matrix** (or parallel jobs).
2. Inject `VERDOCS_API_BASE` + bearer token.
3. Run conformance in each language against the same `fixtures.json`.
4. Fail the job if any language fails any case.

Matrix sketch (GitHub Actions, free for public repos / standard minutes):

```yaml
strategy:
  fail-fast: false
  matrix:
    include:
      - language: python
        # setup-python, pip install -e ., pytest -m conformance
      - language: csharp
        # setup-dotnet, VERDOCS_CONFORMANCE=1 dotnet test --filter ...
      # future:
      # - language: go
      # - language: java
```

`fail-fast: false` matters: you want every language's failures reported in one run, not stop at the first red lane.

## Shared contract rules (language-agnostic)

AI-generated SDKs will diverge unless the comparison rules are documented once and copied carefully.

Already encoded in `fixtures.json`:

- `volatileKeyPattern` / flags: which keys become type markers
- `cases`: method, path, auth, body/query, SDK operation name
- `frozen`: cases intentionally skipped until the API side is fixed

Each language runner must:

1. Load the same JSON file (path relative to hub root).
2. Apply the same volatile normalization (regex + recursion). Document the algorithm once; treat TS `normalizeVolatile` as the reference implementation.
3. Compare status and normalized body (and honor per-case notes, e.g. profiles returning the `current=true` entry).
4. Skip `frozen` cases unless the language explicitly opts in.

When a new language lands, the checklist is: runner + CI matrix entry + standards doc. Do not fork a second fixtures file.

## Validating AI-generated SDKs

Because Python and C# are regenerated from js-sdk patch diffs, CI should answer two questions:

1. **Did generation break the language package?** Lint, typecheck/compile, unit tests.
2. **Did generation change wire behavior?** Conformance fixtures.

Practical ideas (still free/OSS):

- **Fixture coverage as the agent contract.** The agent is done when unit tests pass and every non-frozen fixture passes in that language. No extra cross-language snapshot store for now.
- **Diff-triggered matrix.** If the PR only touches `sdks/python`, still run Python unit tests; if it also touches `packages/js-sdk` or `fixtures.json`, run Python and C# units (and rely on nightly for live).
- **OpenAPI as a soft check.** After generation, optional request validation against Prism catches wrong paths/methods early. This does not replace conformance; it catches dumb wire mistakes without credentials.
- **Keep js-sdk the behavioral reference.** Do not require Python to match C# byte-for-byte; both must match raw HTTP (and thus each other indirectly).



## Free / open-source tooling worth considering


| Need                    | Tool                                                         | Role                                                 |
| ----------------------- | ------------------------------------------------------------ | ---------------------------------------------------- |
| CI runners              | GitHub Actions                                               | Matrix jobs, secrets, schedules                      |
| OpenAPI lint            | Spectral, Redocly CLI                                        | Spec hygiene when js-sdk regenerates OpenAPI         |
| Mock server             | Prism, WireMock                                              | Local/CI HTTP without beta                           |
| Spec drift              | [oasdiff](https://github.com/Tufin/oasdiff)                  | Flag breaking OpenAPI changes on js-sdk PRs          |
| Python unit HTTP        | respx (already)                                              | Mocked httpx                                         |
| C# unit HTTP            | fake `HttpMessageHandler` (already)                          | Mocked HttpClient                                    |
| Property / fuzz (later) | [Schemathesis](https://github.com/schemathesis/schemathesis) | Generate requests from OpenAPI against Prism or beta |
| Collections             | Bruno / Postman (already generated)                          | Human exploration; not the CI gate                   |


Paid codegen platforms (Stainless, Speakeasy, Fern, etc.) can exist in the wider ecosystem, but they are not required for this CI plan and are out of scope here.

## Adding a language later

Keep configuration data-driven so the matrix grows without a redesign:

1. Add `sdks/<lang>/` with unit tests that never hit the network.
2. Implement a conformance runner that reads `packages/conformance/fixtures.json` and applies the shared normalization rules.
3. Add one `matrix.include` entry (setup action, install, unit command, conformance command).
4. Document env vars the same way: `VERDOCS_API_BASE`, token (or email/password), and any language-specific opt-in flag (like `VERDOCS_CONFORMANCE=1` for C#).
5. Path filters: `sdks/<lang>/**` plus shared paths (`packages/conformance/fixtures.json`, `packages/js-sdk/openapi.json`).

Optional future improvement: a tiny machine-readable `packages/conformance/langs.json` listing `{ id, unitCommand, conformanceCommand, paths }` that a single reusable workflow reads. Not required for Python + C#; useful once the third language appears.

## Phased rollout

**Phase 1 (now)**

- Document this plan.
- PR CI: Python and C# unit/lint jobs with path filters.
- Nightly: live conformance for Python and C# with a stored bearer token.
- Keep signup / IMAP out of the default nightly.

**Phase 2**

- Accept `VERDOCS_CONFORMANCE_TOKEN` in all runners; simplify secrets.
- Expand `fixtures.json` as AI generation covers more endpoints.
- Optional Prism job on OpenAPI or SDK PRs.

**Phase 3 (when a third language lands)**

- Introduce `langs.json` or an equivalent reusable workflow.
- Consider Schemathesis against Prism for broader path coverage beyond hand-written fixtures.

---



## Conformance runner: how to use `fixtures.json`

This section is the implementation guide. Python already follows it closely (`sdks/python/tests/conformance/`). C# loads the same `fixtures.json` cases via `ConformanceFixtures.cs` and parametrizes `ConformanceTests` from them. Treat the Python lane as the reference shape for any new language.

### What `fixtures.json` is

It is a tiny, language-neutral DSL for "call this endpoint twice and compare." One file, committed under `packages/conformance/fixtures.json`. Every runner loads that exact path relative to the hub root. Nobody copies cases into a second JSON.

Top-level fields:


| Field                     | Role                                                                          |
| ------------------------- | ----------------------------------------------------------------------------- |
| `volatileKeyPattern`      | Regex of JSON keys whose values are replaced with type markers before compare |
| `volatileKeyPatternFlags` | Today `"i"` (case-insensitive). Runners must honor this, not hardcode flags   |
| `cases`                   | Active cases every language lane must run                                     |
| `frozen`                  | Documented skips (broken API, deferred work). New lanes ignore these entirely |


Each case looks like:

```json
{
  "id": "users-me",
  "sdk": "auth.getMyUser",
  "method": "GET",
  "path": "/v2/users/me",
  "auth": true
}
```


| Field             | Role                                                                                          |
| ----------------- | --------------------------------------------------------------------------------------------- |
| `id`              | Stable test id (use as the parametrize / theory name)                                         |
| `sdk`             | Logical operation name. The runner maps this string to a real SDK call. Not a file path       |
| `method` / `path` | Wire call for the raw-HTTP side                                                               |
| `auth`            | If true, send the session bearer on the raw call                                              |
| `body`            | Optional JSON body. Values like `$VERDOCS_TEST_EMAIL` are placeholders the runner substitutes |
| `query`           | Optional query object. Raw side serializes it; SDK side usually feeds it into typed options   |
| `note`            | Human + machine hint for special compare rules (e.g. profiles-current)                        |


Rules of thumb for growing the file:

- Prefer read-only cases once a token exists.
- Keep bodies and queries JSON-serializable and language-agnostic.
- Put special compare behavior in `note` (and a small `id`-based branch in each runner), not in a second fixture format.
- When an endpoint is broken for every client, move it to `frozen` rather than deleting history.



### Mental model: one algorithm, three thin adapters

Every language does the same steps. Only the HTTP client and SDK call site change.

```
load fixtures.json
load credentials (env / hub .env / optional bearer token)
authenticate once -> session token + SDK endpoint
for each case in fixtures.cases (skip fixtures.frozen):
  raw  = HTTP(method, path, query, body, auth? token)
  sdk  = DISPATCH(case.sdk, endpoint, case)
  left  = adapt(sdk_result)     # serialize / model_dump / prune
  right = adapt(raw_body)       # honor case notes (e.g. pick current profile)
  assert status ok
  assert normalize(left) == normalize(right)
```

`normalize` must be identical across languages: recurse objects and arrays; if a key matches `volatileKeyPattern`, replace the value with `<<${jsTypeof(value)}>>` (including the JS quirk that `null` is `"null"`, and arrays/objects are `"object"`). The TS `normalizeVolatile` in `packages/conformance/src/support.ts` is the reference; Python and C# already mirror it.

### Files you need (per language)

Shared (owned by `@verdocs/conformance`, not duplicated):

```
packages/conformance/
  fixtures.json          # the contract
  src/support.ts         # reference normalize + curl helper (TS lane)
  docs/multi-language-ci.md
```

Per language SDK (live next to that SDK's tests):

```
sdks/<lang>/
  ...                        # the SDK itself
  tests/
    conformance/             # or Conformance/ in C#
      <env loader>           # credentials, hub-root discovery, FIXTURES_PATH
      <normalize>            # volatile mask (or import shared helper module)
      <raw http>             # no SDK on this path
      <sdk dispatch>         # case["sdk"] -> real method
      <test entrypoint>      # parametrize over fixtures.cases
```

Concrete today:


| Concern       | Python                                        | C#                                                 | TS package                                   |
| ------------- | --------------------------------------------- | -------------------------------------------------- | -------------------------------------------- |
| Fixtures path | `conftest.py` (`FIXTURES_PATH`)               | `ConformanceFixtures`                              | file exists; suite still partly hand-written |
| Env / gate    | `conftest.py` (hard fail if missing)          | `ConformanceEnv.cs` + `VERDOCS_CONFORMANCE=1` skip | `support.ts` `loadEnv`                       |
| Session       | `sdk_endpoint` fixture                        | `ConformanceContext`                               | `beforeAll` authenticate                     |
| Normalize     | `normalize_volatile` in `test_conformance.py` | `VolatileJson.cs`                                  | `normalizeVolatile` in `support.ts`          |
| Raw HTTP      | httpx in `call_raw`                           | `HttpClient` in `ConformanceContext`               | `curl` child process                         |
| Dispatch      | `call_sdk`                                    | `CallSdkForCaseAsync`, one arm per case            | one `it` per case                            |
| Entrypoint    | `test_case_matches_raw_http` parametrized     | `ConformanceTests.cs`                              | `conformance.spec.ts`                        |


Minimum new-language checklist: env loader, normalize, raw client, sdk dispatch map, one parametrized test. Optional lifecycle / write smokes can sit beside fixtures but should not invent a second fixture file.

### Responsibility split: JSON vs code

**Put in** `fixtures.json`**:** what to call on the wire, whether auth is required, query/body payloads, which logical SDK op, volatile key policy, frozen ids.

**Keep in runner code:**

1. **Credential loading** and how the session token is obtained.
2. `sdk` **dispatch table** mapping `"getMyUser"` -> `endpoint.users.me()` (names differ per language; the fixture key stays stable).
3. **Serialization / prune** for typed models (see below).
4. **Case-specific adapters** called out by `note` / `id` (profiles-current).
5. **Opt-in gating** so unit CI stays offline (`pytest -m conformance`, `VERDOCS_CONFORMANCE=1`).

When the agent generates a new operation in Python/C#, the expected finish line is: add or extend the fixtures case, add one dispatch branch, green conformance.

### Suggested module shapes



#### 1. Locate hub root and load fixtures

Discover the monorepo root from the test file (walk parents, or search upward for `packages/conformance/fixtures.json`). Do not assume `cwd`.

```python
# illustrative -- Python already does this in conftest.py
HUB_ROOT = Path(__file__).resolve().parents[4]
FIXTURES_PATH = HUB_ROOT / "packages" / "conformance" / "fixtures.json"

def load_fixtures() -> dict:
    return json.loads(FIXTURES_PATH.read_text())
```

Parametrize so a new case fails loudly until dispatch exists:

```python
def pytest_generate_tests(metafunc):
    if "case" in metafunc.fixturenames:
        cases = load_fixtures()["cases"]
        metafunc.parametrize("case", cases, ids=[c["id"] for c in cases])
```

C# equivalent later: `[Theory]` + `[MemberData]` reading the same JSON, or a source generator. Until then, keep Fact names aligned with fixture `id`s so drift is obvious in review.

#### 2. Credentials and session

Session fixture / shared context:

1. Load `VERDOCS_API_BASE` (and today email/password; later prefer `VERDOCS_CONFORMANCE_TOKEN`).
2. Build one SDK endpoint aimed at that base.
3. Authenticate once (or inject the stored bearer).
4. Yield `(endpoint, token, raw_client)`.

Raw client must be a plain HTTP stack (httpx, HttpClient, curl), never the SDK's wrapper, or you are not actually comparing independent paths.

#### 3. Raw call from the case object

```python
def call_raw(client, case, env, token):
    headers = {"Authorization": f"Bearer {token}"} if case.get("auth") else None
    body = substitute_env(case.get("body"), env) if case.get("body") is not None else None
    response = client.request(
        case["method"],
        case["path"],
        params=case.get("query"),
        json=body,
        headers=headers,
    )
    return response.status_code, response.json()
```

`substitute_env` only replaces known `$VERDOCS_*` placeholders. Unknown placeholders should fail the test, not silently send the dollar string to beta.

#### 4. SDK dispatch

A single function or switch. Unknown `sdk` values fail with an actionable message (this is how AI generation gets a clear TODO).

```python
def call_sdk(endpoint, case, env):
    name = case["sdk"]
    if name == "authenticate":
        with VerdocsEndpoint(base_url=env.api_base) as fresh:
            return fresh.auth.authenticate(username=env.email, password=env.password)
    if name == "getMyUser":
        return endpoint.users.me()
    if name == "getCurrentProfile":
        return endpoint.profiles.current()
    if name == "getTemplates":
        return endpoint.templates.list(TemplateListParams(**case.get("query", {})))
    pytest.fail(f"No SDK mapping for case '{case['id']}' ({name})")
```

Authenticate should use a **fresh** endpoint so the case does not accidentally depend on the shared session.

#### 5. Normalize (must match across languages)

```text
normalize(value, pattern):
  if list: map normalize
  if object:
    for each key, entry:
      if pattern matches key: "<<{js_typeof(entry)}>>"
      else: normalize(entry)
  else: value
```

`js_typeof` must match JavaScript: `null -> "null"`, bool, number, string, else `"object"`. Compile `volatileKeyPattern` from the JSON every time; do not hardcode a divergent regex in a new language.

#### 6. Typed-SDK adaptation (Python lesson)

Raw JSON often has extra keys. Pydantic (and similar) drops unknowns by design. Comparing full raw body to `model_dump()` will false-fail forever.

Python's approach (keep this for other typed SDKs):

1. `sdk_dump = result.model_dump(mode="json", exclude_unset=True)`
2. `pruned = prune_to(sdk_dump, raw_body)` -- recursively keep only keys the SDK returned
3. Compare `normalize(sdk_dump)` to `normalize(pruned)`

That still fails if a required field disappears from the wire or the SDK invents a wrong value. It intentionally allows unknown wire fields the model does not surface.

JS SDKs that pass objects through can usually compare without prune. Document which adaptation each language uses next to the runner.

#### 7. Case notes / special compares

Some SDK methods reshape the wire response on purpose. Encode that once in the fixture `note`, and branch on `case["id"]` in every runner the same way:

```python
reference = raw_body
if case["id"] == "profiles-current":
    reference = next(p for p in raw_body if p.get("current"))
```

Do not invent a mini language for transforms yet. A few `id` branches are fine until the set gets large.

#### 8. The actual test

One test function, one assertion story:

```python
def test_case_matches_raw_http(case, conformance_env, sdk_endpoint, raw_client, volatile_pattern):
    raw_status, raw_body = call_raw(raw_client, case, conformance_env, sdk_endpoint.token)
    assert raw_status == 200

    result = call_sdk(sdk_endpoint, case, conformance_env)
    sdk_dump = result.model_dump(mode="json", exclude_unset=True)

    reference = raw_body
    if case["id"] == "profiles-current":
        reference = next(p for p in raw_body if p.get("current"))

    pruned = prune_to(sdk_dump, reference)
    assert normalize_volatile(sdk_dump, volatile_pattern) == normalize_volatile(pruned, volatile_pattern)
```

Lifecycle / mutate tests (create template, cleanup) can live in the same folder, marked conformance, but stay **outside** `fixtures.json` until we define a write-case schema. Read-only fixtures stay boring and CI-friendly.

### Auth evolution without forking fixtures

Today cases assume password grant for `authenticate` and `$VERDOCS_TEST_EMAIL` / `$VERDOCS_TEST_PASSWORD` placeholders.

Recommended path:

1. Nightly jobs may supply `VERDOCS_CONFORMANCE_TOKEN` instead of (or in addition to) email/password.
2. Session setup uses the token when present.
3. If a token is present, skip or soft-skip the `authenticate` case (or keep password secrets only for that one case).
4. Leave `fixtures.json` mostly unchanged; substitution / skip logic lives in the env loader.

That keeps the fixture file stable while CI secrets get simpler.

### What good utilization looks like in practice

**Adding coverage for a new read endpoint**

1. Implement the method in js-sdk (source of truth).
2. Add a `cases[]` entry with `id`, `sdk`, `method`, `path`, `auth`, optional `query`/`body`.
3. AI (or human) ports the method to Python and C#.
4. Add one dispatch branch per language.
5. Run `pytest -m conformance` / `VERDOCS_CONFORMANCE=1 dotnet test` / `pnpm conformance`.
6. If the API is broken for everyone, put the id under `frozen` with a note instead of deleting it.

**Keeping languages honest**

- Never duplicate the case list in markdown or in per-language JSON.
- Prefer parametrize-from-fixtures (Python) over hand-synced Facts (C# today). Hand-synced is acceptable only as a bridge.
- When normalize rules change, change `volatileKeyPattern` in the JSON and the reference TS helper together; language copies must follow.

**CI wiring**

- PR: unit tests only (conformance marker/filter keeps live calls out).
- Nightly: each matrix leg runs only its conformance command against the same `fixtures.json`.



### Gaps to close (relative to this design)

1. **C#**: load `fixtures.json` and theory-parametrize instead of duplicating paths in Facts. Done.
2. **TS package**: drive `conformance.spec.ts` from `fixtures.json` the way Python does, so the richer hand-written lifecycle tests sit beside the shared cases rather than replacing them. Done for fixture cases; chain lives in `chain.spec.ts`.
3. **Token-first env**: teach all three loaders to accept `VERDOCS_CONFORMANCE_TOKEN`.
4. **Dispatch completeness**: a case in JSON with no dispatch branch should fail closed (Python already does).

Once those are true, "utilize fixtures.json" means one sentence operationally: **edit the JSON, add a dispatch arm, run the language conformance marker.**

---



## Cross-language conformance tree consistency

Scope: the **conformance harness folders**, not the SDK public API shape. Python and C# SDKs can keep language-native surfaces (`endpoint.templates.list(...)` vs `GetTemplatesAsync(...)`). What we standardize is how each language runs live fixture cases so a human (or agent) can find the same jobs in the same place.

The shared TS harness stays in `packages/conformance/` (it is the monorepo home for fixtures and the reference normalize). Native SDKs keep their runners under `sdks/<lang>/...`. Same contract, different house.

### Must match

- One `packages/conformance/fixtures.json`. No per-language case lists.
- Same case `id`s, same volatile rules, same special-case behavior (`note` / id branches such as `profiles-current`).
- Same credential env names (`VERDOCS_API_BASE`, today email/password; later `VERDOCS_CONFORMANCE_TOKEN`).
- One parametrized / theory entry that loads fixtures. Hand-synced Facts or `it` blocks are a bridge only.
- Default unit CI stays offline (marker, filter, or env gate).



### May differ

- Folder casing (`conformance/` vs `Conformance/`) and exact filenames.
- Language-native method names inside the dispatch map. Fixture `sdk` keys stay stable (JS-ish today); each runner maps them to local calls.
- Typed-model adaptation (prune-to-SDK-keys like Python) when full raw JSON would false-fail.



### Required tree (roles, not identical filenames)

```
tests/conformance/          # or .../Conformance/ under the C# test project
  env          # credentials + opt-in gate
  fixtures     # resolve hub root, load fixtures.json (can live inside env)
  normalize    # volatile mask matching fixtures + TS support.ts
  raw          # plain HTTP client, never the SDK wrapper
  dispatch     # case.sdk -> language-native SDK call; unknown sdk fails closed
  tests        # one parametrized / theory runner over fixtures.cases
```

Optional write/lifecycle smokes can sit in the same folder. They stay outside `fixtures.json` until we define a write-case schema.

Concrete map today:


| Role      | Python                       | C#                                         | TS (`packages/conformance`)            |
| --------- | ---------------------------- | ------------------------------------------ | -------------------------------------- |
| Env/gate  | `conftest.py`                | `ConformanceEnv` + `VERDOCS_CONFORMANCE=1` | `support.ts` `loadEnv`                 |
| Fixtures  | `conftest.py` loads JSON     | `ConformanceFixtures` loads JSON           | file exists; suite partly hand-written |
| Normalize | `normalize_volatile`         | `VolatileJson`                             | `normalizeVolatile`                    |
| Raw       | httpx `call_raw`             | `ConformanceContext` HttpClient            | `curl` helper                          |
| Dispatch  | `call_sdk`                   | `CallSdkForCaseAsync`, one arm per case    | one `it` per case                      |
| Entry     | `test_case_matches_raw_http` | `ConformanceTests`                         | `conformance.spec.ts`                  |




### Checklist

Use this when adding a language or closing a gap:

1. Put the harness under that SDK's test tree (or under `packages/conformance` for the JS lane). Do not fork fixtures.
2. Load `packages/conformance/fixtures.json` from hub root (discover root from the test file; do not rely on cwd).
3. Gate live runs so plain unit CI never hits beta.
4. Authenticate (or inject a bearer) once; build one SDK session and one raw HTTP client.
5. Parametrize / theory over `fixtures.cases`. Skip `frozen` unless you intentionally opt in.
6. Dispatch with language-native calls. Unknown `sdk` fails with a clear "add a mapping" message.
7. Honor shared special compares the same way in every runner (`profiles-current`, etc.).
8. If the SDK drops unknown wire fields, prune the raw body to SDK keys before compare (Python pattern).
9. New coverage: edit `fixtures.json` -> add one dispatch arm per language -> run each language's conformance command -> all green.
10. CI: PR runs units only; nightly runs each language's conformance command against the same JSON.



### Gaps (conformance trees)

1. **TS**: Drive shared cases from fixtures; keep lifecycle / write smokes beside them, not as a replacement for the shared list.
2. **Gates**: Keep documenting both mechanisms (`pytest -m conformance`, `VERDOCS_CONFORMANCE=1`) without forcing one implementation; same semantics (default offline, opt-in live).
3. **Token-first env**: Teach all loaders to accept `VERDOCS_CONFORMANCE_TOKEN` when we simplify nightly secrets.

Done means: edit the JSON, add a language-native dispatch arm, run the opt-in conformance command, and get the same case ids green in every lane.