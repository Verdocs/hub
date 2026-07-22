"""Template request, response, and list models (js-sdk: Templates module).

The wire models for templates themselves (Template, TemplateDocument,
TemplateField, Role) live in core.py with the rest of the Models.ts shapes;
this module holds the Templates module's own request-parameter and list
shapes plus the Templates/Types.ts wire models.
"""

from __future__ import annotations

from datetime import datetime
from typing import Any, Literal

from .base import FieldType, RecipientType, TemplateSender, TemplateSortBy, TemplateVisibility
from .core import DropdownOption, Number, Template, VerdocsModel

# The visibility QUERY filter accepts private_shared (private + shared), a
# server-side filter value that is not a storable TemplateVisibility.
TemplateVisibilityFilter = Literal["private_shared", "private", "shared", "public"]


class TemplateList(VerdocsModel):
    """One page of template results from GET /v2/templates."""

    # Total number of records matching the query, for pagination.
    count: int
    # Number of rows in this page.
    rows: int
    # The 0-based page number of this response.
    page: int
    templates: list[Template]


class TemplateListParams(VerdocsModel):
    """Query filters for listing templates. Only the fields you set are sent."""

    # Match templates whose names, descriptions, etc contain this search term.
    q: str | None = None
    # Only templates with at least one star.
    is_starred: bool | None = None
    # Only templates created by the caller.
    is_creator: bool | None = None
    # Visibility of templates to include. The server default is private_shared (private + shared).
    visibility: TemplateVisibilityFilter | None = None
    sort_by: TemplateSortBy | None = None
    # Set True or False to override the sort direction. Date sorts default to descending, names ascending.
    ascending: bool | None = None
    # Number of rows to retrieve.
    rows: int | None = None
    # Page to retrieve (0-based).
    page: int | None = None


class DocumentFromUri(VerdocsModel):
    """A document to attach at creation time by URI (js-sdk IDocumentFromUri).

    The server downloads a copy from the URI without sending auth headers, so
    the URI itself must encode any token or key needed to fetch the file.
    """

    uri: str
    # A name for the attachment.
    name: str
    # Declared mime type. Accepted by the server schema although the js-sdk shape omits it.
    mime: str | None = None


class DocumentFromData(VerdocsModel):
    """A document to attach at creation time as base64 data (js-sdk IDocumentFromData).

    The 15 MB JSON body cap applies to the whole request, so base64 payloads
    top out around 10-11 MB of raw file data. Attach bigger files by uri, or
    with template_documents.create() after creating the template.
    """

    # Base64-encoded file data, raw or as a data: URI.
    data: str
    # A name for the attachment.
    name: str
    # Declared mime type. Accepted by the server schema although the js-sdk shape omits it.
    mime: str | None = None


class RoleCreateParams(VerdocsModel):
    """Fields for creating a role, standalone or inline in a template create.

    The js-sdk types this as a full IRole; the deployed CreateRoleSchema
    consumes exactly these fields (message, notably, is stripped). Only name
    is required. Provide either full_name or first_name/last_name; the server
    derives whichever is missing.
    """

    # Unique within the template. Spaces are allowed but must be URL-quoted in later calls, so keep names simple.
    name: str
    # Defaults server-side to signer.
    type: RecipientType | None = None
    full_name: str | None = None
    first_name: str | None = None
    last_name: str | None = None
    # Default contact details; may be completed or overridden when envelopes are created.
    email: str | None = None
    phone: str | None = None
    # 1-based sequence number. Roles sharing a sequence act in parallel. Defaults server-side to 1.
    sequence: int | None = None
    # 1-based display order within a sequence. Defaults server-side to 1.
    order: int | None = None
    # If true, the role may delegate its signing responsibility to another party.
    delegator: bool | None = None
    # If true, recipients made from this role may not change their legal name.
    name_locked: bool | None = None


class RoleUpdateParams(VerdocsModel):
    """Fields for updating a role. Everything is optional and only the fields you set are sent.

    Set name to rename the role; renames fail when the new name is already
    used within the template. The js-sdk doc comments also advertise
    kba_method here, but the deployed update schema does not consume it.
    """

    name: str | None = None
    type: RecipientType | None = None
    full_name: str | None = None
    first_name: str | None = None
    last_name: str | None = None
    email: str | None = None
    phone: str | None = None
    sequence: int | None = None
    order: int | None = None
    delegator: bool | None = None
    name_locked: bool | None = None


