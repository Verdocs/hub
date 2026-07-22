"""Field-input validators and fill checks (js-sdk: Templates/Validators.ts, Envelopes/Fields.ts).

These run entirely client-side and never call the API. The regexes are ported
byte-for-byte from the js-sdk and evaluated with search() to match JS
RegExp.test semantics: patterns without anchors match anywhere in the string.
Validators always check strings, because that is all a user can enter in an
HTML input field, and they never raise: they just return a boolean.
"""

from __future__ import annotations

import re
from typing import TypedDict

from .models import EnvelopeField, Role

_EMAIL_REGEX = re.compile(
    r'^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))'
    r"@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$"
)

# The js-sdk credits https://www.regextester.com/1978 for this pattern. re.ASCII pins \d to [0-9],
# matching the JS \d, so unicode digits do not pass where the js-sdk rejects them.
_PHONE_REGEX = re.compile(
    r"((?:\+|00)[17](?: |\-)?|(?:\+|00)[1-9]\d{0,2}(?: |\-)?|(?:\+|00)1\-\d{3}(?: |\-)?)?"
    r"(0\d|\([0-9]{3}\)|[1-9]{0,3})"
    r"(?:((?: |\-)[0-9]{2}){4}|((?:[0-9]{2}){4})|((?: |\-)[0-9]{3}(?: |\-)[0-9]{4})|([0-9]{7}))",
    re.ASCII,
)

_URL_REGEX = re.compile(
    r"https?://(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)"
)

_POSTAL_CODE_REGEX = re.compile(r"^[A-Za-z0-9-\s]{3,10}$")

_NUMBER_REGEX = re.compile(r"^\d+$", re.ASCII)

# Ported verbatim, including the js-sdk's anchoring quirk: the ^ binds only to the first alternative
# and the $ only to the second, so trailing garbage after a YYYY-MM-DD date (or leading garbage before
# a MM-DD-YYYY one) still matches.
_DATE_REGEX = re.compile(r"^(\d{4}[-/]\d{2}[-/]\d{2})|(\d{2}[-/]\d{2}[-/]\d{4})$", re.ASCII)


class _Validator(TypedDict):
    regex: re.Pattern[str]
    label: str


_VALIDATORS: dict[str, _Validator] = {
    "email": {"regex": _EMAIL_REGEX, "label": "Email Address"},
    "phone": {"regex": _PHONE_REGEX, "label": "Phone Number"},
    "url": {"regex": _URL_REGEX, "label": "URL"},
    "postal_code": {"regex": _POSTAL_CODE_REGEX, "label": "Zip/Postal Code"},
    "number": {"regex": _NUMBER_REGEX, "label": "Number"},
    "date": {"regex": _DATE_REGEX, "label": "Date"},
}

_TAG_REGEX = re.compile(r"^[a-zA-Z0-9-]{0,32}$")


def is_valid_input(value: str, validator: str) -> bool:
    """Check a value against one of the named field validators.

    Ports js-sdk Templates/Validators.ts isValidInput.

    Args:
        value: The value to check.
        validator: The validator name; see get_validators for the options.

    Returns:
        True when the validator exists and the value passes it.
    """
    entry = _VALIDATORS.get(validator)
    return entry is not None and entry["regex"].search(value) is not None


def get_validators() -> list[str]:
    """Get the list of available validators for field inputs.

    Ports js-sdk Templates/Validators.ts getValidators.

    Returns:
        The validator names accepted by is_valid_input.
    """
    return list(_VALIDATORS)


def is_valid_email(email: str | None) -> bool:
    """Check whether a string looks like an email address.

    Ports js-sdk Templates/Validators.ts isValidEmail.

    Args:
        email: The value to check; None and the empty string fail.

    Returns:
        True when the value passes the email pattern.
    """
    return bool(email) and _EMAIL_REGEX.search(email) is not None


def is_valid_phone(phone: str | None) -> bool:
    """Check whether a string looks like a phone number.

    Ports js-sdk Templates/Validators.ts isValidPhone.

    Args:
        phone: The value to check; None and the empty string fail.

    Returns:
        True when the value passes the phone pattern.
    """
    return bool(phone) and _PHONE_REGEX.search(phone) is not None


def is_valid_role_name(value: str, roles: list[Role]) -> bool:
    """Check whether a value names one of the template's roles.

    Ports js-sdk Templates/Validators.ts isValidRoleName.

    Args:
        value: The role name to look for.
        roles: The template's roles.

    Returns:
        True when a role with that exact name exists.
    """
    return any(role.name == value for role in roles)


def is_valid_tag(value: str, tags: list[str]) -> bool:
    """Check whether a value is usable as a template tag.

    Ports js-sdk Templates/Validators.ts isValidTag: the value must be 0-32
    alphanumeric-or-dash characters (yes, the empty string passes; ported
    as-is), or already present in the known tag list.

    Args:
        value: The tag to check.
        tags: Already-known tags, which pass regardless of format.

    Returns:
        True when the tag is well formed or already known.
    """
    return _TAG_REGEX.search(value) is not None or value in tags


# Envelopes/Fields.ts


def is_field_filled(field: EnvelopeField, all_recipient_fields: list[EnvelopeField]) -> bool:
    """Check whether an envelope field has been filled in.

    Ports js-sdk Envelopes/Fields.ts isFieldFilled. Text fields honor their
    email/phone validator; signature-like fields expect their marker values
    (signed, initialed, attached); timestamps count as filled because they are
    stamped automatically at submit; radio fields with a group count as filled
    when any field in the group is selected. One ported quirk: a dropdown with
    a null value counts as filled, because the js-sdk only treats the empty
    string as unfilled there.

    Args:
        field: The field to check.
        all_recipient_fields: Every field belonging to the same recipient,
            used to resolve radio groups.

    Returns:
        True when the field holds a submitted value.
    """
    value = field.value
    match field.type:
        case "textarea" | "textbox":
            match field.validator or "":
                case "email":
                    return bool(value) and is_valid_input(value, "email")
                case "phone":
                    return bool(value) and is_valid_input(value, "phone")
                case _:
                    return (value or "").strip() != ""

        case "signature":
            return value == "signed"

        case "initial":
            return value == "initialed"

        # Timestamp fields get automatically filled when the envelope is submitted.
        case "timestamp":
            return True

        case "date":
            return bool(value)

        case "attachment":
            return value == "attached"

        case "dropdown":
            return value != ""

        case "checkbox":
            return value == "true"

        case "radio":
            if field.group:
                return any(f.value == "true" for f in all_recipient_fields if f.group == field.group)

            return field.value == "true"

        case _:
            return False


def is_field_valid(field: EnvelopeField, all_recipient_fields: list[EnvelopeField]) -> bool:
    """Check whether an envelope field is valid for submission.

    Ports js-sdk Envelopes/Fields.ts isFieldValid: optional fields always
    pass, required fields must be filled. The js-sdk carries an open TODO to
    only let optional fields skip validation when they are empty; we mirror
    the current behavior, so a badly-formatted optional field still passes.

    Args:
        field: The field to check.
        all_recipient_fields: Every field belonging to the same recipient,
            used to resolve radio groups.

    Returns:
        True when the field may be submitted.
    """
    return not field.required or is_field_filled(field, all_recipient_fields)
