namespace Verdocs.Models;

/// <summary>Filters, sorting, and paging for <see cref="Resources.Envelopes.ListAsync"/>.</summary>
public sealed record ListEnvelopesOptions
{
    /// <summary>List only envelopes whose names contain this search term.</summary>
    public string? Q { get; init; }

    /// <summary>
    /// A pre-defined view: "inbox" and "action" return envelopes where the caller must act,
    /// "sent" returns envelopes the caller created, "waiting" returns envelopes where anyone
    /// must act, and "completed" returns envelopes with all actions complete.
    /// </summary>
    public string? View { get; init; }

    /// <summary>List only envelopes in one of these states; see <see cref="EnvelopeStatus"/> for known values.</summary>
    public IReadOnlyList<string>? Status { get; init; }

    /// <summary>If true, include envelopes shared within the organization.</summary>
    public bool? IncludeOrg { get; init; }

    /// <summary>List only envelopes created from this template.</summary>
    public string? TemplateId { get; init; }

    /// <summary>List only envelopes created before this date.</summary>
    public DateTimeOffset? CreatedBefore { get; init; }

    /// <summary>List only envelopes created after this date.</summary>
    public DateTimeOffset? CreatedAfter { get; init; }

    /// <summary>Sort order: "name", "created_at", "updated_at", "canceled_at", or "status".</summary>
    public string? SortBy { get; init; }

    /// <summary>Overrides the sort direction. Omit to sort dates descending and name/status ascending.</summary>
    public bool? Ascending { get; init; }

    /// <summary>Number of rows to retrieve. The server defaults to 20.</summary>
    public int? Rows { get; init; }

    /// <summary>Page to retrieve (0-based). The server defaults to 0.</summary>
    public int? Page { get; init; }
}
