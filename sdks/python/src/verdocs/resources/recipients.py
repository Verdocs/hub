"""Recipient and signing-session operations (js-sdk: Envelopes/Recipients.ts).

The signing-side calls here (agree, decline, submit, verify_signer) expect a
signing session on the endpoint, minted by start_signing_session or taken
from get_in_person_link; the endpoint sends signing tokens under the header
the deployed API expects. The creator-side calls (update, remind, reset,
get_in_person_link) expect a user session.
"""

from __future__ import annotations

from typing import TYPE_CHECKING, Any
from urllib.parse import quote

from ..models.core import Recipient
from ..models.envelopes import (
    InPersonLinkResponse,
    RecipientAgreeParams,
    RecipientDelegateParams,
    RecipientSubmitParams,
    RecipientUpdateParams,
    RecipientVerifyParams,
    SignerTokenResponse,
)

if TYPE_CHECKING:
    from .._endpoint import AsyncVerdocsEndpoint, VerdocsEndpoint

_SIGN_PATH = "/v2/sign"


def _recipient_path(envelope_id: str, role_name: str) -> str:
    # Role names routinely contain spaces ("Recipient 1"), so we encode them
    # the way the js-sdk's encodeURIComponent does.
    return f"/v2/envelopes/{envelope_id}/recipients/{quote(role_name, safe='')}"


def _agree_body(disclosures: str | None, params: RecipientAgreeParams | None) -> dict[str, Any]:
    body: dict[str, Any] = params.model_dump(mode="json", exclude_unset=True) if params is not None else {}
    if disclosures is not None:
        body["disclosures"] = disclosures
    return body


def _verify_body(params: RecipientVerifyParams) -> dict[str, Any]:
    # exclude_none rather than exclude_unset: the auth_method tag has a
    # default, and dropping unset fields would drop the tag with them.
    return params.model_dump(mode="json", exclude_none=True)


