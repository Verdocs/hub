namespace Verdocs.Models;

/// <summary>
/// Known values for <see cref="ApiKey.Permission"/>. Properties stay typed as string so an
/// unknown future value never breaks deserialization.
/// </summary>
public static class ApiKeyPermission
{
    /// <summary>The key acts as its owning profile only.</summary>
    public const string Personal = "personal";

    /// <summary>The key may read data across the organization.</summary>
    public const string GlobalRead = "global_read";

    /// <summary>The key may read and write data across the organization.</summary>
    public const string GlobalWrite = "global_write";
}
