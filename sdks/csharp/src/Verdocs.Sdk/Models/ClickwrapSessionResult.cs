namespace Verdocs.Models;

/// <summary>
/// The answer from <see cref="Resources.Clickwrap.CreateSessionAsync"/>: a
/// <see cref="ClickwrapSessionCurrent"/> when the person has nothing to accept, or a
/// <see cref="ClickwrapSessionCreated"/> with a session token. The two carry different fields under
/// the same names, so this is an abstract base rather than one sealed record; check
/// <see cref="Current"/> or pattern-match on the subtype.
/// </summary>
public abstract record ClickwrapSessionResult
{
    /// <summary>True when the person is already current and no session was created.</summary>
    public bool Current { get; init; }
}
