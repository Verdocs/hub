namespace Verdocs.Models;

/// <summary>
/// Known values for where a record's presentation came from. Properties stay typed as string so an
/// unknown future value never breaks deserialization.
/// </summary>
public static class ClickwrapPresentationSource
{
    /// <summary>Captured by the component.</summary>
    public const string Rendered = "rendered";

    /// <summary>Sent by you with a headless outcome.</summary>
    public const string Customer = "customer";

    /// <summary>No presentation.</summary>
    public const string None = "none";
}
