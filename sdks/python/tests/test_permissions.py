"""Pure-logic permission helper tests (js-sdk: Sessions, Envelopes, and Templates permissions).

The user_has_permissions cases port the js-sdk spec at
__tests__/Sessions/Permissions.ts; the rest cover the envelope and template
helpers with a happy and a denial path each, plus the js-sdk quirks we ported
on purpose. Fixture objects are built locally with the wire models because
importlib import mode keeps test modules from importing each other.
"""

from __future__ import annotations

from typing import Any

from verdocs.models import (
    ALL_PERMISSIONS,
    Envelope,
    Profile,
    Recipient,
    Role,
    SigningSession,
    Template,
    TemplateField,
    UserSession,
)
from verdocs.permissions import (
    ROLE_PERMISSIONS,
    TemplateActionCheck,
    can_access_envelope,
    can_perform_template_action,
    envelope_is_active,
    envelope_is_complete,
    get_fields_for_role,
    get_my_recipient,
    get_next_recipient,
    get_recipient,
    get_recipient_with_actions,
    get_recipients_with_actions,
    has_required_permissions,
    is_envelope_owner,
    is_envelope_recipient,
    recipient_can_act,
    recipient_has_action,
    user_can_act,
    user_can_build_template,
    user_can_cancel_envelope,
    user_can_change_org_visibility,
    user_can_create_org_template,
    user_can_create_personal_template,
    user_can_create_public_template,
    user_can_create_template,
    user_can_delete_template,
    user_can_finish_envelope,
    user_can_make_template_private,
    user_can_make_template_public,
    user_can_make_template_shared,
    user_can_preview_template,
    user_can_read_template,
    user_can_send_template,
    user_can_sign_now,
    user_can_update_template,
    user_has_permissions,
    user_has_shared_template,
    user_is_envelope_owner,
    user_is_envelope_recipient,
    user_is_template_creator,
)

NOW = "2026-01-01T00:00:00Z"


def make_profile(**overrides: Any) -> Profile:
    data: dict[str, Any] = {
        "id": "profile-1",
        "user_id": "user-1",
        "organization_id": "org-1",
        "first_name": "Test",
        "last_name": "User",
        "email": "test@example.com",
        "current": True,
        "permissions": [],
        "roles": [],
        "created_at": NOW,
        "updated_at": NOW,
    }
    data.update(overrides)
    return Profile.model_validate(data)


def make_recipient(**overrides: Any) -> Recipient:
    data: dict[str, Any] = {
        "envelope_id": "envelope-1",
        "role_name": "Recipient 1",
        "profile_id": "profile-recipient",
        "status": "invited",
        "first_name": "Rita",
        "last_name": "Recipient",
        "email": "rita@example.com",
        "sequence": 1,
        "order": 1,
        "type": "signer",
        "delegator": False,
        "claimed": False,
        "agreed": False,
        "name_locked": False,
        "created_at": NOW,
        "updated_at": NOW,
    }
    data.update(overrides)
    return Recipient.model_validate(data)


def make_envelope(**overrides: Any) -> Envelope:
    data: dict[str, Any] = {
        "id": "envelope-1",
        "status": "pending",
        "profile_id": "profile-owner",
        "organization_id": "org-1",
        "name": "Test Envelope",
        "sender_name": "Test Sender",
        "sender_email": "sender@example.com",
        "max_reminder_days": 14,
        "created_at": NOW,
        "updated_at": NOW,
        "visibility": "private",
        "signed": False,
    }
    data.update(overrides)
    return Envelope.model_validate(data)


def make_template(**overrides: Any) -> Template:
    data: dict[str, Any] = {
        "id": "template-1",
        "profile_id": "profile-creator",
        "organization_id": "org-1",
        "sender": "envelope_creator",
        "name": "Test Template",
        "counter": 0,
        "star_counter": 0,
        "max_reminder_days": 14,
        "is_personal": True,
        "is_public": False,
        "visibility": "private",
        "is_sendable": True,
        "created_at": NOW,
        "updated_at": NOW,
    }
    data.update(overrides)
    return Template.model_validate(data)


