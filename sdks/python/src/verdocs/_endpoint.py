"""The endpoint classes: one connection and authorization context per session.

An endpoint wraps a single httpx client (created once and reused, so every
request shares the connection pool) plus the session state for either a user
or a signing session. Apps run a user endpoint and a signing endpoint side by
side, exactly like the js-sdk's VerdocsEndpoint. Session state lives on the
instance, never at module level.

Differences from the js-sdk, on purpose:
  - The fluent setters (setBaseURL, setTimeout, setClientID, setEnvironment)
    are constructor arguments; endpoints are cheap, so make a new one.
  - No localStorage persistence, session-changed listeners, or global default
    endpoint; those are browser-app concerns.
  - set_token() does not fetch the caller's profile in the background. Call
    endpoint.profiles.current() when you want it; the async client could not
    await inside set_token() anyway.
"""

from __future__ import annotations

import time
from types import TracebackType
from typing import Any, Literal

import httpx
from pydantic import ValidationError

from ._token import decode_token_body
from .errors import VerdocsConnectionError, api_error_from_response
from .models import SigningSession, UserSession
from .resources import (
    KBA,
    ApiKeys,
    AsyncApiKeys,
    AsyncAuth,
    AsyncBrands,
    AsyncContacts,
    AsyncEnvelopes,
    AsyncGroups,
    AsyncInitials,
    AsyncInvitations,
    AsyncKBA,
    AsyncMembers,
    AsyncNotificationTemplates,
    AsyncOrganizations,
    AsyncProfiles,
    AsyncRecipients,
    AsyncSignatures,
    AsyncTemplateDocuments,
    AsyncTemplateFields,
    AsyncTemplateRoles,
    AsyncTemplates,
    AsyncUsers,
    AsyncWebhooks,
    Auth,
    Brands,
    Contacts,
    Envelopes,
    Groups,
    Initials,
    Invitations,
    Members,
    NotificationTemplates,
    Organizations,
    Profiles,
    Recipients,
    Signatures,
    TemplateDocuments,
    TemplateFields,
    TemplateRoles,
    Templates,
    Users,
    Webhooks,
)

SessionType = Literal["user", "signing"]
Session = UserSession | SigningSession

DEFAULT_BASE_URL = "https://api.verdocs.com"
DEFAULT_TIMEOUT = 60.0

# Older tokens carry the session type under a namespaced claim; current ones
# use the bare name. We accept either.
_LEGACY_SESSION_TYPE_CLAIM = "https://verdocs.com/session_type"


