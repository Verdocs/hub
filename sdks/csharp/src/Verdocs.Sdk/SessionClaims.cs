namespace Verdocs;

/// <summary>
/// Raw claims read from an access token payload. Internal because the public surface is
/// <see cref="VerdocsSession"/>, which resolves epoch times and the session type enum.
/// </summary>
internal sealed record SessionClaims
{
    public string? Sub { get; init; }

    public string? Sid { get; init; }

    public string? Email { get; init; }

    public string? SessionType { get; init; }

    public string? ProfileId { get; init; }

    public string? OrganizationId { get; init; }

    public string? EnvelopeId { get; init; }

    public string? RoleName { get; init; }

    public bool? GlobalAdmin { get; init; }

    public long? Iat { get; init; }

    public long? Exp { get; init; }
}
