"""Field-placement math (js-sdk: Utils/Fields.ts).

Field records store positions in PDF coordinates (origin bottom-left, in
document units); rendering surfaces use screen coordinates (origin top-left,
in pixels). These helpers convert between the two spaces.
"""

from __future__ import annotations

import base64


def get_r_top(y: float, field_height: float, i_text_height: float, y_ratio: float) -> float:
    """Return the rendered top offset for a field.

    Flips the y axis: PDF y grows upward from the page bottom, screen y grows
    downward from the top.

    Args:
        y: The field's PDF y position (bottom edge).
        field_height: The field's height in document units.
        i_text_height: The rendered page height in pixels.
        y_ratio: Pixels per document unit on the y axis.

    Returns:
        The top offset in pixels.
    """
    return i_text_height - (y + field_height) * y_ratio


def get_r_left(x: float, ratio: float) -> float:
    """Return the rendered left offset for a field: its PDF x scaled to pixels."""
    return x * ratio


def get_r_value(y: float, ratio: float) -> float:
    """Return a document-space value scaled to rendered pixels."""
    return y * ratio


def rescale(r: float, n: float) -> float:
    """Return a value scaled by a ratio."""
    return r * n


def bytes_to_base64(data: bytes) -> str:
    """Encode raw bytes as a base64 string.

    Adapted from the js-sdk's blobToBase64, which reads a browser Blob through
    FileReader and resolves a data URL. Python bytes carry no MIME type, so
    this returns the bare base64 payload; use files.bytes_to_data_url() when
    the "data:<type>;base64," prefix is needed.

    Args:
        data: The bytes to encode.

    Returns:
        The base64-encoded string.
    """
    return base64.b64encode(data).decode("ascii")
