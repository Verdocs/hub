namespace Verdocs.Models;

/// <summary>
/// Known values for the files a clickwrap record can be downloaded as. Properties stay typed as string so an
/// unknown future value never breaks deserialization.
/// </summary>
public static class ClickwrapDownloadType
{
    /// <summary>The signed certificate PDF.</summary>
    public const string Certificate = "certificate";

    /// <summary>A picture of what was on screen, when the record has a presentation.</summary>
    public const string Replay = "replay";

    /// <summary>A ZIP with everything needed to check the record.</summary>
    public const string Evidence = "evidence";
}
