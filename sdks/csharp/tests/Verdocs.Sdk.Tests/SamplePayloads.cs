namespace Verdocs.Sdk.Tests;

/// <summary>
/// Wire payloads for the serialization tests, derived from the js-sdk types and captured
/// beta responses (key sets, key order, and null patterns match what the API really returns,
/// including fields the seed models intentionally leave to extension data, like recent_hashes
/// and plans). Values are fabricated.
/// </summary>
public static class SamplePayloads
{
    /// <summary>POST /v2/oauth2/token response.</summary>
    public const string Auth = """
        {
          "access_token": "eyJhbGciOiJub25lIn0.eyJzdWIiOiJ1c2VyLTEyMzQifQ.fake",
          "id_token": "id-token-value",
          "refresh_token": "refresh-token-value",
          "expires_in": 3600,
          "access_token_exp": 1798804800,
          "refresh_token_exp": 1798891200
        }
        """;

    /// <summary>GET /v2/users/me response.</summary>
    public const string User = """
        {
          "id": "6f0bb35a-6a1f-4b15-9f52-1f8d3c2a7c11",
          "email": "test@example.com",
          "email_verified": true,
          "locked": false,
          "lock_reason": null,
          "login_failures": 0,
          "recent_hashes": null,
          "first_name": "Test",
          "last_name": "User",
          "phone": null,
          "picture": "https://cdn.example.com/avatars/test.png",
          "entra_id": null,
          "b2cId": null,
          "googleId": "google-1234567890",
          "appleId": null,
          "githubId": null,
          "timezone": null,
          "locale": "en-US",
          "created_at": "2026-01-05T12:00:00.000Z",
          "updated_at": "2026-02-06T08:30:00.000Z"
        }
        """;

    /// <summary>One entry from the GET /v2/profiles response array.</summary>
    public const string Profile = """
        {
          "id": "0a9e8b1c-2d3e-4f50-8a9b-0c1d2e3f4a5b",
          "user_id": "6f0bb35a-6a1f-4b15-9f52-1f8d3c2a7c11",
          "organization_id": "b1a2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d",
          "first_name": "Test",
          "last_name": "User",
          "email": "test@example.com",
          "phone": null,
          "picture": "https://cdn.example.com/avatars/test.png",
          "timezone": null,
          "locale": null,
          "current": true,
          "permissions": ["template:creator:create"],
          "roles": ["owner"],
          "plans": [],
          "created_at": "2026-01-05T12:00:00.000Z",
          "updated_at": "2026-02-06T08:30:00.000Z",
          "organization": {
            "id": "b1a2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d",
            "entra_tid": null,
            "name": "Test Organization",
            "address": null,
            "address2": null,
            "phone": null,
            "contact_email": "org@example.com",
            "slug": "test-organization",
            "url": null,
            "full_logo_url": null,
            "thumbnail_url": null,
            "primary_color": null,
            "secondary_color": null,
            "disclaimer": null,
            "parent_id": null,
            "terms_use_url": null,
            "privacy_policy_url": null,
            "powered_by_label": "Powered by Verdocs",
            "powered_by_url": "https://verdocs.com",
            "hubspot_company_id": null,
            "data": null,
            "pipeline_settings": {
              "process_tags": true,
              "process_acroforms": false,
              "ignore_invalid_roles": false,
              "ignore_invalid_fields": false
            },
            "style_overrides": null,
            "separate_cert": false,
            "hipaa_complaint": false,
            "default_brand_id": null,
            "timezone": null,
            "locale": null,
            "deletion_protected": true,
            "created_at": "2025-11-01T09:00:00.000Z",
            "updated_at": "2026-02-01T09:00:00.000Z"
          },
          "group_profiles": [],
          "signatures": [],
          "initials": []
        }
        """;

    /// <summary>POST /v2/templates response for a minimal create call.</summary>
    public const string TemplateCreated = """
        {
          "id": "83da3d70-7857-4392-b876-c4592a304bc9",
          "profile_id": "0a9e8b1c-2d3e-4f50-8a9b-0c1d2e3f4a5b",
          "organization_id": "b1a2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d",
          "sender": "envelope_creator",
          "name": "NDA",
          "description": null,
          "visibility": "private",
          "initial_reminder": null,
          "followup_reminders": null,
          "max_reminder_days": 14,
          "counter": 0,
          "star_counter": 0,
          "is_personal": true,
          "is_public": false,
          "is_sendable": false,
          "created_at": "2026-03-01T15:00:00.000Z",
          "updated_at": "2026-03-01T15:00:00.000Z",
          "last_used_at": null,
          "data": null,
          "tags": []
        }
        """;

