namespace Verdocs.Models;

/// <summary>
/// Known values for <see cref="Envelope.Status"/>. Properties stay typed as string so an
/// unknown future value never breaks deserialization; compare against these constants.
/// "complete", "declined", and "canceled" are permanent end states.
/// </summary>
public static class EnvelopeStatus
{
    /// <summary>All required data has been submitted and every workflow step is done.</summary>
    public const string Complete = "complete";

    /// <summary>The envelope has been created but no recipient has acted yet.</summary>
    public const string Pending = "pending";

    /// <summary>At least one recipient has acted and more work remains.</summary>
    public const string InProgress = "in progress";

    /// <summary>A recipient declined to sign.</summary>
    public const string Declined = "declined";

    /// <summary>The envelope was canceled by its owner.</summary>
    public const string Canceled = "canceled";
}