class _EndpointState:
    """Session state and auth-header handling shared by the sync and async endpoints.

    Only bookkeeping lives here; each endpoint class owns its httpx client and
    request path so the sync and async surfaces stay real, not shims.
    """

    _client: httpx.Client | httpx.AsyncClient

    def __init__(self, *, base_url: str, timeout: float, session_type: SessionType, client_id: str | None) -> None:
        self._base_url = base_url
        self._timeout = timeout
        self._session_type: SessionType = session_type
        self._client_id = client_id
        self._token: str | None = None
        # The decoded claims of the active token, or None when signed out.
        self.session: Session | None = None
        # The authenticated user's user_id (not profile_id), from the token's sub claim.
        self.sub: str | None = None

    def _default_headers(self) -> dict[str, str]:
        return {"X-Client-ID": self._client_id} if self._client_id else {}

    @property
    def base_url(self) -> str:
        """The API origin this endpoint talks to."""
        return self._base_url

    @property
    def timeout(self) -> float:
        """Request timeout in seconds."""
        return self._timeout

    @property
    def session_type(self) -> SessionType:
        """Whether this endpoint currently holds a user or a signing session."""
        return self._session_type

    @property
    def token(self) -> str | None:
        """The raw access token, if a session is active.

        Tokens should rarely be handled directly, but some flows (raw PDF
        downloads, the conformance harness) need the bearer value.
        """
        return self._token

    def set_token(self, token: str | None, session_type: SessionType | None = None) -> None:
        """Attach an access token and make its claims the session state.

        A malformed or expired token clears the session instead of raising,
        mirroring the js-sdk; check endpoint.session afterwards if you need to
        confirm the token was accepted.

        Args:
            token: The access token, or None to sign out.
            session_type: Force "user" or "signing". Leave unset to trust the
                token's own session_type claim, falling back to the endpoint's
                configured type.
        """
        if token is None:
            self.clear_session()
            return

        claims = decode_token_body(token)
        if claims is None:
            self.clear_session()
            return

        exp = claims.get("exp")
        if isinstance(exp, (int, float)) and exp < time.time():
            self.clear_session()
            return

        if session_type is None:
            claim_type = claims.get("session_type") or claims.get(_LEGACY_SESSION_TYPE_CLAIM)
            session_type = claim_type if claim_type in ("user", "signing") else self._session_type

        try:
            session: Session = (
                UserSession.model_validate(claims) if session_type == "user" else SigningSession.model_validate(claims)
            )
        except ValidationError:
            # Claims of the wrong shape get the same treatment as an undecodable token.
            self.clear_session()
            return

        self._session_type = session_type
        self._token = token
        self.session = session
        sub = claims.get("sub")
        self.sub = sub if isinstance(sub, str) else None

        if session_type == "user":
            self._client.headers["Authorization"] = f"Bearer {token}"
            self._client.headers.pop("signer", None)
        else:
            # Signing sessions authorize through the legacy "signer" header
            # instead of Authorization; deployed endpoints still expect it
            # there, so we mirror the js-sdk until the server side moves.
            self._client.headers["signer"] = f"Bearer {token}"
            self._client.headers.pop("Authorization", None)

    def clear_session(self) -> None:
        """Drop the active session: token, decoded claims, and auth headers."""
        self._client.headers.pop("Authorization", None)
        self._client.headers.pop("signer", None)
        self._token = None
        self.session = None
        self.sub = None


class VerdocsEndpoint(_EndpointState):
    """A synchronous connection and authorization context for the Verdocs API.

    Create one endpoint per session context. Ephemeral signing sessions get
    their own endpoint, used for the signing calls and then discarded, while a
    user endpoint carries on independently.

    Example:
        from verdocs import VerdocsEndpoint

        with VerdocsEndpoint() as endpoint:
            tokens = endpoint.auth.authenticate(username="test@example.com", password="secret")
            endpoint.set_token(tokens.access_token)
            page = endpoint.templates.list()
    """

    def __init__(
        self,
        *,
        base_url: str = DEFAULT_BASE_URL,
        timeout: float = DEFAULT_TIMEOUT,
        session_type: SessionType = "user",
        client_id: str | None = None,
    ) -> None:
        """Create a new endpoint.

        Args:
            base_url: API origin. Change this only when directed by Verdocs
                Customer Solutions Engineering (or to target beta).
            timeout: Request timeout in seconds. Some rendering calls take a
                while, so very short timeouts are not recommended.
            session_type: "user" (default) or "signing". Used when a token
                does not declare its own session type.
            client_id: Optional client ID sent as X-Client-ID on every request.
        """
        super().__init__(base_url=base_url, timeout=timeout, session_type=session_type, client_id=client_id)
        self._client = httpx.Client(base_url=base_url, timeout=timeout, headers=self._default_headers())
        self.auth = Auth(self)
        self.users = Users(self)
        self.profiles = Profiles(self)
        self.templates = Templates(self)
        self.template_documents = TemplateDocuments(self)
        self.template_roles = TemplateRoles(self)
        self.template_fields = TemplateFields(self)
        self.envelopes = Envelopes(self)
        self.recipients = Recipients(self)
        self.kba = KBA(self)
        self.signatures = Signatures(self)
        self.initials = Initials(self)
        self.organizations = Organizations(self)
        self.members = Members(self)
        self.groups = Groups(self)
        self.invitations = Invitations(self)
        self.contacts = Contacts(self)
        self.api_keys = ApiKeys(self)
        self.brands = Brands(self)
        self.webhooks = Webhooks(self)
        self.notification_templates = NotificationTemplates(self)

    def _request(
        self, method: str, path: str, *, params: dict[str, Any] | None = None, json: Any = None
    ) -> httpx.Response:
        try:
            response = self._client.request(method, path, params=params, json=json)
        except httpx.TransportError as exc:
            raise VerdocsConnectionError(f"{method} {path} failed: {exc}") from exc

        if response.status_code >= 400:
            raise api_error_from_response(response)

        return response

    def close(self) -> None:
        """Close the underlying HTTP client. Whoever creates an endpoint owns closing it."""
        self._client.close()

    def __enter__(self) -> VerdocsEndpoint:
        return self

    def __exit__(
        self,
        exc_type: type[BaseException] | None,
        exc_value: BaseException | None,
        traceback: TracebackType | None,
    ) -> None:
        self.close()


