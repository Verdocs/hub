namespace Verdocs;

/// <summary>
/// The decoded body of the access token currently held by a <see cref="VerdocsEndpoint"/>.
/// User sessions carry a profile and organization; signing sessions carry an envelope and a
/// role name instead. The SDK decodes tokens for metadata only and never verifies signatures;
/// the server is the authority on token validity.
/// </summary>
public sealed record VerdocsSession
{
    /// <summary>Whether this is a user session or a signing session.</summary>
    public required SessionType SessionType { get; init; }

    /// <summary>The subject claim: the user ID for user sessions, the access key ID for signing sessions.</summary>
    public string? Sub { get; init; }

    /// <summary>Email address associated with the session, if present in the token.</summary>
    public string? Email { get; init; }

    /// <summary>The acting profile ID.</summary>
    public string? ProfileId { get; init; }

    /// <summary>The profile's organization ID. Null for signing sessions.</summary>
    public string? OrganizationId { get; init; }

    /// <summary>The envelope being signed. Null for user sessions.</summary>
    public string? EnvelopeId { get; init; }

    /// <summary>The role being signed for. Null for user sessions.</summary>
    public string? RoleName { get; init; }

    /// <summary>True when the user is a Verdocs global administrator. Null for signing sessions.</summary>
    public bool? GlobalAdmin { get; init; }

    /// <summary>When the token was issued, if the claim is present.</summary>
    public DateTimeOffset? IssuedAt { get; init; }

    /// <summary>When the token expires, if the claim is present.</summary>
    public DateTimeOffset? ExpiresAt { get; init; }
}
