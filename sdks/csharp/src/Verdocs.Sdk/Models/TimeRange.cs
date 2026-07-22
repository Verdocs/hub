namespace Verdocs.Models;

/// <summary>
/// A start/end timestamp pair. The js-sdk exports this without referencing it anywhere; it is
/// ported for API parity.
/// </summary>
public sealed record TimeRange
{
    /// <summary>Start of the range.</summary>
    public required string Start { get; init; }

    /// <summary>End of the range.</summary>
    public required string End { get; init; }
}