class Recipients:
    """Recipient calls for a sync endpoint."""

    def __init__(self, endpoint: VerdocsEndpoint) -> None:
        self._endpoint = endpoint

    def agree(
        self,
        envelope_id: str,
        role_name: str,
        disclosures: str | None = None,
        params: RecipientAgreeParams | None = None,
    ) -> Recipient:
        """Agree to the electronic signing disclosures, the first step of every signing session.

        Calls POST /v2/envelopes/{envelope_id}/recipients/{role_name}/agree.
        Requires a signing session for this role, or a user session that can
        act for it (the envelope owner). Mirrors js-sdk envelopeRecipientAgree.

        Args:
            envelope_id: The envelope to operate on.
            role_name: The role agreeing to the disclosures.
            disclosures: The disclosure text the recipient accepted.
                DEFAULT_DISCLOSURES in verdocs.models.envelopes carries the
                stock text used when the organization has no override.
            params: Optional locale and timezone to record for the recipient.

        Returns:
            The updated recipient.

        Raises:
            VerdocsAPIError: The session cannot act for this role.
            VerdocsConnectionError: The request never reached the API.

        @sdkOperation recipient.envelopeRecipientAgree
        @sdkGroup Recipient
        @sdkPage Endpoints
        """
        response = self._endpoint._request(
            "POST", f"{_recipient_path(envelope_id, role_name)}/agree", json=_agree_body(disclosures, params)
        )
        return Recipient.model_validate(response.json())

    def decline(self, envelope_id: str, role_name: str) -> Recipient:
        """Decline to sign, ending the envelope for everyone.

        Calls POST /v2/envelopes/{envelope_id}/recipients/{role_name}/decline
        with a signing session for this role (or a user session that can act
        for it). Once any recipient declines, the envelope becomes non-viable
        and later recipients may no longer act; the creator is notified.
        Mirrors js-sdk envelopeRecipientDecline.

        Args:
            envelope_id: The envelope to operate on.
            role_name: The role declining.

        Returns:
            The updated recipient.

        Raises:
            VerdocsAPIError: The session cannot act for this role.
            VerdocsConnectionError: The request never reached the API.

        @sdkOperation recipient.envelopeRecipientDecline
        @sdkGroup Recipient
        @sdkPage Endpoints
        """
        response = self._endpoint._request("POST", f"{_recipient_path(envelope_id, role_name)}/decline")
        return Recipient.model_validate(response.json())

    def submit(self, envelope_id: str, role_name: str, params: RecipientSubmitParams | None = None) -> Recipient:
        """Submit the envelope: this recipient's signing is finished.

        Calls POST /v2/envelopes/{envelope_id}/recipients/{role_name}/submit
        with a signing session for this role (or a user session that can act
        for it). Every required field must be valid and completed for this to
        succeed. Mirrors js-sdk envelopeRecipientSubmit.

        Args:
            envelope_id: The envelope to operate on.
            role_name: The role submitting.
            params: Optional locale and timezone to record for the recipient.

        Returns:
            The updated recipient.

        Raises:
            VerdocsAPIError: Fields are incomplete, or the recipient already
                declined or was canceled.
            VerdocsConnectionError: The request never reached the API.

        @sdkOperation recipient.envelopeRecipientSubmit
        @sdkGroup Recipient
        @sdkPage Endpoints
        """
        body = params.model_dump(mode="json", exclude_unset=True) if params is not None else None
        response = self._endpoint._request("POST", f"{_recipient_path(envelope_id, role_name)}/submit", json=body)
        return Recipient.model_validate(response.json())

    def start_signing_session(self, envelope_id: str, role_name: str, key: str) -> SignerTokenResponse:
        """Begin a signing session for an envelope using an invite access key.

        Calls POST /v2/sign/unauth/{envelope_id}/{role_name}/{key}; no prior
        session is needed. The returned signing token is applied to this
        endpoint (mirroring the js-sdk), so signing calls work immediately;
        use a dedicated endpoint rather than one holding an active user
        session. For in-person signing by an authenticated user, call
        get_in_person_link instead; its access_key.key works here too.
        Mirrors js-sdk startSigningSession.

        Example:
            signing = VerdocsEndpoint(session_type="signing")
            session = signing.recipients.start_signing_session(envelope_id, "Recipient 1", key)
            signing.recipients.agree(envelope_id, "Recipient 1", DEFAULT_DISCLOSURES)

        Args:
            envelope_id: The envelope to sign.
            role_name: The role to sign as.
            key: Access key from the email/SMS invite or the envelope creator.

        Returns:
            The signing session: token, envelope, recipient, and any stored
            signature/initial blocks.

        Raises:
            VerdocsAPIError: The key is invalid, expired, or already used up.
            VerdocsConnectionError: The request never reached the API.

        @sdkOperation recipient.startSigningSession
        @sdkGroup Recipient
        @sdkPage Endpoints
        """
        response = self._endpoint._request(
            "POST", f"{_SIGN_PATH}/unauth/{envelope_id}/{quote(role_name, safe='')}/{key}"
        )
        result = SignerTokenResponse.model_validate(response.json())
        self._endpoint.set_token(result.access_token, "signing")
        return result

    def get_in_person_link(self, envelope_id: str, role_name: str) -> InPersonLinkResponse:
        """Get an in-person signing link for a recipient.

        Calls POST /v2/sign/in-person/{envelope_id}/{role_name} with a user
        session; only the envelope owner/creator may call it. The response
        carries a Web link, the raw access key for later session starts (see
        start_signing_session), and an access token that is already a valid
        signing session for immediate embedding. In-person signing is
        considered lower-security than authenticated signing and the envelope
        certificate reflects that. Mirrors js-sdk getInPersonLink.

        Args:
            envelope_id: The envelope to operate on.
            role_name: The role to generate the link for.

        Returns:
            The link, access key, signing token, envelope, and recipient.

        Raises:
            AuthenticationError: The endpoint has no valid user session.
            VerdocsAPIError: The caller does not own the envelope.
            VerdocsConnectionError: The request never reached the API.

        @sdkOperation recipient.getInPersonLink
        @sdkGroup Recipient
        @sdkPage Endpoints
        """
        response = self._endpoint._request("POST", f"{_SIGN_PATH}/in-person/{envelope_id}/{quote(role_name, safe='')}")
        return InPersonLinkResponse.model_validate(response.json())

    def verify_signer(self, params: RecipientVerifyParams) -> SignerTokenResponse:
        """Complete one recipient verification step within a signing session.

        Calls POST /v2/sign/verify with a signing session. When a recipient
        has auth_methods configured, each must be completed (after agreeing
        to disclosures) before documents can be viewed, fields filled, or the
        envelope submitted. This is also the real KBA flow: the endpoint.kba
        stubs target routes the deployed API no longer has. Mirrors js-sdk
        verifySigner.

        Example:
            session = endpoint.recipients.verify_signer(
                RecipientVerifyPasscodeParams(code="1234")
            )

        Args:
            params: The verification step being completed: passcode, email,
                sms, or kba.

        Returns:
            The updated signing session.

        Raises:
            VerdocsAPIError: The verification failed.
            VerdocsConnectionError: The request never reached the API.

        @sdkOperation recipient.verifySigner
        @sdkGroup Recipient
        @sdkPage Endpoints
        """
        response = self._endpoint._request("POST", f"{_SIGN_PATH}/verify", json=_verify_body(params))
        return SignerTokenResponse.model_validate(response.json())

    def delegate(self, envelope_id: str, role_name: str, params: RecipientDelegateParams) -> Recipient:
        """Delegate this recipient's signing responsibility to someone else.

        Calls POST /v2/envelopes/{envelope_id}/recipients/{role_name}/delegate
        with a signing session for this role; the envelope sender must have
        enabled delegation for the recipient, and only the recipient may call
        it. The original role is renamed to record the hand-off and a new
        recipient with the same role_name, order, and sequence is added.
        Unless no_contact is set, the new recipient and the creator are
        notified. Mirrors js-sdk delegateRecipient.

        Args:
            envelope_id: The envelope to operate on.
            role_name: The role delegating their tasks.
            params: Name and contact details of the new recipient.

        Returns:
            The newly added recipient. (The js-sdk types this response as a
            status object, but the server returns the new recipient row.)

        Raises:
            VerdocsAPIError: Delegation is not enabled or the caller is not
                the recipient.
            VerdocsConnectionError: The request never reached the API.

        @sdkOperation recipient.delegateRecipient
        @sdkGroup Recipient
        @sdkPage Endpoints
        """
        response = self._endpoint._request(
            "POST",
            f"{_recipient_path(envelope_id, role_name)}/delegate",
            json=params.model_dump(mode="json", exclude_unset=True),
        )
        return Recipient.model_validate(response.json())

    def update(self, envelope_id: str, role_name: str, params: RecipientUpdateParams) -> Recipient:
        """Update a recipient's details, or trigger a remind/reset action.

        Calls PATCH /v2/envelopes/{envelope_id}/recipients/{role_name} with a
        user session; the caller must own the envelope, and the envelope must
        still be active. Changing the email or phone sends a new invite, so
        rate-limit this in user interfaces; excessive use may draw
        rate-limiting to prevent abuse. The call returns 200 even when the
        envelope's no_contact flag suppresses the messages. Mirrors js-sdk
        updateRecipient.

        Args:
            envelope_id: The envelope to operate on.
            role_name: The role to update.
            params: The fields to change; unset fields are left alone.

        Returns:
            The updated recipient, with freshly generated access keys under
            the access_keys extra field.

        Raises:
            NotFoundError: No such envelope or recipient.
            VerdocsAPIError: The envelope is inactive, or a changed auth
                field was already completed by the recipient.
            VerdocsConnectionError: The request never reached the API.

        @sdkOperation recipient.updateRecipient
        @sdkGroup Recipient
        @sdkPage Endpoints
        """
        response = self._endpoint._request(
            "PATCH",
            _recipient_path(envelope_id, role_name),
            json=params.model_dump(mode="json", exclude_unset=True),
        )
        return Recipient.model_validate(response.json())

    def remind(self, envelope_id: str, role_name: str) -> Recipient:
        """Send a reminder invite to a recipient.

        Calls PATCH /v2/envelopes/{envelope_id}/recipients/{role_name} with
        action=remind and a user session. The recipient must still be an
        active member of the flow (not declined, already submitted, etc).
        Mirrors js-sdk remindRecipient. (The js-sdk types this response as a
        status object, but the server returns the recipient row.)

        Args:
            envelope_id: The envelope to operate on.
            role_name: The role to remind.

        Returns:
            The recipient that was reminded.

        Raises:
            NotFoundError: No such envelope or recipient.
            VerdocsAPIError: The recipient can no longer act.
            VerdocsConnectionError: The request never reached the API.

        @sdkOperation recipient.remindRecipient
        @sdkGroup Recipient
        @sdkPage Endpoints
        """
        response = self._endpoint._request("PATCH", _recipient_path(envelope_id, role_name), json={"action": "remind"})
        return Recipient.model_validate(response.json())

    def reset(self, envelope_id: str, role_name: str) -> Recipient:
        """Fully reset a recipient so they can restart failed KBA flows or refill fields.

        Calls PATCH /v2/envelopes/{envelope_id}/recipients/{role_name} with
        action=reset and a user session. Cannot be used on a canceled or
        completed envelope, but does reactivate an envelope marked declined.
        Mirrors js-sdk resetRecipient. (The js-sdk types this response as a
        status object, but the server returns the recipient row.)

        Args:
            envelope_id: The envelope to operate on.
            role_name: The role to reset.

        Returns:
            The reset recipient.

        Raises:
            NotFoundError: No such envelope or recipient.
            VerdocsAPIError: The envelope is canceled or complete.
            VerdocsConnectionError: The request never reached the API.

        @sdkOperation recipient.resetRecipient
        @sdkGroup Recipient
        @sdkPage Endpoints
        """
        response = self._endpoint._request("PATCH", _recipient_path(envelope_id, role_name), json={"action": "reset"})
        return Recipient.model_validate(response.json())

    def ask_question(self, envelope_id: str, role_name: str, question: str) -> None:
        """Email the envelope's sender a question from the recipient.

        Calls POST /v2/envelopes/{envelope_id}/recipients/{role_name}/ask-question
        with a signing session for this role (or a user session that can act
        for it). The sender decides how to reply. Envelopes with no_contact
        set skip the email but still answer 200. Mirrors js-sdk askQuestion.
        The API answers with a status object that carries no other data (the
        js-sdk response type says otherwise, a known drift), so this returns
        None and relies on exceptions for failure.

        Args:
            envelope_id: The envelope to operate on.
            role_name: The role asking the question.
            question: The question to send.

        Raises:
            VerdocsAPIError: The session cannot act for this role.
            VerdocsConnectionError: The request never reached the API.

        @sdkOperation recipient.askQuestion
        @sdkGroup Recipient
        @sdkPage Endpoints
        """
        self._endpoint._request(
            "POST", f"{_recipient_path(envelope_id, role_name)}/ask-question", json={"question": question}
        )


