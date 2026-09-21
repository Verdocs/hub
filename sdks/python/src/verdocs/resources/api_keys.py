"""API key operations (js-sdk: Organizations/ApiKeys.ts).

API keys authenticate server-to-server calls; never use them from client
code. Authenticate with a key via endpoint.auth (client-credentials flow)
and re-authenticate as tokens expire. Keys may be rotated at any time
without disturbing existing sessions. Every call here requires an admin or
owner of the organization.
"""

from __future__ import annotations

from typing import TYPE_CHECKING, Any

from ..models.core import ApiKey
from ..models.organizations import ApiKeyCreateParams, ApiKeyUpdateParams

if TYPE_CHECKING:
    from .._endpoint import AsyncVerdocsEndpoint, VerdocsEndpoint

_API_KEYS_PATH = "/v2/api-keys"


def _write_body(params: ApiKeyCreateParams | ApiKeyUpdateParams) -> dict[str, Any]:
    return params.model_dump(mode="json", exclude_unset=True)


class ApiKeys:
    """API key calls for a sync endpoint."""

    def __init__(self, endpoint: VerdocsEndpoint) -> None:
        self._endpoint = endpoint

    def list(self) -> list[ApiKey]:
        """Get the API keys for the caller's organization via GET /v2/api-keys.

        Secrets are never included in the list; they are only shown by
        create() and rotate(). Mirrors js-sdk getApiKeys.

        Returns:
            The organization's API keys, each with its profile joined.

        Raises:
            AuthenticationError: The endpoint has no valid user session.
            VerdocsAPIError: The API returned another non-2xx status.
            VerdocsConnectionError: The request never reached the API.

        @sdkOperation apiKey.getApiKeys
        @sdkGroup ApiKey
        @sdkPage Endpoints
        """
        response = self._endpoint._request("GET", _API_KEYS_PATH)
        return [ApiKey.model_validate(entry) for entry in response.json()]

    def create(self, params: ApiKeyCreateParams) -> ApiKey:
        """Create an API key via POST /v2/api-keys. Mirrors js-sdk createApiKey.

        Example:
            key = endpoint.api_keys.create(ApiKeyCreateParams(name="CI", profile_id="profile-1"))
            client_secret = key.client_secret  # only shown here and on rotate

        Args:
            params: Name and acting profile for the new key, plus global_admin
                to give it full access to the organization.

        Returns:
            The new API key, including its client_secret. Store the secret;
            it is not returned by list().

        Raises:
            NotFoundError: The profile does not exist in the caller's organization.
            VerdocsAPIError: The API returned another non-2xx status.
            VerdocsConnectionError: The request never reached the API.

        @sdkOperation apiKey.createApiKey
        @sdkGroup ApiKey
        @sdkPage Endpoints
        """
        response = self._endpoint._request("POST", _API_KEYS_PATH, json=_write_body(params))
        return ApiKey.model_validate(response.json())

    def rotate(self, client_id: str) -> ApiKey:
        """Rotate an API key's secret via POST /v2/api-keys/{client_id}/rotate.

        Existing server-to-server sessions keep working, so rotation is safe
        to do at any time. Mirrors js-sdk rotateApiKey.

        Args:
            client_id: The client ID of the key to rotate.

        Returns:
            The key with its new client_secret.

        Raises:
            NotFoundError: No such key in the caller's organization.
            VerdocsAPIError: The API returned another non-2xx status.
            VerdocsConnectionError: The request never reached the API.

        @sdkOperation apiKey.rotateApiKey
        @sdkGroup ApiKey
        @sdkPage Endpoints
        """
        response = self._endpoint._request("POST", f"{_API_KEYS_PATH}/{client_id}/rotate")
        return ApiKey.model_validate(response.json())

    def update(self, client_id: str, params: ApiKeyUpdateParams) -> ApiKey:
        """Update an API key's name, acting profile, or global_admin flag via PATCH /v2/api-keys/{client_id}.

        Mirrors js-sdk updateApiKey.

        Args:
            client_id: The client ID of the key to update.
            params: The fields to change.

        Returns:
            The updated key. The secret is not included.

        Raises:
            NotFoundError: No such key in the caller's organization.
            VerdocsAPIError: The API returned another non-2xx status.
            VerdocsConnectionError: The request never reached the API.

        @sdkOperation apiKey.updateApiKey
        @sdkGroup ApiKey
        @sdkPage Endpoints
        """
        response = self._endpoint._request("PATCH", f"{_API_KEYS_PATH}/{client_id}", json=_write_body(params))
        return ApiKey.model_validate(response.json())

    def delete(self, client_id: str) -> None:
        """Delete an API key via DELETE /v2/api-keys/{client_id}. Mirrors js-sdk deleteApiKey.

        The API answers with a status marker that nothing consumes, so this
        returns None and relies on exceptions for failure. Deleting an
        unknown key is a silent no-op server-side.

        Args:
            client_id: The client ID of the key to delete.

        Raises:
            VerdocsAPIError: The API returned a non-2xx status.
            VerdocsConnectionError: The request never reached the API.

        @sdkOperation apiKey.deleteApiKey
        @sdkGroup ApiKey
        @sdkPage Endpoints
        """
        self._endpoint._request("DELETE", f"{_API_KEYS_PATH}/{client_id}")


