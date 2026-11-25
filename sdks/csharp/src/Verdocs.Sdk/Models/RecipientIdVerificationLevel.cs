namespace Verdocs.Models;

/// <summary>
/// Known values for <see cref="Recipient.IdVerificationLevel"/> and
/// <see cref="CreateEnvelopeRecipient.IdVerificationLevel"/> (the js-sdk
/// TRecipientIdVerificationLevel union): which tier of ID verification a recipient goes
/// through. Properties stay typed as string so an unknown future value never breaks
/// deserialization.
/// </summary>
public static class RecipientIdVerificationLevel
{
    /// <summary>ID Verification.</summary>
    public const string Base = "base";

    /// <summary>ID Verification Plus.</summary>
    public const string Plus = "plus";
}
