"""Support for the live conformance lane.

These tests hit live beta with real credentials, so the -m filter in
pyproject.toml keeps them out of the default run. Run them explicitly:

    .venv/bin/python -m pytest -m conformance

Credentials come from the gitignored .env at the hub root (or the process
environment): VERDOCS_API_BASE, VERDOCS_TEST_EMAIL, VERDOCS_TEST_PASSWORD.
When the lane is invoked without them, that is a hard error with
instructions, not a silent skip, mirroring the TS lane in
packages/conformance. Secret values are never printed.
"""

from __future__ import annotations

import json
import os
import re
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import Any

import httpx
import pytest

from verdocs import PasswordGrantRequest, VerdocsEndpoint

# parents walks up from tests/conformance/: [1] tests, [2] python, [3] sdks, [4] hub
HUB_ROOT = Path(__file__).resolve().parents[4]
FIXTURES_PATH = HUB_ROOT / "packages" / "conformance" / "fixtures.json"

REQUIRED_VARS = ("VERDOCS_API_BASE", "VERDOCS_TEST_EMAIL", "VERDOCS_TEST_PASSWORD")


def load_fixtures() -> dict[str, Any]:
    return json.loads(FIXTURES_PATH.read_text())


def _load_env_file(path: Path) -> None:
    """Load KEY=VALUE lines without overriding anything already set, like node's loadEnvFile."""
    if not path.exists():
        return
    for line in path.read_text().splitlines():
        stripped = line.strip()
        if not stripped or stripped.startswith("#") or "=" not in stripped:
            continue
        key, _, value = stripped.partition("=")
        os.environ.setdefault(key.strip(), value.strip().strip("'\""))


@dataclass
class ConformanceEnv:
    api_base: str
    email: str
    password: str


def pytest_generate_tests(metafunc: pytest.Metafunc) -> None:
    # Parametrizing from fixtures.json keeps this lane in lockstep with the
    # other SDKs: a case added there shows up here (and fails loudly until the
    # SDK mapping exists). Entries under "frozen" are skipped entirely per the
    # fixture notes.
    if "case" in metafunc.fixturenames:
        cases = load_fixtures()["cases"]
        metafunc.parametrize("case", cases, ids=[case["id"] for case in cases])


@pytest.fixture(scope="session")
def conformance_env() -> ConformanceEnv:
    _load_env_file(HUB_ROOT / ".env")
    values = {name: os.environ.get(name) for name in REQUIRED_VARS}
    if not all(values.values()):
        raise RuntimeError(
            "Conformance tests need VERDOCS_API_BASE, VERDOCS_TEST_EMAIL, and VERDOCS_TEST_PASSWORD. "
            "Copy .env.example to .env at the hub root and fill in a beta test account."
        )
    return ConformanceEnv(
        api_base=values["VERDOCS_API_BASE"],  # type: ignore[arg-type]
        email=values["VERDOCS_TEST_EMAIL"],  # type: ignore[arg-type]
        password=values["VERDOCS_TEST_PASSWORD"],  # type: ignore[arg-type]
    )


@pytest.fixture(scope="session")
def volatile_pattern() -> re.Pattern[str]:
    """The volatile-key pattern shipped inside fixtures.json, compiled with its flags."""
    fixtures = load_fixtures()
    flags = re.IGNORECASE if "i" in fixtures.get("volatileKeyPatternFlags", "") else 0
    return re.compile(fixtures["volatileKeyPattern"], flags)


# A few timestamp columns dodge the volatile-key pattern because their names
# do not end in _at (next_reminder, expiration_date, first_used, ...). The SDK
# parses those into datetime objects and pydantic renders them back with a
# different precision than the server (".913Z" comes back as ".913000Z"), so
# ISO-shaped strings on both sides get canonicalized and the comparison is on
# the instant, not the rendering.
_ISO_DATETIME = re.compile(r"^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$")


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


def normalize_payload(value: Any, pattern: re.Pattern[str]) -> Any:
    """Replace volatile values with type markers; canonicalize the timestamps that dodge the pattern.

    Applied to both sides before diffing so two calls made seconds apart still
    compare equal while the shape stays fully checked. Mirrors support.ts.
    """
    if isinstance(value, list):
        return [normalize_payload(item, pattern) for item in value]
    if isinstance(value, dict):
        return {
            key: f"<<{js_typeof(entry)}>>" if pattern.search(key) else normalize_payload(entry, pattern)
            for key, entry in value.items()
        }
    if isinstance(value, str) and _ISO_DATETIME.match(value):
        try:
            return datetime.fromisoformat(value.replace("Z", "+00:00")).isoformat()
        except ValueError:
            return value
    return value


# The compare helpers are handed to tests as fixtures because importlib import
# mode does not let test modules import from conftest (same pattern as the
# unit-test conftest).


@pytest.fixture(scope="session")
def normalize(volatile_pattern: re.Pattern[str]):
    """normalize_payload bound to the fixture file's volatile-key pattern."""

    def apply(value: Any) -> Any:
        return normalize_payload(value, volatile_pattern)

    return apply


@pytest.fixture(scope="session")
def sdk_dump():
    """Dump an SDK result (one model or a list of models) for comparison against a raw body.

    exclude_unset keeps fields the wire never sent out of the dump, and the
    wire models keep unknown fields (extra="allow"), so the dump carries
    exactly the keys the wire sent: no more, no less.
    """

    def dump(result: Any) -> Any:
        if isinstance(result, list):
            return [entry.model_dump(mode="json", exclude_unset=True) for entry in result]
        return result.model_dump(mode="json", exclude_unset=True)

    return dump


@pytest.fixture(scope="session")
def sdk_endpoint(conformance_env: ConformanceEnv):
    """One authenticated SDK endpoint shared by every case, like the TS lane's beforeAll."""
    with VerdocsEndpoint(base_url=conformance_env.api_base) as endpoint:
        tokens = endpoint.auth.authenticate(
            PasswordGrantRequest(username=conformance_env.email, password=conformance_env.password)
        )
        endpoint.set_token(tokens.access_token)
        assert endpoint.session is not None, "beta rejected the token the SDK just issued"
        yield endpoint


@pytest.fixture(scope="session")
def raw_client(conformance_env: ConformanceEnv):
    """The reference side of every check: raw httpx with no SDK code in the path."""
    with httpx.Client(base_url=conformance_env.api_base, timeout=60.0) as client:
        yield client
