"""Notification template operations (js-sdk: Organizations/Notifications.ts).

Notification templates let an organization customize the email and SMS
content sent during signing workflows. Each is tied to one event and one
channel type, and only one may exist per type/event/template combination.
Every call here requires an admin or owner.
"""

from __future__ import annotations

from typing import TYPE_CHECKING, Any

from ..models.core import NotificationTemplate
from ..models.organizations import NotificationTemplateCreateParams, NotificationTemplateUpdateParams

if TYPE_CHECKING:
    from .._endpoint import AsyncVerdocsEndpoint, VerdocsEndpoint

_NOTIFICATION_TEMPLATES_PATH = "/v2/notifications/templates"


def _write_body(params: NotificationTemplateCreateParams | NotificationTemplateUpdateParams) -> dict[str, Any]:
    return params.model_dump(mode="json", exclude_unset=True)


class NotificationTemplates:
    """Notification template calls for a sync endpoint."""

    def __init__(self, endpoint: VerdocsEndpoint) -> None:
        self._endpoint = endpoint

    def list(self) -> list[NotificationTemplate]:
        """Get the caller's organization's notification templates via GET /v2/notifications/templates.

        The list omits html_template and text_template to keep it light; use
        get() for a template's content. Mirrors js-sdk getNotificationTemplates.

        Returns:
            The organization's notification templates, bodies omitted.

        Raises:
            AuthenticationError: The endpoint has no valid user session.
            VerdocsAPIError: The API returned another non-2xx status.
            VerdocsConnectionError: The request never reached the API.

        @sdkOperation notification.getNotificationTemplates
        @sdkGroup Notification
        @sdkPage Endpoints
        """
        response = self._endpoint._request("GET", _NOTIFICATION_TEMPLATES_PATH)
        return [NotificationTemplate.model_validate(entry) for entry in response.json()]

    def get(self, template_id: str) -> NotificationTemplate:
        """Get one notification template via GET /v2/notifications/templates/{template_id}.

        Mirrors js-sdk getNotificationTemplate.

        Args:
            template_id: ID of the notification template to fetch.

        Returns:
            The requested notification template, including its content.

        Raises:
            NotFoundError: No such template in the caller's organization.
            VerdocsAPIError: The API returned another non-2xx status.
            VerdocsConnectionError: The request never reached the API.

        @sdkOperation notification.getNotificationTemplate
        @sdkGroup Notification
        @sdkPage Endpoints
        """
        response = self._endpoint._request("GET", f"{_NOTIFICATION_TEMPLATES_PATH}/{template_id}")
        return NotificationTemplate.model_validate(response.json())

    def create(self, params: NotificationTemplateCreateParams) -> NotificationTemplate:
        """Create a notification template via POST /v2/notifications/templates.

        The server validates that the content includes the event's required
        Handlebars variables (a 400 lists what is missing). The response may
        carry extra advisory keys, "warnings" and "html_quality_score",
        preserved as extra fields on the model. Mirrors js-sdk
        createNotificationTemplate.

        Example:
            template = endpoint.notification_templates.create(
                NotificationTemplateCreateParams(
                    type="email",
                    event_name="recipient:invited",
                    html_template="<p>{{recipient_first_name}}, you have a document to sign.</p>",
                )
            )

        Args:
            params: The channel type, trigger event, and content. At least
                one of html_template or text_template is required.

        Returns:
            The newly-created notification template.

        Raises:
            VerdocsAPIError: The API rejected the request (400 for missing
                variables or a duplicate type/event/template combination).
            VerdocsConnectionError: The request never reached the API.

        @sdkOperation notification.createNotificationTemplate
        @sdkGroup Notification
        @sdkPage Endpoints
        """
        response = self._endpoint._request("POST", _NOTIFICATION_TEMPLATES_PATH, json=_write_body(params))
        return NotificationTemplate.model_validate(response.json())

    def update(self, template_id: str, params: NotificationTemplateUpdateParams) -> NotificationTemplate:
        """Update a notification template's content via PATCH /v2/notifications/templates/{template_id}.

        The same Handlebars-variable validation as create() applies, and the
        response may carry the same advisory extras. Mirrors js-sdk
        updateNotificationTemplate.

        Args:
            template_id: ID of the notification template to update.
            params: The new content; at least one body is required.

        Returns:
            The updated notification template.

        Raises:
            NotFoundError: No such template in the caller's organization.
            VerdocsAPIError: The API returned another non-2xx status.
            VerdocsConnectionError: The request never reached the API.

        @sdkOperation notification.updateNotificationTemplate
        @sdkGroup Notification
        @sdkPage Endpoints
        """
        response = self._endpoint._request(
            "PATCH", f"{_NOTIFICATION_TEMPLATES_PATH}/{template_id}", json=_write_body(params)
        )
        return NotificationTemplate.model_validate(response.json())

    def delete(self, template_id: str) -> None:
        """Delete a notification template via DELETE /v2/notifications/templates/{template_id}.

        The organization falls back to the stock notification content for
        that event. Mirrors js-sdk deleteNotificationTemplate. The API
        answers with a status marker that nothing consumes, so this returns
        None and relies on exceptions for failure. Deleting an unknown ID is
        a silent no-op server-side.

        Args:
            template_id: ID of the notification template to delete.

        Raises:
            VerdocsAPIError: The API returned a non-2xx status.
            VerdocsConnectionError: The request never reached the API.

        @sdkOperation notification.deleteNotificationTemplate
        @sdkGroup Notification
        @sdkPage Endpoints
        """
        self._endpoint._request("DELETE", f"{_NOTIFICATION_TEMPLATES_PATH}/{template_id}")


