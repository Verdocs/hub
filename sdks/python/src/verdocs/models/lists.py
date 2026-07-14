"""Field-placement constants and permission names (js-sdk: Lists.ts)."""

from __future__ import annotations

from .base import FieldType

FIELD_TYPES: tuple[FieldType, ...] = (
    "textbox",
    "signature",
    "initial",
    "date",
    "dropdown",
    "timestamp",
    # Deprecated upstream: use textbox with multiline instead. Kept so the
    # list still covers everything the server accepts.
    "textarea",
    "checkbox",
    "radio",
    "attachment",
    "payment",
)

# Default sizes (in document units) applied when a field is first placed.
DEFAULT_FIELD_WIDTHS: dict[FieldType, int] = {
    "signature": 71,
    "initial": 71,
    "date": 75,
    "timestamp": 130,
    "textbox": 150,
    "textarea": 150,
    "checkbox": 14,
    "radio": 14,
    "dropdown": 85,
    "attachment": 24,
    "payment": 24,
}

DEFAULT_FIELD_HEIGHTS: dict[FieldType, int] = {
    "signature": 36,
    "initial": 36,
    "date": 15,
    "timestamp": 15,
    "textbox": 15,
    "textarea": 41,
    "checkbox": 14,
    "radio": 14,
    "dropdown": 20,
    "attachment": 24,
    "payment": 24,
}

ALL_PERMISSIONS: tuple[str, ...] = (
    "template:creator:create:public",
    "template:creator:create:org",
    "template:creator:create:personal",
    "template:creator:delete",
    "template:creator:visibility",
    "template:member:read",
    "template:member:write",
    "template:member:delete",
    "template:member:visibility",
    "owner:add",
    "owner:remove",
    "admin:add",
    "admin:remove",
    "member:view",
    "member:add",
    "member:remove",
    "org:create",
    "org:view",
    "org:update",
    "org:delete",
    "org:transfer",
    "org:list",
    "envelope:create",
    "envelope:cancel",
    "envelope:view",
)
