"""File and data-URL helpers (js-sdk: Utils/Files.ts).

The js-sdk module is browser-bound. fileToDataUrl (File plus FileReader) is
adapted here as bytes_to_data_url; downloadBlob has no port because it exists
only to trigger a browser download dialog through a synthetic anchor click,
and Python callers write bytes to disk directly.
"""

from __future__ import annotations

import base64


def bytes_to_data_url(data: bytes, content_type: str) -> str:
    """Encode bytes as a base64 data URL with the given MIME type.

    Adapted from the js-sdk's fileToDataUrl. That helper returns the browser
    File's metadata alongside the data URL; bytes have no metadata, so this
    returns the data URL string directly.

    Example:
        bytes_to_data_url(png_bytes, "image/png")  # "data:image/png;base64,iVBORw0K..."

    Args:
        data: The file content.
        content_type: The MIME type to embed, e.g. "application/pdf".

    Returns:
        The "data:<type>;base64,<payload>" string.
    """
    return f"data:{content_type};base64,{base64.b64encode(data).decode('ascii')}"
