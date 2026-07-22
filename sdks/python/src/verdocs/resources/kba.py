"""Knowledge-based-authentication operations (js-sdk: Envelopes/KBA.ts).

Ported code-faithfully from the js-sdk, but every route in this module is
dead on the deployed API: nothing serves /v2/kba/*, so each call returns 404
today. Real KBA verification runs through POST /v2/sign/verify, which is
endpoint.recipients.verify_signer. These stubs get the same treatment as the
frozen template star toggle: kept for js-sdk parity, excluded from
conformance, and documented as non-functional until the API grows the routes
back.
"""

from __future__ import annotations

from typing import TYPE_CHECKING
from urllib.parse import quote

from pydantic import TypeAdapter

from ..models.envelopes import KbaChallengeResponse, KbaIdentity, RecipientKbaStep

if TYPE_CHECKING:
    from .._endpoint import AsyncVerdocsEndpoint, VerdocsEndpoint

_KBA_PATH = "/v2/kba"

# RecipientKbaStep is a discriminated union, not a model, so parsing goes
# through a TypeAdapter built once here.
_KBA_STEP_ADAPTER: TypeAdapter[RecipientKbaStep] = TypeAdapter(RecipientKbaStep)


class KBA:
    """KBA calls for a sync endpoint."""

    def __init__(self, endpoint: VerdocsEndpoint) -> None:
        self._endpoint = endpoint

    def get_step(self, envelope_id: str, role_name: str) -> RecipientKbaStep:
        """Get the recipient's current KBA step via GET /v2/kba/{envelope_id}/{role_name}.

        Dead route: the deployed API has no /v2/kba routes, so this returns
        404 today; check recipient.auth_step and use
        endpoint.recipients.verify_signer instead. Mirrors js-sdk getKbaStep,
        which only the recipient may call, with a signing session.

        Args:
            envelope_id: The envelope to operate on.
            role_name: The role to check.

        Returns:
            The current KBA step for the recipient.

        Raises:
            NotFoundError: Always, until the API serves this route again.
            VerdocsAPIError: The API returned another non-2xx status.
            VerdocsConnectionError: The request never reached the API.

        @sdkOperation kba.getKbaStep
        @sdkGroup KBA
        @sdkPage Endpoints
        """
        response = self._endpoint._request("GET", f"{_KBA_PATH}/{envelope_id}/{quote(role_name, safe='')}")
        return _KBA_STEP_ADAPTER.validate_python(response.json())

    def submit_pin(self, envelope_id: str, role_name: str, pin: str) -> RecipientKbaStep:
        """Submit a response to a KBA PIN challenge via POST /v2/kba/pin.

        Dead route: the deployed API has no /v2/kba routes, so this returns
        404 today; use endpoint.recipients.verify_signer instead. Mirrors
        js-sdk submitKbaPin. Requires a signing session.

        Args:
            envelope_id: The envelope to operate on.
            role_name: The role completing the challenge.
            pin: The PIN the recipient entered.

        Returns:
            The next KBA step for the recipient.

        Raises:
            NotFoundError: Always, until the API serves this route again.
            VerdocsAPIError: The API returned another non-2xx status.
            VerdocsConnectionError: The request never reached the API.

        @sdkOperation kba.submitKbaPin
        @sdkGroup KBA
        @sdkPage Endpoints
        """
        response = self._endpoint._request(
            "POST", f"{_KBA_PATH}/pin", json={"envelope_id": envelope_id, "role_name": role_name, "pin": pin}
        )
        return _KBA_STEP_ADAPTER.validate_python(response.json())

    def submit_identity(self, envelope_id: str, role_name: str, identity: KbaIdentity) -> RecipientKbaStep:
        """Submit identity details for a KBA challenge via POST /v2/kba/identity.

        Dead route: the deployed API has no /v2/kba routes, so this returns
        404 today; use endpoint.recipients.verify_signer with a
        RecipientVerifyKBAParams instead. Mirrors js-sdk submitKbaIdentity.
        Requires a signing session.

        Args:
            envelope_id: The envelope to operate on.
            role_name: The role completing the challenge.
            identity: The recipient's identity details.

        Returns:
            The next KBA step for the recipient.

        Raises:
            NotFoundError: Always, until the API serves this route again.
            VerdocsAPIError: The API returned another non-2xx status.
            VerdocsConnectionError: The request never reached the API.

        @sdkOperation kba.submitKbaIdentity
        @sdkGroup KBA
        @sdkPage Endpoints
        """
        response = self._endpoint._request(
            "POST",
            f"{_KBA_PATH}/identity",
            json={
                "envelope_id": envelope_id,
                "role_name": role_name,
                "identity": identity.model_dump(mode="json", exclude_unset=True),
            },
        )
        return _KBA_STEP_ADAPTER.validate_python(response.json())

    def submit_challenge_response(
        self, envelope_id: str, role_name: str, responses: list[KbaChallengeResponse]
    ) -> RecipientKbaStep:
        """Submit answers to KBA challenge questions via POST /v2/kba/response.

        Dead route: the deployed API has no /v2/kba routes, so this returns
        404 today; use endpoint.recipients.verify_signer instead. Mirrors
        js-sdk submitKbaChallengeResponse. Answers go in the same order the
        challenge questions were listed. Requires a signing session.

        Args:
            envelope_id: The envelope to operate on.
            role_name: The role completing the challenge.
            responses: One answer per challenge question, in order.

        Returns:
            The next KBA step for the recipient.

        Raises:
            NotFoundError: Always, until the API serves this route again.
            VerdocsAPIError: The API returned another non-2xx status.
            VerdocsConnectionError: The request never reached the API.

        @sdkOperation kba.submitKbaChallengeResponse
        @sdkGroup KBA
        @sdkPage Endpoints
        """
        response = self._endpoint._request(
            "POST",
            f"{_KBA_PATH}/response",
            json={
                "envelope_id": envelope_id,
                "role_name": role_name,
                "responses": [entry.model_dump(mode="json", exclude_unset=True) for entry in responses],
            },
        )
        return _KBA_STEP_ADAPTER.validate_python(response.json())


