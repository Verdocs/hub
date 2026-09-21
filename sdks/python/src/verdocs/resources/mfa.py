"""Multi-factor authentication operations (js-sdk: Users/MFA.ts).

Enrollment is a two-step flow: enroll() returns a pending TOTP secret, and
verify_enrollment() confirms it with a code from the user's authenticator
app, returning one-time backup codes. Every call requires a user session.
"""

from __future__ import annotations

from typing import TYPE_CHECKING

from ..models.users import MFABackupCodes, MFAEnrollment, MFAStatus

if TYPE_CHECKING:
    from .._endpoint import AsyncVerdocsEndpoint, VerdocsEndpoint

_MFA_PATH = "/v2/users/mfa"
_ENROLL_PATH = "/v2/users/mfa/enroll"
_VERIFY_ENROLLMENT_PATH = "/v2/users/mfa/enroll/verify"
_BACKUP_CODES_PATH = "/v2/users/mfa/backup-codes"


class MFA:
    """Multi-factor authentication calls for a sync endpoint."""

    def __init__(self, endpoint: VerdocsEndpoint) -> None:
        self._endpoint = endpoint

    def status(self) -> MFAStatus:
        """Get the caller's multi-factor authentication status via GET /v2/users/mfa.

        Mirrors js-sdk getMFAStatus.

        Example:
            status = endpoint.mfa.status()
            print(status.enabled, status.backup_codes_remaining)

        Returns:
            Whether MFA is enabled, the factor type, and the backup codes remaining.

        Raises:
            AuthenticationError: The endpoint has no valid user session.
            VerdocsAPIError: The API returned another non-2xx status.
            VerdocsConnectionError: The request never reached the API.

        @sdkOperation mfa.getMFAStatus
        @sdkGroup MFA
        @sdkPage Endpoints
        """
        response = self._endpoint._request("GET", _MFA_PATH)
        return MFAStatus.model_validate(response.json())

    def enroll(self) -> MFAEnrollment:
        """Begin MFA enrollment via POST /v2/users/mfa/enroll.

        The pending secret does not take effect until it is confirmed with
        verify_enrollment(). Render otpauth_url as a QR code for
        authenticator apps, and show secret for users who need to type it in
        by hand. Calling this again replaces the pending secret, so a user
        who abandons the flow can safely restart it. Mirrors js-sdk enrollMFA.

        Example:
            enrollment = endpoint.mfa.enroll()
            show_qr_code(enrollment.otpauth_url)

        Returns:
            The pending enrollment: secret, otpauth URL, and expiry.

        Raises:
            AuthenticationError: The endpoint has no valid user session.
            VerdocsAPIError: The API returned another non-2xx status; a 400
                means MFA is already enabled for the caller.
            VerdocsConnectionError: The request never reached the API.

        @sdkOperation mfa.enrollMFA
        @sdkGroup MFA
        @sdkPage Endpoints
        """
        response = self._endpoint._request("POST", _ENROLL_PATH)
        return MFAEnrollment.model_validate(response.json())

    def verify_enrollment(self, code: str) -> MFABackupCodes:
        """Complete MFA enrollment via POST /v2/users/mfa/enroll/verify.

        Proves the user can generate codes from the pending secret. The
        backup codes are returned once and never again, so they must be
        shown to the user before the flow closes. Three incorrect codes
        discard the pending enrollment and the user must start over. Mirrors
        js-sdk verifyMFAEnrollment.

        Example:
            codes = endpoint.mfa.verify_enrollment("123456")
            show_backup_codes(codes.backup_codes)

        Args:
            code: The current six-digit code from the user's authenticator app.

        Returns:
            One-time backup codes, returned only once.

        Raises:
            AuthenticationError: The endpoint has no valid user session.
            VerdocsAPIError: The code was wrong, or the API returned another non-2xx status.
            VerdocsConnectionError: The request never reached the API.

        @sdkOperation mfa.verifyMFAEnrollment
        @sdkGroup MFA
        @sdkPage Endpoints
        """
        response = self._endpoint._request("POST", _VERIFY_ENROLLMENT_PATH, json={"code": code})
        return MFABackupCodes.model_validate(response.json())

    def regenerate_backup_codes(self, code: str) -> MFABackupCodes:
        """Replace the caller's backup codes with a new set via POST /v2/users/mfa/backup-codes.

        The previous codes stop working immediately, and the new ones are
        returned only once. Mirrors js-sdk regenerateBackupCodes.

        Example:
            codes = endpoint.mfa.regenerate_backup_codes("123456")

        Args:
            code: The current six-digit code from the user's authenticator app.

        Returns:
            The new one-time backup codes, returned only once.

        Raises:
            AuthenticationError: The endpoint has no valid user session.
            VerdocsAPIError: The code was wrong, or the API returned another non-2xx status.
            VerdocsConnectionError: The request never reached the API.

        @sdkOperation mfa.regenerateBackupCodes
        @sdkGroup MFA
        @sdkPage Endpoints
        """
        response = self._endpoint._request("POST", _BACKUP_CODES_PATH, json={"code": code})
        return MFABackupCodes.model_validate(response.json())

    def disable(self, code: str) -> None:
        """Turn off MFA for the caller via DELETE /v2/users/mfa.

        A valid code is always required, so knowing the password alone is
        not enough to remove the second factor. Either a TOTP code or an
        unused backup code is accepted. The API answers with a status marker
        that nothing consumes, so this returns None and relies on exceptions
        for failure. Mirrors js-sdk disableMFA.

        Example:
            endpoint.mfa.disable("123456")

        Args:
            code: A current six-digit code from the user's authenticator app, or an unused backup code.

        Raises:
            AuthenticationError: The endpoint has no valid user session.
            VerdocsAPIError: The code was wrong, or the API returned another non-2xx status.
            VerdocsConnectionError: The request never reached the API.

        @sdkOperation mfa.disableMFA
        @sdkGroup MFA
        @sdkPage Endpoints
        """
        self._endpoint._request("DELETE", _MFA_PATH, json={"code": code})


