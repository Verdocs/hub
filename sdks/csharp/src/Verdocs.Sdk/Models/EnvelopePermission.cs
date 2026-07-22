namespace Verdocs.Models;

/// <summary>
/// Envelope permissions a profile or group may hold, from the js-sdk's TEnvelopePermission
/// union (Sessions/Permissions.ts). Permission lists stay typed as string so an unknown
/// future value never breaks deserialization; compare against these constants.
/// </summary>
public static class EnvelopePermission
{
    /// <summary>Create envelopes.</summary>
    public const string Create = "envelope:create";

    /// <summary>Cancel envelopes. A default permission for most users, but it may be removed in highly regulated environments where envelope activities must be audited, not canceled.</summary>
    public const string Cancel = "envelope:cancel";

    /// <summary>View envelopes. A default permission for most users, but it may be removed in highly regulated environments where sent envelopes may only be viewed by specific users.</summary>
    public const string View = "envelope:view";

    /// <summary>View envelopes created by other members of the same organization. Useful for "all activity" users, and particularly for API keys that back applications needing organization-wide data access.</summary>
    public const string OrgView = "envelope:org:view";
}
