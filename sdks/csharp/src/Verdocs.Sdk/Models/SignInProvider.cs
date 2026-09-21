namespace Verdocs.Models;

/// <summary>
/// Known values for <see cref="User.SignInProviders"/>. Properties stay typed as string so an
/// unknown future value never breaks deserialization.
/// </summary>
public static class SignInProvider
{
    /// <summary>A linked Google account.</summary>
    public const string Google = "google";

    /// <summary>A linked Apple account.</summary>
    public const string Apple = "apple";

    /// <summary>A linked Github account.</summary>
    public const string Github = "github";

    /// <summary>A linked Microsoft account, covering both Entra ID (work and school) and personal accounts.</summary>
    public const string Microsoft = "microsoft";
}
