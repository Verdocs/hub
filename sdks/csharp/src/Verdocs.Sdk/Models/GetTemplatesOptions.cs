namespace Verdocs.Models;

/// <summary>Filters, sorting, and paging for <see cref="Resources.Templates.ListAsync"/>.</summary>
public sealed record GetTemplatesOptions
{
    /// <summary>List only templates whose names, descriptions, etc contain this search term.</summary>
    public string? Q { get; init; }

    /// <summary>List only templates with at least one star.</summary>
    public bool? IsStarred { get; init; }

    /// <summary>List only templates created by the caller.</summary>
    public bool? IsCreator { get; init; }

    /// <summary>Visibility of templates to include. The server defaults to private plus shared.</summary>
    public TemplateVisibilityFilter? Visibility { get; init; }

    /// <summary>Sort order.</summary>
    public TemplateSortBy? SortBy { get; init; }

    /// <summary>Overrides the sort direction. Omit to sort dates descending and names ascending.</summary>
    public bool? Ascending { get; init; }

    /// <summary>Number of rows to retrieve. The server defaults to 10.</summary>
    public int? Rows { get; init; }

    /// <summary>Page to retrieve (0-based). The server defaults to 0.</summary>
    public int? Page { get; init; }
}
