"""Pure-logic permission helpers (js-sdk: Sessions/Permissions.ts, Envelopes/Permissions.ts,
Templates/Permissions.ts, Templates/Actions.ts).

These run entirely client-side: they inspect profiles, envelopes, and templates
you already hold and never call the API. Everything is a faithful port of the
js-sdk logic, quirks included, so both SDKs answer permission questions the
same way. The js-sdk's useCanAccessEnvelope is a React hook and is not ported;
its logic is user_is_envelope_owner or user_is_envelope_recipient.
"""

from __future__ import annotations

from typing import NamedTuple

from .models import Envelope, Profile, Recipient, SigningSession, Template, TemplateAction, TemplateField, UserSession
from .models.sessions import Permission, ProfileRole, TemplatePermission

# Sessions/Permissions.ts

# A map of the permissions each account role confers (js-sdk Sessions/Permissions.ts RolePermissions).
ROLE_PERMISSIONS: dict[ProfileRole, tuple[Permission, ...]] = {
    "owner": (
        "template:creator:create:public",
        "template:creator:create:org",
        "template:creator:create:personal",
        "template:creator:delete",
        "template:creator:visibility",
        "template:member:read",
        "template:member:write",
        "template:member:delete",
        "template:member:visibility",
        "owner:add",
        "owner:remove",
        "admin:add",
        "admin:remove",
        "member:view",
        "member:add",
        "member:remove",
        "org:create",
        "org:view",
        "org:update",
        "org:delete",
        "org:transfer",
        "org:list",
        "envelope:create",
        "envelope:cancel",
        "envelope:view",
    ),
    "admin": (
        "template:creator:create:public",
        "template:creator:create:org",
        "template:creator:create:personal",
        "template:creator:delete",
        "template:creator:visibility",
        "template:member:read",
        "template:member:write",
        "template:member:delete",
        "template:member:visibility",
        "admin:add",
        "admin:remove",
        "member:view",
        "member:add",
        "member:remove",
        "org:create",
        "org:view",
        "org:update",
        "org:list",
        "envelope:create",
        "envelope:cancel",
        "envelope:view",
    ),
    "member": (
        "template:creator:create:public",
        "template:creator:create:org",
        "template:creator:create:personal",
        "template:creator:delete",
        "template:creator:visibility",
        "template:member:read",
        "template:member:write",
        "template:member:delete",
        "member:view",
        "org:create",
        "org:view",
        "org:list",
        "envelope:create",
        "envelope:cancel",
        "envelope:view",
    ),
    "basic_user": ("template:member:read", "member:view", "org:view", "org:list"),
    "contact": ("org:view", "org:list", "org:create"),
}


def user_has_permissions(profile: Profile | None, permissions: list[Permission]) -> bool:
    """Confirm whether the user has all of the specified permissions.

    Ports js-sdk Sessions/Permissions.ts userHasPermissions. A permission
    counts if it is applied directly to the profile, conferred by one of the
    profile's account roles, or granted through a group the profile belongs to.

    Args:
        profile: The profile to check, or None when there is no session.
        permissions: The permissions that must all be held.

    Returns:
        True when every requested permission is held.

    @sdkOperation permission.userHasPermissions
    @sdkGroup Permissions
    @sdkPage Helpers
    """
    # No need to de-dupe here, we're just checking present-at-least-once set membership.
    net_permissions: list[str] = list(profile.permissions) if profile is not None else []

    if profile is not None:
        for role in profile.roles:
            net_permissions.extend(ROLE_PERMISSIONS.get(role, ()))

        for group_profile in profile.group_profiles or []:
            if group_profile.group is not None:
                net_permissions.extend(group_profile.group.permissions)

    return all(permission in net_permissions for permission in permissions)


# Envelopes/Permissions.ts


def _lower(email: str | None) -> str | None:
    # Mirrors the js-sdk's email?.toLowerCase(): None passes through, so two missing emails still compare equal.
    return email.lower() if email is not None else None


