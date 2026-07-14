"""Field-placement math (verdocs.utils.fields)."""

from __future__ import annotations

from verdocs.utils import bytes_to_base64, get_r_left, get_r_top, get_r_value, rescale


def test_get_r_top_flips_the_y_axis():
    # A field 20 units tall sitting 10 units above the page bottom, rendered
    # on a 792px-tall page at 1.5px per unit: 792 - (10 + 20) * 1.5.
    assert get_r_top(10, 20, 792, 1.5) == 747.0


def test_get_r_top_at_page_bottom():
    assert get_r_top(0, 0, 792, 1.5) == 792.0


def test_get_r_left():
    assert get_r_left(100, 0.75) == 75.0


def test_get_r_value():
    assert get_r_value(50, 1.5) == 75.0


def test_rescale():
    assert rescale(1.5, 40) == 60.0
    assert rescale(0, 40) == 0


def test_bytes_to_base64():
    assert bytes_to_base64(b"hello") == "aGVsbG8="
    assert bytes_to_base64(b"") == ""
    # Bare payload, no data-URL prefix; that lives in files.bytes_to_data_url.
    assert not bytes_to_base64(b"hello").startswith("data:")
