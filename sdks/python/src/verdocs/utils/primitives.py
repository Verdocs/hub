"""Name and sequence primitives (js-sdk: Utils/Primitives.ts)."""

from __future__ import annotations

from collections.abc import Mapping
from typing import Any

from .strings import capitalize


def _read(source: Any, field: str) -> Any:
    # The js-sdk takes structural objects; the Python equivalents are dicts
    # (raw payloads) and pydantic models (parsed ones), so we accept both.
    if isinstance(source, Mapping):
        return source.get(field)
    return getattr(source, field, None)


def integer_sequence(start: int, count: int) -> list[int]:
    """Return a list of consecutive integers, e.g. [start, start + 1, ...].

    Frequently useful in rendering when there is no source list to iterate.

    Args:
        start: The first value.
        count: How many values to produce.

    Returns:
        A list of `count` integers beginning at `start`.
    """
    return list(range(start, start + count))


def format_full_name(source: Any = None) -> str:
    """Format a profile-like record's full name, capitalized.

    Args:
        source: Anything carrying first_name and last_name, as keys or
            attributes (a dict, a Profile, a Recipient). None and missing
            names are treated as empty.

    Returns:
        "First Last", trimmed, so a single known name comes back alone and
        no names at all come back as "".
    """
    first = capitalize(_read(source, "first_name") or "")
    last = capitalize(_read(source, "last_name") or "")
    return f"{first} {last}".strip()


def format_initials(profile: Any = None) -> str:
    """Format a profile's initials, e.g. "T U", with "--" for no profile.

    Args:
        profile: Anything carrying first_name and last_name, as keys or
            attributes. The js-sdk assumes both names are present; we treat
            a missing one as empty rather than raising.

    Returns:
        The space-separated uppercase initials, or "--" when there is no
        profile to read.
    """
    if not profile:
        return "--"
    first = capitalize(_read(profile, "first_name") or "")
    last = capitalize(_read(profile, "last_name") or "")
    return f"{first[:1]} {last[:1]}"


def full_name_to_initials(name: str) -> str:
    """Generate suggested initials for a full name, e.g. "John Doe" yields "JD".

    Splits on single spaces and keeps each word's first character unchanged,
    matching the js-sdk (which does not uppercase here).

    Args:
        name: The full name.

    Returns:
        The concatenated first characters.
    """
    return "".join(word[:1] for word in name.split(" "))
