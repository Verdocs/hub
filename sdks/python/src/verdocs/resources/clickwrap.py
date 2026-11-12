"""Clickwrap operations (js-sdk: Clickwrap module).

Admin calls (agreements, drafts, publishing, coverage, status, sessions, and
records) need an admin profile or API key and the clickwrap entitlement. The
four session calls (get_session, send_event, accept, decline) instead take the
session token from create_session and run in the person's browser context.
"""

from __future__ import annotations

from typing import TYPE_CHECKING, Any

from ..models.clickwrap import (
    ClickwrapAcceptance,
    ClickwrapAcceptanceList,
    ClickwrapAcceptanceListParams,
    ClickwrapAgreement,
    ClickwrapAgreementCreateParams,
    ClickwrapAgreementDetail,
    ClickwrapAgreementSummary,
    ClickwrapCoverage,
    ClickwrapDownloadLink,
    ClickwrapDownloadType,
    ClickwrapDraftCreateParams,
    ClickwrapEventParams,
    ClickwrapOutcomeRecordParams,
    ClickwrapOutcomeResult,
    ClickwrapPublicSession,
    ClickwrapPublishParams,
    ClickwrapSessionCreated,
    ClickwrapSessionCreateParams,
    ClickwrapSessionCurrent,
    ClickwrapSessionOutcomeParams,
    ClickwrapStatus,
    ClickwrapVersion,
)
from ..models.core import VerdocsModel

if TYPE_CHECKING:
    from .._endpoint import AsyncVerdocsEndpoint, VerdocsEndpoint

_PATH = "/v2/clickwraps"


def _body(params: VerdocsModel) -> dict[str, Any]:
    return params.model_dump(mode="json", exclude_none=True)


# Session tokens aren't JWTs, so set_token() can't hold them, and they shouldn't
# replace whatever session the endpoint already has. We send one per request.
def _session_headers(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}


def _status_query(user_id: str, agreements: list[str]) -> dict[str, str]:
    return {"user_id": user_id, "agreements": ",".join(agreements)}


def _session_result(payload: dict[str, Any]) -> ClickwrapSessionCurrent | ClickwrapSessionCreated:
    if payload.get("current"):
        return ClickwrapSessionCurrent.model_validate(payload)
    return ClickwrapSessionCreated.model_validate(payload)