class AsyncRecipients:
    """Recipient calls for an async endpoint."""

    def __init__(self, endpoint: AsyncVerdocsEndpoint) -> None:
        self._endpoint = endpoint

    async def agree(
        self,
        envelope_id: str,
        role_name: str,
        disclosures: str | None = None,
        params: RecipientAgreeParams | None = None,
    ) -> Recipient:
        """Agree to the electronic signing disclosures, the first step of every signing session.

        Calls POST /v2/envelopes/{envelope_id}/recipients/{role_name}/agree.
        Requires a signing session for this role, or a user session that can
        act for it (the envelope owner). Mirrors js-sdk envelopeRecipientAgree.

        Args:
            envelope_id: The envelope to operate on.
            role_name: The role agreeing to the disclosures.
            disclosures: The disclosure text the recipient accepted.
                DEFAULT_DISCLOSURES in verdocs.models.envelopes carries the
                stock text used when the organization has no override.
            params: Optional locale and timezone to record for the recipient.

        Returns:
            The updated recipient.

        Raises:
            VerdocsAPIError: The session cannot act for this role.
            VerdocsConnectionError: The request never reached the API.
        """
        response = await self._endpoint._request(
            "POST", f"{_recipient_path(envelope_id, role_name)}/agree", json=_agree_body(disclosures, params)
        )
        return Recipient.model_validate(response.json())

    async def decline(self, envelope_id: str, role_name: str) -> Recipient:
        """Decline to sign, ending the envelope for everyone.

        Calls POST /v2/envelopes/{envelope_id}/recipients/{role_name}/decline
        with a signing session for this role (or a user session that can act
        for it). Once any recipient declines, the envelope becomes non-viable
        and later recipients may no longer act; the creator is notified.
        Mirrors js-sdk envelopeRecipientDecline.

        Args:
            envelope_id: The envelope to operate on.
            role_name: The role declining.

        Returns:
            The updated recipient.

        Raises:
            VerdocsAPIError: The session cannot act for this role.
            VerdocsConnectionError: The request never reached the API.
        """
        response = await self._endpoint._request("POST", f"{_recipient_path(envelope_id, role_name)}/decline")
        return Recipient.model_validate(response.json())

    async def submit(self, envelope_id: str, role_name: str, params: RecipientSubmitParams | None = None) -> Recipient:
        """Submit the envelope: this recipient's signing is finished.

        Calls POST /v2/envelopes/{envelope_id}/recipients/{role_name}/submit
        with a signing session for this role (or a user session that can act
        for it). Every required field must be valid and completed for this to
        succeed. Mirrors js-sdk envelopeRecipientSubmit.

        Args:
            envelope_id: The envelope to operate on.
            role_name: The role submitting.
            params: Optional locale and timezone to record for the recipient.

        Returns:
            The updated recipient.

        Raises:
            VerdocsAPIError: Fields are incomplete, or the recipient already
                declined or was canceled.
            VerdocsConnectionError: The request never reached the API.
        """
        body = params.model_dump(mode="json", exclude_unset=True) if params is not None else None
        response = await self._endpoint._request("POST", f"{_recipient_path(envelope_id, role_name)}/submit", json=body)
        return Recipient.model_validate(response.json())

    async def start_signing_session(self, envelope_id: str, role_name: str, key: str) -> SignerTokenResponse:
        """Begin a signing session for an envelope using an invite access key.

        Calls POST /v2/sign/unauth/{envelope_id}/{role_name}/{key}; no prior
        session is needed. The returned signing token is applied to this
        endpoint (mirroring the js-sdk), so signing calls work immediately;
        use a dedicated endpoint rather than one holding an active user
        session. For in-person signing by an authenticated user, call
        get_in_person_link instead; its access_key.key works here too.
        Mirrors js-sdk startSigningSession.

        Example:
            signing = AsyncVerdocsEndpoint(session_type="signing")
            session = await signing.recipients.start_signing_session(envelope_id, "Recipient 1", key)
            await signing.recipients.agree(envelope_id, "Recipient 1", DEFAULT_DISCLOSURES)

        Args:
            envelope_id: The envelope to sign.
            role_name: The role to sign as.
            key: Access key from the email/SMS invite or the envelope creator.

        Returns:
            The signing session: token, envelope, recipient, and any stored
            signature/initial blocks.

        Raises:
            VerdocsAPIError: The key is invalid, expired, or already used up.
            VerdocsConnectionError: The request never reached the API.
        """
        response = await self._endpoint._request(
            "POST", f"{_SIGN_PATH}/unauth/{envelope_id}/{quote(role_name, safe='')}/{key}"
        )
        result = SignerTokenResponse.model_validate(response.json())
        self._endpoint.set_token(result.access_token, "signing")
        return result

    async def get_in_person_link(self, envelope_id: str, role_name: str) -> InPersonLinkResponse:
        """Get an in-person signing link for a recipient.

        Calls POST /v2/sign/in-person/{envelope_id}/{role_name} with a user
        session; only the envelope owner/creator may call it. The response
        carries a Web link, the raw access key for later session starts (see
        start_signing_session), and an access token that is already a valid
        signing session for immediate embedding. In-person signing is
        considered lower-security than authenticated signing and the envelope
        certificate reflects that. Mirrors js-sdk getInPersonLink.

        Args:
            envelope_id: The envelope to operate on.
            role_name: The role to generate the link for.

        Returns:
            The link, access key, signing token, envelope, and recipient.

        Raises:
            AuthenticationError: The endpoint has no valid user session.
            VerdocsAPIError: The caller does not own the envelope.
            VerdocsConnectionError: The request never reached the API.
        """
        response = await self._endpoint._request(
            "POST", f"{_SIGN_PATH}/in-person/{envelope_id}/{quote(role_name, safe='')}"
        )
        return InPersonLinkResponse.model_validate(response.json())

    async def verify_signer(self, params: RecipientVerifyParams) -> SignerTokenResponse:
        """Complete one recipient verification step within a signing session.

        Calls POST /v2/sign/verify with a signing session. When a recipient
        has auth_methods configured, each must be completed (after agreeing
        to disclosures) before documents can be viewed, fields filled, or the
        envelope submitted. This is also the real KBA flow: the endpoint.kba
        stubs target routes the deployed API no longer has. Mirrors js-sdk
        verifySigner.

        Example:
            session = await endpoint.recipients.verify_signer(
                RecipientVerifyPasscodeParams(code="1234")
            )

        Args:
            params: The verification step being completed: passcode, email,
                sms, or kba.

        Returns:
            The updated signing session.

        Raises:
            VerdocsAPIError: The verification failed.
            VerdocsConnectionError: The request never reached the API.
        """
        response = await self._endpoint._request("POST", f"{_SIGN_PATH}/verify", json=_verify_body(params))
        return SignerTokenResponse.model_validate(response.json())

    async def delegate(self, envelope_id: str, role_name: str, params: RecipientDelegateParams) -> Recipient:
        """Delegate this recipient's signing responsibility to someone else.

        Calls POST /v2/envelopes/{envelope_id}/recipients/{role_name}/delegate
        with a signing session for this role; the envelope sender must have
        enabled delegation for the recipient, and only the recipient may call
        it. The original role is renamed to record the hand-off and a new
        recipient with the same role_name, order, and sequence is added.
        Unless no_contact is set, the new recipient and the creator are
        notified. Mirrors js-sdk delegateRecipient.

        Args:
            envelope_id: The envelope to operate on.
            role_name: The role delegating their tasks.
            params: Name and contact details of the new recipient.

        Returns:
            The newly added recipient. (The js-sdk types this response as a
            status object, but the server returns the new recipient row.)

        Raises:
            VerdocsAPIError: Delegation is not enabled or the caller is not
                the recipient.
            VerdocsConnectionError: The request never reached the API.
        """
        response = await self._endpoint._request(
            "POST",
            f"{_recipient_path(envelope_id, role_name)}/delegate",
            json=params.model_dump(mode="json", exclude_unset=True),
        )
        return Recipient.model_validate(response.json())

    async def update(self, envelope_id: str, role_name: str, params: RecipientUpdateParams) -> Recipient:
        """Update a recipient's details, or trigger a remind/reset action.

        Calls PATCH /v2/envelopes/{envelope_id}/recipients/{role_name} with a
        user session; the caller must own the envelope, and the envelope must
        still be active. Changing the email or phone sends a new invite, so
        rate-limit this in user interfaces; excessive use may draw
        rate-limiting to prevent abuse. The call returns 200 even when the
        envelope's no_contact flag suppresses the messages. Mirrors js-sdk
        updateRecipient.

        Args:
            envelope_id: The envelope to operate on.
            role_name: The role to update.
            params: The fields to change; unset fields are left alone.

        Returns:
            The updated recipient, with freshly generated access keys under
            the access_keys extra field.

        Raises:
            NotFoundError: No such envelope or recipient.
            VerdocsAPIError: The envelope is inactive, or a changed auth
                field was already completed by the recipient.
            VerdocsConnectionError: The request never reached the API.
        """
        response = await self._endpoint._request(
            "PATCH",
            _recipient_path(envelope_id, role_name),
            json=params.model_dump(mode="json", exclude_unset=True),
        )
        return Recipient.model_validate(response.json())

    async def remind(self, envelope_id: str, role_name: str) -> Recipient:
        """Send a reminder invite to a recipient.

        Calls PATCH /v2/envelopes/{envelope_id}/recipients/{role_name} with
        action=remind and a user session. The recipient must still be an
        active member of the flow (not declined, already submitted, etc).
        Mirrors js-sdk remindRecipient. (The js-sdk types this response as a
        status object, but the server returns the recipient row.)

        Args:
            envelope_id: The envelope to operate on.
            role_name: The role to remind.

        Returns:
            The recipient that was reminded.

        Raises:
            NotFoundError: No such envelope or recipient.
            VerdocsAPIError: The recipient can no longer act.
            VerdocsConnectionError: The request never reached the API.
        """
        response = await self._endpoint._request(
            "PATCH", _recipient_path(envelope_id, role_name), json={"action": "remind"}
        )
        return Recipient.model_validate(response.json())

    async def reset(self, envelope_id: str, role_name: str) -> Recipient:
        """Fully reset a recipient so they can restart failed KBA flows or refill fields.

        Calls PATCH /v2/envelopes/{envelope_id}/recipients/{role_name} with
        action=reset and a user session. Cannot be used on a canceled or
        completed envelope, but does reactivate an envelope marked declined.
        Mirrors js-sdk resetRecipient. (The js-sdk types this response as a
        status object, but the server returns the recipient row.)

        Args:
            envelope_id: The envelope to operate on.
            role_name: The role to reset.

        Returns:
            The reset recipient.

        Raises:
            NotFoundError: No such envelope or recipient.
            VerdocsAPIError: The envelope is canceled or complete.
            VerdocsConnectionError: The request never reached the API.
        """
        response = await self._endpoint._request(
            "PATCH", _recipient_path(envelope_id, role_name), json={"action": "reset"}
        )
        return Recipient.model_validate(response.json())

    async def ask_question(self, envelope_id: str, role_name: str, question: str) -> None:
        """Email the envelope's sender a question from the recipient.

        Calls POST /v2/envelopes/{envelope_id}/recipients/{role_name}/ask-question
        with a signing session for this role (or a user session that can act
        for it). The sender decides how to reply. Envelopes with no_contact
        set skip the email but still answer 200. Mirrors js-sdk askQuestion.
        The API answers with a status object that carries no other data (the
        js-sdk response type says otherwise, a known drift), so this returns
        None and relies on exceptions for failure.

        Args:
            envelope_id: The envelope to operate on.
            role_name: The role asking the question.
            question: The question to send.

        Raises:
            VerdocsAPIError: The session cannot act for this role.
            VerdocsConnectionError: The request never reached the API.
        """
        await self._endpoint._request(
            "POST", f"{_recipient_path(envelope_id, role_name)}/ask-question", json={"question": question}
        )