def make_role(name: str, role_type: str = "signer") -> Role:
    return Role.model_validate(
        {
            "template_id": "template-1",
            "name": name,
            "type": role_type,
            "sequence": 1,
            "order": 1,
            "name_locked": False,
        }
    )


def make_template_field(role_name: str) -> TemplateField:
    return TemplateField.model_validate(
        {
            "name": f"{role_name}-textbox-1",
            "role_name": role_name,
            "template_id": "template-1",
            "document_id": "document-1",
            "type": "textbox",
            "required": True,
            "page": 1,
            "x": 10,
            "y": 10,
            "width": 150,
            "height": 15,
            "multiline": False,
        }
    )


def three_recipient_envelope(**overrides: Any) -> Envelope:
    """Alice already submitted; bob (sequence 2) is next; carol (sequence 3) waits."""
    return make_envelope(
        recipients=[
            make_recipient(
                role_name="Recipient 1",
                email="alice@example.com",
                profile_id="profile-alice",
                sequence=1,
                status="submitted",
            ),
            make_recipient(role_name="Recipient 2", email="bob@example.com", profile_id="profile-bob", sequence=2),
            make_recipient(role_name="Recipient 3", email="carol@example.com", profile_id="profile-carol", sequence=3),
        ],
        **overrides,
    )


# Sessions/Permissions.ts


def test_user_has_permissions_matches_the_js_sdk_spec():
    # Ported from js-sdk __tests__/Sessions/Permissions.ts.
    profile = make_profile(
        id="BOGUS",
        roles=["member"],
        # Directly-applied permission that normal members don't have
        permissions=["admin:add"],
        group_profiles=[
            {
                "group_id": "BOGUS",
                "profile_id": "BOGUS",
                "organization_id": "BOGUS",
                "group": {
                    "id": "BOGUS",
                    "name": "",
                    "organization_id": "BOGUS",
                    # Group-applied permission that normal members don't have
                    "permissions": ["admin:remove"],
                },
            }
        ],
    )

    # Permission not applied by role, directly, or via group
    assert user_has_permissions(profile, ["org:delete"]) is False
    # Permission applied by group
    assert user_has_permissions(profile, ["admin:remove"]) is True
    # Permission applied directly
    assert user_has_permissions(profile, ["admin:add"]) is True
    # Permission applied by role
    assert user_has_permissions(profile, ["template:member:delete"]) is True


def test_user_has_permissions_requires_every_permission():
    profile = make_profile(permissions=["admin:add"])

    assert user_has_permissions(profile, ["admin:add", "org:delete"]) is False


def test_user_has_permissions_without_a_profile():
    assert user_has_permissions(None, ["org:view"]) is False
    # Vacuously true, matching js Array.every on an empty list.
    assert user_has_permissions(None, []) is True


def test_user_has_permissions_ignores_unknown_roles():
    profile = make_profile(roles=["superhero"])

    assert user_has_permissions(profile, ["org:view"]) is False


def test_role_permissions_covers_the_five_account_roles():
    assert set(ROLE_PERMISSIONS) == {"contact", "basic_user", "member", "admin", "owner"}


def test_owner_role_confers_every_permission():
    assert ROLE_PERMISSIONS["owner"] == ALL_PERMISSIONS


def test_role_permission_grants_narrow_with_each_step_down():
    assert "owner:add" in ROLE_PERMISSIONS["owner"]
    assert "owner:add" not in ROLE_PERMISSIONS["admin"]
    assert "admin:add" in ROLE_PERMISSIONS["admin"]
    assert "admin:add" not in ROLE_PERMISSIONS["member"]
    assert "template:member:write" in ROLE_PERMISSIONS["member"]
    assert "template:member:write" not in ROLE_PERMISSIONS["basic_user"]
    assert ROLE_PERMISSIONS["contact"] == ("org:view", "org:list", "org:create")


# Envelopes/Permissions.ts


def test_is_envelope_owner():
    envelope = make_envelope()

    assert is_envelope_owner("profile-owner", envelope) is True
    assert is_envelope_owner("profile-other", envelope) is False
    assert is_envelope_owner(None, envelope) is False


