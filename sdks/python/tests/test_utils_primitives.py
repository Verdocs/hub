"""Name and sequence primitives (verdocs.utils.primitives).

The format_full_name cases port js-sdk __tests__/Utils/Primitives.spec.ts.
"""

from __future__ import annotations

from types import SimpleNamespace

from verdocs.utils import format_full_name, format_initials, full_name_to_initials, integer_sequence


def test_integer_sequence():
    assert integer_sequence(0, 5) == [0, 1, 2, 3, 4]
    assert integer_sequence(3, 4) == [3, 4, 5, 6]
    assert integer_sequence(5, 0) == []


def test_format_full_name_spec_cases():
    assert format_full_name() == ""
    assert format_full_name({}) == ""
    assert format_full_name({"first_name": "test"}) == "Test"
    assert format_full_name({"last_name": "user"}) == "User"
    assert format_full_name({"first_name": "test", "last_name": "user"}) == "Test User"


def test_format_full_name_accepts_attribute_objects():
    # Pydantic models and other objects read through attributes.
    assert format_full_name(SimpleNamespace(first_name="sally", last_name="signer")) == "Sally Signer"


def test_format_full_name_treats_none_names_as_empty():
    assert format_full_name({"first_name": None, "last_name": "user"}) == "User"


def test_format_initials():
    assert format_initials({"first_name": "test", "last_name": "user"}) == "T U"
    assert format_initials(SimpleNamespace(first_name="sally", last_name="signer")) == "S S"


def test_format_initials_without_profile():
    assert format_initials() == "--"
    assert format_initials(None) == "--"


def test_full_name_to_initials():
    assert full_name_to_initials("John Doe") == "JD"
    # A double space yields an empty word, which contributes nothing (in js,
    # undefined joins as "").
    assert full_name_to_initials("John  Doe") == "JD"
    assert full_name_to_initials("") == ""
    # No capitalization here, matching the js-sdk.
    assert full_name_to_initials("jane ann doe") == "jad"
