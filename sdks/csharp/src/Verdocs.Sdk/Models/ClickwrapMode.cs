namespace Verdocs.Models;

/// <summary>
/// Known values for how the component shows the terms. Properties stay typed as string so an
/// unknown future value never breaks deserialization.
/// </summary>
public static class ClickwrapMode
{
    /// <summary>In a modal.</summary>
    public const string Modal = "modal";

    /// <summary>Inline in your page.</summary>
    public const string Inline = "inline";
}