def test_is_envelope_recipient():
    envelope = three_recipient_envelope()

    assert is_envelope_recipient("profile-bob", envelope) is True
    assert is_envelope_recipient("profile-stranger", envelope) is False
    assert is_envelope_recipient("profile-bob", make_envelope()) is False


def test_is_envelope_recipient_matches_unclaimed_recipients_for_none():
    # js-sdk quirk ported on purpose: null === null, so a None profile_id
    # "matches" recipients who never claimed a profile.
    envelope = make_envelope(recipients=[make_recipient(profile_id=None)])

    assert is_envelope_recipient(None, envelope) is True


def test_can_access_envelope():
    envelope = three_recipient_envelope()

    assert can_access_envelope("profile-owner", envelope) is True
    assert can_access_envelope("profile-carol", envelope) is True
    assert can_access_envelope("profile-stranger", envelope) is False


def test_user_is_envelope_owner():
    envelope = make_envelope()

    assert user_is_envelope_owner(make_profile(id="profile-owner"), envelope) is True
    assert user_is_envelope_owner(make_profile(id="profile-other"), envelope) is False
    assert user_is_envelope_owner(None, envelope) is False


def test_user_is_envelope_recipient():
    envelope = three_recipient_envelope()

    assert user_is_envelope_recipient(make_profile(id="profile-bob"), envelope) is True
    assert user_is_envelope_recipient(make_profile(id="profile-stranger"), envelope) is False


def test_user_is_envelope_recipient_never_matches_without_a_profile():
    # Unlike the profile-ID flavor above, the js comparison target here is
    # undefined, which never equals a recipient's null profile_id.
    envelope = make_envelope(recipients=[make_recipient(profile_id=None)])

    assert user_is_envelope_recipient(None, envelope) is False


def test_envelope_is_active():
    assert envelope_is_active(make_envelope(status="pending")) is True
    assert envelope_is_active(make_envelope(status="in progress")) is True
    assert envelope_is_active(make_envelope(status="complete")) is False
    assert envelope_is_active(make_envelope(status="declined")) is False
    assert envelope_is_active(make_envelope(status="canceled")) is False


def test_envelope_is_complete_is_inverted_like_the_js_sdk():
    # The js-sdk compares status != 'complete', so the answer is the opposite
    # of the function name. Ported faithfully.
    assert envelope_is_complete(make_envelope(status="complete")) is False
    assert envelope_is_complete(make_envelope(status="pending")) is True


def test_user_can_cancel_envelope():
    owner = make_profile(id="profile-owner")

    assert user_can_cancel_envelope(owner, make_envelope()) is True
    assert user_can_cancel_envelope(owner, make_envelope(status="complete")) is False
    assert user_can_cancel_envelope(owner, make_envelope(status="declined")) is False
    assert user_can_cancel_envelope(owner, make_envelope(status="canceled")) is False
    assert user_can_cancel_envelope(make_profile(id="profile-other"), make_envelope()) is False


def test_user_can_finish_envelope():
    owner = make_profile(id="profile-owner")

    assert user_can_finish_envelope(owner, make_envelope()) is True
    assert user_can_finish_envelope(owner, make_envelope(status="complete")) is False
    assert user_can_finish_envelope(make_profile(id="profile-other"), make_envelope()) is False


def test_recipient_has_action():
    assert recipient_has_action(make_recipient(status="invited")) is True
    assert recipient_has_action(make_recipient(status="opened")) is True
    assert recipient_has_action(make_recipient(status="submitted")) is False
    assert recipient_has_action(make_recipient(status="canceled")) is False
    assert recipient_has_action(make_recipient(status="declined")) is False


def test_get_recipients_with_actions():
    pending = get_recipients_with_actions(three_recipient_envelope())

    assert [recipient.email for recipient in pending] == ["bob@example.com", "carol@example.com"]


def test_get_recipients_with_actions_is_empty_for_ended_envelopes():
    assert get_recipients_with_actions(three_recipient_envelope(status="complete")) == []
    assert get_recipients_with_actions(three_recipient_envelope(status="declined")) == []
    assert get_recipients_with_actions(three_recipient_envelope(status="canceled")) == []
    assert get_recipients_with_actions(make_envelope()) == []