    /// <summary>GET /v2/templates response. List entries carry scalars only, no relations.</summary>
    public const string TemplateList = """
        {
          "count": 2,
          "rows": 10,
          "page": 0,
          "templates": [
            {
              "id": "0df79afe-76b9-417f-a1b3-d51c7abffb6f",
              "profile_id": "0a9e8b1c-2d3e-4f50-8a9b-0c1d2e3f4a5b",
              "organization_id": "b1a2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d",
              "sender": "envelope_creator",
              "name": "Lease Agreement",
              "description": null,
              "visibility": "private",
              "initial_reminder": null,
              "followup_reminders": null,
              "max_reminder_days": 14,
              "counter": 3,
              "star_counter": 0,
              "is_personal": true,
              "is_public": false,
              "is_sendable": true,
              "created_at": "2026-01-10T15:00:00.000Z",
              "updated_at": "2026-02-11T10:00:00.000Z",
              "last_used_at": null,
              "data": null,
              "tags": []
            },
            {
              "id": "83da3d70-7857-4392-b876-c4592a304bc9",
              "profile_id": "0a9e8b1c-2d3e-4f50-8a9b-0c1d2e3f4a5b",
              "organization_id": "b1a2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d",
              "sender": "template_owner",
              "name": "NDA",
              "description": "Mutual NDA",
              "visibility": "shared",
              "initial_reminder": 14400,
              "followup_reminders": 43200,
              "max_reminder_days": 14,
              "counter": 12,
              "star_counter": 2,
              "is_personal": false,
              "is_public": false,
              "is_sendable": true,
              "created_at": "2025-12-01T15:00:00.000Z",
              "updated_at": "2026-02-01T10:00:00.000Z",
              "last_used_at": "2026-02-01T10:00:00.000Z",
              "data": {"source_id": 42},
              "tags": ["legal"]
            }
          ]
        }
        """;

    /// <summary>GET /v2/templates/:template_id response, which adds documents, fields, and roles.</summary>
    public const string TemplateDetail = """
        {
          "id": "0df79afe-76b9-417f-a1b3-d51c7abffb6f",
          "profile_id": "0a9e8b1c-2d3e-4f50-8a9b-0c1d2e3f4a5b",
          "organization_id": "b1a2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d",
          "sender": "envelope_creator",
          "name": "Lease Agreement",
          "description": null,
          "visibility": "private",
          "initial_reminder": null,
          "followup_reminders": null,
          "max_reminder_days": 14,
          "counter": 3,
          "star_counter": 0,
          "is_personal": true,
          "is_public": false,
          "is_sendable": true,
          "created_at": "2026-01-10T15:00:00.000Z",
          "updated_at": "2026-02-11T10:00:00.000Z",
          "last_used_at": null,
          "data": null,
          "tags": [],
          "documents": [
            {
              "id": "b7c8d9e0-f1a2-4b3c-8d5e-6f7a8b9c0d1e",
              "name": "lease.pdf",
              "template_id": "0df79afe-76b9-417f-a1b3-d51c7abffb6f",
              "order": 0,
              "pages": 3,
              "page_sizes": {"0": {"width": 612, "height": 792}, "1": {"width": 612, "height": 792}, "2": {"width": 612, "height": 792}},
              "size": 182044,
              "mime": "application/pdf",
              "created_at": "2026-01-10T15:00:05.000Z",
              "updated_at": "2026-01-10T15:00:05.000Z"
            }
          ],
          "fields": [
            {
              "name": "Tenant-signature-1",
              "role_name": "Tenant",
              "template_id": "0df79afe-76b9-417f-a1b3-d51c7abffb6f",
              "document_id": "b7c8d9e0-f1a2-4b3c-8d5e-6f7a8b9c0d1e",
              "type": "signature",
              "settings": {"x": 72.5, "y": 190, "width": 82.63, "height": 36, "result": ""},
              "page": 2,
              "required": true,
              "readonly": false,
              "x": 72.5,
              "y": 190,
              "width": 82.63,
              "height": 36,
              "label": "Sign here",
              "default": "",
              "placeholder": "",
              "group": "",
              "validator": null,
              "multiline": false,
              "options": null
            }
          ],
          "roles": [
            {
              "template_id": "0df79afe-76b9-417f-a1b3-d51c7abffb6f",
              "name": "Tenant",
              "type": "signer",
              "full_name": null,
              "first_name": null,
              "last_name": null,
              "email": null,
              "phone": null,
              "message": null,
              "sequence": 1,
              "order": 1,
              "delegator": false,
              "name_locked": false
            }
          ]
        }
        """;

