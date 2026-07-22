namespace Verdocs.Models;

/// <summary>
/// Known values for <see cref="Brand.AppDomainStatus"/>: the lifecycle of a custom app domain.
/// Properties stay typed as string so an unknown future value never breaks deserialization.
/// </summary>
public static class DomainStatus
{
    /// <summary>The domain is awaiting validation.</summary>
    public const string Pending = "pending";

    /// <summary>The domain is validated and serving traffic.</summary>
    public const string Active = "active";

    /// <summary>Domain validation failed.</summary>
    public const string Failed = "failed";

    /// <summary>The domain has been suspended.</summary>
    public const string Suspended = "suspended";
}
