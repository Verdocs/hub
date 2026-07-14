namespace Verdocs.Models;

/// <summary>
/// Known values for <see cref="Template.Visibility"/>. Properties stay typed as string so an
/// unknown future value never breaks deserialization. For the request-side list filter, see
/// <see cref="TemplateVisibilityFilter"/>.
/// </summary>
public static class TemplateVisibility
{
    /// <summary>Visible only to the template's creator.</summary>
    public const string Private = "private";

    /// <summary>Visible to the creator's organization.</summary>
    public const string Shared = "shared";

    /// <summary>Visible publicly.</summary>
    public const string Public = "public";
}
