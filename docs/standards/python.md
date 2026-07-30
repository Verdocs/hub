# Python SDK Standards

This document is binding for the Python SDK (`sdks/python`). It exists so the package reads like one person wrote it: reviewers cite a rule number instead of re-litigating style, and anyone touching the seed knows what done looks like. Leadership already settled the stack, and those choices appear below as rules, not suggestions: the package is named `verdocs`, HTTP is httpx with both sync and async clients, models are pydantic v2, tests are pytest, and packaging is hatchling. Publishing to PyPI was off the table through the seed and true-up phases and opened up with the 1.0.0 release on 2026-07-29; rule 2 has the current terms. The client design mirrors the js-sdk's `VerdocsEndpoint`: one endpoint object per session, with user and signing sessions able to run side by side. Versions verified online 2026-07-10: Python 3.14 is the current stable (3.10 is the oldest supported release and hits EOL this October), httpx's latest stable is 0.28.1 with 1.0 still in dev prereleases, and pydantic is at 2.13.4.

## Binding rules

1. The distribution and import name is `verdocs`. One package, no namespace packages.
2. The package publishes to PyPI as `verdocs`, starting with 1.0.0 on 2026-07-29. The `Private :: Do Not Upload` classifier that used to guard the seed is gone; it did its job while the SDK was unfinished and would now block the release. Publishing still happens only when instructed, and a version number is never reused: PyPI refuses a re-upload of one that exists, deleting a release does not free the number, and every bump needs the same treatment in `pyproject.toml`. Do not add a `License :: OSI Approved` classifier, because PyPI rejects an upload carrying both that and the PEP 639 `license` expression.
3. Support Python 3.10 through 3.14, with `requires-python = ">=3.10"`. 3.9 went EOL in October 2025 and 3.10 is the oldest release still getting security fixes; when 3.10 EOLs this October, raise the floor to 3.11.
4. src layout: code lives in `src/verdocs/`, tests in `tests/` beside it, never inside the package. Tests then exercise the installed package instead of whatever happens to sit on `sys.path`.
5. Packaging is hatchling through `pyproject.toml` only. No `setup.py`, no `setup.cfg`, no `requirements.txt`; dev tooling goes in the `[dependency-groups]` dev group.
6. HTTP is httpx, pinned `httpx>=0.28,<1`. The cap matters: 1.0 is a breaking prerelease line, and openai and anthropic ship the same `<1` guard.
7. Two client classes with a mirrored surface: `VerdocsEndpoint` wraps `httpx.Client` and `AsyncVerdocsEndpoint` wraps `httpx.AsyncClient`. Separate classes with method-for-method parity, the openai/anthropic pattern, not an async core with a sync shim. A sync change without its async twin is an incomplete PR.
8. Calls hang off resource namespaces on the endpoint: `endpoint.envelopes.create(...)`, `endpoint.templates.get(...)`. Each namespace is a sync/async class pair (`Envelopes` / `AsyncEnvelopes`) holding a reference to its endpoint. No module-level request functions.
9. One endpoint instance is one session context. `session_type` is `"user"` or `"signing"`, tokens attach with `set_token()`, and an app runs a user endpoint and a signing endpoint concurrently, exactly like the js-sdk. Session state lives on the instance, never at module level.
10. Each endpoint creates its httpx client once and reuses it for every request so connections pool. Never build a client, or an endpoint, per request.
11. Both endpoint classes are context managers (`with` / `async with`) and expose `close()` / `aclose()` for long-lived use. Whoever creates an endpoint owns closing it.
12. Every wire model is a pydantic v2 `BaseModel` configured with `model_config = ConfigDict(...)`; the v1 `class Config` is deprecated and banned. Responses parse with `Model.model_validate(payload)`, and `extra` stays at its default of ignore so new server fields never break installed clients.
13. Field names are snake_case and match the wire format exactly. The API already speaks snake_case, so there are no aliases, no `populate_by_name`, and no mapping layer to drift.
14. Timestamps are `datetime` fields; pydantic parses the API's ISO 8601 strings on input, and outbound bodies serialize through `model_dump(mode="json")` or `model_dump_json()`.
15. Type hints on every public function, method, and attribute, and `src/verdocs/py.typed` ships in the wheel so mypy and pyright actually consume them.
16. Everything the SDK raises derives from `VerdocsError`. Non-2xx responses raise `VerdocsAPIError` carrying `status_code`, the httpx `response`, and the parsed `body`, with subclasses for common statuses (`AuthenticationError` 401, `NotFoundError` 404, `RateLimitError` 429). Transport failures raise `VerdocsConnectionError`. Callers get one `except` that catches everything we throw.
17. Naming is PEP 8: snake_case functions, variables, and modules, PascalCase classes, UPPER_SNAKE constants.
18. Docstrings are Google style (summary line, then `Args:`, `Returns:`, `Raises:`) on every public callable, matching what openai and anthropic write. Per comments.md, the summary says what the caller gets, and anything non-obvious gets a copy-pasteable example.
19. Ruff is the only lint and format tool: `ruff check --fix` and `ruff format` must both pass before merge. No black, isort, flake8, or pylint. The exact config is below and doesn't grow without a change to this doc.
20. Tests are plain pytest functions with fixtures; no unittest classes, no xunit setup methods. Async tests run under pytest-asyncio with `asyncio_mode = "auto"` so they're plain `async def` functions too, and every sync test has an async twin where the surface differs.
21. HTTP mocking is respx, which openai and anthropic both test with: stub routes through the `respx_mock` fixture for both client flavors. Tests never touch the live API.