def is_envelope_owner(profile_id: str | None, envelope: Envelope) -> bool:
    """Check whether the profile ID owns the envelope.

    Ports js-sdk Envelopes/Permissions.ts isEnvelopeOwner.

    Args:
        profile_id: The profile ID to test, or None.
        envelope: The envelope to check against.

    Returns:
        True when the envelope was created by that profile.
    """
    return envelope.profile_id == profile_id


def is_envelope_recipient(profile_id: str | None, envelope: Envelope) -> bool:
    """Check whether the profile ID is a recipient within the envelope.

    Ports js-sdk Envelopes/Permissions.ts isEnvelopeRecipient. Like the
    js-sdk's null comparison, a None profile_id matches recipients whose
    profile_id is null (unclaimed recipients).

    Args:
        profile_id: The profile ID to test, or None.
        envelope: The envelope to check against.

    Returns:
        True when any recipient carries that profile ID.
    """
    return any(recipient.profile_id == profile_id for recipient in envelope.recipients or [])


def can_access_envelope(profile_id: str | None, envelope: Envelope) -> bool:
    """Check whether the profile ID is the envelope's sender or one of the recipients.

    Ports js-sdk Envelopes/Permissions.ts canAccessEnvelope.

    Args:
        profile_id: The profile ID to test, or None.
        envelope: The envelope to check against.

    Returns:
        True when the profile owns the envelope or appears as a recipient.
    """
    return is_envelope_owner(profile_id, envelope) or is_envelope_recipient(profile_id, envelope)


def user_is_envelope_owner(profile: Profile | None, envelope: Envelope) -> bool:
    """Check whether the user owns the envelope.

    Ports js-sdk Envelopes/Permissions.ts userIsEnvelopeOwner.

    Args:
        profile: The user's profile, or None when there is no session.
        envelope: The envelope to check against.

    Returns:
        True when the envelope was created by the user's profile.
    """
    return envelope.profile_id == (profile.id if profile is not None else None)


def user_is_envelope_recipient(profile: Profile | None, envelope: Envelope) -> bool:
    """Check whether the user is a recipient within the envelope.

    Ports js-sdk Envelopes/Permissions.ts userIsEnvelopeRecipient. With no
    profile there is no match: in the js-sdk the comparison target is
    undefined, which never equals a recipient's null profile_id.

    Args:
        profile: The user's profile, or None when there is no session.
        envelope: The envelope to check against.

    Returns:
        True when any recipient carries the user's profile ID.
    """
    if profile is None:
        return False
    return any(recipient.profile_id == profile.id for recipient in envelope.recipients or [])


def envelope_is_active(envelope: Envelope) -> bool:
    """Check whether the envelope has pending actions.

    Ports js-sdk Envelopes/Permissions.ts envelopeIsActive.

    Args:
        envelope: The envelope to check.

    Returns:
        True unless the envelope is complete, declined, or canceled.
    """
    return envelope.status not in ("complete", "declined", "canceled")


def envelope_is_complete(envelope: Envelope) -> bool:
    """Check the envelope's completion state, with the js-sdk's inverted result.

    Ports js-sdk Envelopes/Permissions.ts envelopeIsComplete verbatim: despite
    the name, it returns True when the status is anything but complete. The
    js-sdk code compares status != 'complete', so we keep that behavior for
    parity; test envelope.status directly if you want the intuitive check.

    Args:
        envelope: The envelope to check.

    Returns:
        True when the envelope status is not complete.
    """
    return envelope.status != "complete"


def user_can_cancel_envelope(profile: Profile | None, envelope: Envelope) -> bool:
    """Check whether the user may cancel the envelope.

    Ports js-sdk Envelopes/Permissions.ts userCanCancelEnvelope: the user must
    own the envelope and it must not already be in an end state.

    Args:
        profile: The user's profile, or None when there is no session.
        envelope: The envelope to check.

    Returns:
        True when the owner can still cancel it.
    """
    return user_is_envelope_owner(profile, envelope) and envelope.status not in ("complete", "declined", "canceled")


