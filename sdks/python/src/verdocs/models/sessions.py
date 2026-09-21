"""Session types and the permission vocabulary (js-sdk: Sessions module).

The claim models decode our JWTs; the Literal aliases name the permission
strings and account-role values that appear in profile records and admin
profile updates. Only types live here: the role-to-permission map and the
permission-check helper are logic and belong to the permissions helper
module.

Two js-sdk aliases are deliberately not redefined here: TSessionType and
TSession already exist as SessionType and Session | None in _endpoint.py,
which models cannot import without a cycle.
"""

from __future__ import annotations

from typing import Literal

from .core import VerdocsModel


class UserSession(VerdocsModel):
    """Decoded claims from a user access token.

    Everything is optional because the token is treated as data, not a
    contract: a claim the server stops sending should never break set_token().
    """

    jti: str | None = None
    # The server-side login session this token belongs to; matches
    # UserLoginSession.id from endpoint.sessions.list(). Tokens issued before
    # login sessions existed do not carry it.
    sid: str | None = None
    aud: str | None = None
    iss: str | None = None
    sub: str | None = None
    iat: int | None = None
    exp: int | None = None
    session_type: str | None = None
    email: str | None = None
    profile_id: str | None = None
    organization_id: str | None = None
    global_admin: bool | None = None


class SigningSession(VerdocsModel):
    """Decoded claims from a signing access token, scoped to one envelope role."""

    aud: str | None = None
    iss: str | None = None
    sub: str | None = None
    iat: int | None = None
    exp: int | None = None
    session_type: str | None = None
    key_type: str | None = None
    email: str | None = None
    profile_id: str | None = None
    envelope_id: str | None = None
    role_name: str | None = None


class IdToken(VerdocsModel):
    """Decoded claims from an id token: the user's identity summary.

    Optional throughout for the same reason as the session models: tokens
    are data, not a contract.
    """

    aud: str | None = None
    iss: str | None = None
    # The Verdocs user_id.
    sub: str | None = None
    email: str | None = None
    organization_id: str | None = None
    first_name: str | None = None
    last_name: str | None = None
    phone: str | None = None


# Either session flavor, once a token has been accepted. The js-sdk's
# TSession adds a null arm; the Python spelling for that is
# ActiveSession | None (see endpoint.session).
ActiveSession = UserSession | SigningSession


# Permissions (js-sdk: Sessions/Permissions.ts type aliases).
#
# Template permissions: creator:* governs a profile's own templates, and
# member:* governs templates shared by other members of the same organization
# (those must also have is_personal false to be visible or editable).

TemplatePermissionCreatePublic = Literal["template:creator:create:public"]
TemplatePermissionCreateOrg = Literal["template:creator:create:org"]
TemplatePermissionCreatePersonal = Literal["template:creator:create:personal"]
TemplatePermissionDelete = Literal["template:creator:delete"]
TemplatePermissionVisibility = Literal["template:creator:visibility"]
TemplateMemberRead = Literal["template:member:read"]
TemplateMemberWrite = Literal["template:member:write"]
TemplateMemberDelete = Literal["template:member:delete"]
TemplateMemberVisibility = Literal["template:member:visibility"]

TemplatePermission = (
    TemplatePermissionCreatePublic
    | TemplatePermissionCreateOrg
    | TemplatePermissionCreatePersonal
    | TemplatePermissionDelete
    | TemplatePermissionVisibility
    | TemplateMemberRead
    | TemplateMemberWrite
    | TemplateMemberDelete
    | TemplateMemberVisibility
)

# Account permissions govern granting and removing the owner/admin/member
# roles on other members of the organization.

AccountPermissionOwnerAdd = Literal["owner:add"]
AccountPermissionOwnerRemove = Literal["owner:remove"]
AccountPermissionAdminAdd = Literal["admin:add"]
AccountPermissionAdminRemove = Literal["admin:remove"]
AccountPermissionMemberView = Literal["member:view"]
AccountPermissionMemberAdd = Literal["member:add"]
AccountPermissionMemberRemove = Literal["member:remove"]

AccountPermission = (
    AccountPermissionOwnerAdd
    | AccountPermissionOwnerRemove
    | AccountPermissionAdminAdd
    | AccountPermissionAdminRemove
    | AccountPermissionMemberAdd
    | AccountPermissionMemberRemove
    | AccountPermissionMemberView
)

# Organization permissions. org:create and org:list are deprecated upstream:
# they are system-wide settings, and owners cannot stop members from listing
# organizations they hold separate profiles in. org:transfer lets the holder
# add or remove Owners without being one, mainly for reseller scenarios.

OrgPermissionCreate = Literal["org:create"]
OrgPermissionView = Literal["org:view"]
OrgPermissionUpdate = Literal["org:update"]
OrgPermissionDelete = Literal["org:delete"]
OrgPermissionTransfer = Literal["org:transfer"]
OrgPermissionList = Literal["org:list"]

OrgPermission = (
    OrgPermissionCreate
    | OrgPermissionView
    | OrgPermissionUpdate
    | OrgPermissionDelete
    | OrgPermissionTransfer
    | OrgPermissionList
)

# Envelope permissions. cancel and view are defaults for most users but may
# be removed in highly regulated environments; org:view reveals envelopes
# created by other members of the organization and is most useful on API
# keys.

EnvelopePermissionCreate = Literal["envelope:create"]
EnvelopePermissionCancel = Literal["envelope:cancel"]
EnvelopePermissionView = Literal["envelope:view"]
EnvelopePermissionOrg = Literal["envelope:org:view"]

EnvelopePermission = (
    EnvelopePermissionCreate | EnvelopePermissionCancel | EnvelopePermissionView | EnvelopePermissionOrg
)

# Operations within Verdocs that users may perform.
Permission = TemplatePermission | OrgPermission | AccountPermission | EnvelopePermission

# Account-level user types, each conferring a set of permissions. The js-sdk
# calls this TRole; we rename it because Role is already the template
# participant placeholder model (the js-sdk itself notes the historical
# overlap between the two uses of "role").
ProfileRole = Literal["contact", "basic_user", "member", "admin", "owner"]
