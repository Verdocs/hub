namespace Verdocs.Models;

/// <summary>
/// Known values for who reported a record's browser details. For headless records the IP address and user agent are your own report. Properties stay typed as string so an
/// unknown future value never breaks deserialization.
/// </summary>
public static class ClickwrapReporter
{
    /// <summary>Seen by Verdocs.</summary>
    public const string Verdocs = "verdocs";

    /// <summary>Reported by you.</summary>
    public const string Customer = "customer";
}
