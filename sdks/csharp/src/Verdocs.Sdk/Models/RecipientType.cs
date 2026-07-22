namespace Verdocs.Models;

/// <summary>
/// Known values for <see cref="Recipient.Type"/> and <see cref="Role.Type"/>. Properties stay
/// typed as string so an unknown future value never breaks deserialization.
/// </summary>
public static class RecipientType
{
    /// <summary>The party fills and signs fields.</summary>
    public const string Signer = "signer";

    /// <summary>The party receives a copy but takes no action.</summary>
    public const string Cc = "cc";

    /// <summary>The party approves the envelope without filling fields.</summary>
    public const string Approver = "approver";
}