class FieldCreateParams(VerdocsModel):
    """Fields for creating a template field (js-sdk createField params).

    The js-sdk types this as a full ITemplateField; the deployed
    CreateTemplateFieldSchema consumes exactly these fields. A field cannot be
    both required and readonly.
    """

    # ID of the document to place the field on.
    document_id: str
    # Unique within the template. URL-hostile characters must be quoted in later calls, so keep names simple.
    name: str
    # Must match an existing role name, so create roles before fields.
    role_name: str
    type: FieldType
    # 0-based page number to place the field on.
    page: int
    # X position for the field (left to right).
    x: Number
    # Y position for the field (bottom to top).
    y: Number
    # Every field type has a built-in default size; set width and height on text fields only.
    width: Number | None = None
    height: Number | None = None
    required: bool | None = None
    readonly: bool | None = None
    # Optional label displayed above the field.
    label: str | None = None
    # Optional default value for the field.
    default: str | None = None
    # Optional placeholder shown in empty text fields.
    placeholder: str | None = None
    # For text boxes, allow more than one line of text.
    multiline: bool | None = None
    # Radio buttons and check boxes store their selected value under this name.
    group: str | None = None
    # For dropdown fields, the options to display.
    options: list[DropdownOption] | None = None
    # Deprecated grab-bag settings object; prefer the top-level fields.
    settings: dict[str, Any] | None = None
    validator: str | None = None


class FieldUpdateParams(VerdocsModel):
    """Fields for updating a template field. Everything is optional and only the fields you set are sent.

    Set name to rename the field. There is no type here on purpose: the
    deployed update schema does not consume type changes (despite the js-sdk
    doc comments), so add a new field and delete the old one instead.
    """

    name: str | None = None
    role_name: str | None = None
    # Move the field to another document in the same template.
    document_id: str | None = None
    page: int | None = None
    x: Number | None = None
    y: Number | None = None
    width: Number | None = None
    height: Number | None = None
    required: bool | None = None
    readonly: bool | None = None
    label: str | None = None
    default: str | None = None
    placeholder: str | None = None
    multiline: bool | None = None
    group: str | None = None
    options: list[DropdownOption] | None = None
    settings: dict[str, Any] | None = None
    validator: str | None = None


class TemplateCreateParams(VerdocsModel):
    """Fields for creating a template. Only name is required.

    Documents may be attached inline here (uri or base64 data entries) on the
    JSON path, or as real file uploads via the files argument to
    templates.create(); the two cannot be combined. Roles may be created
    inline on the JSON path. There is no inline fields list: the deployed API
    validates one but never creates the rows, so add fields with
    template_fields.create() after creating the template.
    """

    name: str
    description: str | None = None
    visibility: TemplateVisibility | None = None
    # Who will own envelopes created from this template. Defaults server-side to envelope_creator.
    sender: TemplateSender | None = None
    # Delay in milliseconds before the first reminder (server range: 1 to 30
    # days). The js-sdk doc comments say seconds; the deployed validator
    # counts milliseconds. An explicit None disables reminders.
    initial_reminder: int | None = None
    # Delay in milliseconds between follow-up reminders (same 1 to 30 day
    # range, also milliseconds despite the js-sdk doc comments). An explicit
    # None disables them.
    followup_reminders: int | None = None
    # Maximum days after envelope creation for which reminders are sent (1-90). Defaults server-side to 14.
    max_reminder_days: int | None = None
    # JSON-path attachments; each entry carries a uri or base64 data.
    documents: list[DocumentFromUri | DocumentFromData] | None = None
    # Roles to create along with the template.
    roles: list[RoleCreateParams] | None = None


class TemplateUpdateParams(VerdocsModel):
    """Fields for updating a template. Everything is optional and only the fields you set are sent."""

    name: str | None = None
    description: str | None = None
    visibility: TemplateVisibility | None = None
    sender: TemplateSender | None = None
    # Reminder delays in milliseconds (server range: 1 to 30 days, despite the
    # js-sdk doc comments saying seconds). An explicit None disables them.
    initial_reminder: int | None = None
    followup_reminders: int | None = None
    max_reminder_days: int | None = None


class TemplateCreateFromSharepointParams(VerdocsModel):
    """Params for creating a template from a Sharepoint asset (js-sdk ITemplateCreateFromSharepointParams).

    The endpoint this feeds is dead on the deployed API (no handler); see
    templates.create_from_sharepoint(). Field names are camelCase because the
    js-sdk sends them that way on the wire.
    """

    # Name for the template to create.
    name: str
    # The site ID the source file is in.
    siteId: str
    # The item ID of the source file.
    itemId: str
    # On-Behalf-Of access token with an audience of https://graph.microsoft.com
    # and Read access to the source file. Used once and discarded; generate it
    # with the minimal permissions possible.
    oboToken: str


# Templates/Types.ts wire models.


class TemplateTag(VerdocsModel):
    """A tag attached to a template (js-sdk ITemplateTag)."""

    tag_name: str
    template_id: str


class Tag(VerdocsModel):
    """A tag known to the organization (js-sdk ITag)."""

    name: str
    featured: bool | None = None
    organization_id: str | None = None
    created_at: datetime | None = None


class Star(VerdocsModel):
    """A profile's star on a template (js-sdk IStar)."""

    template_id: str
    profile_id: str


class TemplateSearchResult(VerdocsModel):
    """One page of template search results (js-sdk ITemplateSearchResult)."""

    page: int
    row: int
    total: int
    result: list[Template]
