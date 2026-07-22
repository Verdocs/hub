# @verdocs/conformance

The curl-vs-SDK conformance baseline described in `platform/specs/sdk-restructure/SDKS.md`. Every covered endpoint is called twice, once with raw curl in a child process and once with `@verdocs/js-sdk`, and the two responses are diffed on status, shape, and data (volatile fields like timestamps and tokens are normalized to type markers).

POC coverage: authenticate (password grant), current user and profile, getTemplates, and the star toggle.

## Running it

The suite hits the live beta API, so it runs only via an explicit script and is excluded from CI until secrets are set up there:

```bash
cp .env.example .env   # at the hub root; fill in a beta test account
pnpm test:conformance
```

The star toggle check needs the test account to have at least one template.

## The signup lane

`src/signup.spec.ts` exercises the full self-serve signup flow against beta with the SDK alone (no browser), mirroring VerdocsAuth's call sequence: `createProfile`, pull the verification code from the test mailbox over IMAP, `verifyEmail`, then a fresh password-grant login as the new identity. Each run creates one real account (and its own new org) on beta, so the lane is gated: it runs only when `VERDOCS_TEST_IMAP_HOST`, `VERDOCS_TEST_IMAP_USER`, and `VERDOCS_TEST_IMAP_PASSWORD` are set (hub root `.env` or the environment). Without them the spec skips with a note and the rest of the suite is unaffected.

Two rules for the shared test mailbox:

- Never sign up with the bare mailbox address. Signup consumes an email address permanently, and the base address is our one-shot resource for every future email test. The spec always derives a unique plus address (`test+sdk-YYYYMMDD-HHMMSS@...`) from `VERDOCS_TEST_IMAP_USER`; keep it that way.
- Purelymail's server-side IMAP SEARCH is unreliable, so `src/imap.ts` never issues SEARCH. It polls the newest messages by sequence range and matches the To/Subject headers client-side. Reuse `waitForMessage` from there for any future email-driven checks.

Flow notes from the first live run (2026-07-10): the verification mail is multipart/alternative with a one-line text/plain stub and the real content (a 6-digit code) in the HTML part, and `POST /v2/users/verify` requires the partial session's bearer token from `createProfile`; email plus code alone get 401 Access Denied.