def user_can_finish_envelope(profile: Profile | None, envelope: Envelope) -> bool:
    """Check whether the user may finish the envelope.

    Ports js-sdk Envelopes/Permissions.ts userCanFinishEnvelope: the user must
    own the envelope and it must not already be in an end state.

    Args:
        profile: The user's profile, or None when there is no session.
        envelope: The envelope to check.

    Returns:
        True when the owner can still finish it.
    """
    return user_is_envelope_owner(profile, envelope) and envelope.status not in ("complete", "declined", "canceled")


def recipient_has_action(recipient: Recipient) -> bool:
    """Check whether the recipient has a pending action.

    Ports js-sdk Envelopes/Permissions.ts recipientHasAction. Note that this
    does not necessarily mean the recipient can act yet; see recipient_can_act.

    Args:
        recipient: The recipient to check.

    Returns:
        True unless the recipient already submitted, canceled, or declined.
    """
    return recipient.status not in ("submitted", "canceled", "declined")


def get_recipients_with_actions(envelope: Envelope) -> list[Recipient]:
    """Get the recipients who still have a pending action.

    Ports js-sdk Envelopes/Permissions.ts getRecipientsWithActions. Not all of
    the returned recipients may be able to act yet; ordering follows the
    envelope's recipient list.

    Args:
        envelope: The envelope to inspect.

    Returns:
        The pending recipients, or an empty list when the envelope is in an
        end state.
    """
    if envelope.status in ("complete", "declined", "canceled"):
        return []
    return [recipient for recipient in envelope.recipients or [] if recipient_has_action(recipient)]


def recipient_can_act(recipient: Recipient, recipients_with_actions: list[Recipient]) -> bool:
    """Check whether the recipient can act now.

    Ports js-sdk Envelopes/Permissions.ts recipientCanAct: the recipient must
    share a sequence number with the first entry in the pending list.

    Args:
        recipient: The recipient to check.
        recipients_with_actions: The pending recipients, from
            get_recipients_with_actions.

    Returns:
        True when the recipient is in the currently acting sequence.
    """
    return bool(recipients_with_actions) and recipient.sequence == recipients_with_actions[0].sequence


def get_my_recipient(session: UserSession | SigningSession | None, envelope: Envelope) -> Recipient | None:
    """Get the envelope recipient matching the caller's session.

    Ports js-sdk Envelopes/Permissions.ts getMyRecipient. Works for user and
    signing sessions alike. The email comparison is exact (case-sensitive),
    matching the js-sdk.

    Args:
        session: The active session, or None.
        envelope: The envelope to search.

    Returns:
        The matching recipient, or None.
    """
    email = session.email if session is not None else None
    return next((recipient for recipient in envelope.recipients or [] if recipient.email == email), None)


def user_can_act(email: str, recipients_with_actions: list[Recipient]) -> bool:
    """Check whether the user with this email can act now.

    Ports js-sdk Envelopes/Permissions.ts userCanAct. The email comparison is
    case-insensitive.

    Args:
        email: The email address to look for.
        recipients_with_actions: The pending recipients, from
            get_recipients_with_actions.

    Returns:
        True when a matching recipient is in the currently acting sequence.
    """
    recipient = next((r for r in recipients_with_actions if _lower(r.email) == _lower(email)), None)
    return recipient is not None and recipient.sequence == recipients_with_actions[0].sequence


def get_recipient(email: str, envelope: Envelope) -> Recipient | None:
    """Get a recipient from an envelope via an email match.

    Ports js-sdk Envelopes/Permissions.ts getRecipient. The email comparison
    is case-insensitive.

    Args:
        email: The email address to look for.
        envelope: The envelope to search.

    Returns:
        The matching recipient, or None.
    """
    return next((r for r in envelope.recipients or [] if _lower(r.email) == _lower(email)), None)


