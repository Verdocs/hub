using Verdocs.Models;

namespace Verdocs.Resources;

/// <summary>
/// Webhook calls, reached through the endpoint's Webhooks property. An organization has one
/// webhook configuration that delivers event notifications to a caller-supplied URL; every
/// call requires the caller to be an admin.
/// </summary>
public sealed class Webhooks
{
    private readonly VerdocsEndpoint _endpoint;

    internal Webhooks(VerdocsEndpoint endpoint)
    {
        _endpoint = endpoint;
    }

    /// <summary>
    /// Gets the webhook configuration for the caller's organization. The server answers 404
    /// when no configuration has ever been set. The client secret and signing secret are
    /// masked to their last four characters in this response.
    /// </summary>
    /// <param name="cancellationToken">Token to cancel the operation.</param>
    /// <returns>The organization's webhook configuration.</returns>
    /// <exception cref="VerdocsApiException">The call failed, for example because nothing is configured yet.</exception>
    /// <sdkOperation>webhook.getWebhooks</sdkOperation>
    /// <sdkGroup>Webhook</sdkGroup>
    /// <sdkPage>Endpoints</sdkPage>
    public Task<Webhook> GetAsync(CancellationToken cancellationToken = default)
    {
        return _endpoint.SendAsync<Webhook>(HttpMethod.Get, "/v2/webhooks", null, cancellationToken);
    }

    /// <summary>
    /// Sets the webhook configuration for the caller's organization. Configurations cannot be
    /// deleted; disable deliveries by setting Active to false or the URL to an empty string.
    ///
    /// <example>
    /// <code>
    /// await endpoint.Webhooks.SetAsync(new SetWebhookRequest
    /// {
    ///     Url = "https://hooks.example.com/verdocs",
    ///     Active = true,
    ///     AuthMethod = WebhookAuthMethod.Hmac,
    ///     Events = new Dictionary&lt;string, bool&gt; { [WebhookEvent.EnvelopeCompleted] = true },
    /// });
    /// </code>
    /// </example>
    /// </summary>
    /// <param name="request">The configuration to apply.</param>
    /// <param name="cancellationToken">Token to cancel the operation.</param>
    /// <returns>The updated webhook configuration.</returns>
    /// <exception cref="VerdocsApiException">The call failed, for example because the URL is not HTTPS.</exception>
    /// <sdkOperation>webhook.setWebhooks</sdkOperation>
    /// <sdkGroup>Webhook</sdkGroup>
    /// <sdkPage>Endpoints</sdkPage>
    public Task<Webhook> SetAsync(SetWebhookRequest request, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(request);
        return _endpoint.SendAsync<Webhook>(HttpMethod.Patch, "/v2/webhooks", request, cancellationToken);
    }

    /// <summary>
    /// Rotates (or first creates) the secret used to sign webhook deliveries. Until a secret
    /// exists, deliveries carry no signature header. Deliveries already queued keep the old
    /// signature; new events use the new secret. To authenticate a delivery, compare an
    /// HMAC-SHA256 hex digest of the payload's inner "body" field against the
    /// x-webhook-signature request header.
    /// </summary>
    /// <param name="cancellationToken">Token to cancel the operation.</param>
    /// <returns>The webhook configuration including the new, unmasked secret key.</returns>
    /// <exception cref="VerdocsApiException">The call failed, for example because nothing is configured yet.</exception>
    /// <sdkOperation>webhook.rotateWebhookSecret</sdkOperation>
    /// <sdkGroup>Webhook</sdkGroup>
    /// <sdkPage>Endpoints</sdkPage>
    public Task<Webhook> RotateSecretAsync(CancellationToken cancellationToken = default)
    {
        return _endpoint.SendAsync<Webhook>(HttpMethod.Put, "/v2/webhooks/rotate-secret", null, cancellationToken);
    }
}
