namespace Verdocs.Models;

/// <summary>
/// Actions a recipient may attempt on an envelope, used by permission checks. Properties stay
/// typed as string so an unknown future value never breaks deserialization.
/// </summary>
public static class RecipientAction
{
    /// <summary>Submit completed fields.</summary>
    public const string Submit = "submit";

    /// <summary>Decline to sign.</summary>
    public const string Decline = "decline";

    /// <summary>Prepare fields for other recipients.</summary>
    public const string Prepare = "prepare";

    /// <summary>Update recipient details.</summary>
    public const string Update = "update";
}
