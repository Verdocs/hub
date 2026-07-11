namespace Verdocs.Models;

/// <summary>Sort orders for template listings. Date sorts default to descending, name to ascending.</summary>
public enum TemplateSortBy
{
    /// <summary>Sort by creation date.</summary>
    CreatedAt,

    /// <summary>Sort by last-update date.</summary>
    UpdatedAt,

    /// <summary>Sort by template name.</summary>
    Name,

    /// <summary>Sort by when the template was last used.</summary>
    LastUsedAt,

    /// <summary>Sort by how many times the template has been used.</summary>
    Counter,

    /// <summary>Sort by how many stars the template has.</summary>
    StarCounter,
}
