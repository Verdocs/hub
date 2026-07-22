"""Entitlement collapsing (js-sdk: Utils/Entitlements.ts)."""

from __future__ import annotations

from datetime import datetime, timezone

from ..models.core import Entitlement
from ..models.organizations import ActiveEntitlements


def collapse_entitlements(entitlements: list[Entitlement]) -> ActiveEntitlements:
    """Collapse raw entitlement records down to the active one per feature.

    Only entries whose date window covers now survive, and the first record
    per feature wins, so presence of a key means the feature is currently
    enabled. This is the client-side twin of what
    organizations.get_active_entitlements() returns.

    Args:
        entitlements: The raw records, e.g. from organizations.get_entitlements().

    Returns:
        Feature name to the entitlement record currently granting it.

    @sdkOperation entitlement.collapseEntitlements
    @sdkGroup Entitlement
    @sdkPage Helpers
    """
    now = datetime.now(timezone.utc)
    active: ActiveEntitlements = {}
    for entitlement in entitlements:
        if entitlement.starts_at <= now <= entitlement.ends_at and entitlement.feature not in active:
            active[entitlement.feature] = entitlement
    return active
