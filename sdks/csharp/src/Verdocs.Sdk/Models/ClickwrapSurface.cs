namespace Verdocs.Models;

/// <summary>
/// Known values for where a clickwrap outcome was recorded. Properties stay typed as string so an
/// unknown future value never breaks deserialization.
/// </summary>
public static class ClickwrapSurface
{
    /// <summary>The embedded component.</summary>
    public const string Component = "component";

    /// <summary>The Verdocs hosted page.</summary>
    public const string Hosted = "hosted";

    /// <summary>Your own interface, reported through the API.</summary>
    public const string Headless = "headless";
}