class AsyncApiKeys:
    """API key calls for an async endpoint."""

    def __init__(self, endpoint: AsyncVerdocsEndpoint) -> None:
        self._endpoint = endpoint

    async def list(self) -> list[ApiKey]:
        """Get the API keys for the caller's organization via GET /v2/api-keys.

        Secrets are never included in the list; they are only shown by
        create() and rotate(). Mirrors js-sdk getApiKeys.

        Returns:
            The organization's API keys, each with its profile joined.

        Raises:
            AuthenticationError: The endpoint has no valid user session.
            VerdocsAPIError: The API returned another non-2xx status.
            VerdocsConnectionError: The request never reached the API.
        """
        response = await self._endpoint._request("GET", _API_KEYS_PATH)
        return [ApiKey.model_validate(entry) for entry in response.json()]

    async def create(self, params: ApiKeyCreateParams) -> ApiKey:
        """Create an API key via POST /v2/api-keys. Mirrors js-sdk createApiKey.

        Example:
            key = await endpoint.api_keys.create(ApiKeyCreateParams(name="CI", profile_id="profile-1"))
            client_secret = key.client_secret  # only shown here and on rotate

        Args:
            params: Name and acting profile for the new key, plus global_admin
                to give it full access to the organization.

        Returns:
            The new API key, including its client_secret. Store the secret;
            it is not returned by list().

        Raises:
            NotFoundError: The profile does not exist in the caller's organization.
            VerdocsAPIError: The API returned another non-2xx status.
            VerdocsConnectionError: The request never reached the API.
        """
        response = await self._endpoint._request("POST", _API_KEYS_PATH, json=_write_body(params))
        return ApiKey.model_validate(response.json())

    async def rotate(self, client_id: str) -> ApiKey:
        """Rotate an API key's secret via POST /v2/api-keys/{client_id}/rotate.

        Existing server-to-server sessions keep working, so rotation is safe
        to do at any time. Mirrors js-sdk rotateApiKey.

        Args:
            client_id: The client ID of the key to rotate.

        Returns:
            The key with its new client_secret.

        Raises:
            NotFoundError: No such key in the caller's organization.
            VerdocsAPIError: The API returned another non-2xx status.
            VerdocsConnectionError: The request never reached the API.
        """
        response = await self._endpoint._request("POST", f"{_API_KEYS_PATH}/{client_id}/rotate")
        return ApiKey.model_validate(response.json())

    async def update(self, client_id: str, params: ApiKeyUpdateParams) -> ApiKey:
        """Update an API key's name, acting profile, or global_admin flag via PATCH /v2/api-keys/{client_id}.

        Mirrors js-sdk updateApiKey.

        Args:
            client_id: The client ID of the key to update.
            params: The fields to change.

        Returns:
            The updated key. The secret is not included.

        Raises:
            NotFoundError: No such key in the caller's organization.
            VerdocsAPIError: The API returned another non-2xx status.
            VerdocsConnectionError: The request never reached the API.
        """
        response = await self._endpoint._request("PATCH", f"{_API_KEYS_PATH}/{client_id}", json=_write_body(params))
        return ApiKey.model_validate(response.json())

    async def delete(self, client_id: str) -> None:
        """Delete an API key via DELETE /v2/api-keys/{client_id}. Mirrors js-sdk deleteApiKey.

        The API answers with a status marker that nothing consumes, so this
        returns None and relies on exceptions for failure. Deleting an
        unknown key is a silent no-op server-side.

        Args:
            client_id: The client ID of the key to delete.

        Raises:
            VerdocsAPIError: The API returned a non-2xx status.
            VerdocsConnectionError: The request never reached the API.
        """
        await self._endpoint._request("DELETE", f"{_API_KEYS_PATH}/{client_id}")