    /// <summary>
    /// GET /v2/envelopes/:envelope_id response for a completed envelope, as seen by its
    /// creator (in_app_key and passcode are only returned to creators). separate_cert is an
    /// undocumented live-beta field that must ride in extension data.
    /// </summary>
    public const string Envelope = """
        {
          "id": "9c2f8d3e-5b6a-4c7d-8e9f-0a1b2c3d4e5f",
          "status": "complete",
          "profile_id": "0a9e8b1c-2d3e-4f50-8a9b-0c1d2e3f4a5b",
          "template_id": "0df79afe-76b9-417f-a1b3-d51c7abffb6f",
          "organization_id": "b1a2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d",
          "name": "Lease Agreement",
          "sender_name": "Test User",
          "sender_email": "test@example.com",
          "no_contact": false,
          "initial_reminder": 14400,
          "followup_reminders": 43200,
          "max_reminder_days": 14,
          "next_reminder": null,
          "created_at": "2026-02-01T10:00:00.000Z",
          "updated_at": "2026-02-03T16:20:00.000Z",
          "canceled_at": null,
          "expires_at": null,
          "visibility": "private",
          "signed": true,
          "data": {"crm_id": "L-1044"},
          "separate_cert": false,
          "recipients": [
            {
              "envelope_id": "9c2f8d3e-5b6a-4c7d-8e9f-0a1b2c3d4e5f",
              "role_name": "Tenant",
              "profile_id": null,
              "status": "submitted",
              "first_name": "Terry",
              "last_name": "Tenant",
              "full_name": null,
              "email": "terry@example.com",
              "phone": null,
              "address": null,
              "city": null,
              "state": null,
              "zip": null,
              "ssn_last_4": null,
              "disclosures": null,
              "disclosures_accepted_at": "2026-02-03T16:00:00.000Z",
              "dob": null,
              "sequence": 1,
              "order": 1,
              "type": "signer",
              "delegator": false,
              "delegated_to": null,
              "message": "Please sign your lease",
              "claimed": true,
              "agreed": true,
              "name_locked": false,
              "created_at": "2026-02-01T10:00:00.000Z",
              "updated_at": "2026-02-03T16:20:00.000Z",
              "last_attempt_at": null,
              "locale": null,
              "timezone": null,
              "in_app_key": "8f7e6d5c4b3a29181706f5e4d3c2b1a0",
              "auth_step": null,
              "auth_methods": ["passcode"],
              "auth_method_states": {"passcode": "complete"},
              "passcode": "1234",
              "kba_questions": null
            }
          ],
          "documents": [
            {
              "id": "d1e2f3a4-b5c6-4d7e-8f9a-0b1c2d3e4f5a",
              "envelope_id": "9c2f8d3e-5b6a-4c7d-8e9f-0a1b2c3d4e5f",
              "template_document_id": "b7c8d9e0-f1a2-4b3c-8d5e-6f7a8b9c0d1e",
              "order": 0,
              "type": "attachment",
              "name": "lease.pdf",
              "pages": 3,
              "mime": "application/pdf",
              "size": 182044,
              "signed": true,
              "page_sizes": {"0": {"width": 612, "height": 792}, "1": {"width": 612, "height": 792}, "2": {"width": 612, "height": 792}},
              "created_at": "2026-02-01T10:00:01.000Z",
              "updated_at": "2026-02-03T16:20:05.000Z"
            },
            {
              "id": "c9b8a7f6-e5d4-4c3b-8a29-1f0e9d8c7b6a",
              "envelope_id": "9c2f8d3e-5b6a-4c7d-8e9f-0a1b2c3d4e5f",
              "template_document_id": null,
              "order": 1,
              "type": "certificate",
              "name": "certificate.pdf",
              "pages": 1,
              "mime": "application/pdf",
              "size": 48213,
              "signed": true,
              "page_sizes": {"0": {"width": 612, "height": 792}},
              "created_at": "2026-02-03T16:20:06.000Z",
              "updated_at": "2026-02-03T16:20:08.000Z"
            }
          ],
          "fields": [
            {
              "envelope_id": "9c2f8d3e-5b6a-4c7d-8e9f-0a1b2c3d4e5f",
              "document_id": "d1e2f3a4-b5c6-4d7e-8f9a-0b1c2d3e4f5a",
              "name": "Tenant-signature-1",
              "role_name": "Tenant",
              "type": "signature",
              "required": true,
              "readonly": false,
              "settings": {"x": 72.5, "y": 190, "width": 82.63, "height": 36, "result": "signed", "base64": "iVBORw0KGgo=", "signed_at": "2026-02-03T16:19:59.000Z"},
              "validator": null,
              "label": "Sign here",
              "page": 2,
              "x": 72.5,
              "y": 190,
              "width": 82.63,
              "height": 36,
              "default": null,
              "placeholder": null,
              "multiline": false,
              "group": null,
              "options": null,
              "value": "signed",
              "is_valid": true
            }
          ],
          "history_entries": [
            {
              "id": "1a2b3c4d-5e6f-4a7b-8c9d-0e1f2a3b4c5e",
              "envelope_id": "9c2f8d3e-5b6a-4c7d-8e9f-0a1b2c3d4e5f",
              "role_name": "Tenant",
              "event": "recipient:invited",
              "event_detail": "mail",
              "created_at": "2026-02-01T10:00:02.000Z"
            },
            {
              "id": "2b3c4d5e-6f7a-4b8c-9d0e-1f2a3b4c5d6f",
              "envelope_id": "9c2f8d3e-5b6a-4c7d-8e9f-0a1b2c3d4e5f",
              "role_name": "Tenant",
              "event": "recipient:submitted",
              "event_detail": "in_app",
              "created_at": "2026-02-03T16:20:00.000Z"
            }
          ],
          "access_keys": [
            {
              "id": "3c4d5e6f-7a8b-4c9d-0e1f-2a3b4c5d6e7f",
              "type": "in_app",
              "authentication": null,
              "recipient_name": "Tenant",
              "envelope_id": "9c2f8d3e-5b6a-4c7d-8e9f-0a1b2c3d4e5f",
              "key": "8f7e6d5c4b3a29181706f5e4d3c2b1a0",
              "expiration_date": null,
              "created_at": "2026-02-01T10:00:01.000Z",
              "first_used": null,
              "last_used": null
            }
          ]
        }
        """;

