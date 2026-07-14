namespace Verdocs.Models;

/// <summary>
/// Known values for <see cref="AccessKey.Type"/>. Properties stay typed as string so an
/// unknown future value never breaks deserialization.
/// </summary>
public static class AccessKeyType
{
    /// <summary>The key was delivered by an email invitation.</summary>
    public const string Email = "email";

    /// <summary>The key was issued to the envelope creator for in-app use.</summary>
    public const string InApp = "in_app";

    /// <summary>The key backs a link generated for in-person signing.</summary>
    public const string InPersonLink = "in_person_link";

    /// <summary>The key was delivered by an SMS invitation.</summary>
    public const string Sms = "sms";
}
