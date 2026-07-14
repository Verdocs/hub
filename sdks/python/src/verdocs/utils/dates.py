"""Compact relative timestamps (js-sdk: Utils/DateTime.ts)."""

from __future__ import annotations

import math
from datetime import datetime, timezone

_YEAR = 365 * 24 * 60 * 60
# No month unit: the js-sdk comments it out, so weeks run all the way up to a
# year (e.g. 30 days ago renders as "4W").
_WEEK = 7 * 24 * 60 * 60
_DAY = 24 * 60 * 60
_HOUR = 60 * 60
_MINUTE = 60


def _parse_iso(value: str) -> datetime | None:
    # The API speaks ISO 8601 with a trailing Z; fromisoformat only learned
    # that suffix in 3.11 and our floor is 3.10, so we swap it ourselves.
    if value.endswith(("Z", "z")):
        value = value[:-1] + "+00:00"
    try:
        return datetime.fromisoformat(value)
    except ValueError:
        return None


def format_short_time_ago(val: datetime | str | int | float | None) -> str:
    """Format how long ago a moment was as a compact unit string, e.g. "5M".

    Units are S, M (minutes), H, D, W, and Y, matching the js-sdk output byte
    for byte. Accepts a datetime (naive datetimes are read as local time, the
    same way JS reads zone-less date strings), an ISO 8601 string, or a
    JS-style number of milliseconds since the epoch.

    Args:
        val: The moment to describe. None, unsupported types, and unparseable
            strings yield "".

    Returns:
        The elapsed time as "<n><unit>", or "" when there is nothing to format.
        A future moment comes out with a negative count, as in the js-sdk.
    """
    if val is None:
        return ""

    if isinstance(val, datetime):
        moment = val
    elif isinstance(val, str):
        parsed = _parse_iso(val)
        if parsed is None:
            return ""
        moment = parsed
    elif isinstance(val, bool):
        # bool is an int in Python, but JS typeof calls it "boolean" and bails.
        return ""
    elif isinstance(val, (int, float)):
        moment = datetime.fromtimestamp(val / 1000, tz=timezone.utc)
    else:
        return ""

    now = datetime.now(timezone.utc) if moment.tzinfo else datetime.now()
    seconds = math.floor((now - moment).total_seconds())

    if seconds >= _YEAR:
        return f"{seconds // _YEAR}Y"
    if seconds >= _WEEK:
        return f"{seconds // _WEEK}W"
    if seconds >= _DAY:
        return f"{seconds // _DAY}D"
    if seconds >= _HOUR:
        return f"{seconds // _HOUR}H"
    if seconds >= _MINUTE:
        return f"{seconds // _MINUTE}M"
    return f"{seconds}S"
