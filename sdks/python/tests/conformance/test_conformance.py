"""Live conformance checks driven by packages/conformance/fixtures.json.

Each case calls the endpoint twice, once with raw httpx and once with the
SDK, then compares status, shape, and data with volatile fields normalized,
the same contract as the TS lane. One adaptation for a typed SDK: pydantic
models cannot echo unknown wire fields back (extras are ignored by design),
so the raw body is pruned to the keys the SDK returned before diffing.
Everything the SDK surfaces is still compared in full, and required model
fields guarantee the load-bearing keys cannot silently disappear.
"""

from __future__ import annotations

import re
import uuid
from typing import Any

import httpx
import pytest

from verdocs import (
    PasswordGrantRequest,
    TemplateCreateParams,
    TemplateListParams,
    TemplateUpdateParams,
    VerdocsEndpoint,
)
from verdocs.errors import NotFoundError

pytestmark = pytest.mark.conformance


def js_typeof(value: Any) -> str:
    """Mirror the type markers support.ts produces with JS typeof (plus its null special case)."""
    if value is None:
        return "null"
    if isinstance(value, bool):
        return "boolean"
    if isinstance(value, (int, float)):
        return "number"
    if isinstance(value, str):
        return "string"
    return "object"


def normalize_volatile(value: Any, pattern: re.Pattern[str]) -> Any:
    """Replace volatile values (timestamps, tokens, expiries) with type markers.

    Applied to both sides before diffing so two calls made seconds apart still
    compare equal while the shape stays fully checked. Mirrors support.ts.
    """
    if isinstance(value, list):
        return [normalize_volatile(item, pattern) for item in value]
    if isinstance(value, dict):
        return {
            key: f"<<{js_typeof(entry)}>>" if pattern.search(key) else normalize_volatile(entry, pattern)
            for key, entry in value.items()
        }
    return value


def prune_to(reference: Any, value: Any) -> Any:
    """Reduce the raw body to the keys the SDK dump carries, recursively."""
    if isinstance(reference, dict) and isinstance(value, dict):
        return {key: prune_to(ref_entry, value[key]) for key, ref_entry in reference.items() if key in value}
    if isinstance(reference, list) and isinstance(value, list):
        if len(reference) != len(value):
            # Let a length mismatch surface in the diff instead of hiding it.
            return value
        return [prune_to(ref_entry, entry) for ref_entry, entry in zip(reference, value, strict=True)]
    return value


def substitute_env(value: Any, env) -> Any:
    """Fill in $VERDOCS_* placeholders from fixtures.json request bodies."""
    mapping = {"$VERDOCS_TEST_EMAIL": env.email, "$VERDOCS_TEST_PASSWORD": env.password}
    if isinstance(value, dict):
        return {key: substitute_env(entry, env) for key, entry in value.items()}
    if isinstance(value, str) and value.startswith("$"):
        if value not in mapping:
            pytest.fail(f"No substitution for fixture placeholder {value}")
        return mapping[value]
    return value


def call_raw(client: httpx.Client, case: dict[str, Any], env, token: str | None) -> tuple[int, Any]:
    headers = {"Authorization": f"Bearer {token}"} if case.get("auth") else None
    body = substitute_env(case.get("body"), env) if case.get("body") is not None else None
    response = client.request(case["method"], case["path"], params=case.get("query"), json=body, headers=headers)
    try:
        parsed: Any = response.json()
    except ValueError:
        parsed = response.text
    return response.status_code, parsed


def call_sdk(endpoint: VerdocsEndpoint, case: dict[str, Any], env) -> Any:
    sdk_name = case["sdk"]
    if sdk_name == "authenticate":
        # A fresh endpoint proves authenticate needs no existing session.
        with VerdocsEndpoint(base_url=env.api_base) as fresh:
            return fresh.auth.authenticate(PasswordGrantRequest(username=env.email, password=env.password))
    if sdk_name == "getMyUser":
        return endpoint.users.me()
    if sdk_name == "getCurrentProfile":
        return endpoint.profiles.current()
    if sdk_name == "getTemplates":
        return endpoint.templates.list(TemplateListParams(**case.get("query", {})))
    pytest.fail(f"Conformance case '{case['id']}' has no SDK mapping; add one when the SDK grows the operation.")


def test_case_matches_raw_http(case, conformance_env, sdk_endpoint, raw_client, volatile_pattern):
    raw_status, raw_body = call_raw(raw_client, case, conformance_env, sdk_endpoint.token)
    assert raw_status == 200

    result = call_sdk(sdk_endpoint, case, conformance_env)
    assert result is not None
    sdk_dump = result.model_dump(mode="json", exclude_unset=True)

    reference: Any = raw_body
    if case["id"] == "profiles-current":
        # The raw response is an array; the SDK returns the entry with
        # current=true, so that entry is the comparison target (per the
        # fixture note).
        reference = next((entry for entry in raw_body if entry.get("current")), None)
        assert reference is not None, "no profile in the raw response is marked current"

    pruned = prune_to(sdk_dump, reference)
    assert normalize_volatile(sdk_dump, volatile_pattern) == normalize_volatile(pruned, volatile_pattern)


def test_template_lifecycle_round_trip(sdk_endpoint):
    """Create, read, update, and delete one template on beta.

    Not a fixtures.json case (those are read-only); this is the
    create-then-delete smoke the beta etiquette allows so the write
    operations get live coverage too. One template, always cleaned up.
    """
    name = f"python-sdk-conformance-{uuid.uuid4().hex[:8]}"

    created = sdk_endpoint.templates.create(TemplateCreateParams(name=name))
    try:
        assert created.name == name

        fetched = sdk_endpoint.templates.get(created.id)
        assert fetched.id == created.id
        assert fetched.name == name

        updated = sdk_endpoint.templates.update(
            created.id, TemplateUpdateParams(description="python sdk conformance check")
        )
        assert updated.description == "python sdk conformance check"
    finally:
        sdk_endpoint.templates.delete(created.id)

    with pytest.raises(NotFoundError):
        sdk_endpoint.templates.get(created.id)
