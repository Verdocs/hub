using Verdocs.Models;

namespace Verdocs.Resources;

/// <summary>
/// Legacy knowledge-based authentication calls, reached through the endpoint's Kba property.
/// NOTE: the /v2/kba routes these methods target DO NOT EXIST in the deployed API; every call
/// returns 404. Real KBA verification runs through <see cref="Recipients.VerifySignerAsync"/>
/// (POST /v2/sign/verify). The module is ported code-faithfully from the js-sdk for parity and
/// is excluded from conformance runs.
/// </summary>
public sealed class Kba
{
    private readonly VerdocsEndpoint _endpoint;

    internal Kba(VerdocsEndpoint endpoint)
    {
        _endpoint = endpoint;
    }

    /// <summary>
    /// Gets the current KBA status. Per the js-sdk this may only be called by the recipient
    /// under a signing session. NOTE: the deployed API has no such route; use
    /// <see cref="Recipients.VerifySignerAsync"/> for real KBA.
    /// </summary>
    /// <param name="envelopeId">The envelope to operate on.</param>
    /// <param name="roleName">The role being verified.</param>
    /// <param name="cancellationToken">Token to cancel the operation.</param>
    /// <returns>The next KBA step required.</returns>
    /// <exception cref="VerdocsApiException">Always, against the deployed API (404).</exception>
    public Task<RecipientKbaStep> GetStepAsync(string envelopeId, string roleName, CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrEmpty(envelopeId);
        ArgumentException.ThrowIfNullOrEmpty(roleName);
        return _endpoint.SendAsync<RecipientKbaStep>(
            HttpMethod.Get,
            "/v2/kba/" + Uri.EscapeDataString(envelopeId) + "/" + Uri.EscapeDataString(roleName),
            null,
            cancellationToken);
    }

    /// <summary>
    /// Submits a response to a KBA PIN challenge. NOTE: the deployed API has no such route;
    /// use <see cref="Recipients.VerifySignerAsync"/> for real KBA.
    /// </summary>
    /// <param name="envelopeId">The envelope to operate on.</param>
    /// <param name="roleName">The role being verified.</param>
    /// <param name="pin">The PIN the user entered.</param>
    /// <param name="cancellationToken">Token to cancel the operation.</param>
    /// <returns>The next KBA step required.</returns>
    /// <exception cref="VerdocsApiException">Always, against the deployed API (404).</exception>
    public Task<RecipientKbaStep> SubmitPinAsync(string envelopeId, string roleName, string pin, CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrEmpty(envelopeId);
        ArgumentException.ThrowIfNullOrEmpty(roleName);
        ArgumentException.ThrowIfNullOrEmpty(pin);
        return _endpoint.SendAsync<RecipientKbaStep>(
            HttpMethod.Post,
            "/v2/kba/pin",
            new { EnvelopeId = envelopeId, RoleName = roleName, Pin = pin },
            cancellationToken);
    }

    /// <summary>
    /// Submits an identity response to a KBA challenge. NOTE: the deployed API has no such
    /// route; use <see cref="Recipients.VerifySignerAsync"/> for real KBA.
    /// </summary>
    /// <param name="envelopeId">The envelope to operate on.</param>
    /// <param name="roleName">The role being verified.</param>
    /// <param name="identity">The identity details the user supplied.</param>
    /// <param name="cancellationToken">Token to cancel the operation.</param>
    /// <returns>The next KBA step required.</returns>
    /// <exception cref="VerdocsApiException">Always, against the deployed API (404).</exception>
    public Task<RecipientKbaStep> SubmitIdentityAsync(
        string envelopeId,
        string roleName,
        KbaIdentity identity,
        CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrEmpty(envelopeId);
        ArgumentException.ThrowIfNullOrEmpty(roleName);
        ArgumentNullException.ThrowIfNull(identity);
        return _endpoint.SendAsync<RecipientKbaStep>(
            HttpMethod.Post,
            "/v2/kba/identity",
            new { EnvelopeId = envelopeId, RoleName = roleName, Identity = identity },
            cancellationToken);
    }

    /// <summary>
    /// Submits answers to KBA challenge questions, in the same order the challenges were
    /// listed in <see cref="RecipientKbaStep.Questions"/>. NOTE: the deployed API has no such
    /// route; use <see cref="Recipients.VerifySignerAsync"/> for real KBA.
    /// </summary>
    /// <param name="envelopeId">The envelope to operate on.</param>
    /// <param name="roleName">The role being verified.</param>
    /// <param name="responses">The answers, in question order.</param>
    /// <param name="cancellationToken">Token to cancel the operation.</param>
    /// <returns>The next KBA step required.</returns>
    /// <exception cref="VerdocsApiException">Always, against the deployed API (404).</exception>
    public Task<RecipientKbaStep> SubmitChallengeResponseAsync(
        string envelopeId,
        string roleName,
        IReadOnlyList<KbaResponse> responses,
        CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrEmpty(envelopeId);
        ArgumentException.ThrowIfNullOrEmpty(roleName);
        ArgumentNullException.ThrowIfNull(responses);
        return _endpoint.SendAsync<RecipientKbaStep>(
            HttpMethod.Post,
            "/v2/kba/response",
            new { EnvelopeId = envelopeId, RoleName = roleName, Responses = responses },
            cancellationToken);
    }
}