    /// <summary>One entry from the GET /v2/webhooks response array.</summary>
    public const string Webhook = """
        {
          "id": "4d5e6f7a-8b9c-4d0e-1f2a-3b4c5d6e7f8a",
          "organization_id": "b1a2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d",
          "url": "https://hooks.example.com/verdocs",
          "secret_key": null,
          "client_id": null,
          "client_secret": null,
          "scope": null,
          "token_endpoint": null,
          "auth_method": "none",
          "active": true,
          "events": {
            "envelope_created": true,
            "envelope_completed": true,
            "envelope_canceled": false,
            "recipient_submitted": true
          },
          "status": null,
          "last_success": null,
          "last_failure": null
        }
        """;

    /// <summary>One entry from the GET /v2/brands response array.</summary>
    public const string Brand = """
        {
          "id": "5e6f7a8b-9c0d-4e1f-2a3b-4c5d6e7f8a9b",
          "organization_id": "b1a2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d",
          "key": "acme",
          "name": "Acme Signing",
          "full_logo_url": "https://cdn.example.com/brands/acme/logo.png",
          "thumbnail_url": null,
          "favicon_url": null,
          "page_title": "Acme Signing Portal",
          "primary_color": "#003366",
          "secondary_color": null,
          "powered_by_label": "Powered by Acme",
          "powered_by_url": "https://acme.example.com",
          "style_overrides": null,
          "disclaimer": null,
          "terms_use_url": null,
          "privacy_policy_url": null,
          "support_contact": "support@acme.example.com",
          "pdf_signature_reason": null,
          "pdf_signature_location": null,
          "app_domain": "sign.acme.example.com",
          "app_domain_status": "active",
          "app_domain_cf_id": "cf-1234567890",
          "app_domain_dcv_token": null,
          "email_domain": "mail.acme.example.com",
          "email_local_part": "notifications",
          "email_display_name": "Acme Signing",
          "email_reply_to": null,
          "email_reply_to_verified": false,
          "email_domain_status": "verified",
          "email_spf_verified": true,
          "email_dkim_verified": true,
          "email_dmarc_verified": false,
          "email_dkim_tokens": ["token-one", "token-two", "token-three"],
          "locale": null,
          "timezone": null,
          "created_at": "2026-01-15T09:00:00.000Z",
          "updated_at": "2026-02-10T09:00:00.000Z"
        }
        """;

