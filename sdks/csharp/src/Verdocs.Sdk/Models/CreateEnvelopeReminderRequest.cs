namespace Verdocs.Models;

/// <summary>
/// A legacy reminder configuration shape. No current operation accepts it; the js-sdk exports
/// it without referencing it, and it is ported for API parity.
/// </summary>
public sealed record CreateEnvelopeReminderRequest
{
    /// <summary>Delay before the first reminder.</summary>
    public required long SetupTime { get; init; }

    /// <summary>Delay between subsequent reminders.</summary>
    public required long IntervalTime { get; init; }
}
