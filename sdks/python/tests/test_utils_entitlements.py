"""Entitlement collapsing (verdocs.utils.entitlements).

Ports the js-sdk Organizations/Entitlements.spec.ts cases. The sample windows
are computed relative to now on purpose (a weekend fix upstream): the spec
must keep passing regardless of when it runs.
"""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Any

from verdocs.models import Entitlement
from verdocs.utils import collapse_entitlements

_NOW = datetime.now(timezone.utc)
YESTERDAY = (_NOW - timedelta(days=1)).isoformat()
TOMORROW = (_NOW + timedelta(days=1)).isoformat()
LAST_MONTH = (_NOW - timedelta(days=30)).isoformat()
LAST_WEEK = (_NOW - timedelta(days=7)).isoformat()


def _entitlement(**overrides: Any) -> Entitlement:
    payload: dict[str, Any] = {
        "id": "eae89e66-83bc-44f7-bb35-a8ef55958b3e",
        "organization_id": "eae89e66-83bc-44f7-bb35-a8ef55958b3e",
        "contract_id": "1234",
        "notes": "Active kba_auth entitlement",
        "feature": "kba_auth",
        "monthly_max": -1,
        "yearly_max": 5000,
        "starts_at": YESTERDAY,
        "ends_at": TOMORROW,
        "created_at": LAST_MONTH,
    }
    payload.update(overrides)
    return Entitlement.model_validate(payload)


SAMPLE_ENTITLEMENTS = [
    _entitlement(),
    _entitlement(
        id="98e94415-90b9-4601-a7bf-6557c7f4d426",
        contract_id="A",
        notes="Second active kba_auth entitlement, should lose to the first",
        yearly_max=-1,
    ),
    _entitlement(
        id="c8127c99-be1c-4c4c-af52-cbaf220c4059",
        organization_id="eae89e66-83bc-4c4c-af52-cbaf220c4059",
        contract_id="asdf",
        notes="Expired passcode_auth entitlement",
        feature="passcode_auth",
        monthly_max=-1,
        yearly_max=-1,
        starts_at=LAST_MONTH,
        ends_at=LAST_WEEK,
    ),
]


def test_collapse_entitlements_distills_properly():
    collapsed = collapse_entitlements(SAMPLE_ENTITLEMENTS)

    # One active entry per feature, first match wins, expired entries dropped.
    assert collapsed["kba_auth"].id == SAMPLE_ENTITLEMENTS[0].id
    assert "passcode_auth" not in collapsed
    assert list(collapsed) == ["kba_auth"]


def test_collapse_entitlements_skips_future_windows():
    day_after = (_NOW + timedelta(days=2)).isoformat()
    upcoming = _entitlement(id="future", feature="sms_auth", starts_at=TOMORROW, ends_at=day_after)
    assert collapse_entitlements([upcoming]) == {}


def test_collapse_entitlements_empty_input():
    assert collapse_entitlements([]) == {}
