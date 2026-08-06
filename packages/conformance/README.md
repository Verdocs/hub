# @verdocs/conformance

Live integration tests that compare raw HTTP calls against SDK calls on the beta API. Used to keep JavaScript, Python, and C# SDKs aligned before release.

You do not need this package to build on Verdocs. For application development, use the SDK READMEs and https://developers.verdocs.com.

## Run

Requires a beta test account. From the hub root:

```bash
cp .env.example .env   # VERDOCS_API_BASE, VERDOCS_TEST_EMAIL, VERDOCS_TEST_PASSWORD
pnpm conformance
```

That runs every language lane (JS, Python, C#) that defines a `conformance` script. The suite is excluded from default CI until secrets are configured.

Optional gates:

- `VERDOCS_STAR_TOGGLE=1`: include the star-toggle equivalence check (off by default)
- `VERDOCS_SIGNUP_E2E=1` plus IMAP vars: full signup flow test (`VERDOCS_TEST_IMAP_HOST`, `VERDOCS_TEST_IMAP_USER`, `VERDOCS_TEST_IMAP_PASSWORD`)

Fixture definitions live in `fixtures.json`. The canonical create-to-cancel lifecycle is in `src/chain.spec.ts`.