class Clickwrap:
    """Clickwrap calls for a sync endpoint."""

    def __init__(self, endpoint: VerdocsEndpoint) -> None:
        self._endpoint = endpoint

    def list_agreements(self) -> list[ClickwrapAgreementSummary]:
        """List the organization's agreements via GET /v2/clickwraps/agreements.

        Each comes with its current (latest published) version and its open
        draft. Mirrors js-sdk getClickwrapAgreements.

        Returns:
            The agreements, oldest first.

        Raises:
            VerdocsAPIError: The API returned a non-2xx status.
            VerdocsConnectionError: The request never reached the API.

        @sdkOperation clickwrap.getClickwrapAgreements
        @sdkGroup Clickwrap
        @sdkPage Endpoints
        """
        response = self._endpoint._request("GET", f"{_PATH}/agreements")
        return [ClickwrapAgreementSummary.model_validate(item) for item in response.json()["agreements"]]

    def get_agreement(self, agreement_id: str) -> ClickwrapAgreementDetail:
        """Get one agreement with every version via GET /v2/clickwraps/agreements/{agreement_id}.

        Versions come newest first, each with its full text. Mirrors js-sdk
        getClickwrapAgreement.

        Args:
            agreement_id: The agreement to get.

        Returns:
            The agreement with its versions.

        Raises:
            NotFoundError: No such agreement in the organization.
            VerdocsAPIError: The API returned another non-2xx status.
            VerdocsConnectionError: The request never reached the API.

        @sdkOperation clickwrap.getClickwrapAgreement
        @sdkGroup Clickwrap
        @sdkPage Endpoints
        """
        response = self._endpoint._request("GET", f"{_PATH}/agreements/{agreement_id}")
        return ClickwrapAgreementDetail.model_validate(response.json()["agreement"])

    def create_agreement(self, params: ClickwrapAgreementCreateParams) -> ClickwrapAgreement:
        """Create an agreement via POST /v2/clickwraps/agreements.

        It starts with no versions. The key can never change, because
        developers put it in their code. Mirrors js-sdk createClickwrapAgreement.

        Example:
            agreement = endpoint.clickwrap.create_agreement(
                ClickwrapAgreementCreateParams(key="terms-of-service", name="Terms of Service")
            )

        Args:
            params: The agreement's key and name.

        Returns:
            The new agreement.

        Raises:
            VerdocsAPIError: The API rejected the request, for example a duplicate key.
            VerdocsConnectionError: The request never reached the API.

        @sdkOperation clickwrap.createClickwrapAgreement
        @sdkGroup Clickwrap
        @sdkPage Endpoints
        """
        response = self._endpoint._request("POST", f"{_PATH}/agreements", json=_body(params))
        return ClickwrapAgreement.model_validate(response.json()["agreement"])

    def rename_agreement(self, agreement_id: str, name: str) -> ClickwrapAgreement:
        """Rename an agreement via PATCH /v2/clickwraps/agreements/{agreement_id}.

        Its key never changes. Mirrors js-sdk renameClickwrapAgreement.

        Args:
            agreement_id: The agreement to rename.
            name: The new name.

        Returns:
            The renamed agreement.

        Raises:
            NotFoundError: No such agreement in the organization.
            VerdocsAPIError: The API returned another non-2xx status.
            VerdocsConnectionError: The request never reached the API.

        @sdkOperation clickwrap.renameClickwrapAgreement
        @sdkGroup Clickwrap
        @sdkPage Endpoints
        """
        response = self._endpoint._request("PATCH", f"{_PATH}/agreements/{agreement_id}", json={"name": name})
        return ClickwrapAgreement.model_validate(response.json()["agreement"])

    def create_draft(self, agreement_id: str, params: ClickwrapDraftCreateParams | None = None) -> ClickwrapVersion:
        """Start a draft version via POST /v2/clickwraps/agreements/{agreement_id}/versions.

        The draft is empty, holds the given text, or copies the current
        version. An agreement has at most one draft. Mirrors js-sdk
        createClickwrapDraft.

        Example:
            draft = endpoint.clickwrap.create_draft(agreement_id, ClickwrapDraftCreateParams(copy_current=True))

        Args:
            agreement_id: The agreement to add the draft to.
            params: The text or copy_current. Omit for an empty draft.

        Returns:
            The new draft.

        Raises:
            VerdocsAPIError: The API rejected the request, for example an existing draft.
            VerdocsConnectionError: The request never reached the API.

        @sdkOperation clickwrap.createClickwrapDraft
        @sdkGroup Clickwrap
        @sdkPage Endpoints
        """
        body = _body(params) if params else {}
        response = self._endpoint._request("POST", f"{_PATH}/agreements/{agreement_id}/versions", json=body)
        return ClickwrapVersion.model_validate(response.json()["version"])

    def update_draft(self, version_id: str, content: str) -> ClickwrapVersion:
        """Replace a draft's text via PATCH /v2/clickwraps/versions/{version_id}.

        Only drafts can be edited. Mirrors js-sdk updateClickwrapDraft.

        Args:
            version_id: The draft to edit.
            content: The agreement text as HTML, sanitized on save.

        Returns:
            The updated draft.

        Raises:
            VerdocsAPIError: The API rejected the request, for example a published version.
            VerdocsConnectionError: The request never reached the API.

        @sdkOperation clickwrap.updateClickwrapDraft
        @sdkGroup Clickwrap
        @sdkPage Endpoints
        """
        response = self._endpoint._request("PATCH", f"{_PATH}/versions/{version_id}", json={"content": content})
        return ClickwrapVersion.model_validate(response.json()["version"])

    def delete_draft(self, version_id: str) -> None:
        """Delete a draft via DELETE /v2/clickwraps/versions/{version_id}.

        Published versions can never be deleted. Mirrors js-sdk
        deleteClickwrapDraft.

        Args:
            version_id: The draft to delete.

        Raises:
            VerdocsAPIError: The API rejected the request, for example a published version.
            VerdocsConnectionError: The request never reached the API.

        @sdkOperation clickwrap.deleteClickwrapDraft
        @sdkGroup Clickwrap
        @sdkPage Endpoints
        """
        self._endpoint._request("DELETE", f"{_PATH}/versions/{version_id}")

    def publish_version(self, version_id: str, params: ClickwrapPublishParams) -> ClickwrapVersion:
        """Publish a draft via POST /v2/clickwraps/versions/{version_id}/publish.

        This can't be undone: the text is hashed and frozen. With
        requires_reacceptance, everyone who accepted an earlier version must
        accept again. Mirrors js-sdk publishClickwrapVersion.

        Example:
            endpoint.clickwrap.publish_version(version_id, ClickwrapPublishParams(requires_reacceptance=True))

        Args:
            version_id: The draft to publish.
            params: Whether re-acceptance is required, and an optional change summary.

        Returns:
            The published version.

        Raises:
            VerdocsAPIError: The API rejected the request, for example an empty draft.
            VerdocsConnectionError: The request never reached the API.

        @sdkOperation clickwrap.publishClickwrapVersion
        @sdkGroup Clickwrap
        @sdkPage Endpoints
        """
        response = self._endpoint._request("POST", f"{_PATH}/versions/{version_id}/publish", json=_body(params))
        return ClickwrapVersion.model_validate(response.json()["version"])

    def get_coverage(self, agreement_id: str) -> ClickwrapCoverage:
        """Count who has accepted an agreement via GET /v2/clickwraps/agreements/{agreement_id}/coverage.

        Counts distinct people, not clicks. Mirrors js-sdk getClickwrapCoverage.

        Args:
            agreement_id: The agreement to count.

        Returns:
            The counts overall and per published version.

        Raises:
            NotFoundError: No such agreement in the organization.
            VerdocsAPIError: The API returned another non-2xx status.
            VerdocsConnectionError: The request never reached the API.

        @sdkOperation clickwrap.getClickwrapCoverage
        @sdkGroup Clickwrap
        @sdkPage Endpoints
        """
        response = self._endpoint._request("GET", f"{_PATH}/agreements/{agreement_id}/coverage")
        return ClickwrapCoverage.model_validate(response.json())

    def get_status(self, user_id: str, agreements: list[str]) -> list[ClickwrapStatus]:
        """Check whether one person is current on each agreement via GET /v2/clickwraps/status.

        Current means they accepted a published version at or after the
        newest one that requires re-acceptance. Declines never make anyone
        current. Mirrors js-sdk getClickwrapStatus.

        Example:
            status = endpoint.clickwrap.get_status("user-123", ["terms-of-service"])
            needs_terms = any(not entry.current for entry in status)

        Args:
            user_id: The person's ID in your own system.
            agreements: The agreement keys to check, up to 20.

        Returns:
            One entry per agreement.

        Raises:
            VerdocsAPIError: The API rejected the request, for example an unknown key.
            VerdocsConnectionError: The request never reached the API.

        @sdkOperation clickwrap.getClickwrapStatus
        @sdkGroup Clickwrap
        @sdkPage Endpoints
        """
        response = self._endpoint._request("GET", f"{_PATH}/status", params=_status_query(user_id, agreements))
        return [ClickwrapStatus.model_validate(item) for item in response.json()]

    def create_session(self, params: ClickwrapSessionCreateParams) -> ClickwrapSessionCurrent | ClickwrapSessionCreated:
        """Start an acceptance session for one person via POST /v2/clickwraps/session.

        When the person is already current, the answer is a
        ClickwrapSessionCurrent with no token and nothing to show. Otherwise
        it's a ClickwrapSessionCreated carrying the session token for the
        component (or a hosted_url) that expires in an hour. Mirrors js-sdk
        createClickwrapSession.

        Example:
            session = endpoint.clickwrap.create_session(
                ClickwrapSessionCreateParams(user_id="user-123", agreements=["terms-of-service"])
            )
            if not session.current:
                token = session.token  # hand it to the browser

        Args:
            params: The person, the agreement keys, and how to show them.

        Returns:
            The session, or the person's status when there's nothing to accept.

        Raises:
            VerdocsAPIError: The API rejected the request, for example an unknown key.
            VerdocsConnectionError: The request never reached the API.

        @sdkOperation clickwrap.createClickwrapSession
        @sdkGroup Clickwrap
        @sdkPage Endpoints
        """
        response = self._endpoint._request("POST", f"{_PATH}/session", json=_body(params))
        return _session_result(response.json())

    def record_outcome(self, params: ClickwrapOutcomeRecordParams) -> ClickwrapOutcomeResult:
        """Record an outcome from your own interface via POST /v2/clickwraps/acceptances.

        The IP address and user agent are kept as your report, and a
        presentation is stored as you sent it. Mirrors js-sdk
        recordClickwrapOutcome.

        Example:
            result = endpoint.clickwrap.record_outcome(
                ClickwrapOutcomeRecordParams(
                    user_id="user-123",
                    outcome="accepted",
                    agreements=[ClickwrapOutcomeAgreement(key="terms-of-service", version_id=version_id)],
                )
            )

        Args:
            params: Who, what they did, and which versions they saw.

        Returns:
            The new record.

        Raises:
            VerdocsAPIError: The API rejected the request, for example an unpublished version.
            VerdocsConnectionError: The request never reached the API.

        @sdkOperation clickwrap.recordClickwrapOutcome
        @sdkGroup Clickwrap
        @sdkPage Endpoints
        """
        response = self._endpoint._request("POST", f"{_PATH}/acceptances", json=_body(params))
        return ClickwrapOutcomeResult.model_validate(response.json())

    def list_acceptances(self, params: ClickwrapAcceptanceListParams) -> ClickwrapAcceptanceList:
        """Find records, newest first, via GET /v2/clickwraps/acceptances.

        Search by user_id, or by one metadata key and value. Mirrors js-sdk
        getClickwrapAcceptances.

        Args:
            params: The search and paging.

        Returns:
            One page of record summaries.

        Raises:
            VerdocsAPIError: The API rejected the request, for example no search given.
            VerdocsConnectionError: The request never reached the API.

        @sdkOperation clickwrap.getClickwrapAcceptances
        @sdkGroup Clickwrap
        @sdkPage Endpoints
        """
        response = self._endpoint._request("GET", f"{_PATH}/acceptances", params=_body(params))
        return ClickwrapAcceptanceList.model_validate(response.json())

    def get_acceptance(self, acceptance_id: str) -> ClickwrapAcceptance:
        """Get one record via GET /v2/clickwraps/acceptances/{acceptance_id}.

        Includes the agreement versions, how it happened, the labels shown,
        and the event trail. Mirrors js-sdk getClickwrapAcceptance.

        Args:
            acceptance_id: The record to get.

        Returns:
            The record.

        Raises:
            NotFoundError: No such record in the organization.
            VerdocsAPIError: The API returned another non-2xx status.
            VerdocsConnectionError: The request never reached the API.

        @sdkOperation clickwrap.getClickwrapAcceptance
        @sdkGroup Clickwrap
        @sdkPage Endpoints
        """
        response = self._endpoint._request("GET", f"{_PATH}/acceptances/{acceptance_id}")
        return ClickwrapAcceptance.model_validate(response.json())

    def get_download_link(self, acceptance_id: str, type: ClickwrapDownloadType) -> ClickwrapDownloadLink:
        """Get a 15-minute link to one of a record's files via GET /v2/clickwraps/acceptances/{acceptance_id}/download.

        certificate is the signed PDF, replay a picture of what was on screen
        (only when has_presentation is true), and evidence a ZIP with
        everything needed to check the record. The first request for a file
        can take several seconds. Mirrors js-sdk getClickwrapDownloadLink.

        Example:
            link = endpoint.clickwrap.get_download_link(acceptance_id, "evidence")

        Args:
            acceptance_id: The record to download from.
            type: Which file to link to.

        Returns:
            The link and how long it works.

        Raises:
            NotFoundError: No such record, or no presentation for a replay.
            VerdocsAPIError: The API returned another non-2xx status.
            VerdocsConnectionError: The request never reached the API.

        @sdkOperation clickwrap.getClickwrapDownloadLink
        @sdkGroup Clickwrap
        @sdkPage Endpoints
        """
        response = self._endpoint._request(
            "GET", f"{_PATH}/acceptances/{acceptance_id}/download", params={"type": type}
        )
        return ClickwrapDownloadLink.model_validate(response.json())

    def get_session(self, token: str) -> ClickwrapPublicSession:
        """Get what a session shows via GET /v2/clickwraps/session, using its session token.

        Mirrors js-sdk getClickwrapSession.

        Args:
            token: The session token from create_session.

        Returns:
            The session's agreements, mode, and brand.

        Raises:
            AuthenticationError: The token is invalid, expired, or already used.
            VerdocsAPIError: The API returned another non-2xx status.
            VerdocsConnectionError: The request never reached the API.

        @sdkOperation clickwrap.getClickwrapSession
        @sdkGroup Clickwrap
        @sdkPage Endpoints
        """
        response = self._endpoint._request("GET", f"{_PATH}/session", headers=_session_headers(token))
        return ClickwrapPublicSession.model_validate(response.json())

    def send_event(self, token: str, params: ClickwrapEventParams) -> None:
        """Report what the person did while reading via POST /v2/clickwraps/session/events.

        The events become the record's trail when the person accepts or
        declines. Mirrors js-sdk sendClickwrapEvent.

        Args:
            token: The session token from create_session.
            params: The event, and the checkbox's version_id for checked and unchecked.

        Raises:
            VerdocsAPIError: The API rejected the event.
            VerdocsConnectionError: The request never reached the API.

        @sdkOperation clickwrap.sendClickwrapEvent
        @sdkGroup Clickwrap
        @sdkPage Endpoints
        """
        self._endpoint._request("POST", f"{_PATH}/session/events", json=_body(params), headers=_session_headers(token))

    def accept(self, token: str, params: ClickwrapSessionOutcomeParams) -> ClickwrapOutcomeResult:
        """Record that the person accepted the session's agreements via POST /v2/clickwraps/session/accept.

        The presentation's text must contain each version's text and every
        label, or the call is refused. Mirrors js-sdk acceptClickwrap.

        Args:
            token: The session token from create_session.
            params: The surface, labels, and rendered presentation.

        Returns:
            The new record.

        Raises:
            VerdocsAPIError: The API rejected the request.
            VerdocsConnectionError: The request never reached the API.

        @sdkOperation clickwrap.acceptClickwrap
        @sdkGroup Clickwrap
        @sdkPage Endpoints
        """
        response = self._endpoint._request(
            "POST", f"{_PATH}/session/accept", json=_body(params), headers=_session_headers(token)
        )
        return ClickwrapOutcomeResult.model_validate(response.json())

    def decline(self, token: str, params: ClickwrapSessionOutcomeParams) -> ClickwrapOutcomeResult:
        """Record that the person declined the session's agreements via POST /v2/clickwraps/session/decline.

        Takes the same fields as accept(). Mirrors js-sdk declineClickwrap.

        Args:
            token: The session token from create_session.
            params: The surface, labels, and rendered presentation.

        Returns:
            The new record.

        Raises:
            VerdocsAPIError: The API rejected the request.
            VerdocsConnectionError: The request never reached the API.

        @sdkOperation clickwrap.declineClickwrap
        @sdkGroup Clickwrap
        @sdkPage Endpoints
        """
        response = self._endpoint._request(
            "POST", f"{_PATH}/session/decline", json=_body(params), headers=_session_headers(token)
        )
        return ClickwrapOutcomeResult.model_validate(response.json())