def test_recipient_can_act():
    pending = get_recipients_with_actions(three_recipient_envelope())
    bob, carol = pending

    assert recipient_can_act(bob, pending) is True
    assert recipient_can_act(carol, pending) is False
    assert recipient_can_act(bob, []) is False


def test_get_my_recipient():
    envelope = three_recipient_envelope()

    bob = get_my_recipient(UserSession(email="bob@example.com"), envelope)
    assert bob is not None and bob.role_name == "Recipient 2"

    # Works for signing sessions too, and finds recipients who already acted.
    alice = get_my_recipient(SigningSession(email="alice@example.com"), envelope)
    assert alice is not None and alice.role_name == "Recipient 1"

    assert get_my_recipient(None, envelope) is None


def test_get_my_recipient_is_case_sensitive():
    # The js-sdk compares this one exactly, unlike get_recipient. Ported as-is.
    envelope = three_recipient_envelope()

    assert get_my_recipient(UserSession(email="BOB@example.com"), envelope) is None


def test_user_can_act():
    pending = get_recipients_with_actions(three_recipient_envelope())

    assert user_can_act("bob@example.com", pending) is True
    assert user_can_act("BOB@EXAMPLE.COM", pending) is True
    assert user_can_act("carol@example.com", pending) is False
    assert user_can_act("stranger@example.com", pending) is False
    assert user_can_act("bob@example.com", []) is False


def test_get_recipient():
    envelope = three_recipient_envelope()

    found = get_recipient("ALICE@example.com", envelope)
    assert found is not None and found.email == "alice@example.com"

    assert get_recipient("stranger@example.com", envelope) is None


def test_get_recipient_with_actions():
    envelope = three_recipient_envelope()

    assert get_recipient_with_actions("bob@example.com", envelope) is True
    assert get_recipient_with_actions("carol@example.com", envelope) is False
    # Alice already submitted, so she is not in the pending list at all.
    assert get_recipient_with_actions("alice@example.com", envelope) is False
    assert get_recipient_with_actions("stranger@example.com", envelope) is False


def test_user_can_sign_now():
    envelope = three_recipient_envelope()

    assert user_can_sign_now(make_profile(id="profile-bob", email="bob@example.com"), envelope) is True
    assert user_can_sign_now(make_profile(id="profile-carol", email="carol@example.com"), envelope) is False
    assert user_can_sign_now(None, envelope) is False
    assert user_can_sign_now(make_profile(id="profile-bob", email="bob@example.com"), make_envelope()) is False


def test_user_can_sign_now_requires_a_claimed_profile():
    # js-sdk behavior ported as-is: the pending recipient is found by email,
    # but userIsEnvelopeRecipient still wants a profile-ID match, so an
    # unclaimed recipient cannot sign even from the right account.
    envelope = make_envelope(recipients=[make_recipient(email="dana@example.com", profile_id=None)])

    assert user_can_sign_now(make_profile(id="profile-dana", email="dana@example.com"), envelope) is False


def test_get_next_recipient():
    envelope = three_recipient_envelope()

    next_recipient = get_next_recipient(envelope)
    assert next_recipient is not None and next_recipient.email == "bob@example.com"

    assert get_next_recipient(three_recipient_envelope(status="complete")) is None


def test_get_next_recipient_follows_list_order_not_sequence():
    # The js-sdk takes the first pending recipient in array order and never
    # sorts by sequence. Ported as-is.
    envelope = make_envelope(
        recipients=[
            make_recipient(email="carol@example.com", sequence=3),
            make_recipient(email="bob@example.com", sequence=2),
        ]
    )

    next_recipient = get_next_recipient(envelope)
    assert next_recipient is not None and next_recipient.email == "carol@example.com"


# Templates/Permissions.ts


def test_user_is_template_creator():
    template = make_template()

    assert user_is_template_creator(make_profile(id="profile-creator"), template) is True
    assert user_is_template_creator(make_profile(id="profile-member"), template) is False
    assert user_is_template_creator(None, template) is False


def test_user_has_shared_template():
    shared = make_template(is_personal=False, visibility="shared")

    assert user_has_shared_template(make_profile(id="profile-member"), shared) is True
    assert user_has_shared_template(make_profile(id="profile-member"), make_template()) is False
    assert user_has_shared_template(make_profile(id="profile-outsider", organization_id="org-2"), shared) is False
    assert user_has_shared_template(None, shared) is False


