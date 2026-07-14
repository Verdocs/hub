namespace Verdocs.Models;

/// <summary>
/// Known values for <see cref="Webhook.AuthMethod"/>: how Verdocs authenticates itself to the
/// webhook receiver. Properties stay typed as string so an unknown future value never breaks
/// deserialization.
/// </summary>
public static class WebhookAuthMethod
{
    /// <summary>Requests are not authenticated.</summary>
    public const string None = "none";

    /// <summary>Requests carry an HMAC signature computed with the webhook's secret key.</summary>
    public const string Hmac = "hmac";

    /// <summary>Requests carry a bearer token obtained via the OAuth2 client credentials flow.</summary>
    public const string ClientCredentials = "client_credentials";
}
