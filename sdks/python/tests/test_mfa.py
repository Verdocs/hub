"""mfa resource: status, enroll, verify_enrollment, regenerate_backup_codes, and disable, sync and async."""

from __future__ import annotations

from datetime import datetime
from typing import Any

import pytest

from verdocs import AuthenticationError, MFABackupCodes, MFAEnrollment, MFAStatus, VerdocsAPIError

MFA_URL = "/v2/users/mfa"
ENROLL_URL = "/v2/users/mfa/enroll"
VERIFY_URL = "/v2/users/mfa/enroll/verify"
BACKUP_CODES_URL = "/v2/users/mfa/backup-codes"


def status_payload(**overrides: Any) -> dict[str, Any]:
    payload: dict[str, Any] = {
        "enabled": True,
        "type": "totp",
        "enrolled_at": "2026-03-01T00:00:00.000Z",
        "backup_codes_remaining": 8,
    }
    payload.update(overrides)
    return payload


def enrollment_payload() -> dict[str, Any]:
    return {
        "secret": "JBSWY3DPEHPK3PXP",
        "otpauth_url": "otpauth://totp/Verdocs:test%40example.com?secret=JBSWY3DPEHPK3PXP&issuer=Verdocs",
        "expires_at": "2026-03-01T00:15:00.000Z",
    }


BACKUP_CODES = {"backup_codes": ["ab12-cd34", "ef56-gh78", "ij90-kl12"]}


def test_status_parses_an_enabled_record(endpoint, respx_mock, base_url):
    respx_mock.get(f"{base_url}{MFA_URL}").respond(200, json=status_payload())

    status = endpoint.mfa.status()

    assert isinstance(status, MFAStatus)
    assert status.enabled is True
    assert status.type == "totp"
    assert isinstance(status.enrolled_at, datetime)
    assert status.backup_codes_remaining == 8


def test_status_parses_a_disabled_record(endpoint, respx_mock, base_url):
    respx_mock.get(f"{base_url}{MFA_URL}").respond(
        200, json=status_payload(enabled=False, type=None, enrolled_at=None, backup_codes_remaining=0)
    )

    status = endpoint.mfa.status()

    assert status.enabled is False
    assert status.type is None
    assert status.enrolled_at is None
    assert status.backup_codes_remaining == 0


def test_status_unauthenticated_raises(endpoint, respx_mock, base_url):
    respx_mock.get(f"{base_url}{MFA_URL}").respond(401, json={"error": "unauthorized"})

    with pytest.raises(AuthenticationError):
        endpoint.mfa.status()


def test_enroll_posts_without_a_body(endpoint, respx_mock, base_url):
    route = respx_mock.post(f"{base_url}{ENROLL_URL}").respond(200, json=enrollment_payload())

    enrollment = endpoint.mfa.enroll()

    assert isinstance(enrollment, MFAEnrollment)
    assert enrollment.secret == "JBSWY3DPEHPK3PXP"
    assert enrollment.otpauth_url.startswith("otpauth://totp/")
    assert isinstance(enrollment.expires_at, datetime)
    assert route.calls.last.request.content == b""


def test_enroll_when_already_enabled_raises(endpoint, respx_mock, base_url):
    respx_mock.post(f"{base_url}{ENROLL_URL}").respond(400, json={"error": "MFA is already enabled"})

    with pytest.raises(VerdocsAPIError) as excinfo:
        endpoint.mfa.enroll()

    assert excinfo.value.status_code == 400


def test_verify_enrollment_sends_the_code_and_returns_backup_codes(endpoint, payloads, respx_mock, base_url):
    route = respx_mock.post(f"{base_url}{VERIFY_URL}").respond(200, json=BACKUP_CODES)

    codes = endpoint.mfa.verify_enrollment("123456")

    assert isinstance(codes, MFABackupCodes)
    assert codes.backup_codes == ["ab12-cd34", "ef56-gh78", "ij90-kl12"]
    assert payloads.request_json(route) == {"code": "123456"}