class AsyncKBA:
    """KBA calls for an async endpoint."""

    def __init__(self, endpoint: AsyncVerdocsEndpoint) -> None:
        self._endpoint = endpoint

    async def get_step(self, envelope_id: str, role_name: str) -> RecipientKbaStep:
        """Get the recipient's current KBA step via GET /v2/kba/{envelope_id}/{role_name}.

        Dead route: the deployed API has no /v2/kba routes, so this returns
        404 today; check recipient.auth_step and use
        endpoint.recipients.verify_signer instead. Mirrors js-sdk getKbaStep,
        which only the recipient may call, with a signing session.

        Args:
            envelope_id: The envelope to operate on.
            role_name: The role to check.

        Returns:
            The current KBA step for the recipient.

        Raises:
            NotFoundError: Always, until the API serves this route again.
            VerdocsAPIError: The API returned another non-2xx status.
            VerdocsConnectionError: The request never reached the API.
        """
        response = await self._endpoint._request("GET", f"{_KBA_PATH}/{envelope_id}/{quote(role_name, safe='')}")
        return _KBA_STEP_ADAPTER.validate_python(response.json())

    async def submit_pin(self, envelope_id: str, role_name: str, pin: str) -> RecipientKbaStep:
        """Submit a response to a KBA PIN challenge via POST /v2/kba/pin.

        Dead route: the deployed API has no /v2/kba routes, so this returns
        404 today; use endpoint.recipients.verify_signer instead. Mirrors
        js-sdk submitKbaPin. Requires a signing session.

        Args:
            envelope_id: The envelope to operate on.
            role_name: The role completing the challenge.
            pin: The PIN the recipient entered.

        Returns:
            The next KBA step for the recipient.

        Raises:
            NotFoundError: Always, until the API serves this route again.
            VerdocsAPIError: The API returned another non-2xx status.
            VerdocsConnectionError: The request never reached the API.
        """
        response = await self._endpoint._request(
            "POST", f"{_KBA_PATH}/pin", json={"envelope_id": envelope_id, "role_name": role_name, "pin": pin}
        )
        return _KBA_STEP_ADAPTER.validate_python(response.json())

    async def submit_identity(self, envelope_id: str, role_name: str, identity: KbaIdentity) -> RecipientKbaStep:
        """Submit identity details for a KBA challenge via POST /v2/kba/identity.

        Dead route: the deployed API has no /v2/kba routes, so this returns
        404 today; use endpoint.recipients.verify_signer with a
        RecipientVerifyKBAParams instead. Mirrors js-sdk submitKbaIdentity.
        Requires a signing session.

        Args:
            envelope_id: The envelope to operate on.
            role_name: The role completing the challenge.
            identity: The recipient's identity details.

        Returns:
            The next KBA step for the recipient.

        Raises:
            NotFoundError: Always, until the API serves this route again.
            VerdocsAPIError: The API returned another non-2xx status.
            VerdocsConnectionError: The request never reached the API.
        """
        response = await self._endpoint._request(
            "POST",
            f"{_KBA_PATH}/identity",
            json={
                "envelope_id": envelope_id,
                "role_name": role_name,
                "identity": identity.model_dump(mode="json", exclude_unset=True),
            },
        )
        return _KBA_STEP_ADAPTER.validate_python(response.json())

    async def submit_challenge_response(
        self, envelope_id: str, role_name: str, responses: list[KbaChallengeResponse]
    ) -> RecipientKbaStep:
        """Submit answers to KBA challenge questions via POST /v2/kba/response.

        Dead route: the deployed API has no /v2/kba routes, so this returns
        404 today; use endpoint.recipients.verify_signer instead. Mirrors
        js-sdk submitKbaChallengeResponse. Answers go in the same order the
        challenge questions were listed. Requires a signing session.

        Args:
            envelope_id: The envelope to operate on.
            role_name: The role completing the challenge.
            responses: One answer per challenge question, in order.

        Returns:
            The next KBA step for the recipient.

        Raises:
            NotFoundError: Always, until the API serves this route again.
            VerdocsAPIError: The API returned another non-2xx status.
            VerdocsConnectionError: The request never reached the API.
        """
        response = await self._endpoint._request(
            "POST",
            f"{_KBA_PATH}/response",
            json={
                "envelope_id": envelope_id,
                "role_name": role_name,
                "responses": [entry.model_dump(mode="json", exclude_unset=True) for entry in responses],
            },
        )
        return _KBA_STEP_ADAPTER.validate_python(response.json())