def get_recipient_with_actions(email: str, envelope: Envelope) -> bool:
    """Check whether the recipient matching this email can act now.

    Ports js-sdk Envelopes/Permissions.ts getRecipientWithActions. Despite the
    js-sdk name, this returns the can-act check, not the recipient; use
    get_recipient for the object.

    Args:
        email: The email address to look for.
        envelope: The envelope to search.

    Returns:
        True when a matching pending recipient is in the currently acting
        sequence.
    """
    recipients_with_actions = get_recipients_with_actions(envelope)
    recipient = next((r for r in recipients_with_actions if _lower(r.email) == _lower(email)), None)
    return recipient is not None and recipient.sequence == recipients_with_actions[0].sequence


def user_can_sign_now(profile: Profile | None, envelope: Envelope) -> bool:
    """Check whether the user can sign right now.

    Ports js-sdk Envelopes/Permissions.ts userCanSignNow. The pending
    recipient is located by profile ID or email, but the recipient membership
    check still requires a profile-ID match, so a recipient who never claimed
    their profile fails this even when the email matches (js-sdk behavior).

    Args:
        profile: The user's profile, or None when there is no session.
        envelope: The envelope to check.

    Returns:
        True when the user is an envelope recipient in the currently acting
        sequence of an active envelope.
    """
    if profile is None:
        return False

    recipients_with_actions = get_recipients_with_actions(envelope)
    my_recipient = next(
        (r for r in recipients_with_actions if r.profile_id == profile.id or _lower(r.email) == _lower(profile.email)),
        None,
    )
    return (
        my_recipient is not None
        and envelope_is_active(envelope)
        and user_is_envelope_recipient(profile, envelope)
        and recipient_can_act(my_recipient, recipients_with_actions)
    )


def get_next_recipient(envelope: Envelope) -> Recipient | None:
    """Get the next recipient with a pending action.

    Ports js-sdk Envelopes/Permissions.ts getNextRecipient. "Next" means first
    in the envelope's recipient list order, not lowest sequence number.

    Args:
        envelope: The envelope to inspect.

    Returns:
        The first pending recipient, or None.
    """
    recipients_with_actions = get_recipients_with_actions(envelope)
    return recipients_with_actions[0] if recipients_with_actions else None


# Templates/Permissions.ts


def user_is_template_creator(profile: Profile | None, template: Template) -> bool:
    """Check whether the user created the template.

    Ports js-sdk Templates/Permissions.ts userIsTemplateCreator.

    Args:
        profile: The user's profile, or None when there is no session.
        template: The template to check against.

    Returns:
        True when the template was created by the user's profile.
    """
    return profile is not None and template is not None and profile.id == template.profile_id


def user_has_shared_template(profile: Profile | None, template: Template) -> bool:
    """Check whether a template is "shared" with the user.

    Ports js-sdk Templates/Permissions.ts userHasSharedTemplate: the template
    must not be personal and must belong to the user's organization.

    Args:
        profile: The user's profile, or None when there is no session.
        template: The template to check against.

    Returns:
        True when the template is org-shared with the user.
    """
    return (
        profile is not None
        and template is not None
        and not template.is_personal
        and profile.organization_id == template.organization_id
    )


def user_can_create_personal_template(profile: Profile | None) -> bool:
    """Check whether the user can create a personal/private template.

    Ports js-sdk Templates/Permissions.ts userCanCreatePersonalTemplate.

    Args:
        profile: The user's profile, or None when there is no session.

    Returns:
        True when the user holds template:creator:create:personal.
    """
    return user_has_permissions(profile, ["template:creator:create:personal"])