def test_verify_enrollment_wrong_code_raises(endpoint, respx_mock, base_url):
    respx_mock.post(f"{base_url}{VERIFY_URL}").respond(400, json={"error": "invalid code"})

    with pytest.raises(VerdocsAPIError):
        endpoint.mfa.verify_enrollment("000000")


def test_regenerate_backup_codes_sends_the_code(endpoint, payloads, respx_mock, base_url):
    route = respx_mock.post(f"{base_url}{BACKUP_CODES_URL}").respond(200, json=BACKUP_CODES)

    codes = endpoint.mfa.regenerate_backup_codes("123456")

    assert isinstance(codes, MFABackupCodes)
    assert len(codes.backup_codes) == 3
    assert payloads.request_json(route) == {"code": "123456"}


def test_disable_sends_the_code_in_a_delete_body(endpoint, payloads, respx_mock, base_url):
    route = respx_mock.delete(f"{base_url}{MFA_URL}").respond(200, json={"status": "OK"})

    assert endpoint.mfa.disable("123456") is None

    request = route.calls.last.request
    assert request.method == "DELETE"
    assert request.headers["Content-Type"] == "application/json"
    assert payloads.request_json(route) == {"code": "123456"}


def test_disable_accepts_a_backup_code(endpoint, payloads, respx_mock, base_url):
    route = respx_mock.delete(f"{base_url}{MFA_URL}").respond(200, json={"status": "OK"})

    endpoint.mfa.disable("ab12-cd34")

    assert payloads.request_json(route) == {"code": "ab12-cd34"}


def test_disable_wrong_code_raises(endpoint, respx_mock, base_url):
    respx_mock.delete(f"{base_url}{MFA_URL}").respond(400, json={"error": "invalid code"})

    with pytest.raises(VerdocsAPIError):
        endpoint.mfa.disable("000000")


async def test_async_status(async_endpoint, respx_mock, base_url):
    respx_mock.get(f"{base_url}{MFA_URL}").respond(200, json=status_payload())

    status = await async_endpoint.mfa.status()

    assert isinstance(status, MFAStatus)
    assert status.enabled is True


async def test_async_enroll_verify_regenerate_disable_round_trip(async_endpoint, payloads, respx_mock, base_url):
    enroll_route = respx_mock.post(f"{base_url}{ENROLL_URL}").respond(200, json=enrollment_payload())
    verify_route = respx_mock.post(f"{base_url}{VERIFY_URL}").respond(200, json=BACKUP_CODES)
    regenerate_route = respx_mock.post(f"{base_url}{BACKUP_CODES_URL}").respond(200, json=BACKUP_CODES)
    disable_route = respx_mock.delete(f"{base_url}{MFA_URL}").respond(200, json={"status": "OK"})

    enrollment = await async_endpoint.mfa.enroll()
    verified = await async_endpoint.mfa.verify_enrollment("123456")
    regenerated = await async_endpoint.mfa.regenerate_backup_codes("654321")
    disabled = await async_endpoint.mfa.disable("ab12-cd34")

    assert enroll_route.called
    assert enrollment.secret == "JBSWY3DPEHPK3PXP"
    assert verified.backup_codes == BACKUP_CODES["backup_codes"]
    assert payloads.request_json(verify_route) == {"code": "123456"}
    assert regenerated.backup_codes == BACKUP_CODES["backup_codes"]
    assert payloads.request_json(regenerate_route) == {"code": "654321"}
    assert disabled is None
    assert payloads.request_json(disable_route) == {"code": "ab12-cd34"}


async def test_async_status_unauthenticated_raises(async_endpoint, respx_mock, base_url):
    respx_mock.get(f"{base_url}{MFA_URL}").respond(401, json={"error": "unauthorized"})

    with pytest.raises(AuthenticationError):
        await async_endpoint.mfa.status()
