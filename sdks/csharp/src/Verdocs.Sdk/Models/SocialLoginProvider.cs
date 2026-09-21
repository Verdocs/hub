namespace Verdocs.Models;

/// <summary>
/// Known values for the provider parameter of <see cref="Resources.Auth.GetSocialLoginUrl"/>.
/// The parameter stays typed as string so a provider added later can be used without an SDK update.
/// </summary>
public static class SocialLoginProvider
{
    /// <summary>Sign in with a Google account.</summary>
    public const string Google = "google";

    /// <summary>Sign in with a Microsoft account, covering both Entra ID (work and school) and personal accounts.</summary>
    public const string Microsoft = "microsoft";
}
