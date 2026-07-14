"""Data-URL building (verdocs.utils.files)."""

from __future__ import annotations

from verdocs.utils import bytes_to_data_url


def test_bytes_to_data_url():
    assert bytes_to_data_url(b"hello", "text/plain") == "data:text/plain;base64,aGVsbG8="


def test_bytes_to_data_url_empty_payload():
    assert bytes_to_data_url(b"", "application/pdf") == "data:application/pdf;base64,"


def test_bytes_to_data_url_prefix_shape():
    # The prefix must look exactly like FileReader.readAsDataURL output so
    # downstream consumers can split on the first comma.
    url = bytes_to_data_url(b"\x89PNG", "image/png")
    prefix, payload = url.split(",", 1)
    assert prefix == "data:image/png;base64"
    assert payload == "iVBORw=="
