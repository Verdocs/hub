namespace Verdocs.Models;

/// <summary>
/// Known values for <see cref="NotificationTemplate.EventName"/> and
/// <see cref="Notification.EventName"/>. Properties stay typed as string so an unknown future
/// value never breaks deserialization.
/// </summary>
public static class EventName
{
    /// <summary>An invitation was canceled.</summary>
    public const string InvitationCanceled = "invitation:canceled";

    /// <summary>A transaction was completed.</summary>
    public const string TransactionCompleted = "transaction:completed";

    /// <summary>An envelope failed to process.</summary>
    public const string EnvelopeFailed = "envelope:failed";

    /// <summary>An envelope expired.</summary>
    public const string EnvelopeExpired = "envelope:expired";

    /// <summary>An envelope was declined.</summary>
    public const string EnvelopeDeclined = "envelope:declined";

    /// <summary>A copy of a completed envelope went to a CC party.</summary>
    public const string EnvelopeCc = "envelope:cc";

    /// <summary>A reminder was sent to a recipient.</summary>
    public const string RecipientReminder = "recipient:reminder";

    /// <summary>A transaction was requested.</summary>
    public const string TransactionRequested = "transaction:requested";

    /// <summary>An envelope was completed.</summary>
    public const string EnvelopeCompleted = "envelope:completed";

    /// <summary>A transaction was canceled.</summary>
    public const string TransactionCanceled = "transaction:canceled";

    /// <summary>A user was invited to an organization.</summary>
    public const string UserInvited = "user:invited";

    /// <summary>A recipient was invited to sign.</summary>
    public const string RecipientInvited = "recipient:invited";

    /// <summary>An envelope was canceled.</summary>
    public const string EnvelopeCanceled = "envelope:canceled";

    /// <summary>A transaction was sent.</summary>
    public const string TransactionSent = "transaction:sent";

    /// <summary>An envelope was signed.</summary>
    public const string EnvelopeSigned = "envelope:signed";

    /// <summary>An email verification message was sent.</summary>
    public const string EmailVerify = "email:verify";

    /// <summary>An email one-time code was sent.</summary>
    public const string EmailOtp = "email:otp";

    /// <summary>A password reset was requested.</summary>
    public const string PasswordReset = "password:reset";

    /// <summary>A recipient asked a question.</summary>
    public const string RecipientQuestion = "recipient:question";

    /// <summary>A signing delegation was requested.</summary>
    public const string DelegateRequested = "delegate:requested";

    /// <summary>A signing delegation was confirmed for sending.</summary>
    public const string DelegateSendConfirmed = "delegate:send_confirmed";
}
