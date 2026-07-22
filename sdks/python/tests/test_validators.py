"""Validator and field-fill tests (js-sdk: Templates/Validators.ts, Envelopes/Fields.ts).

Each validator gets a valid and an invalid case, plus tests pinning the
js-sdk regex quirks we ported on purpose (search semantics, the date
anchoring bug, and empty-string tags). Fixture objects are built locally
with the wire models because importlib import mode keeps test modules from
importing each other.
"""

from __future__ import annotations

from typing import Any

from verdocs.models import EnvelopeField, Role
from verdocs.validators import (
    get_validators,
    is_field_filled,
    is_field_valid,
    is_valid_email,
    is_valid_input,
    is_valid_phone,
    is_valid_role_name,
    is_valid_tag,
)


def make_field(field_type: str = "textbox", value: str | None = None, **overrides: Any) -> EnvelopeField:
    data: dict[str, Any] = {
        "envelope_id": "envelope-1",
        "document_id": "document-1",
        "name": "field-1",
        "role_name": "Recipient 1",
        "type": field_type,
        "page": 1,
        "x": 10,
        "y": 10,
        "width": 150,
        "height": 15,
        "multiline": False,
        "is_valid": True,
        "value": value,
    }
    data.update(overrides)
    return EnvelopeField.model_validate(data)


def make_role(name: str) -> Role:
    return Role.model_validate(
        {
            "template_id": "template-1",
            "name": name,
            "type": "signer",
            "sequence": 1,
            "order": 1,
            "name_locked": False,
        }
    )


# Templates/Validators.ts


def test_get_validators_lists_the_js_sdk_names_in_order():
    assert get_validators() == ["email", "phone", "url", "postal_code", "number", "date"]


def test_is_valid_input_email():
    assert is_valid_input("test@example.com", "email") is True
    assert is_valid_input("not-an-email", "email") is False


def test_is_valid_input_phone():
    assert is_valid_input("(555) 123-4567", "phone") is True
    assert is_valid_input("+1 555 123 4567", "phone") is True
    assert is_valid_input("no digits here", "phone") is False


def test_is_valid_input_phone_matches_substrings_like_regexp_test():
    # The js pattern has no anchors and RegExp.test scans the whole string,
    # so a phone number anywhere in the value passes. Ported semantics.
    assert is_valid_input("call me at 5551234567 ok", "phone") is True


def test_is_valid_input_url():
    assert is_valid_input("https://verdocs.com/sign", "url") is True
    assert is_valid_input("http://www.example.org", "url") is True
    assert is_valid_input("verdocs.com", "url") is False


def test_is_valid_input_postal_code():
    assert is_valid_input("94105", "postal_code") is True
    assert is_valid_input("SW1A 1AA", "postal_code") is True
    assert is_valid_input("ab", "postal_code") is False


def test_is_valid_input_number():
    assert is_valid_input("12345", "number") is True
    assert is_valid_input("12.5", "number") is False
    assert is_valid_input("12a45", "number") is False


def test_is_valid_input_number_rejects_unicode_digits():
    # JS \d is ASCII-only; re.ASCII keeps the port exact, so Arabic-Indic
    # digits (U+0661..) fail here just like in the js-sdk.
    assert is_valid_input("\u0661\u0662\u0663", "number") is False


def test_is_valid_input_date():
    assert is_valid_input("2026-01-31", "date") is True
    assert is_valid_input("01/31/2026", "date") is True
    assert is_valid_input("January 31", "date") is False


def test_is_valid_input_date_anchoring_quirk():
    # Ported js-sdk bug: the ^ binds only to the YYYY-MM-DD alternative and
    # the $ only to the MM-DD-YYYY one, so trailing or leading garbage can
    # still match.
    assert is_valid_input("2026-01-31 with trailing text", "date") is True
    assert is_valid_input("note from 01/31/2026", "date") is True


def test_is_valid_input_unknown_validator():
    assert is_valid_input("anything", "ssn") is False


def test_is_valid_email():
    assert is_valid_email("test@example.com") is True
    assert is_valid_email("not-an-email") is False
    assert is_valid_email("") is False
    assert is_valid_email(None) is False


def test_is_valid_phone():
    assert is_valid_phone("+1 (555) 123-4567") is True
    assert is_valid_phone("letters only") is False
    assert is_valid_phone("") is False
    assert is_valid_phone(None) is False


def test_is_valid_role_name():
    roles = [make_role("Signer 1"), make_role("Signer 2")]

    assert is_valid_role_name("Signer 1", roles) is True
    assert is_valid_role_name("signer 1", roles) is False
    assert is_valid_role_name("Signer 3", roles) is False
    assert is_valid_role_name("Signer 1", []) is False


