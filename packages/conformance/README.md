# @verdocs/conformance

The curl-vs-SDK conformance baseline described in `docs/conformance-plan.md`. Every covered endpoint is called twice, once with raw curl in a child process and once with `@verdocs/js-sdk`, and the two responses are diffed on status, shape, and data (volatile fields like timestamps and tokens are normalized to type markers).

Coverage today:

- 20 read-only cases driven from `fixtures.json`
- The canonical create-to-cancel chain (`src/chain.spec.ts`)
- Extra lifecycle and detail checks beside the fixture loop (template CRUD, group/brand detail, and similar)

## Running it

The suite hits the live beta API, so it runs only via an explicit script and is excluded from CI until secrets are set up there:

```bash
cp .env.example .env   # at the hub root; fill in a beta test account
pnpm conformance
```

The frozen star-toggle check is skipped by default. Set `VERDOCS_STAR_TOGGLE=1` to opt in when debugging curl/SDK equivalence after an API fix.

## Running every language's lane

`pnpm conformance` from the hub root runs this suite plus every other language's conformance
lane (currently C# and Python under `sdks/*`) in one shot, via `pnpm --if-present -r run
conformance`. It fans out to any workspace package that defines a `conformance` script, so a
new SDK under `sdks/<language>/` is picked up automatically the moment its `package.json` gains
one (following the existing "task runner stub" `package.json` pattern already used by
`sdks/csharp` and `sdks/python`) — nothing here needs to change. `--no-bail` means every lane
runs even if an earlier one fails, so one broken language never hides the others' results.

## The signup lane

`src/signup.spec.ts` exercises the full self-serve signup flow against beta with the SDK alone (no browser), mirroring VerdocsAuth's call sequence: `createProfile`, pull the verification code from the test mailbox over IMAP, `verifyEmail`, then a fresh password-grant login as the new identity. Each run creates one real account (and its own new org) on beta, so the lane is gated: it runs only when `VERDOCS_SIGNUP_E2E=1` is set on top of the IMAP mailbox variables (`VERDOCS_TEST_IMAP_HOST`, `VERDOCS_TEST_IMAP_USER`, `VERDOCS_TEST_IMAP_PASSWORD`). Without them the spec skips with a note and the rest of the suite is unaffected.

Two rules for the shared test mailbox:

- Never sign up with the bare mailbox address. Signup consumes an email address permanently, and the base address is our one-shot resource for every future email test. The spec always derives a unique plus address (`test+sdk-YYYYMMDD-HHMMSS@...`) from `VERDOCS_TEST_IMAP_USER`; keep it that way.
- Purelymail's server-side IMAP SEARCH is unreliable, so `src/imap.ts` never issues SEARCH. It polls the newest messages by sequence range and matches the To/Subject headers client-side. Reuse `waitForMessage` from there for any future email-driven checks.

Flow notes from the first live run (2026-07-10): the verification mail is multipart/alternative with a one-line text/plain stub and the real content (a 6-digit code) in the HTML part, and `POST /v2/users/verify` requires the partial session's bearer token from `createProfile`; email plus code alone get 401 Access Denied.
