"""Every models module exposes its exports and the barrels re-export them.

Smoke coverage for the models/ package split: the old single-module import
paths must keep working, and each new module must carry its full surface.
"""

from __future__ import annotations

import verdocs
from verdocs import models
from verdocs.models import (
    ALL_PERMISSIONS,
    DEFAULT_FIELD_HEIGHTS,
    DEFAULT_FIELD_WIDTHS,
    FIELD_TYPES,
    WEBHOOK_EVENTS,
    SigningSession,
    TemplateCreateParams,
    UserSession,
    VerdocsModel,
)

BASE_EXPORTS = [
    "AccessKeyType",
    "DeprecatedHistoryEvent",
    "EntitlementFeature",
    "EnvelopeDocumentType",
    "EnvelopeStatus",
    "EventDetail",
    "EventName",
    "FieldType",
    "HistoryEvent",
    "NotificationType",
    "RecipientAction",
    "RecipientAuthMethod",
    "RecipientAuthStep",
    "RecipientStatus",
    "RecipientType",
    "RequestStatus",
    "TemplateAction",
    "TemplateSender",
    "TemplateSortBy",
    "TemplateVisibility",
    "UsageType",
    "WebhookAuthMethod",
    "WebhookEvent",
    "WEBHOOK_EVENTS",
]

CORE_MODEL_EXPORTS = [
    "AccessKey",
    "ApiKey",
    "Brand",
    "Channel",
    "DisabledChannel",
    "DomainStatus",
    "DropdownOption",
    "EmailAccessKey",
    "EmailDomainStatus",
    "Entitlement",
    "Envelope",
    "EnvelopeDocument",
    "EnvelopeField",
    "EnvelopeFieldOptions",
    "EnvelopeFieldSettings",
    "EnvelopeHistory",
    "EnvelopeUpdateResult",
    "Group",
    "GroupProfile",
    "InAppAccessKey",
    "InPersonAccessKey",
    "Initial",
    "KBAQuestion",
    "KbaPINRequired",
    "Notification",
    "NotificationTemplate",
    "Number",
    "OAuth2App",
    "Organization",
    "OrganizationApiKey",
    "OrganizationInvitation",
    "OrganizationUsage",
    "PageSize",
    "PendingWebhook",
    "PipelineSettings",
    "Profile",
    "Recipient",
    "Role",
    "SMSAccessKey",
    "SignInProvider",
    "Signature",
    "Template",
    "TemplateDocument",
    "TemplateField",
    "TemplateFieldSetting",
    "TextFieldSetting",
    "User",
    "UserMFA",
    "VerdocsModel",
    "Webhook",
    "WebhookEvents",
]

USERS_MODULE_EXPORTS = [
    "LoginCodeGrantRequest",
    "MFABackupCodes",
    "MFAChallenge",
    "MFAEnrollment",
    "MFAOtpGrantRequest",
    "MFARecoveryCodeGrantRequest",
    "MFAStatus",
    "MFAType",
    "RevokeSessionsResponse",
    "SocialLoginProvider",
    "SocialProviders",
    "UserLoginSession",
]

MOVED_MODULE_EXPORTS = [
    "AuthenticateResponse",
    "SigningSession",
    "TemplateCreateParams",
    "TemplateList",
    "TemplateListParams",
    "TemplateSortBy",
    "TemplateUpdateParams",
    "TemplateVisibility",
    "TemplateVisibilityFilter",
    "UserSession",
]


def test_base_and_core_exports_are_reachable():
    for name in BASE_EXPORTS + CORE_MODEL_EXPORTS + MOVED_MODULE_EXPORTS + USERS_MODULE_EXPORTS:
        assert hasattr(models, name), f"verdocs.models.{name} is missing"


def test_api_key_permission_is_gone():
    # The deployed API has no permission field on keys; the old Literal must not linger anywhere.
    assert not hasattr(models, "ApiKeyPermission")
    assert not hasattr(verdocs, "ApiKeyPermission")
    assert "ApiKeyPermission" not in verdocs.__all__


def test_package_barrel_exposes_account_security_surface():
    for name in USERS_MODULE_EXPORTS + [
        "MFARequiredError",
        "UserMFA",
        "SignInProvider",
        "create_code_challenge",
        "create_code_verifier",
        "get_mfa_challenge",
        "is_mfa_required",
    ]:
        assert hasattr(verdocs, name), f"verdocs.{name} is missing"
        assert name in verdocs.__all__


def test_package_barrel_exposes_shared_wire_models():
    for name in ["Envelope", "Recipient", "Organization", "Webhook", "ApiKey", "Brand", "AccessKey"]:
        assert hasattr(verdocs, name), f"verdocs.{name} is missing"
        assert name in verdocs.__all__


def test_moved_models_keep_working():
    # These moved from the old single models.py; the import path and shapes must not change.
    session = UserSession.model_validate({"sub": "user-1", "session_type": "user"})
    assert session.sub == "user-1"

    signing = SigningSession.model_validate({"envelope_id": "env-1", "role_name": "Recipient 1"})
    assert signing.envelope_id == "env-1"

    params = TemplateCreateParams(name="NDA")
    assert params.model_dump(mode="json", exclude_unset=True) == {"name": "NDA"}

    assert issubclass(TemplateCreateParams, VerdocsModel)


def test_webhook_events_constant_matches_the_js_sdk_list():
    assert len(WEBHOOK_EVENTS) == 23
    assert len(set(WEBHOOK_EVENTS)) == 23
    assert WEBHOOK_EVENTS[0] == "envelope_created"
    assert WEBHOOK_EVENTS[-1] == "organization_deleted"


def test_field_lists_are_consistent():
    assert len(FIELD_TYPES) == 11
    # Every placeable field type has a default size, and nothing extra.
    assert set(DEFAULT_FIELD_WIDTHS) == set(FIELD_TYPES)
    assert set(DEFAULT_FIELD_HEIGHTS) == set(FIELD_TYPES)
    assert DEFAULT_FIELD_WIDTHS["signature"] == 71
    assert DEFAULT_FIELD_HEIGHTS["signature"] == 36


def test_all_permissions_list():
    assert len(ALL_PERMISSIONS) == 25
    assert "envelope:create" in ALL_PERMISSIONS
    assert "template:creator:create:public" in ALL_PERMISSIONS