def test_user_can_create_template_permission_trio():
    assert user_can_create_personal_template(make_profile(permissions=["template:creator:create:personal"])) is True
    assert user_can_create_personal_template(make_profile()) is False
    assert user_can_create_org_template(make_profile(permissions=["template:creator:create:org"])) is True
    assert user_can_create_org_template(make_profile()) is False
    assert user_can_create_public_template(make_profile(permissions=["template:creator:create:public"])) is True
    assert user_can_create_public_template(make_profile()) is False


def test_user_can_read_template():
    shared = make_template(is_personal=False, visibility="shared")
    reader = make_profile(id="profile-member", permissions=["template:member:read"])

    assert user_can_read_template(None, make_template(is_public=True)) is True
    assert user_can_read_template(make_profile(id="profile-creator"), make_template()) is True
    assert user_can_read_template(reader, shared) is True
    # The member account role also confers template:member:read.
    assert user_can_read_template(make_profile(id="profile-member", roles=["member"]), shared) is True
    assert user_can_read_template(make_profile(id="profile-member"), shared) is False
    # A personal template is not shared, whatever permissions the member holds.
    assert user_can_read_template(reader, make_template()) is False


def test_user_can_update_template():
    shared = make_template(is_personal=False, visibility="shared")
    editor = make_profile(id="profile-member", permissions=["template:member:read", "template:member:write"])
    reader = make_profile(id="profile-member", permissions=["template:member:read"])

    assert user_can_update_template(make_profile(id="profile-creator"), shared) is True
    assert user_can_update_template(editor, shared) is True
    assert user_can_update_template(reader, shared) is False


def test_user_can_make_template_private():
    template = make_template()
    creator_ok = make_profile(id="profile-creator", permissions=["template:creator:create:personal"])
    member_ok = make_profile(id="profile-member", permissions=["template:member:visibility"])

    assert user_can_make_template_private(creator_ok, template) is True
    assert user_can_make_template_private(make_profile(id="profile-creator"), template) is False
    assert user_can_make_template_private(member_ok, template) is True
    assert user_can_make_template_private(make_profile(id="profile-member"), template) is False


def test_user_can_make_template_shared():
    template = make_template()
    creator_ok = make_profile(id="profile-creator", permissions=["template:creator:create:org"])
    member_ok = make_profile(id="profile-member", permissions=["template:member:visibility"])

    assert user_can_make_template_shared(creator_ok, template) is True
    assert user_can_make_template_shared(make_profile(id="profile-creator"), template) is False
    assert user_can_make_template_shared(member_ok, template) is True


def test_user_can_make_template_public():
    template = make_template()
    creator_ok = make_profile(id="profile-creator", permissions=["template:creator:create:public"])
    member_ok = make_profile(id="profile-member", permissions=["template:member:visibility"])

    assert user_can_make_template_public(creator_ok, template) is True
    assert user_can_make_template_public(make_profile(id="profile-creator"), template) is False
    assert user_can_make_template_public(member_ok, template) is True


def test_user_can_change_org_visibility():
    template = make_template()
    creator_ok = make_profile(id="profile-creator", permissions=["template:creator:create:personal"])
    member_with_visibility = make_profile(id="profile-member", permissions=["template:member:visibility"])

    assert user_can_change_org_visibility(creator_ok, template) is True
    assert user_can_change_org_visibility(make_profile(id="profile-creator"), template) is False
    # Only the creator may, whatever the member holds.
    assert user_can_change_org_visibility(member_with_visibility, template) is False


def test_user_can_delete_template():
    template = make_template()
    creator_ok = make_profile(id="profile-creator", permissions=["template:creator:delete"])
    member_ok = make_profile(id="profile-member", permissions=["template:member:delete"])

    assert user_can_delete_template(creator_ok, template) is True
    assert user_can_delete_template(make_profile(id="profile-creator"), template) is False
    assert user_can_delete_template(member_ok, template) is True
    assert user_can_delete_template(make_profile(id="profile-member"), template) is False


