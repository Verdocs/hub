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
from pathlib import Path
from typing import Any

import httpx
import pytest

from verdocs import VerdocsEndpoint

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


@pytest.fixture(scope="session")
def sdk_endpoint(conformance_env: ConformanceEnv):
    """One authenticated SDK endpoint shared by every case, like the TS lane's beforeAll."""
    with VerdocsEndpoint(base_url=conformance_env.api_base) as endpoint:
        tokens = endpoint.auth.authenticate(username=conformance_env.email, password=conformance_env.password)
        endpoint.set_token(tokens.access_token)
        assert endpoint.session is not None, "beta rejected the token the SDK just issued"
        yield endpoint


@pytest.fixture(scope="session")
def raw_client(conformance_env: ConformanceEnv):
    """The reference side of every check: raw httpx with no SDK code in the path."""
    with httpx.Client(base_url=conformance_env.api_base, timeout=60.0) as client:
        yield client