def user_can_create_org_template(profile: Profile | None) -> bool:
    """Check whether the user can create an org-shared template.

    Ports js-sdk Templates/Permissions.ts userCanCreateOrgTemplate.

    Args:
        profile: The user's profile, or None when there is no session.

    Returns:
        True when the user holds template:creator:create:org.
    """
    return user_has_permissions(profile, ["template:creator:create:org"])


def user_can_create_public_template(profile: Profile | None) -> bool:
    """Check whether the user can create a public template.

    Ports js-sdk Templates/Permissions.ts userCanCreatePublicTemplate.

    Args:
        profile: The user's profile, or None when there is no session.

    Returns:
        True when the user holds template:creator:create:public.
    """
    return user_has_permissions(profile, ["template:creator:create:public"])


def user_can_read_template(profile: Profile | None, template: Template) -> bool:
    """Check whether the user can read/view a template.

    Ports js-sdk Templates/Permissions.ts userCanReadTemplate: public
    templates are readable by anyone; otherwise the user must be the creator,
    or the template must be shared with them and they must hold
    template:member:read.

    Args:
        profile: The user's profile, or None when there is no session.
        template: The template to check.

    Returns:
        True when the user may view the template.
    """
    return (
        template.is_public
        or user_is_template_creator(profile, template)
        or (user_has_shared_template(profile, template) and user_has_permissions(profile, ["template:member:read"]))
    )


def user_can_update_template(profile: Profile | None, template: Template) -> bool:
    """Check whether the user can update a template.

    Ports js-sdk Templates/Permissions.ts userCanUpdateTemplate: the creator
    always can; other members need the template shared with them plus both
    template:member:read and template:member:write.

    Args:
        profile: The user's profile, or None when there is no session.
        template: The template to check.

    Returns:
        True when the user may update the template.
    """
    return user_is_template_creator(profile, template) or (
        user_has_shared_template(profile, template)
        and user_has_permissions(profile, ["template:member:read", "template:member:write"])
    )


def user_can_make_template_private(profile: Profile | None, template: Template) -> bool:
    """Check whether the user can make the template personal/private.

    Ports js-sdk Templates/Permissions.ts userCanMakeTemplatePrivate: the
    creator needs template:creator:create:personal, anyone else needs
    template:member:visibility.

    Args:
        profile: The user's profile, or None when there is no session.
        template: The template to check.

    Returns:
        True when the user may change the template to private.
    """
    if user_is_template_creator(profile, template):
        return user_has_permissions(profile, ["template:creator:create:personal"])
    return user_has_permissions(profile, ["template:member:visibility"])


def user_can_make_template_shared(profile: Profile | None, template: Template) -> bool:
    """Check whether the user can make the template org-shared.

    Ports js-sdk Templates/Permissions.ts userCanMakeTemplateShared: the
    creator needs template:creator:create:org, anyone else needs
    template:member:visibility.

    Args:
        profile: The user's profile, or None when there is no session.
        template: The template to check.

    Returns:
        True when the user may change the template to shared.
    """
    if user_is_template_creator(profile, template):
        return user_has_permissions(profile, ["template:creator:create:org"])
    return user_has_permissions(profile, ["template:member:visibility"])


def user_can_make_template_public(profile: Profile | None, template: Template) -> bool:
    """Check whether the user can make the template public.

    Ports js-sdk Templates/Permissions.ts userCanMakeTemplatePublic: the
    creator needs template:creator:create:public, anyone else needs
    template:member:visibility.

    Args:
        profile: The user's profile, or None when there is no session.
        template: The template to check.

    Returns:
        True when the user may change the template to public.
    """
    if user_is_template_creator(profile, template):
        return user_has_permissions(profile, ["template:creator:create:public"])
    return user_has_permissions(profile, ["template:member:visibility"])


def user_can_change_org_visibility(profile: Profile | None, template: Template) -> bool:
    """Check whether the user can change a template between personal and org-shared.

    Ports js-sdk Templates/Permissions.ts userCanChangeOrgVisibility: only the
    creator may, and only with template:creator:create:personal.

    Args:
        profile: The user's profile, or None when there is no session.
        template: The template to check.

    Returns:
        True when the user may change the org visibility.
    """
    return user_is_template_creator(profile, template) and user_has_permissions(
        profile, ["template:creator:create:personal"]
    )


