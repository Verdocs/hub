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
}
