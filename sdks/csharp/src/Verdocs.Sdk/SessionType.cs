namespace Verdocs;

/// <summary>
/// The kind of authorization context an endpoint carries. Verdocs supports two concurrent
/// session types: an authenticated user session, and an ephemeral signing session tied to a
/// single envelope. An application that needs both at once runs two endpoint instances.
/// </summary>
public enum SessionType
{
    /// <summary>An authenticated user session. May call any operation the profile permits.</summary>
    User,

    /// <summary>An ephemeral signing session. Limited to operations on the envelope being signed.</summary>
    Signing,
}