class AsyncMFA:
    """Multi-factor authentication calls for an async endpoint."""

    def __init__(self, endpoint: AsyncVerdocsEndpoint) -> None:
        self._endpoint = endpoint

    async def status(self) -> MFAStatus:
        """Get the caller's multi-factor authentication status via GET /v2/users/mfa.

        Mirrors js-sdk getMFAStatus.

        Example:
            status = await endpoint.mfa.status()
            print(status.enabled, status.backup_codes_remaining)

        Returns:
            Whether MFA is enabled, the factor type, and the backup codes remaining.

        Raises:
            AuthenticationError: The endpoint has no valid user session.
            VerdocsAPIError: The API returned another non-2xx status.
            VerdocsConnectionError: The request never reached the API.
        """
        response = await self._endpoint._request("GET", _MFA_PATH)
        return MFAStatus.model_validate(response.json())

    async def enroll(self) -> MFAEnrollment:
        """Begin MFA enrollment via POST /v2/users/mfa/enroll.

        The pending secret does not take effect until it is confirmed with
        verify_enrollment(). Render otpauth_url as a QR code for
        authenticator apps, and show secret for users who need to type it in
        by hand. Calling this again replaces the pending secret, so a user
        who abandons the flow can safely restart it. Mirrors js-sdk enrollMFA.

        Example:
            enrollment = await endpoint.mfa.enroll()
            show_qr_code(enrollment.otpauth_url)

        Returns:
            The pending enrollment: secret, otpauth URL, and expiry.

        Raises:
            AuthenticationError: The endpoint has no valid user session.
            VerdocsAPIError: The API returned another non-2xx status; a 400
                means MFA is already enabled for the caller.
            VerdocsConnectionError: The request never reached the API.
        """
        response = await self._endpoint._request("POST", _ENROLL_PATH)
        return MFAEnrollment.model_validate(response.json())

    async def verify_enrollment(self, code: str) -> MFABackupCodes:
        """Complete MFA enrollment via POST /v2/users/mfa/enroll/verify.

        Proves the user can generate codes from the pending secret. The
        backup codes are returned once and never again, so they must be
        shown to the user before the flow closes. Three incorrect codes
        discard the pending enrollment and the user must start over. Mirrors
        js-sdk verifyMFAEnrollment.

        Example:
            codes = await endpoint.mfa.verify_enrollment("123456")
            show_backup_codes(codes.backup_codes)

        Args:
            code: The current six-digit code from the user's authenticator app.

        Returns:
            One-time backup codes, returned only once.

        Raises:
            AuthenticationError: The endpoint has no valid user session.
            VerdocsAPIError: The code was wrong, or the API returned another non-2xx status.
            VerdocsConnectionError: The request never reached the API.
        """
        response = await self._endpoint._request("POST", _VERIFY_ENROLLMENT_PATH, json={"code": code})
        return MFABackupCodes.model_validate(response.json())

    async def regenerate_backup_codes(self, code: str) -> MFABackupCodes:
        """Replace the caller's backup codes with a new set via POST /v2/users/mfa/backup-codes.

        The previous codes stop working immediately, and the new ones are
        returned only once. Mirrors js-sdk regenerateBackupCodes.

        Example:
            codes = await endpoint.mfa.regenerate_backup_codes("123456")

        Args:
            code: The current six-digit code from the user's authenticator app.

        Returns:
            The new one-time backup codes, returned only once.

        Raises:
            AuthenticationError: The endpoint has no valid user session.
            VerdocsAPIError: The code was wrong, or the API returned another non-2xx status.
            VerdocsConnectionError: The request never reached the API.
        """
        response = await self._endpoint._request("POST", _BACKUP_CODES_PATH, json={"code": code})
        return MFABackupCodes.model_validate(response.json())

    async def disable(self, code: str) -> None:
        """Turn off MFA for the caller via DELETE /v2/users/mfa.

        A valid code is always required, so knowing the password alone is
        not enough to remove the second factor. Either a TOTP code or an
        unused backup code is accepted. The API answers with a status marker
        that nothing consumes, so this returns None and relies on exceptions
        for failure. Mirrors js-sdk disableMFA.

        Example:
            await endpoint.mfa.disable("123456")

        Args:
            code: A current six-digit code from the user's authenticator app, or an unused backup code.

        Raises:
            AuthenticationError: The endpoint has no valid user session.
            VerdocsAPIError: The code was wrong, or the API returned another non-2xx status.
            VerdocsConnectionError: The request never reached the API.
        """
        await self._endpoint._request("DELETE", _MFA_PATH, json={"code": code})
