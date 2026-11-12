namespace Verdocs.Models;

/// <summary>
/// Known values for the events in a record's trail. A session can report Shown, ScrolledToEnd, Checked, and Unchecked; Verdocs records Accepted and Declined with the outcome. Properties stay typed as string so an
/// unknown future value never breaks deserialization.
/// </summary>
public static class ClickwrapEventType
{
    /// <summary>The terms were shown.</summary>
    public const string Shown = "shown";

    /// <summary>The person scrolled to the end.</summary>
    public const string ScrolledToEnd = "scrolled_to_end";

    /// <summary>A checkbox was checked.</summary>
    public const string Checked = "checked";

    /// <summary>A checkbox was unchecked.</summary>
    public const string Unchecked = "unchecked";

    /// <summary>The person accepted.</summary>
    public const string Accepted = "accepted";

    /// <summary>The person declined.</summary>
    public const string Declined = "declined";
}