    /// <summary>One entry from the GET /v2/api-keys response array.</summary>
    public const string ApiKey = """
        {
          "client_id": "6f7a8b9c-0d1e-4f2a-3b4c-5d6e7f8a9b0c",
          "name": "Default",
          "organization_id": "b1a2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d",
          "profile_id": "0a9e8b1c-2d3e-4f50-8a9b-0c1d2e3f4a5b",
          "global_admin": false,
          "client_secret": null,
          "permission": "personal"
        }
        """;

    /// <summary>One entry from the GET /v2/groups response array, with its memberships.</summary>
    public const string Group = """
        {
          "id": "7a8b9c0d-1e2f-4a3b-4c5d-6e7f8a9b0c1d",
          "name": "Sales",
          "organization_id": "b1a2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d",
          "permissions": ["envelope:create", "envelope:view"],
          "profiles": [
            {
              "group_id": "7a8b9c0d-1e2f-4a3b-4c5d-6e7f8a9b0c1d",
              "profile_id": "0a9e8b1c-2d3e-4f50-8a9b-0c1d2e3f4a5b",
              "organization_id": "b1a2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d"
            }
          ]
        }
        """;

    /// <summary>One entry from the GET /v2/notifications response array.</summary>
    public const string Notification = """
        {
          "id": "8b9c0d1e-2f3a-4b4c-5d6e-7f8a9b0c1d2e",
          "profile_id": "0a9e8b1c-2d3e-4f50-8a9b-0c1d2e3f4a5b",
          "event_name": "envelope:completed",
          "data": {"envelope_id": "9c2f8d3e-5b6a-4c7d-8e9f-0a1b2c3d4e5f"},
          "read": false,
          "deleted": false,
          "message": "Lease Agreement was completed",
          "time": "2026-02-03T16:20:10+00:00"
        }
        """;

    /// <summary>One entry from the GET /v2/notification-templates response array.</summary>
    public const string NotificationTemplate = """
        {
          "id": "9c0d1e2f-3a4b-4c5d-6e7f-8a9b0c1d2e3f",
          "organization_id": "b1a2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d",
          "type": "email",
          "event_name": "envelope:completed",
          "template_id": null,
          "html_template": "<p>Your envelope is complete.</p>",
          "text_template": "Your envelope is complete."
        }
        """;

    /// <summary>One entry from the GET /v2/entitlements response array.</summary>
    public const string Entitlement = """
        {
          "id": "0d1e2f3a-4b5c-4d6e-7f8a-9b0c1d2e3f4a",
          "organization_id": "b1a2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d",
          "feature": "envelope",
          "contract_id": null,
          "notes": null,
          "starts_at": "2026-01-01T00:00:00.000Z",
          "ends_at": "2027-01-01T00:00:00.000Z",
          "monthly_max": 100,
          "yearly_max": 1200,
          "created_at": "2026-01-01T00:00:00.000Z"
        }
        """;

    /// <summary>One entry from the GET /v2/invitations response array.</summary>
    public const string OrganizationInvitation = """
        {
          "organization_id": "b1a2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d",
          "email": "newhire@example.com",
          "first_name": "New",
          "last_name": "Hire",
          "status": "pending",
          "role": "member",
          "generated_at": "2026-02-11T12:00:00.000Z",
          "token": null
        }
        """;

    /// <summary>One entry from the pending deliveries list for a webhook.</summary>
    public const string PendingWebhook = """
        {
          "id": "1e2f3a4b-5c6d-4e7f-8a9b-0c1d2e3f4a5c",
          "webhook_id": "4d5e6f7a-8b9c-4d0e-1f2a-3b4c5d6e7f8a",
          "organization_id": "b1a2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d",
          "url": "https://hooks.example.com/verdocs",
          "body": {"event": "envelope_created", "envelope_id": "9c2f8d3e-5b6a-4c7d-8e9f-0a1b2c3d4e5f"},
          "created_at": "2026-02-01T10:00:03.000Z",
          "delivered_at": null,
          "last_attempt_at": "2026-02-01T10:05:00.000Z",
          "last_status": 503,
          "last_result": "Service Unavailable"
        }
        """;
}
