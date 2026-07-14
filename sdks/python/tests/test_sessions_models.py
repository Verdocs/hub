"""Sessions models: claim parsing and the permission vocabulary.

The Literal aliases mirror js-sdk Sessions types; these tests pin the value
sets so a drive-by edit cannot silently drop a permission name.
"""

from __future__ import annotations

from typing import get_args

from verdocs.models import ALL_PERMISSIONS
from verdocs.models.sessions import (
    AccountPermission,
    ActiveSession,
    EnvelopePermission,
    IdToken,
    OrgPermission,
    Permission,
    ProfileRole,
    SigningSession,
    TemplatePermission,
    UserSession,
)


def _literal_values(alias) -> list[str]:
    """Flatten a Literal, or a union of Literals, into its string values."""
    args = get_args(alias)
    if all(isinstance(arg, str) for arg in args):
        return list(args)
    values: list[str] = []
    for arg in args:
        values.extend(_literal_values(arg))
    return values


def test_id_token_parses_claims():
    id_token = IdToken.model_validate(
        {
            "sub": "user-1234",
            "email": "test@example.com",
            "organization_id": "org-1234",
            "first_name": "Test",
            "last_name": "User",
            "phone": "+15555550100",
            "some_new_claim": True,
        }
    )

    assert id_token.sub == "user-1234"
    assert id_token.first_name == "Test"
    # Claims are data, not a contract: unknown ones survive.
    assert id_token.some_new_claim is True


def test_id_token_tolerates_missing_claims():
    id_token = IdToken.model_validate({})

    assert id_token.sub is None
    assert id_token.email is None


def test_active_session_is_either_session_flavor():
    assert get_args(ActiveSession) == (UserSession, SigningSession)


def test_deprecated_namespaced_claims_land_in_model_extra():
    # The js-sdk session interfaces still declare the https://verdocs.com/*
    # claims; those are not valid Python attribute names, so they ride along
    # as extras instead of first-class fields.
    session = UserSession.model_validate(
        {
            "sub": "user-1234",
            "session_type": "user",
            "https://verdocs.com/profile_id": "profile-1234",
        }
    )

    assert session.model_extra is not None
    assert session.model_extra["https://verdocs.com/profile_id"] == "profile-1234"


def test_permission_covers_the_js_sdk_vocabulary():
    values = _literal_values(Permission)

    assert len(values) == 26
    assert len(set(values)) == 26
    # ALL_PERMISSIONS (Lists.ts) is the profile-settable list and deliberately
    # omits envelope:org:view, which exists in the permission type union.
    assert set(values) == set(ALL_PERMISSIONS) | {"envelope:org:view"}


def test_permission_groups_partition_the_vocabulary():
    template = set(_literal_values(TemplatePermission))
    account = set(_literal_values(AccountPermission))
    org = set(_literal_values(OrgPermission))
    envelope = set(_literal_values(EnvelopePermission))

    assert len(template) == 9
    assert len(account) == 7
    assert len(org) == 6
    assert len(envelope) == 4
    assert template | account | org | envelope == set(_literal_values(Permission))


def test_profile_role_names_match_the_js_sdk():
    assert get_args(ProfileRole) == ("contact", "basic_user", "member", "admin", "owner")


def test_signing_session_still_parses_signing_claims():
    session = SigningSession.model_validate(
        {
            "session_type": "signing",
            "envelope_id": "envelope-1234",
            "role_name": "Recipient 1",
            "key_type": "email",
        }
    )

    assert session.envelope_id == "envelope-1234"
    assert session.key_type == "email"
