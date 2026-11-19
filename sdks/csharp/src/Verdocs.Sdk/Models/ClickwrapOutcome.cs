namespace Verdocs.Models;

/// <summary>
/// Known values for what a person did with a clickwrap. Properties stay typed as string so an
/// unknown future value never breaks deserialization.
/// </summary>
public static class ClickwrapOutcome
{
    /// <summary>The person accepted.</summary>
    public const string Accepted = "accepted";

    /// <summary>The person declined.</summary>
    public const string Declined = "declined";
}
