"""Short relative timestamps (verdocs.utils.dates).

Offsets sit safely inside their unit's range: the moments are built
microseconds before the call, so a boundary can only be crossed by a full
second of delay between the two.
"""

from __future__ import annotations

import time
from datetime import datetime, timedelta, timezone

import pytest

from verdocs.utils import format_short_time_ago


def _ago(**kwargs) -> datetime:
    return datetime.now(timezone.utc) - timedelta(**kwargs)


def test_none_is_empty():
    assert format_short_time_ago(None) == ""


@pytest.mark.parametrize(
    ("delta", "expected"),
    [
        (timedelta(seconds=5), "5S"),
        (timedelta(seconds=59), "59S"),
        (timedelta(seconds=90), "1M"),
        (timedelta(minutes=59), "59M"),
        (timedelta(hours=2), "2H"),
        (timedelta(hours=26), "1D"),
        (timedelta(days=6), "6D"),
        (timedelta(days=7), "1W"),
        # No month unit (commented out in the js-sdk), so weeks run up to a year.
        (timedelta(days=30), "4W"),
        (timedelta(days=364), "52W"),
        (timedelta(days=400), "1Y"),
        (timedelta(days=800), "2Y"),
    ],
)
def test_unit_ladder(delta: timedelta, expected: str):
    assert format_short_time_ago(datetime.now(timezone.utc) - delta) == expected


def test_just_now_is_zero_seconds():
    assert format_short_time_ago(datetime.now(timezone.utc)) == "0S"


def test_future_moment_goes_negative():
    # No guard in the js-sdk either; the count just goes negative.
    assert format_short_time_ago(_ago(seconds=-5)) == "-5S"


def test_naive_datetime_reads_as_local_time():
    assert format_short_time_ago(datetime.now() - timedelta(minutes=5)) == "5M"


def test_iso_string_with_z_suffix():
    value = _ago(hours=2).isoformat().replace("+00:00", "Z")
    assert format_short_time_ago(value) == "2H"


def test_iso_string_with_offset():
    assert format_short_time_ago(_ago(days=3).isoformat()) == "3D"


def test_epoch_milliseconds():
    assert format_short_time_ago((time.time() - 3 * 24 * 60 * 60) * 1000) == "3D"


def test_unparseable_string_is_empty():
    # Adapted: the js-sdk builds an Invalid Date here and renders "NaNS".
    assert format_short_time_ago("not a date") == ""


def test_unsupported_types_are_empty():
    assert format_short_time_ago([1, 2]) == ""
    # bool is an int subclass in Python, but js typeof calls it boolean and bails.
    assert format_short_time_ago(True) == ""