def test_user_can_send_template():
    private = make_template(visibility="private")
    shared = make_template(is_personal=False, visibility="shared")

    assert user_can_send_template(make_profile(id="profile-creator"), private) is True
    assert user_can_send_template(make_profile(id="profile-member"), private) is False
    assert user_can_send_template(make_profile(id="profile-creator"), shared) is True
    assert user_can_send_template(make_profile(id="profile-member"), shared) is True
    assert user_can_send_template(make_profile(id="profile-outsider", organization_id="org-2"), shared) is False
    assert user_can_send_template(None, make_template(visibility="public")) is True


def test_user_can_send_template_unknown_visibility_quirk():
    # js-sdk fall-through ported as-is: with an unrecognized visibility the
    # function checks roles and fields instead, and returns undefined (None
    # here) when both are present.
    profile = make_profile(id="profile-member")

    assert user_can_send_template(profile, make_template(visibility=None)) is False
    assert user_can_send_template(profile, make_template(visibility=None, roles=[make_role("Signer 1")])) is False
    complete = make_template(visibility=None, roles=[make_role("Signer 1")], fields=[make_template_field("Signer 1")])
    assert user_can_send_template(profile, complete) is None


def test_user_can_create_template():
    assert user_can_create_template(make_profile(permissions=["template:creator:create:org"])) is True
    # The member account role confers the creation permissions too.
    assert user_can_create_template(make_profile(roles=["member"])) is True
    assert user_can_create_template(make_profile()) is False


def test_user_can_build_template():
    creator = make_profile(id="profile-creator")

    assert user_can_build_template(creator, make_template(roles=[make_role("Signer 1")])) is True
    assert user_can_build_template(creator, make_template(roles=[make_role("CC 1", role_type="cc")])) is False
    member = make_profile(id="profile-member")
    assert user_can_build_template(member, make_template(roles=[make_role("Signer 1")])) is False


def test_get_fields_for_role():
    template = make_template(fields=[make_template_field("Signer 1"), make_template_field("Signer 2")])

    fields = get_fields_for_role(template, "Signer 1")
    assert [field.role_name for field in fields] == ["Signer 1"]
    assert get_fields_for_role(template, "Signer 3") == []
    assert get_fields_for_role(make_template(), "Signer 1") == []


def test_user_can_preview_template():
    creator = make_profile(id="profile-creator")
    ready = make_template(roles=[make_role("Signer 1")], fields=[make_template_field("Signer 1")])

    assert user_can_preview_template(creator, ready) is True
    # A signer without any fields blocks the preview.
    assert user_can_preview_template(creator, make_template(roles=[make_role("Signer 1")])) is False
    # No signers, nothing to preview.
    assert user_can_preview_template(creator, make_template(fields=[make_template_field("Signer 1")])) is False
    # No read access, no preview.
    assert user_can_preview_template(make_profile(id="profile-member"), ready) is False


# Templates/Actions.ts


def test_can_perform_template_action_requires_a_template_for_non_create_actions():
    result = can_perform_template_action(make_profile(), "read")

    assert result == TemplateActionCheck(can_perform=False, message="Missing required template object")


def test_can_perform_template_action_create_without_a_template():
    profile = make_profile(permissions=["template:creator:create:personal"])

    assert can_perform_template_action(profile, "create_personal") == TemplateActionCheck(can_perform=True, message="")


def test_can_perform_template_action_create_denial_message():
    result = can_perform_template_action(make_profile(), "create_personal")

    assert result.can_perform is False
    assert result.message == (
        "Insufficient access to perform 'create_personal'. Needed permissions: template:creator:create:personal"
    )


def test_can_perform_template_action_read():
    shared = make_template(is_personal=False)

    # The creator needs no permission at all.
    assert can_perform_template_action(make_profile(id="profile-creator"), "read", make_template()).can_perform is True
    # A same-org member needs template:member:read.
    granted = make_profile(id="profile-member", permissions=["template:member:read"])
    assert can_perform_template_action(granted, "read", shared).can_perform is True
    denied = can_perform_template_action(make_profile(id="profile-member"), "read", shared)
    assert denied.can_perform is False
    assert denied.message == "Insufficient access to perform 'read'. Needed permissions: template:member:read"