class AsyncClickwrap:
    """Clickwrap calls for an async endpoint. Each method matches its Clickwrap twin."""

    def __init__(self, endpoint: AsyncVerdocsEndpoint) -> None:
        self._endpoint = endpoint

    async def list_agreements(self) -> list[ClickwrapAgreementSummary]:
        """List the organization's agreements via GET /v2/clickwraps/agreements.

        Returns:
            The agreements, oldest first.

        @sdkOperation clickwrap.getClickwrapAgreements
        @sdkGroup Clickwrap
        @sdkPage Endpoints
        """
        response = await self._endpoint._request("GET", f"{_PATH}/agreements")
        return [ClickwrapAgreementSummary.model_validate(item) for item in response.json()["agreements"]]

    async def get_agreement(self, agreement_id: str) -> ClickwrapAgreementDetail:
        """Get one agreement with every version via GET /v2/clickwraps/agreements/{agreement_id}.

        Args:
            agreement_id: The agreement to get.

        Returns:
            The agreement with its versions.

        @sdkOperation clickwrap.getClickwrapAgreement
        @sdkGroup Clickwrap
        @sdkPage Endpoints
        """
        response = await self._endpoint._request("GET", f"{_PATH}/agreements/{agreement_id}")
        return ClickwrapAgreementDetail.model_validate(response.json()["agreement"])

    async def create_agreement(self, params: ClickwrapAgreementCreateParams) -> ClickwrapAgreement:
        """Create an agreement via POST /v2/clickwraps/agreements.

        Args:
            params: The agreement's key and name.

        Returns:
            The new agreement.

        @sdkOperation clickwrap.createClickwrapAgreement
        @sdkGroup Clickwrap
        @sdkPage Endpoints
        """
        response = await self._endpoint._request("POST", f"{_PATH}/agreements", json=_body(params))
        return ClickwrapAgreement.model_validate(response.json()["agreement"])

    async def rename_agreement(self, agreement_id: str, name: str) -> ClickwrapAgreement:
        """Rename an agreement via PATCH /v2/clickwraps/agreements/{agreement_id}.

        Args:
            agreement_id: The agreement to rename.
            name: The new name.

        Returns:
            The renamed agreement.

        @sdkOperation clickwrap.renameClickwrapAgreement
        @sdkGroup Clickwrap
        @sdkPage Endpoints
        """
        response = await self._endpoint._request("PATCH", f"{_PATH}/agreements/{agreement_id}", json={"name": name})
        return ClickwrapAgreement.model_validate(response.json()["agreement"])

    async def create_draft(
        self, agreement_id: str, params: ClickwrapDraftCreateParams | None = None
    ) -> ClickwrapVersion:
        """Start a draft version via POST /v2/clickwraps/agreements/{agreement_id}/versions.

        Args:
            agreement_id: The agreement to add the draft to.
            params: The text or copy_current. Omit for an empty draft.

        Returns:
            The new draft.

        @sdkOperation clickwrap.createClickwrapDraft
        @sdkGroup Clickwrap
        @sdkPage Endpoints
        """
        body = _body(params) if params else {}
        response = await self._endpoint._request("POST", f"{_PATH}/agreements/{agreement_id}/versions", json=body)
        return ClickwrapVersion.model_validate(response.json()["version"])

    async def update_draft(self, version_id: str, content: str) -> ClickwrapVersion:
        """Replace a draft's text via PATCH /v2/clickwraps/versions/{version_id}.

        Args:
            version_id: The draft to edit.
            content: The agreement text as HTML, sanitized on save.

        Returns:
            The updated draft.

        @sdkOperation clickwrap.updateClickwrapDraft
        @sdkGroup Clickwrap
        @sdkPage Endpoints
        """
        response = await self._endpoint._request("PATCH", f"{_PATH}/versions/{version_id}", json={"content": content})
        return ClickwrapVersion.model_validate(response.json()["version"])

    async def delete_draft(self, version_id: str) -> None:
        """Delete a draft via DELETE /v2/clickwraps/versions/{version_id}.

        Args:
            version_id: The draft to delete.

        @sdkOperation clickwrap.deleteClickwrapDraft
        @sdkGroup Clickwrap
        @sdkPage Endpoints
        """
        await self._endpoint._request("DELETE", f"{_PATH}/versions/{version_id}")

    async def publish_version(self, version_id: str, params: ClickwrapPublishParams) -> ClickwrapVersion:
        """Publish a draft via POST /v2/clickwraps/versions/{version_id}/publish. This can't be undone.

        Args:
            version_id: The draft to publish.
            params: Whether re-acceptance is required, and an optional change summary.

        Returns:
            The published version.

        @sdkOperation clickwrap.publishClickwrapVersion
        @sdkGroup Clickwrap
        @sdkPage Endpoints
        """
        response = await self._endpoint._request("POST", f"{_PATH}/versions/{version_id}/publish", json=_body(params))
        return ClickwrapVersion.model_validate(response.json()["version"])

    async def get_coverage(self, agreement_id: str) -> ClickwrapCoverage:
        """Count who has accepted an agreement via GET /v2/clickwraps/agreements/{agreement_id}/coverage.

        Args:
            agreement_id: The agreement to count.

        Returns:
            The counts overall and per published version.

        @sdkOperation clickwrap.getClickwrapCoverage
        @sdkGroup Clickwrap
        @sdkPage Endpoints
        """
        response = await self._endpoint._request("GET", f"{_PATH}/agreements/{agreement_id}/coverage")
        return ClickwrapCoverage.model_validate(response.json())

    async def get_status(self, user_id: str, agreements: list[str]) -> list[ClickwrapStatus]:
        """Check whether one person is current on each agreement via GET /v2/clickwraps/status.

        Args:
            user_id: The person's ID in your own system.
            agreements: The agreement keys to check, up to 20.

        Returns:
            One entry per agreement.

        @sdkOperation clickwrap.getClickwrapStatus
        @sdkGroup Clickwrap
        @sdkPage Endpoints
        """
        response = await self._endpoint._request("GET", f"{_PATH}/status", params=_status_query(user_id, agreements))
        return [ClickwrapStatus.model_validate(item) for item in response.json()]

    async def create_session(
        self, params: ClickwrapSessionCreateParams
    ) -> ClickwrapSessionCurrent | ClickwrapSessionCreated:
        """Start an acceptance session for one person via POST /v2/clickwraps/session.

        Args:
            params: The person, the agreement keys, and how to show them.

        Returns:
            The session, or the person's status when there's nothing to accept.

        @sdkOperation clickwrap.createClickwrapSession
        @sdkGroup Clickwrap
        @sdkPage Endpoints
        """
        response = await self._endpoint._request("POST", f"{_PATH}/session", json=_body(params))
        return _session_result(response.json())

    async def record_outcome(self, params: ClickwrapOutcomeRecordParams) -> ClickwrapOutcomeResult:
        """Record an outcome from your own interface via POST /v2/clickwraps/acceptances.

        Args:
            params: Who, what they did, and which versions they saw.

        Returns:
            The new record.

        @sdkOperation clickwrap.recordClickwrapOutcome
        @sdkGroup Clickwrap
        @sdkPage Endpoints
        """
        response = await self._endpoint._request("POST", f"{_PATH}/acceptances", json=_body(params))
        return ClickwrapOutcomeResult.model_validate(response.json())

    async def list_acceptances(self, params: ClickwrapAcceptanceListParams) -> ClickwrapAcceptanceList:
        """Find records, newest first, via GET /v2/clickwraps/acceptances.

        Args:
            params: The search and paging.

        Returns:
            One page of record summaries.

        @sdkOperation clickwrap.getClickwrapAcceptances
        @sdkGroup Clickwrap
        @sdkPage Endpoints
        """
        response = await self._endpoint._request("GET", f"{_PATH}/acceptances", params=_body(params))
        return ClickwrapAcceptanceList.model_validate(response.json())

    async def get_acceptance(self, acceptance_id: str) -> ClickwrapAcceptance:
        """Get one record via GET /v2/clickwraps/acceptances/{acceptance_id}.

        Args:
            acceptance_id: The record to get.

        Returns:
            The record.

        @sdkOperation clickwrap.getClickwrapAcceptance
        @sdkGroup Clickwrap
        @sdkPage Endpoints
        """
        response = await self._endpoint._request("GET", f"{_PATH}/acceptances/{acceptance_id}")
        return ClickwrapAcceptance.model_validate(response.json())

    async def get_download_link(self, acceptance_id: str, type: ClickwrapDownloadType) -> ClickwrapDownloadLink:
        """Get a 15-minute link to one of a record's files via GET /v2/clickwraps/acceptances/{acceptance_id}/download.

        Args:
            acceptance_id: The record to download from.
            type: Which file to link to.

        Returns:
            The link and how long it works.

        @sdkOperation clickwrap.getClickwrapDownloadLink
        @sdkGroup Clickwrap
        @sdkPage Endpoints
        """
        response = await self._endpoint._request(
            "GET", f"{_PATH}/acceptances/{acceptance_id}/download", params={"type": type}
        )
        return ClickwrapDownloadLink.model_validate(response.json())

    async def get_session(self, token: str) -> ClickwrapPublicSession:
        """Get what a session shows via GET /v2/clickwraps/session, using its session token.

        Args:
            token: The session token from create_session.

        Returns:
            The session's agreements, mode, and brand.

        @sdkOperation clickwrap.getClickwrapSession
        @sdkGroup Clickwrap
        @sdkPage Endpoints
        """
        response = await self._endpoint._request("GET", f"{_PATH}/session", headers=_session_headers(token))
        return ClickwrapPublicSession.model_validate(response.json())

    async def send_event(self, token: str, params: ClickwrapEventParams) -> None:
        """Report what the person did while reading via POST /v2/clickwraps/session/events.

        Args:
            token: The session token from create_session.
            params: The event, and the checkbox's version_id for checked and unchecked.

        @sdkOperation clickwrap.sendClickwrapEvent
        @sdkGroup Clickwrap
        @sdkPage Endpoints
        """
        await self._endpoint._request(
            "POST", f"{_PATH}/session/events", json=_body(params), headers=_session_headers(token)
        )

    async def accept(self, token: str, params: ClickwrapSessionOutcomeParams) -> ClickwrapOutcomeResult:
        """Record that the person accepted the session's agreements via POST /v2/clickwraps/session/accept.

        Args:
            token: The session token from create_session.
            params: The surface, labels, and rendered presentation.

        Returns:
            The new record.

        @sdkOperation clickwrap.acceptClickwrap
        @sdkGroup Clickwrap
        @sdkPage Endpoints
        """
        response = await self._endpoint._request(
            "POST", f"{_PATH}/session/accept", json=_body(params), headers=_session_headers(token)
        )
        return ClickwrapOutcomeResult.model_validate(response.json())

    async def decline(self, token: str, params: ClickwrapSessionOutcomeParams) -> ClickwrapOutcomeResult:
        """Record that the person declined the session's agreements via POST /v2/clickwraps/session/decline.

        Args:
            token: The session token from create_session.
            params: The surface, labels, and rendered presentation.

        Returns:
            The new record.

        @sdkOperation clickwrap.declineClickwrap
        @sdkGroup Clickwrap
        @sdkPage Endpoints
        """
        response = await self._endpoint._request(
            "POST", f"{_PATH}/session/decline", json=_body(params), headers=_session_headers(token)
        )
        return ClickwrapOutcomeResult.model_validate(response.json())