def test_is_valid_tag():
    assert is_valid_tag("alpha-1", []) is True
    assert is_valid_tag("has space", []) is False
    assert is_valid_tag("a" * 33, []) is False
    # A known tag passes regardless of format.
    assert is_valid_tag("has space", ["has space"]) is True
    assert is_valid_tag("a" * 33, ["a" * 33]) is True


def test_is_valid_tag_accepts_the_empty_string():
    # Ported js-sdk quirk: the pattern quantifier is {0,32}, so "" passes.
    assert is_valid_tag("", []) is True


# Envelopes/Fields.ts


def test_is_field_filled_textbox():
    assert is_field_filled(make_field(value="hello"), []) is True
    assert is_field_filled(make_field(value="   "), []) is False
    assert is_field_filled(make_field(value=""), []) is False
    assert is_field_filled(make_field(value=None), []) is False


def test_is_field_filled_textarea_uses_the_text_rules():
    assert is_field_filled(make_field("textarea", value="notes"), []) is True
    assert is_field_filled(make_field("textarea", value="  "), []) is False


def test_is_field_filled_textbox_email_validator():
    assert is_field_filled(make_field(value="test@example.com", validator="email"), []) is True
    assert is_field_filled(make_field(value="not-an-email", validator="email"), []) is False
    assert is_field_filled(make_field(value=None, validator="email"), []) is False


def test_is_field_filled_textbox_phone_validator():
    assert is_field_filled(make_field(value="(555) 123-4567", validator="phone"), []) is True
    assert is_field_filled(make_field(value="letters only", validator="phone"), []) is False


def test_is_field_filled_textbox_other_validators_fall_back_to_text_rules():
    # Only email and phone are special-cased in the js-sdk switch.
    assert is_field_filled(make_field(value="not a number", validator="number"), []) is True


def test_is_field_filled_signature():
    assert is_field_filled(make_field("signature", value="signed"), []) is True
    assert is_field_filled(make_field("signature", value="pending"), []) is False
    assert is_field_filled(make_field("signature", value=None), []) is False


def test_is_field_filled_initial():
    assert is_field_filled(make_field("initial", value="initialed"), []) is True
    assert is_field_filled(make_field("initial", value=""), []) is False


def test_is_field_filled_timestamp_is_always_filled():
    # Timestamp fields get automatically filled when the envelope is submitted.
    assert is_field_filled(make_field("timestamp", value=None), []) is True


def test_is_field_filled_date():
    assert is_field_filled(make_field("date", value="2026-01-31"), []) is True
    assert is_field_filled(make_field("date", value=""), []) is False
    assert is_field_filled(make_field("date", value=None), []) is False


def test_is_field_filled_attachment():
    assert is_field_filled(make_field("attachment", value="attached"), []) is True
    assert is_field_filled(make_field("attachment", value=None), []) is False


def test_is_field_filled_dropdown():
    assert is_field_filled(make_field("dropdown", value="option-1"), []) is True
    assert is_field_filled(make_field("dropdown", value=""), []) is False


def test_is_field_filled_dropdown_null_quirk():
    # Ported js-sdk quirk: only the empty string counts as unfilled for
    # dropdowns, so a null value passes the check.
    assert is_field_filled(make_field("dropdown", value=None), []) is True


def test_is_field_filled_checkbox():
    assert is_field_filled(make_field("checkbox", value="true"), []) is True
    assert is_field_filled(make_field("checkbox", value="false"), []) is False
    assert is_field_filled(make_field("checkbox", value=None), []) is False


def test_is_field_filled_radio_without_a_group():
    assert is_field_filled(make_field("radio", value="true"), []) is True
    assert is_field_filled(make_field("radio", value="false"), []) is False


def test_is_field_filled_radio_group_looks_across_the_group():
    field = make_field("radio", value=None, group="choices")
    selected_sibling = make_field("radio", value="true", group="choices", name="field-2")
    unselected_sibling = make_field("radio", value="false", group="choices", name="field-3")
    other_group = make_field("radio", value="true", group="other", name="field-4")

    assert is_field_filled(field, [field, selected_sibling, unselected_sibling]) is True
    assert is_field_filled(field, [field, unselected_sibling]) is False
    assert is_field_filled(field, [field, other_group]) is False


def test_is_field_filled_unknown_type():
    assert is_field_filled(make_field("payment", value="paid"), []) is False


def test_is_field_valid():
    assert is_field_valid(make_field(value="hello", required=True), []) is True
    assert is_field_valid(make_field(value=None, required=True), []) is False
    assert is_field_valid(make_field(value=None, required=False), []) is True
    # required is nullable on the wire; null means optional.
    assert is_field_valid(make_field(value=None), []) is True


def test_is_field_valid_optional_fields_skip_validation_entirely():
    # The js-sdk carries a TODO about this: a badly-formatted optional field
    # still passes. Ported as-is.
    assert is_field_valid(make_field(value="not-an-email", validator="email", required=False), []) is True