class AsyncNotificationTemplates:
    """Notification template calls for an async endpoint."""

    def __init__(self, endpoint: AsyncVerdocsEndpoint) -> None:
        self._endpoint = endpoint

    async def list(self) -> list[NotificationTemplate]:
        """Get the caller's organization's notification templates via GET /v2/notifications/templates.

        The list omits html_template and text_template to keep it light; use
        get() for a template's content. Mirrors js-sdk getNotificationTemplates.

        Returns:
            The organization's notification templates, bodies omitted.

        Raises:
            AuthenticationError: The endpoint has no valid user session.
            VerdocsAPIError: The API returned another non-2xx status.
            VerdocsConnectionError: The request never reached the API.
        """
        response = await self._endpoint._request("GET", _NOTIFICATION_TEMPLATES_PATH)
        return [NotificationTemplate.model_validate(entry) for entry in response.json()]

    async def get(self, template_id: str) -> NotificationTemplate:
        """Get one notification template via GET /v2/notifications/templates/{template_id}.

        Mirrors js-sdk getNotificationTemplate.

        Args:
            template_id: ID of the notification template to fetch.

        Returns:
            The requested notification template, including its content.

        Raises:
            NotFoundError: No such template in the caller's organization.
            VerdocsAPIError: The API returned another non-2xx status.
            VerdocsConnectionError: The request never reached the API.
        """
        response = await self._endpoint._request("GET", f"{_NOTIFICATION_TEMPLATES_PATH}/{template_id}")
        return NotificationTemplate.model_validate(response.json())

    async def create(self, params: NotificationTemplateCreateParams) -> NotificationTemplate:
        """Create a notification template via POST /v2/notifications/templates.

        The server validates that the content includes the event's required
        Handlebars variables (a 400 lists what is missing). The response may
        carry extra advisory keys, "warnings" and "html_quality_score",
        preserved as extra fields on the model. Mirrors js-sdk
        createNotificationTemplate.

        Example:
            template = await endpoint.notification_templates.create(
                NotificationTemplateCreateParams(
                    type="email",
                    event_name="recipient:invited",
                    html_template="<p>{{recipient_first_name}}, you have a document to sign.</p>",
                )
            )

        Args:
            params: The channel type, trigger event, and content. At least
                one of html_template or text_template is required.

        Returns:
            The newly-created notification template.

        Raises:
            VerdocsAPIError: The API rejected the request (400 for missing
                variables or a duplicate type/event/template combination).
            VerdocsConnectionError: The request never reached the API.
        """
        response = await self._endpoint._request("POST", _NOTIFICATION_TEMPLATES_PATH, json=_write_body(params))
        return NotificationTemplate.model_validate(response.json())

    async def update(self, template_id: str, params: NotificationTemplateUpdateParams) -> NotificationTemplate:
        """Update a notification template's content via PATCH /v2/notifications/templates/{template_id}.

        The same Handlebars-variable validation as create() applies, and the
        response may carry the same advisory extras. Mirrors js-sdk
        updateNotificationTemplate.

        Args:
            template_id: ID of the notification template to update.
            params: The new content; at least one body is required.

        Returns:
            The updated notification template.

        Raises:
            NotFoundError: No such template in the caller's organization.
            VerdocsAPIError: The API returned another non-2xx status.
            VerdocsConnectionError: The request never reached the API.
        """
        response = await self._endpoint._request(
            "PATCH", f"{_NOTIFICATION_TEMPLATES_PATH}/{template_id}", json=_write_body(params)
        )
        return NotificationTemplate.model_validate(response.json())

    async def delete(self, template_id: str) -> None:
        """Delete a notification template via DELETE /v2/notifications/templates/{template_id}.

        The organization falls back to the stock notification content for
        that event. Mirrors js-sdk deleteNotificationTemplate. The API
        answers with a status marker that nothing consumes, so this returns
        None and relies on exceptions for failure. Deleting an unknown ID is
        a silent no-op server-side.

        Args:
            template_id: ID of the notification template to delete.

        Raises:
            VerdocsAPIError: The API returned a non-2xx status.
            VerdocsConnectionError: The request never reached the API.
        """
        await self._endpoint._request("DELETE", f"{_NOTIFICATION_TEMPLATES_PATH}/{template_id}")
