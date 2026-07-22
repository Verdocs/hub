namespace Verdocs.Models;

/// <summary>
/// Known values for <see cref="Recipient.Status"/>. Properties stay typed as string so an
/// unknown future value never breaks deserialization; compare against these constants.
/// </summary>
public static class RecipientStatus
{
    /// <summary>The recipient has been invited but has not opened the envelope.</summary>
    public const string Invited = "invited";

    /// <summary>The recipient opened the envelope.</summary>
    public const string Opened = "opened";

    /// <summary>The recipient signed their fields.</summary>
    public const string Signed = "signed";

    /// <summary>The recipient submitted their work.</summary>
    public const string Submitted = "submitted";

    /// <summary>The envelope was canceled before the recipient finished.</summary>
    public const string Canceled = "canceled";

    /// <summary>The recipient's turn in the workflow has not arrived yet.</summary>
    public const string Pending = "pending";

    /// <summary>The recipient declined to sign.</summary>
    public const string Declined = "declined";

    /// <summary>The recipient could not be reached or failed verification.</summary>
    public const string Failed = "failed";
}
