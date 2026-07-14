namespace Verdocs.Models;

/// <summary>
/// Known event names a webhook can subscribe to, the keys of <see cref="Webhook.Events"/>.
/// Properties stay typed as string so an unknown future value never breaks deserialization.
/// </summary>
public static class WebhookEvent
{
    /// <summary>An envelope was created.</summary>
    public const string EnvelopeCreated = "envelope_created";

    /// <summary>An envelope was completed.</summary>
    public const string EnvelopeCompleted = "envelope_completed";

    /// <summary>An envelope was canceled.</summary>
    public const string EnvelopeCanceled = "envelope_canceled";

    /// <summary>An envelope was updated.</summary>
    public const string EnvelopeUpdated = "envelope_updated";

    /// <summary>An envelope expired.</summary>
    public const string EnvelopeExpired = "envelope_expired";

    /// <summary>A template was created.</summary>
    public const string TemplateCreated = "template_created";

    /// <summary>A template was updated.</summary>
    public const string TemplateUpdated = "template_updated";

    /// <summary>A template was deleted.</summary>
    public const string TemplateDeleted = "template_deleted";

    /// <summary>A template was used to create an envelope.</summary>
    public const string TemplateUsed = "template_used";

    /// <summary>A recipient submitted their work.</summary>
    public const string RecipientSubmitted = "recipient_submitted";

    /// <summary>A recipient's details were updated.</summary>
    public const string RecipientUpdated = "recipient_updated";

    /// <summary>A recipient delegated signing to someone else.</summary>
    public const string RecipientDelegated = "recipient_delegated";

    /// <summary>A knowledge-based authentication event occurred.</summary>
    public const string KbaEvent = "kba_event";

    /// <summary>A metered entitlement was consumed.</summary>
    public const string EntitlementUsed = "entitlement_used";

    /// <summary>A recipient was invited.</summary>
    public const string RecipientInvited = "recipient_invited";

    /// <summary>A reminder was sent to a recipient.</summary>
    public const string RecipientReminded = "recipient_reminded";

    /// <summary>A recipient opened the envelope.</summary>
    public const string RecipientOpened = "recipient_opened";

    /// <summary>A recipient failed an authentication step.</summary>
    public const string RecipientAuthFail = "recipient_auth_fail";

    /// <summary>A recipient accepted the signing disclosures.</summary>
    public const string RecipientDisclosureAccepted = "recipient_disclosure_accepted";

    /// <summary>A recipient downloaded the envelope's documents.</summary>
    public const string RecipientDocsDownloaded = "recipient_docs_downloaded";

    /// <summary>An invitation could not be delivered to a recipient.</summary>
    public const string RecipientInviteFailed = "recipient_invite_failed";

    /// <summary>A recipient declined to sign.</summary>
    public const string RecipientDeclined = "recipient_declined";

    /// <summary>An organization was deleted.</summary>
    public const string OrganizationDeleted = "organization_deleted";

    /// <summary>Every known webhook event name, mirroring the js-sdk WEBHOOK_EVENTS list.</summary>
    public static IReadOnlyList<string> All { get; } =
    [
        EnvelopeCreated,
        EnvelopeCompleted,
        EnvelopeCanceled,
        EnvelopeUpdated,
        EnvelopeExpired,
        TemplateCreated,
        TemplateUpdated,
        TemplateDeleted,
        TemplateUsed,
        RecipientSubmitted,
        RecipientUpdated,
        RecipientDelegated,
        KbaEvent,
        EntitlementUsed,
        RecipientInvited,
        RecipientReminded,
        RecipientOpened,
        RecipientAuthFail,
        RecipientDisclosureAccepted,
        RecipientDocsDownloaded,
        RecipientInviteFailed,
        RecipientDeclined,
        OrganizationDeleted,
    ];
}