def user_can_delete_template(profile: Profile | None, template: Template) -> bool:
    """Check whether the user can delete the template.

    Ports js-sdk Templates/Permissions.ts userCanDeleteTemplate: the creator
    needs template:creator:delete, anyone else needs template:member:delete.

    Args:
        profile: The user's profile, or None when there is no session.
        template: The template to check.

    Returns:
        True when the user may delete the template.
    """
    if user_is_template_creator(profile, template):
        return user_has_permissions(profile, ["template:creator:delete"])
    return user_has_permissions(profile, ["template:member:delete"])


def user_can_send_template(profile: Profile | None, template: Template) -> bool | None:
    """Confirm whether the user can create an envelope using the specified template.

    Ports js-sdk Templates/Permissions.ts userCanSendTemplate, including its
    fall-through: when visibility is not private, shared, or public, the
    js-sdk instead checks that roles and fields exist, and returns undefined
    (None here) when both are present.

    Args:
        profile: The user's profile, or None when there is no session.
        template: The template to check.

    Returns:
        True or False for the known visibility values; for unknown visibility,
        False when roles or fields are missing and None otherwise (the js-sdk
        returns undefined there).
    """
    if template.visibility == "private":
        return user_is_template_creator(profile, template)

    if template.visibility == "shared":
        return user_is_template_creator(profile, template) or template.organization_id == (
            profile.organization_id if profile is not None else None
        )

    if template.visibility == "public":
        return True

    if not template.roles:
        return False

    if not template.fields:
        return False

    return None


def user_can_create_template(profile: Profile | None) -> bool:
    """Confirm whether the user can create a new template of any visibility.

    Ports js-sdk Templates/Permissions.ts userCanCreateTemplate.

    Args:
        profile: The user's profile, or None when there is no session.

    Returns:
        True when the user holds any of the template creation permissions.
    """
    return (
        user_can_create_personal_template(profile)
        or user_can_create_org_template(profile)
        or user_can_create_public_template(profile)
    )


def user_can_build_template(profile: Profile | None, template: Template) -> bool:
    """Check whether the user can "build" the template (use the field builder).

    Ports js-sdk Templates/Permissions.ts userCanBuildTemplate: the user must
    have write access to the template, and the template must have at least one
    signer role.

    Args:
        profile: The user's profile, or None when there is no session.
        template: The template to check.

    Returns:
        True when the user may open the template in the builder.
    """
    return (
        user_can_update_template(profile, template)
        and len([role for role in template.roles or [] if role.type == "signer"]) > 0
    )


def get_fields_for_role(template: Template, role_name: str) -> list[TemplateField]:
    """Get the template's fields assigned to the given role.

    Ports js-sdk Templates/Permissions.ts getFieldsForRole.

    Args:
        template: The template to inspect.
        role_name: The role name to filter by.

    Returns:
        The fields whose role_name matches.
    """
    return [field for field in template.fields or [] if field.role_name == role_name]


def user_can_preview_template(profile: Profile | None, template: Template) -> bool:
    """Check whether the user can preview the template.

    Ports js-sdk Templates/Permissions.ts userCanPreviewTemplate: the user
    must have read access, the template must have at least one signer, and
    every signer must have at least one field.

    Args:
        profile: The user's profile, or None when there is no session.
        template: The template to check.

    Returns:
        True when the template can be previewed by the user.
    """
    has_permission = user_can_read_template(profile, template)
    signers = [role for role in template.roles or [] if role.type == "signer"]
    return (
        has_permission
        and len(signers) > 0
        and all(len(get_fields_for_role(template, signer.name)) > 0 for signer in signers)
    )


