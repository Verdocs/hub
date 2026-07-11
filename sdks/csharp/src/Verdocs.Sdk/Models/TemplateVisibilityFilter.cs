namespace Verdocs.Models;

/// <summary>Visibility filter for template listings.</summary>
public enum TemplateVisibilityFilter
{
    /// <summary>Private and shared templates together, the server default.</summary>
    PrivateShared,

    /// <summary>Only templates visible to their creator.</summary>
    Private,

    /// <summary>Only templates shared within the organization.</summary>
    Shared,

    /// <summary>Only publicly visible templates.</summary>
    Public,
}
