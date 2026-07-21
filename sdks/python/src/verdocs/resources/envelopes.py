"""Envelope operations (js-sdk: Envelopes/Envelopes.ts).

This seed covers creating an envelope from an existing template and fetching
one by ID. Creating an envelope directly from uploaded documents, and the
recipient/history/document sub-resources, come later.
"""

from __future__ import annotations

from typing import TYPE_CHECKING, Any

from ..models import Envelope, EnvelopeCreateParams

if TYPE_CHECKING:
    from .._endpoint import AsyncVerdocsEndpoint, VerdocsEndpoint

_ENVELOPES_PATH = "/v2/envelopes"


def _write_body(params: EnvelopeCreateParams) -> dict[str, Any]:
    return params.model_dump(mode="json", exclude_none=True)


class Envelopes:
    """Envelope calls for a sync endpoint."""

    def __init__(self, endpoint: VerdocsEndpoint) -> None:
        self._endpoint = endpoint

    def create(self, params: EnvelopeCreateParams) -> Envelope:
        """Create an envelope from a template via POST /v2/envelopes. Mirrors js-sdk createEnvelope.

        Example:
            envelope = endpoint.envelopes.create(
                EnvelopeCreateParams(
                    template_id="d2338742-f3a1-465b-8592-806587413cc1",
                    name="Bill of Sale",
                    recipients=[
                        EnvelopeCreateRecipient(
                            role_name="Seller",
                            first_name="Paige",
                            last_name="Turner",
                            email="paige.turner@nomail.com",
                        ),
                    ],
                )
            )

        Args:
            params: The template to copy and the recipients to fill its roles.

        Returns:
            The newly created envelope.

        Raises:
            NotFoundError: The template does not exist or is not visible to the caller.
            VerdocsAPIError: The API rejected the request.
            VerdocsConnectionError: The request never reached the API.

        @sdkOperation envelope.createEnvelope
        @sdkGroup Envelope
        @sdkPage Endpoints
        @sdkGettingStarted
        """
        response = self._endpoint._request("POST", _ENVELOPES_PATH, json=_write_body(params))
        return Envelope.model_validate(response.json())

    def get(self, envelope_id: str) -> Envelope:
        """Get one envelope by ID via GET /v2/envelopes/{envelope_id}. Mirrors js-sdk getEnvelope.

        Non-creators (e.g. recipients) receive only the metadata they are allowed to view.

        Args:
            envelope_id: ID of the envelope to fetch.

        Returns:
            The requested envelope.

        Raises:
            NotFoundError: No visible envelope has that ID.
            VerdocsAPIError: The API returned another non-2xx status.
            VerdocsConnectionError: The request never reached the API.

        @sdkOperation envelope.getEnvelope
        @sdkGroup Envelope
        @sdkPage Endpoints
        """
        response = self._endpoint._request("GET", f"{_ENVELOPES_PATH}/{envelope_id}")
        return Envelope.model_validate(response.json())


class AsyncEnvelopes:
    """Envelope calls for an async endpoint."""

    def __init__(self, endpoint: AsyncVerdocsEndpoint) -> None:
        self._endpoint = endpoint

    async def create(self, params: EnvelopeCreateParams) -> Envelope:
        """Create an envelope from a template via POST /v2/envelopes. Mirrors js-sdk createEnvelope.

        Example:
            envelope = await endpoint.envelopes.create(
                EnvelopeCreateParams(
                    template_id="d2338742-f3a1-465b-8592-806587413cc1",
                    name="Bill of Sale",
                    recipients=[
                        EnvelopeCreateRecipient(
                            role_name="Seller",
                            first_name="Paige",
                            last_name="Turner",
                            email="paige.turner@nomail.com",
                        ),
                    ],
                )
            )

        Args:
            params: The template to copy and the recipients to fill its roles.

        Returns:
            The newly created envelope.

        Raises:
            NotFoundError: The template does not exist or is not visible to the caller.
            VerdocsAPIError: The API rejected the request.
            VerdocsConnectionError: The request never reached the API.
        """
        response = await self._endpoint._request("POST", _ENVELOPES_PATH, json=_write_body(params))
        return Envelope.model_validate(response.json())

    async def get(self, envelope_id: str) -> Envelope:
        """Get one envelope by ID via GET /v2/envelopes/{envelope_id}. Mirrors js-sdk getEnvelope.

        Non-creators (e.g. recipients) receive only the metadata they are allowed to view.

        Args:
            envelope_id: ID of the envelope to fetch.

        Returns:
            The requested envelope.

        Raises:
            NotFoundError: No visible envelope has that ID.
            VerdocsAPIError: The API returned another non-2xx status.
            VerdocsConnectionError: The request never reached the API.
        """
        response = await self._endpoint._request("GET", f"{_ENVELOPES_PATH}/{envelope_id}")
        return Envelope.model_validate(response.json())
