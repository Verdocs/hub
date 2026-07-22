"""String helpers (js-sdk: Utils/Strings.ts)."""

from __future__ import annotations

import re
import secrets

# The digits Math.random().toString(36) can produce; random_string draws from
# the same alphabet so its output is interchangeable with the js-sdk's.
_BASE36_ALPHABET = "0123456789abcdefghijklmnopqrstuvwxyz"


def capitalize(value: str) -> str:
    """Return the string with its first letter uppercased.

    Args:
        value: The string to capitalize. May be empty.

    Returns:
        The input with the first character uppercased, other characters untouched.

    @sdkOperation string.capitalize
    @sdkGroup String
    @sdkPage Helpers
    """
    return value[:1].upper() + value[1:]


def convert_to_e164(value: str | None) -> str:
    """Convert a phone-number-like string to E.164 format, assuming US numbers.

    A value already prefixed with "+" is only trimmed: the caller set a country
    code deliberately, so non-US numbers pass through untouched. Everything
    else has punctuation stripped, one leading zero removed, and "+1" prepended
    (the js-sdk assumes US for unprefixed input, and we keep that).

    Example:
        convert_to_e164("(212) 555-1212")  # "+12125551212"
        convert_to_e164("+46766861004")    # "+46766861004"

    Args:
        value: The phone-number-like input; None is treated as empty.

    Returns:
        The E.164 string, or the trimmed input when it was blank or "+"-prefixed.

    @sdkOperation string.convertToE164
    @sdkGroup String
    @sdkPage Helpers
    """
    number = (value or "").strip()
    if not number or number.startswith("+"):
        return number

    number = re.sub(r"[^0-9]", "", number)
    # One leading zero comes off after the punctuation strip because it may
    # hide inside it, e.g. "(05..." as well as "0(5...".
    number = re.sub(r"^0", "", number)
    return f"+1{number}"


def random_string(length: int) -> str:
    """Generate a random lowercase-alphanumeric string of the given length.

    Adapted from the js-sdk, which slices Math.random().toString(36) and, due
    to an off-by-one in its substring bounds, actually returns length + 1
    characters. We draw exactly `length` characters from the same base36
    alphabet using the secrets module (per the true-up handoff), so the output
    is also safe for more than DOM-id duty.

    Args:
        length: Number of characters to generate.

    Returns:
        A random string of exactly `length` characters from [0-9a-z].

    @sdkOperation string.randomString
    @sdkGroup String
    @sdkPage Helpers
    """
    return "".join(secrets.choice(_BASE36_ALPHABET) for _ in range(length))
