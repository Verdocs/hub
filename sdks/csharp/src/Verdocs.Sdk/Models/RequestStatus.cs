namespace Verdocs.Models;

/// <summary>
/// Known values for the simple status field some operations return. Properties stay typed as
/// string so an unknown future value never breaks deserialization.
/// </summary>
public static class RequestStatus
{
    /// <summary>The operation succeeded.</summary>
    public const string Ok = "OK";

    /// <summary>The operation failed.</summary>
    public const string Error = "ERROR";
}
