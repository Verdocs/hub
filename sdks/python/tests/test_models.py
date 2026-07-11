"""Model behavior: resilience to unknown fields, datetime parsing, params serialization."""

from __future__ import annotations

from datetime import datetime, timezone

from verdocs import Profile, Template, TemplateListParams


def test_unknown_nested_fields_are_ignored(payloads):
    payload = payloads.template(
        brand_new_field="whatever",
        roles=[
            {
                "template_id": "template-1234",
                "name": "Recipient 1",
                "type": "signer",
                "full_name": None,
                "first_name": None,
                "last_name": None,
                "email": None,
                "phone": None,
                "message": None,
                "sequence": 1,
                "order": 1,
                "delegator": False,
                "name_locked": False,
                "unknown_role_field": 123,
            }
        ],
    )

    template = Template.model_validate(payload)

    assert template.roles is not None
    assert template.roles[0].name == "Recipient 1"
    assert not hasattr(template.roles[0], "unknown_role_field")


def test_datetimes_parse_from_iso_strings(payloads):
    profile = Profile.model_validate(payloads.profile())

    assert profile.created_at == datetime(2026, 1, 1, tzinfo=timezone.utc)
    assert profile.updated_at.tzinfo is not None


def test_list_params_exclude_unset_fields():
    params = TemplateListParams(visibility="private_shared", rows=10, page=0)

    dumped = params.model_dump(mode="json", exclude_none=True)

    assert dumped == {"visibility": "private_shared", "rows": 10, "page": 0}


def test_list_params_keep_explicit_false():
    params = TemplateListParams(ascending=False)

    dumped = params.model_dump(mode="json", exclude_none=True)

    # False is a real filter value and must not be dropped with the Nones.
    assert dumped == {"ascending": False}
