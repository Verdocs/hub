# Verdocs Python SDK

Python client for the Verdocs REST API. Sync and async endpoints, pydantic v2 models, and the same resource layout as the JavaScript SDK.

The package is complete and tested, and the PyPI release is waiting on account paperwork rather than
on the code. Until it lands, install it from a checkout:

```bash
pip install path/to/hub/sdks/python
```

Once it ships:

```bash
pip install verdocs
```

Python 3.10+. Runtime dependencies: httpx and pydantic.

API reference: https://developers.verdocs.com

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

Async twin, same methods, `async`/`await`:

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

An endpoint is one session context. Verdocs distinguishes **user** sessions (your integration managing templates and envelopes) from **signing** sessions (a recipient in a ceremony). Keep two endpoints when you need both:

```python
user = VerdocsEndpoint()
user.set_token(user_access_token)

signing = VerdocsEndpoint(session_type="signing")
signing.set_token(signing_token)
```

`set_token` decodes the JWT, stores claims on `endpoint.session`, and sets the correct auth header. A bad or expired token clears the session instead of raising.

## Errors

All SDK exceptions inherit from `VerdocsError`. API failures are `VerdocsAPIError` (with `status_code`, `response`, and `body`). Common statuses have subclasses: `AuthenticationError`, `NotFoundError`, `RateLimitError`. Transport failures are `VerdocsConnectionError`.

## Resource namespaces

`endpoint.templates`, `endpoint.envelopes`, `endpoint.users`, `endpoint.organizations`, and the rest map directly to the REST API. Helpers for permissions, validators, and common utilities live under `verdocs.permissions`, `verdocs.validators`, and `verdocs.utils`.

## Quick-starts

Both live under `apps/` in the source repo:

- `quickstart-python`, a console script: API key auth, create envelope from PDF, signing link, cancel
- `quickstart-python-server`, a Django app issuing policies for signature

Working from a clone of this repo instead of the published package? Install editable from
`sdks/python`:

```bash
pip install -e path/to/hub/sdks/python
```