## Client shape

```python
from verdocs import AsyncVerdocsEndpoint, VerdocsEndpoint

with VerdocsEndpoint() as endpoint:  # user session
    endpoint.set_token(user_token)
    template = endpoint.templates.get(template_id)

async with AsyncVerdocsEndpoint(session_type="signing") as endpoint:
    endpoint.set_token(signing_token)
    envelope = await endpoint.envelopes.get(envelope_id)
```

## Ruff config

```toml
[tool.ruff]
line-length = 120

[tool.ruff.lint]
select = ["E", "F", "I", "B", "UP"]
```

Line length 120 matches the exemplar SDKs. Ruff derives its target version from `requires-python`, and the formatter runs on defaults, so there is nothing else to set.

## pyproject skeleton

```toml
[build-system]
requires = ["hatchling >= 1.26"]
build-backend = "hatchling.build"

[project]
name = "verdocs"
version = "1.0.0"
description = "Verdocs e-signing SDK for Python"
readme = "README.md"
license = "MIT"
requires-python = ">=3.10"
classifiers = ["Private :: Do Not Upload"]
dependencies = ["httpx>=0.28,<1", "pydantic>=2,<3"]

[dependency-groups]
dev = ["pytest", "pytest-asyncio", "respx", "ruff"]

[tool.pytest.ini_options]
testpaths = ["tests"]
addopts = "--import-mode=importlib"
asyncio_mode = "auto"
```

Version 1.0.0 matches the repo convention for new SDK packages, and MIT matches the js-sdk.

## Sources

Consulted 2026-07-10:

- https://devguide.python.org/versions/ confirmed 3.14 as current stable, 3.10 as the oldest supported release (security fixes until October 2026), and 3.9 as EOL (rule 3).
- https://pypi.org/project/httpx/ confirmed 0.28.1 as the latest stable, with 1.0 available only as dev prereleases (rule 6).
- https://pypi.org/project/pydantic/ confirmed pydantic 2.13.4 as current, supporting Python 3.9 through 3.14.
- https://www.python-httpx.org/advanced/clients/ informed rules 10 and 11: reuse one Client for connection pooling, prefer the with-block, close explicitly otherwise.
- https://www.python-httpx.org/async/ informed rules 7, 10, and 11: async with, aclose(), and the warning against instantiating clients in hot loops.
- https://docs.pydantic.dev/latest/concepts/config/ informed rule 12: model_config with ConfigDict, and the v1 class Config marked deprecated.
- https://packaging.python.org/en/latest/guides/writing-pyproject-toml/ informed rule 5 and the skeleton: the hatchling build-system block plus required and recommended metadata.
- https://docs.astral.sh/ruff/configuration/ informed rule 19: the tool.ruff table layout and the split between ruff check and ruff format.
- https://docs.pytest.org/en/stable/explanation/goodpractices.html informed rules 4 and 20: tests outside src, importlib import mode, functions and fixtures over xunit style.
- https://lundberg.github.io/respx/ informed rule 21: the mock router and the respx_mock pytest fixture.
- https://github.com/openai/openai-python shows rules 4, 7, 8, 11, and 16 in production: src layout, OpenAI/AsyncOpenAI, resource namespaces, client context managers, and status errors carrying status_code and response.
- https://github.com/anthropics/anthropic-sdk-python (pyproject.toml and resources/models.py) shows rules 5, 6, 18, 20, and 21 in production: hatchling, the httpx <1 pin, Google-style Args docstrings, and pytest-asyncio plus respx in the dev group.
