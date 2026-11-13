namespace Verdocs.Models;

/// <summary>
/// Known values for a clickwrap version's status. Drafts can be edited or deleted; published versions never change. Properties stay typed as string so an
/// unknown future value never breaks deserialization.
/// </summary>
public static class ClickwrapVersionStatus
{
    /// <summary>Not yet published; can be edited or deleted.</summary>
    public const string Draft = "draft";

    /// <summary>Published and frozen.</summary>
    public const string Published = "published";
}