def test_can_perform_template_action_read_public_personal_quirk():
    # js-sdk condition ported as-is: (!isPersonal && isSameOrg) || !isPublic
    # never fires for a public personal template in another org, so no
    # permission is required to read it.
    outsider = make_profile(id="profile-outsider", organization_id="org-2")
    template = make_template(is_personal=True, is_public=True)

    assert can_perform_template_action(outsider, "read", template).can_perform is True


def test_can_perform_template_action_write():
    shared = make_template(is_personal=False)

    assert can_perform_template_action(make_profile(id="profile-creator"), "write", make_template()).can_perform is True
    editor = make_profile(id="profile-member", permissions=["template:member:read", "template:member:write"])
    assert can_perform_template_action(editor, "write", shared).can_perform is True

    reader = make_profile(id="profile-member", permissions=["template:member:read"])
    denied = can_perform_template_action(reader, "write", shared)
    assert denied.can_perform is False
    assert denied.message == (
        "Insufficient access to perform 'write'. Needed permissions: template:member:read,template:member:write"
    )


def test_can_perform_template_action_change_visibility():
    template = make_template()

    creator_ok = make_profile(id="profile-creator", permissions=["template:creator:create:personal"])
    assert can_perform_template_action(creator_ok, "change_visibility_personal", template).can_perform is True
    org_ok = make_profile(id="profile-creator", permissions=["template:creator:create:org"])
    assert can_perform_template_action(org_ok, "change_visibility_org", template).can_perform is True
    member_ok = make_profile(id="profile-member", permissions=["template:member:visibility"])
    assert can_perform_template_action(member_ok, "change_visibility_personal", template).can_perform is True
    member_denied = can_perform_template_action(make_profile(id="profile-member"), "change_visibility_org", template)
    assert member_denied.can_perform is False


def test_can_perform_template_action_change_visibility_public_needs_both_creator_permissions():
    template = make_template()

    partial = make_profile(id="profile-creator", permissions=["template:creator:create:public"])
    assert can_perform_template_action(partial, "change_visibility_public", template).can_perform is False

    full = make_profile(
        id="profile-creator",
        permissions=["template:creator:create:public", "template:creator:visibility"],
    )
    assert can_perform_template_action(full, "change_visibility_public", template).can_perform is True

    member = make_profile(id="profile-member", permissions=["template:member:visibility"])
    assert can_perform_template_action(member, "change_visibility_public", template).can_perform is True


def test_can_perform_template_action_delete():
    template = make_template()

    creator = make_profile(id="profile-creator", permissions=["template:creator:delete"])
    assert can_perform_template_action(creator, "delete", template).can_perform is True
    member = make_profile(id="profile-member", permissions=["template:member:delete"])
    assert can_perform_template_action(member, "delete", template).can_perform is True
    assert can_perform_template_action(make_profile(id="profile-member"), "delete", template).can_perform is False


def test_can_perform_template_action_without_a_profile():
    result = can_perform_template_action(None, "delete", make_template())

    assert result.can_perform is False
    assert result.message == "Insufficient access to perform 'delete'. Needed permissions: template:member:delete"


def test_can_perform_template_action_unknown_action():
    result = can_perform_template_action(make_profile(), "explode", make_template())

    assert result == TemplateActionCheck(can_perform=False, message="Action is not defined")


def test_can_perform_template_action_ignores_roles_and_groups():
    # js-sdk split ported as-is: canPerformTemplateAction checks only directly
    # applied permissions, while userHasPermissions also expands roles.
    profile = make_profile(roles=["owner"])

    assert user_has_permissions(profile, ["template:creator:create:personal"]) is True
    assert can_perform_template_action(profile, "create_personal").can_perform is False


def test_has_required_permissions():
    assert has_required_permissions(make_profile(permissions=["org:view"]), ["org:view"]) is True
    assert has_required_permissions(make_profile(permissions=["org:view"]), ["org:view", "org:update"]) is False
    assert has_required_permissions(make_profile(roles=["owner"]), ["org:view"]) is False
    assert has_required_permissions(None, ["org:view"]) is False
    assert has_required_permissions(None, []) is True
