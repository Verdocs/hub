namespace Verdocs.Models;

/// <summary>
/// Known values for <see cref="NotificationTemplate.Type"/>: the channel a notification goes
/// out on. Properties stay typed as string so an unknown future value never breaks
/// deserialization.
/// </summary>
public static class NotificationType
{
    /// <summary>Delivered by SMS.</summary>
    public const string Sms = "sms";

    /// <summary>Delivered by email.</summary>
    public const string Email = "email";

    /// <summary>Delivered inside the app.</summary>
    public const string App = "app";
}
