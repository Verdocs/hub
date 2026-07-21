"""Smoke-check that the griffe extractor emits the Auth @sdkOperation set."""

from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
GENERATOR = ROOT / "docs" / "generate_sdk_docs.py"
OUTPUT = ROOT / "sdk-docs.json"

EXPECTED_AUTH_OPERATIONS = {
    "auth.authenticate",
    "auth.changePassword",
    "auth.getMyUser",
    "auth.getOAuth2AuthorizeUrl",
    "auth.refreshToken",
    "auth.resendVerification",
    "auth.resetPassword",
    "auth.verifyEmail",
}

EXPECTED_TEMPLATE_OPERATIONS = {
    "template.createTemplate",
}


def test_generate_sdk_docs_emits_auth_operations():
    result = subprocess.run([sys.executable, str(GENERATOR)], cwd=ROOT, check=True, capture_output=True, text=True)
    assert "Wrote sdk-docs.json" in result.stdout

    model = json.loads(OUTPUT.read_text(encoding="utf-8"))
    expected_language = "python"
    assert model["language"] == expected_language
    assert model["package"] == "verdocs"
    assert "auth" in model["groups"]

    auth_symbols = model["groups"]["auth"]["symbols"]
    assert set(auth_symbols) == EXPECTED_AUTH_OPERATIONS

    authenticate = auth_symbols["auth.authenticate"]
    expected_getting_started = True
    assert authenticate["gettingStarted"] is expected_getting_started
    assert authenticate["kind"] == "function"
    assert authenticate["page"] == "Endpoints"
    assert authenticate["resource"] == "function"
    assert authenticate["examples"][0]["language"] == "python"
    assert "PasswordGrantRequest" in authenticate["examples"][0]["code"]

    template_symbols = model["groups"]["template"]["symbols"]
    assert set(template_symbols) == EXPECTED_TEMPLATE_OPERATIONS

    create_template = template_symbols["template.createTemplate"]
    expected_getting_started = True
    assert create_template["gettingStarted"] is expected_getting_started
    assert create_template["page"] == "Endpoints"
    assert create_template["examples"][0]["language"] == "python"
    assert "TemplateCreateParams" in create_template["examples"][0]["code"]
