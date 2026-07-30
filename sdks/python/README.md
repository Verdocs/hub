# Verdocs Python SDK

Python SDK for the Verdocs e-signing platform, at full parity with the js-sdk public
surface. Endpoint sessions with sync/async parity, pydantic v2 wire models that keep
undocumented server fields, resource namespaces for every API family (templates,
template documents/roles/fields, envelopes, recipients, signatures, initials,
organizations, members, groups, invitations, contacts, api keys, brands, webhooks,
notification templates, users, profiles, auth), and pure-logic helpers
(`verdocs.permissions`, `verdocs.validators`, `verdocs.utils.*`).

API reference and guides: https://developers.verdocs.com

In the source repo, the symbol-by-symbol parity mapping lives in `sdks/API-PARITY.md`
at the hub root, the binding rules in `docs/standards/python.md`, and wire-truth notes
for the tricky endpoints in `sdks/WIRE-NOTES.md`.

## Install

```
pip install verdocs
```

Python 3.10 through 3.14. The only runtime dependencies are httpx and pydantic.

Working on the SDK itself instead of consuming it? Install it editable from this
directory:

```
python3 -m venv .venv
.venv/bin/python -m pip install -e . --group dev
```

The dev group brings in pytest, pytest-asyncio, respx, ruff, and griffe (dev tooling
lives in `[dependency-groups]`, not extras, so it is `--group dev` rather than
`.[dev]`). Drop the flag if you only need the SDK itself.

## Quickstart

```python
from verdocs import PasswordGrantRequest, TemplateListParams, VerdocsEndpoint

with VerdocsEndpoint() as endpoint:
    tokens = endpoint.auth.authenticate(
        PasswordGrantRequest(username="you@example.com", password="secret")
    )
    endpoint.set_token(tokens.access_token)

    me = endpoint.users.me()
    page = endpoint.templates.list(TemplateListParams(visibility="private_shared", rows=10, page=0))
    for template in page.templates:
        print(template.id, template.name)
```

`AsyncVerdocsEndpoint` is the method-for-method async twin:

```python
import asyncio

from verdocs import AsyncVerdocsEndpoint, PasswordGrantRequest


async def main() -> None:
    async with AsyncVerdocsEndpoint() as endpoint:
        tokens = await endpoint.auth.authenticate(
            PasswordGrantRequest(username="you@example.com", password="secret")
        )
        endpoint.set_token(tokens.access_token)
        page = await endpoint.templates.list()
        print(page.count)


asyncio.run(main())
```

## Sessions

An endpoint is one session context. Verdocs has two session types, user and signing,
and an app can run one of each side by side: authenticate a user endpoint for regular
operations, and hand a signing token to a second endpoint for an ephemeral signing
flow, then discard it. `set_token()` decodes the token, keeps its claims on
`endpoint.session`, and sets the right auth header for the session type; a malformed
or expired token clears the session instead of raising, mirroring the js-sdk.

```python
user_endpoint = VerdocsEndpoint()
user_endpoint.set_token(user_access_token)

signing_endpoint = VerdocsEndpoint(session_type="signing")
signing_endpoint.set_token(signing_token)
```

Everything the SDK raises derives from `VerdocsError`: API failures are
`VerdocsAPIError` (with `AuthenticationError`, `NotFoundError`, and `RateLimitError`
for the common statuses, plus `status_code`, `response`, and `body` on every one),
and transport failures are `VerdocsConnectionError`.

## Checks

```
.venv/bin/python -m ruff format --check .
.venv/bin/python -m ruff check .
.venv/bin/python -m pytest
./docs/generate-sdk-docs.sh
```

From the hub root, regenerate every language then unify:

```
pnpm generate:sdk-docs
```

Unit tests mock every route with respx and never touch the live API.
`docs/generate_sdk_docs.py` regenerates `sdk-docs.json` from Auth docstrings via griffe.

The conformance lane is the exception: it runs the shared cases from
`packages/conformance/fixtures.json` against live beta, comparing SDK results to raw
httpx calls with volatile fields normalized. It is excluded from the default run and
needs `VERDOCS_API_BASE`, `VERDOCS_TEST_EMAIL`, and `VERDOCS_TEST_PASSWORD`, read
from the hub root `.env` (or the environment):

```
.venv/bin/python -m pytest -m conformance
```
