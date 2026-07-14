"""Signer color helpers (js-sdk: Utils/Colors.ts).

Field placements are tinted per recipient role; these helpers pick the tint.
The outputs must match the js-sdk byte for byte because both SDKs feed the
same rendering surfaces, so the JS number quirks (truncated modulo, 32-bit
hash wraparound, round-half-up) are reproduced deliberately below.
"""

from __future__ import annotations

import math
from collections.abc import Sequence

# Colors for role indexes 1-9; index 0 is special-cased in get_rgba. The ".4"
# spellings (no leading zero) are what the js-sdk emits; keep them byte-exact.
_ROLE_COLORS = {
    1: "rgba(156, 39, 176, .4)",
    2: "rgba(33, 150, 243, .4)",
    3: "rgba(220, 231, 117, 0.3)",
    4: "rgba(121, 134, 203, 0.3)",
    5: "rgba(77, 182, 172, 0.3)",
    6: "rgba(255, 202, 165, 0.3)",
    7: "rgba(2, 247, 190, 0.3)",
    8: "rgba(255, 138, 101, 0.3)",
    9: "rgba(82, 255, 79, 0.3)",
}
_DEFAULT_COLOR = "rgba(229, 115, 155, 0.3)"


def _js_round(value: float) -> int:
    # JS Math.round rounds half toward +infinity; Python's round() banks to
    # even, so 0.5 would drift down.
    return math.floor(value + 0.5)


def _to_int32(value: int) -> int:
    # ECMAScript ToInt32: wrap to 32 bits, then reinterpret as signed.
    value &= 0xFFFFFFFF
    return value - 0x100000000 if value >= 0x80000000 else value


def _rgb_to_hex(value: int) -> str:
    digits = format(value, "x")
    if len(digits) < 2:
        return "0" + digits
    return digits


def get_rgb(rgba: str) -> str:
    """Convert an "rgba(r,g,b,a)" string to its hex equivalent, dropping alpha.

    The alpha channel is composited against white first, so the hex color is
    what the translucent tint actually looks like on a page.

    Args:
        rgba: A CSS rgba() string, e.g. "rgba(255, 193, 7, 0.4)".

    Returns:
        The lowercase hex color, e.g. "#ffe69c".
    """
    parts = rgba.replace("rgba(", "", 1).replace(")", "", 1).split(",")
    red_in, green_in, blue_in, alpha_in = (float(part) for part in parts[:4])

    inverse = 1 - alpha_in
    red = _js_round((alpha_in * (red_in / 255) + inverse) * 255)
    green = _js_round((alpha_in * (green_in / 255) + inverse) * 255)
    blue = _js_round((alpha_in * (blue_in / 255) + inverse) * 255)
    return "#" + _rgb_to_hex(red) + _rgb_to_hex(green) + _rgb_to_hex(blue)


def get_rgba(role_index: int) -> str:
    """Return the color code for a signer given its role index.

    Indexes cycle through ten colors; index 0 gets its own shade so the first
    signer stands out from every tenth one after it.

    Args:
        role_index: Zero-based index of the role in the template's role list.

    Returns:
        A CSS rgba() string.
    """
    # JS % truncates toward zero, so a negative index matches no case and
    # falls to the default color; Python % would map -1 to 9 instead.
    remainder = abs(role_index) % 10
    if role_index < 0:
        remainder = -remainder

    if remainder == 0:
        return "rgba(255, 193, 7, 0.4)" if role_index == 0 else "rgba(134, 134, 134, 0.3)"
    return _ROLE_COLORS.get(remainder, _DEFAULT_COLOR)


def name_to_rgba(name: str | None) -> str | None:
    """Derive a stable color code from a role name.

    The color is not specified explicitly: a hash of the name picks it, so the
    same name always yields the same color. Matches the js-sdk hash (including
    its 32-bit shift wraparound) so both SDKs tint a given role identically.

    Args:
        name: The role name. Names ending in a digit get extra hash input so
            "Signer 1" and "Signer 2" land on visibly different colors.

    Returns:
        A CSS rgba() string, or None for an empty name (the js-sdk returns
        undefined there).
    """
    if not name:
        return None

    # Only ASCII digits count, mirroring JS parseInt on the last character.
    if name[-1] in "0123456789":
        name += str(int(name[-1]) * 99)

    # We walk code points where JS walks UTF-16 units; identical for BMP text,
    # which role names are in practice.
    hash_value = 0
    for ch in name:
        shifted = _to_int32(_to_int32(hash_value) << 5)
        hash_value = ord(ch) + (shifted - hash_value)

    hash_value = _js_round(hash_value / 1.3)
    # Python's & already gives two's-complement semantics for negatives, which
    # is exactly what the JS ToInt32-and-mask does here.
    masked = hash_value & 0x00FFFF08

    digits = format(masked, "X")
    hex_color = "00000"[: 6 - len(digits)] + digits
    red = int(hex_color[0:2], 16)
    green = int(hex_color[2:4], 16)
    blue = int(hex_color[4:6], 16)
    return f"rgba({red}, {green}, {blue}, 0.2)"


def get_role_color(name: str, roles: Sequence[str] | None, index: int | None = None) -> str | None:
    """Pick a color code for a role name from whichever inputs are available.

    An explicit index wins, then the name's position in the roles list, and a
    name absent from the list falls back to the name hash.

    Args:
        name: The role name to color.
        roles: The template's role names, in order. May be None or empty.
        index: Explicit role index. The js-sdk checks truthiness, so 0 falls
            through to the roles lookup; we keep that quirk.

    Returns:
        A CSS rgba() string, or None when only an empty name is available.
    """
    if index:
        return get_rgba(index)
    if roles:
        try:
            return get_rgba(roles.index(name))
        except ValueError:
            return name_to_rgba(name)
    return name_to_rgba(name)