# Templates/Actions.ts


class TemplateActionCheck(NamedTuple):
    """The outcome of a template action check (js-sdk Templates/Actions.ts return shape)."""

    can_perform: bool
    message: str


def can_perform_template_action(
    profile: Profile | None,
    action: TemplateAction,
    template: Template | None = None,
) -> TemplateActionCheck:
    """Check whether the user may perform a template action, with a reason when not.

    Ports js-sdk Templates/Actions.ts canPerformTemplateAction. Permission
    checks here only consider directly-applied permissions (see
    has_required_permissions), not roles or groups; that matches the js-sdk.

    Args:
        profile: The user's profile, or None when there is no session.
        action: The template action to check.
        template: The template acted on; only optional for the create actions.

    Returns:
        A TemplateActionCheck with can_perform and, when denied, a message
        explaining why.
    """
    if template is None and "create" not in action:
        return TemplateActionCheck(can_perform=False, message="Missing required template object")

    # We use BOGUS here to force comparisons like template.profile_id == profile.id NOT to match when both
    # sides are missing, because two Nones would otherwise compare equal (ported from the js-sdk, which
    # guards its option chains against undefined === undefined the same way).
    profile_id = (profile.id if profile is not None else None) or "BOGUS"
    organization_id = (profile.organization_id if profile is not None else None) or "BOGUS"

    if not profile_id:
        # Unreachable: the BOGUS fallback above keeps profile_id truthy. Ported as-is from the js-sdk.
        return TemplateActionCheck(can_perform=False, message="Active session required")

    is_creator = (template.profile_id if template is not None else None) == profile_id
    is_same_org = (template.organization_id if template is not None else None) == organization_id
    is_personal = template.is_personal if template is not None else False
    is_public = template.is_public if template is not None else False

    permissions_required: list[TemplatePermission] = []
    match action:
        case "create_personal":
            permissions_required.append("template:creator:create:personal")
        case "create_org":
            permissions_required.append("template:creator:create:org")
        case "create_public":
            permissions_required.append("template:creator:create:public")
        case "read":
            if not is_creator and ((not is_personal and is_same_org) or not is_public):
                permissions_required.append("template:member:read")
        case "write":
            if not is_creator:
                permissions_required.append("template:member:read")
                permissions_required.append("template:member:write")
        case "change_visibility_personal":
            if is_creator:
                permissions_required.append("template:creator:create:personal")
            else:
                permissions_required.append("template:member:visibility")
        case "change_visibility_org":
            if is_creator:
                permissions_required.append("template:creator:create:org")
            else:
                permissions_required.append("template:member:visibility")
        case "change_visibility_public":
            if is_creator:
                permissions_required.append("template:creator:create:public")
                permissions_required.append("template:creator:visibility")
            else:
                permissions_required.append("template:member:visibility")
        case "delete":
            if is_creator:
                permissions_required.append("template:creator:delete")
            else:
                permissions_required.append("template:member:delete")
        case _:
            return TemplateActionCheck(can_perform=False, message="Action is not defined")

    if has_required_permissions(profile, permissions_required):
        return TemplateActionCheck(can_perform=True, message="")

    return TemplateActionCheck(
        can_perform=False,
        message=f"Insufficient access to perform '{action}'. Needed permissions: {','.join(permissions_required)}",
    )


def has_required_permissions(profile: Profile | None, permissions: list[Permission]) -> bool:
    """Confirm whether the profile directly holds all of the specified permissions.

    Ports js-sdk Templates/Actions.ts hasRequiredPermissions. Unlike
    user_has_permissions, this checks only permissions applied directly to the
    profile: roles and groups do not count (js-sdk behavior).

    Args:
        profile: The profile to check, or None when there is no session.
        permissions: The permissions that must all be present.

    Returns:
        True when every requested permission is directly held.
    """
    held = profile.permissions if profile is not None else []
    return all(permission in held for permission in permissions)
