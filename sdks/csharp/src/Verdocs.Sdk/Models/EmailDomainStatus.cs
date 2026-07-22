namespace Verdocs.Models;

/// <summary>
/// Known values for <see cref="Brand.EmailDomainStatus"/>: the lifecycle of a custom sending
/// domain. Properties stay typed as string so an unknown future value never breaks
/// deserialization.
/// </summary>
public static class EmailDomainStatus
{
    /// <summary>The domain is awaiting verification.</summary>
    public const string Pending = "pending";

    /// <summary>The domain's DNS records have been verified.</summary>
    public const string Verified = "verified";

    /// <summary>Domain verification failed.</summary>
    public const string Failed = "failed";

    /// <summary>The domain has been suspended.</summary>
    public const string Suspended = "suspended";
}
