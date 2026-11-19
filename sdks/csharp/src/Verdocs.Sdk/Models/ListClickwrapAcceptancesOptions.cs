namespace Verdocs.Models;

/// <summary>The search and paging for <see cref="Resources.Clickwrap.ListAcceptancesAsync"/>. Search by UserId, or by MetadataKey and MetadataValue together.</summary>
public sealed record ListClickwrapAcceptancesOptions
{
    /// <summary>The person's ID in your own system.</summary>
    public string? UserId { get; init; }

    /// <summary>A metadata field you attached, such as "email".</summary>
    public string? MetadataKey { get; init; }

    /// <summary>The exact value to match. Required with MetadataKey.</summary>
    public string? MetadataValue { get; init; }

    /// <summary>Page size, up to 100. Defaults to 25.</summary>
    public int? Rows { get; init; }

    /// <summary>Page to retrieve (0-based). Defaults to 0.</summary>
    public int? Page { get; init; }
}