class AsyncVerdocsEndpoint(_EndpointState):
    """An asynchronous connection and authorization context for the Verdocs API.

    Method-for-method twin of VerdocsEndpoint; only the awaits differ.

    Example:
        from verdocs import AsyncVerdocsEndpoint

        async with AsyncVerdocsEndpoint(session_type="signing") as endpoint:
            endpoint.set_token(signing_token)
    """

    def __init__(
        self,
        *,
        base_url: str = DEFAULT_BASE_URL,
        timeout: float = DEFAULT_TIMEOUT,
        session_type: SessionType = "user",
        client_id: str | None = None,
    ) -> None:
        """Create a new async endpoint.

        Args:
            base_url: API origin. Change this only when directed by Verdocs
                Customer Solutions Engineering (or to target beta).
            timeout: Request timeout in seconds. Some rendering calls take a
                while, so very short timeouts are not recommended.
            session_type: "user" (default) or "signing". Used when a token
                does not declare its own session type.
            client_id: Optional client ID sent as X-Client-ID on every request.
        """
        super().__init__(base_url=base_url, timeout=timeout, session_type=session_type, client_id=client_id)
        self._client = httpx.AsyncClient(base_url=base_url, timeout=timeout, headers=self._default_headers())
        self.auth = AsyncAuth(self)
        self.users = AsyncUsers(self)
        self.profiles = AsyncProfiles(self)
        self.templates = AsyncTemplates(self)
        self.template_documents = AsyncTemplateDocuments(self)
        self.template_roles = AsyncTemplateRoles(self)
        self.template_fields = AsyncTemplateFields(self)
        self.envelopes = AsyncEnvelopes(self)
        self.recipients = AsyncRecipients(self)
        self.kba = AsyncKBA(self)
        self.signatures = AsyncSignatures(self)
        self.initials = AsyncInitials(self)
        self.organizations = AsyncOrganizations(self)
        self.members = AsyncMembers(self)
        self.groups = AsyncGroups(self)
        self.invitations = AsyncInvitations(self)
        self.contacts = AsyncContacts(self)
        self.api_keys = AsyncApiKeys(self)
        self.brands = AsyncBrands(self)
        self.webhooks = AsyncWebhooks(self)
        self.notification_templates = AsyncNotificationTemplates(self)

    async def _request(
        self, method: str, path: str, *, params: dict[str, Any] | None = None, json: Any = None
    ) -> httpx.Response:
        try:
            response = await self._client.request(method, path, params=params, json=json)
        except httpx.TransportError as exc:
            raise VerdocsConnectionError(f"{method} {path} failed: {exc}") from exc

        if response.status_code >= 400:
            raise api_error_from_response(response)

        return response

    async def aclose(self) -> None:
        """Close the underlying HTTP client. Whoever creates an endpoint owns closing it."""
        await self._client.aclose()

    async def __aenter__(self) -> AsyncVerdocsEndpoint:
        return self

    async def __aexit__(
        self,
        exc_type: type[BaseException] | None,
        exc_value: BaseException | None,
        traceback: TracebackType | None,
    ) -> None:
        await self.aclose()
