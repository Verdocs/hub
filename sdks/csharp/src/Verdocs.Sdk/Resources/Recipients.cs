using System.Text.Json.Serialization;
using Verdocs.Models;

namespace Verdocs.Resources;

/// <summary>
/// Recipient and signing-session calls, reached through the endpoint's Recipients property.
/// </summary>
public sealed class Recipients
{
    private readonly VerdocsEndpoint _endpoint;

    internal Recipients(VerdocsEndpoint endpoint)
    {
        _endpoint = endpoint;
    }

    /// <summary>
    /// Agrees to the electronic signing disclosures. Requires a signing session, and must
    /// happen before the recipient completes fields or submits.
    ///
    /// <example>
    /// <code>
    /// var recipient = await endpoint.Recipients.AgreeAsync(envelopeId, roleName, Disclosures.Default);
    /// </code>
    /// </example>
    /// </summary>
    /// <param name="envelopeId">The envelope to operate on.</param>
    /// <param name="roleName">The role to operate on.</param>
    /// <param name="disclosures">The disclosure text shown to the recipient, recorded with the agreement. <see cref="Models.Disclosures.Default"/> is what Verdocs shows when the organization supplies no override.</param>
    /// <param name="data">Optional locale details to record with the agreement.</param>
    /// <param name="cancellationToken">Token to cancel the operation.</param>
    /// <returns>The updated recipient.</returns>
    /// <exception cref="VerdocsApiException">The call failed, for example because the session is not a signing session.</exception>
    /// <sdkOperation>recipient.envelopeRecipientAgree</sdkOperation>
    /// <sdkGroup>Recipient</sdkGroup>
    /// <sdkPage>Endpoints</sdkPage>
    public Task<Recipient> AgreeAsync(
        string envelopeId,
        string roleName,
        string? disclosures = null,
        RecipientDisclosureAgreeBody? data = null,
        CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrEmpty(envelopeId);
        ArgumentException.ThrowIfNullOrEmpty(roleName);
        var body = new AgreeBody
        {
            Disclosures = disclosures,
            Locale = data?.Locale,
            Timezone = data?.Timezone,
        };
        return _endpoint.SendAsync<Recipient>(HttpMethod.Post, RecipientPath(envelopeId, roleName) + "/agree", body, cancellationToken);
    }

    /// <summary>
    /// Declines to sign. If any recipient declines, the entire envelope becomes non-viable and
    /// later recipients may no longer act; the creator is notified when this happens. Requires
    /// a signing session.
    ///
    /// <example>
    /// <code>
    /// var recipient = await endpoint.Recipients.DeclineAsync(envelopeId, roleName);
    /// </code>
    /// </example>
    /// </summary>
    /// <param name="envelopeId">The envelope to operate on.</param>
    /// <param name="roleName">The role to operate on.</param>
    /// <param name="cancellationToken">Token to cancel the operation.</param>
    /// <returns>The updated recipient.</returns>
    /// <exception cref="VerdocsApiException">The call failed, for example because the session is not a signing session.</exception>
    /// <sdkOperation>recipient.envelopeRecipientDecline</sdkOperation>
    /// <sdkGroup>Recipient</sdkGroup>
    /// <sdkPage>Endpoints</sdkPage>
    public Task<Recipient> DeclineAsync(string envelopeId, string roleName, CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrEmpty(envelopeId);
        ArgumentException.ThrowIfNullOrEmpty(roleName);
        return _endpoint.SendAsync<Recipient>(HttpMethod.Post, RecipientPath(envelopeId, roleName) + "/decline", null, cancellationToken);
    }

    /// <summary>
    /// Submits the envelope: the recipient's signing is finished. Every field must be valid
    /// and complete for this to succeed. Requires a signing session.
    ///
    /// <example>
    /// <code>
    /// var recipient = await endpoint.Recipients.SubmitAsync(envelopeId, roleName);
    /// </code>
    /// </example>
    /// </summary>
    /// <param name="envelopeId">The envelope to operate on.</param>
    /// <param name="roleName">The role to submit.</param>
    /// <param name="data">Optional locale details to record with the submission.</param>
    /// <param name="cancellationToken">Token to cancel the operation.</param>
    /// <returns>The updated recipient.</returns>
    /// <exception cref="VerdocsApiException">The call failed, for example because a required field is incomplete.</exception>
    /// <sdkOperation>recipient.envelopeRecipientSubmit</sdkOperation>
    /// <sdkGroup>Recipient</sdkGroup>
    /// <sdkPage>Endpoints</sdkPage>
    public Task<Recipient> SubmitAsync(
        string envelopeId,
        string roleName,
        RecipientSubmitBody? data = null,
        CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrEmpty(envelopeId);
        ArgumentException.ThrowIfNullOrEmpty(roleName);
        return _endpoint.SendAsync<Recipient>(HttpMethod.Post, RecipientPath(envelopeId, roleName) + "/submit", data, cancellationToken);
    }

    /// <summary>
    /// Begins a signing session for an envelope using an access key from an email or SMS
    /// invite, or the access key returned by <see cref="GetInPersonLinkAsync"/>. No prior
    /// session is required. On success the signing token is stored on this endpoint (the
    /// js-sdk does the same), so call this on a dedicated endpoint instance to avoid replacing
    /// an active user session.
    ///
    /// <example>
    /// <code>
    /// var session = await endpoint.Recipients.StartSigningSessionAsync(envelopeId, roleName, key);
    /// </code>
    /// </example>
    /// </summary>
    /// <param name="envelopeId">The envelope to operate on.</param>
    /// <param name="roleName">The role to request.</param>
    /// <param name="key">Access key generated by the envelope creator or an email/SMS invite.</param>
    /// <param name="cancellationToken">Token to cancel the operation.</param>
    /// <returns>The signing session token plus envelope and recipient metadata.</returns>
    /// <exception cref="VerdocsApiException">The call failed, for example because the key is invalid or already used.</exception>
    /// <sdkOperation>recipient.startSigningSession</sdkOperation>
    /// <sdkGroup>Recipient</sdkGroup>
    /// <sdkPage>Endpoints</sdkPage>
    public Task<SignerTokenResponse> StartSigningSessionAsync(
        string envelopeId,
        string roleName,
        string key,
        CancellationToken cancellationToken = default)
    {
        // Usage errors throw synchronously (rule 16); the async work lives in the core method.
        ArgumentException.ThrowIfNullOrEmpty(envelopeId);
        ArgumentException.ThrowIfNullOrEmpty(roleName);
        ArgumentException.ThrowIfNullOrEmpty(key);
        return StartSigningSessionCoreAsync(envelopeId, roleName, key, cancellationToken);
    }

    private async Task<SignerTokenResponse> StartSigningSessionCoreAsync(
        string envelopeId,
        string roleName,
        string key,
        CancellationToken cancellationToken)
    {
        var response = await _endpoint
            .SendAsync<SignerTokenResponse>(
                HttpMethod.Post,
                "/v2/sign/unauth/" + Uri.EscapeDataString(envelopeId)
                    + "/" + Uri.EscapeDataString(roleName)
                    + "/" + Uri.EscapeDataString(key),
                null,
                cancellationToken)
            .ConfigureAwait(false);

        _endpoint.SetToken(response.AccessToken, SessionType.Signing);
        return response;
    }

    /// <summary>
    /// Gets an in-person signing link. Must be called by the envelope's owner/creator under a
    /// user session. The response also carries the raw access key (usable later with
    /// <see cref="StartSigningSessionAsync"/>) and an access token for immediate signing in
    /// embeds. In-person signing is a lower-security operation than authenticated signing and
    /// the final envelope certificate reflects this.
    ///
    /// <example>
    /// <code>
    /// var link = await endpoint.Recipients.GetInPersonLinkAsync(envelopeId, roleName);
    /// </code>
    /// </example>
    /// </summary>
    /// <param name="envelopeId">The envelope to operate on.</param>
    /// <param name="roleName">The role to request.</param>
    /// <param name="cancellationToken">Token to cancel the operation.</param>
    /// <returns>The signing link, key, token, and envelope/recipient metadata.</returns>
    /// <exception cref="VerdocsApiException">The call failed, for example because the caller is not the creator.</exception>
    /// <sdkOperation>recipient.getInPersonLink</sdkOperation>
    /// <sdkGroup>Recipient</sdkGroup>
    /// <sdkPage>Endpoints</sdkPage>
    public Task<InPersonLinkResponse> GetInPersonLinkAsync(string envelopeId, string roleName, CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrEmpty(envelopeId);
        ArgumentException.ThrowIfNullOrEmpty(roleName);
        return _endpoint.SendAsync<InPersonLinkResponse>(
            HttpMethod.Post,
            "/v2/sign/in-person/" + Uri.EscapeDataString(envelopeId) + "/" + Uri.EscapeDataString(roleName),
            null,
            cancellationToken);
    }

    /// <summary>
    /// Completes one verification step for the current signing session. Recipients with auth
    /// methods attached must agree to the disclosures first, then complete every step before
    /// viewing documents, completing fields, or submitting. Requires a signing session. This
    /// is also where real knowledge-based authentication runs; the endpoint's Kba resource
    /// targets legacy /v2/kba routes that were never deployed.
    ///
    /// <example>
    /// <code>
    /// var session = await endpoint.Recipients.VerifySignerAsync(new AuthenticateRecipientRequest
    /// {
    ///     AuthMethod = "passcode",
    ///     Code = "123456",
    /// });
    /// </code>
    /// </example>
    /// </summary>
    /// <param name="request">The verification step being completed.</param>
    /// <param name="cancellationToken">Token to cancel the operation.</param>
    /// <returns>The updated signing session.</returns>
    /// <exception cref="VerdocsApiException">The call failed, for example because the code was wrong.</exception>
    /// <sdkOperation>recipient.verifySigner</sdkOperation>
    /// <sdkGroup>Recipient</sdkGroup>
    /// <sdkPage>Endpoints</sdkPage>
    public Task<SignerTokenResponse> VerifySignerAsync(AuthenticateRecipientRequest request, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(request);
        return _endpoint.SendAsync<SignerTokenResponse>(HttpMethod.Post, "/v2/sign/verify", request, cancellationToken);
    }

    /// <summary>
    /// Delegates the recipient's signing responsibility to someone else. The envelope sender
    /// must have enabled delegation, and only the recipient may call this (a signing session).
    /// The original role is renamed to record the delegation and a new recipient with the same
    /// role name, order, and sequence is added; unless no_contact is set, the new recipient
    /// and the creator are notified.
    ///
    /// <example>
    /// <code>
    /// await endpoint.Recipients.DelegateAsync(envelopeId, roleName, new DelegateRecipientRequest
    /// {
    ///     FirstName = "Paige",
    ///     LastName = "Turner",
    ///     Email = "paige.turner@example.com",
    /// });
    /// </code>
    /// </example>
    /// </summary>
    /// <param name="envelopeId">The envelope to operate on.</param>
    /// <param name="roleName">The role to operate on.</param>
    /// <param name="request">The person to delegate to.</param>
    /// <param name="cancellationToken">Token to cancel the operation.</param>
    /// <returns>A task that completes when the delegation is recorded. The server responds with a status body that carries nothing.</returns>
    /// <exception cref="VerdocsApiException">The call failed, for example because delegation is not enabled.</exception>
    /// <sdkOperation>recipient.delegateRecipient</sdkOperation>
    /// <sdkGroup>Recipient</sdkGroup>
    /// <sdkPage>Endpoints</sdkPage>
    public Task DelegateAsync(
        string envelopeId,
        string roleName,
        DelegateRecipientRequest request,
        CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrEmpty(envelopeId);
        ArgumentException.ThrowIfNullOrEmpty(roleName);
        ArgumentNullException.ThrowIfNull(request);
        return _endpoint.SendVoidAsync(HttpMethod.Post, RecipientPath(envelopeId, roleName) + "/delegate", request, cancellationToken);
    }

    /// <summary>
    /// Updates a recipient: contact details, invite message, auth prefills, or a remind/reset
    /// action. Rate-limit this in user interfaces to avoid spamming recipients; excessive use
    /// may lead Verdocs to rate-limit the calling application. Returns 200 OK even when the
    /// envelope's no_contact flag silently suppresses the resulting notification.
    ///
    /// <example>
    /// <code>
    /// var recipient = await endpoint.Recipients.UpdateAsync(envelopeId, roleName, new UpdateRecipientParams
    /// {
    ///     Email = "paige.turner@example.com",
    /// });
    /// </code>
    /// </example>
    /// </summary>
    /// <param name="envelopeId">The envelope to operate on.</param>
    /// <param name="roleName">The role to update.</param>
    /// <param name="request">The fields to change; unset fields are left alone.</param>
    /// <param name="cancellationToken">Token to cancel the operation.</param>
    /// <returns>The updated recipient.</returns>
    /// <exception cref="VerdocsApiException">The call failed, for example because the caller is not the creator.</exception>
    /// <sdkOperation>recipient.updateRecipient</sdkOperation>
    /// <sdkGroup>Recipient</sdkGroup>
    /// <sdkPage>Endpoints</sdkPage>
    public Task<Recipient> UpdateAsync(
        string envelopeId,
        string roleName,
        UpdateRecipientParams request,
        CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrEmpty(envelopeId);
        ArgumentException.ThrowIfNullOrEmpty(roleName);
        ArgumentNullException.ThrowIfNull(request);
        return _endpoint.SendAsync<Recipient>(HttpMethod.Patch, RecipientPath(envelopeId, roleName), request, cancellationToken);
    }

    /// <summary>
    /// Sends a reminder to a recipient. The recipient must still be an active member of the
    /// signing flow (not declined or already submitted).
    ///
    /// <example>
    /// <code>
    /// await endpoint.Recipients.RemindAsync(envelopeId, roleName);
    /// </code>
    /// </example>
    /// </summary>
    /// <param name="envelopeId">The envelope to operate on.</param>
    /// <param name="roleName">The role to remind.</param>
    /// <param name="cancellationToken">Token to cancel the operation.</param>
    /// <returns>A task that completes when the reminder is queued. The server responds with a status body that carries nothing.</returns>
    /// <exception cref="VerdocsApiException">The call failed, for example because the recipient already submitted.</exception>
    /// <sdkOperation>recipient.remindRecipient</sdkOperation>
    /// <sdkGroup>Recipient</sdkGroup>
    /// <sdkPage>Endpoints</sdkPage>
    public Task RemindAsync(string envelopeId, string roleName, CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrEmpty(envelopeId);
        ArgumentException.ThrowIfNullOrEmpty(roleName);
        return _endpoint.SendVoidAsync(HttpMethod.Patch, RecipientPath(envelopeId, roleName), new { action = "remind" }, cancellationToken);
    }

    /// <summary>
    /// Fully resets a recipient, letting them restart failed KBA flows or redo fields they
    /// filled in incorrectly. Cannot be used on a canceled or completed envelope, but may
    /// restart a declined one.
    ///
    /// <example>
    /// <code>
    /// await endpoint.Recipients.ResetAsync(envelopeId, roleName);
    /// </code>
    /// </example>
    /// </summary>
    /// <param name="envelopeId">The envelope to operate on.</param>
    /// <param name="roleName">The role to reset.</param>
    /// <param name="cancellationToken">Token to cancel the operation.</param>
    /// <returns>A task that completes when the reset is recorded. The server responds with a status body that carries nothing.</returns>
    /// <exception cref="VerdocsApiException">The call failed, for example because the envelope is complete.</exception>
    /// <sdkOperation>recipient.resetRecipient</sdkOperation>
    /// <sdkGroup>Recipient</sdkGroup>
    /// <sdkPage>Endpoints</sdkPage>
    public Task ResetAsync(string envelopeId, string roleName, CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrEmpty(envelopeId);
        ArgumentException.ThrowIfNullOrEmpty(roleName);
        return _endpoint.SendVoidAsync(HttpMethod.Patch, RecipientPath(envelopeId, roleName), new { action = "reset" }, cancellationToken);
    }

    /// <summary>
    /// Asks the sender a question. Emails the envelope's sender (via sender_email, if set at
    /// creation) with the recipient's information and their question; replying is up to the
    /// sender. Called by recipients during signing.
    ///
    /// <example>
    /// <code>
    /// var recipient = await endpoint.Recipients.AskQuestionAsync(envelopeId, roleName, "Which page do I sign?");
    /// </code>
    /// </example>
    /// </summary>
    /// <param name="envelopeId">The envelope to operate on.</param>
    /// <param name="roleName">The role asking the question.</param>
    /// <param name="question">The question to ask.</param>
    /// <param name="cancellationToken">Token to cancel the operation.</param>
    /// <returns>The recipient, as the server echoes it back.</returns>
    /// <exception cref="VerdocsApiException">The call failed, for example because the session is invalid.</exception>
    /// <sdkOperation>recipient.askQuestion</sdkOperation>
    /// <sdkGroup>Recipient</sdkGroup>
    /// <sdkPage>Endpoints</sdkPage>
    public Task<Recipient> AskQuestionAsync(string envelopeId, string roleName, string question, CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrEmpty(envelopeId);
        ArgumentException.ThrowIfNullOrEmpty(roleName);
        ArgumentException.ThrowIfNullOrEmpty(question);
        return _endpoint.SendAsync<Recipient>(
            HttpMethod.Post,
            RecipientPath(envelopeId, roleName) + "/ask-question",
            new { question },
            cancellationToken);
    }

    private static string RecipientPath(string envelopeId, string roleName)
    {
        return "/v2/envelopes/" + Uri.EscapeDataString(envelopeId) + "/recipients/" + Uri.EscapeDataString(roleName);
    }

    // The agree call flattens the disclosure text and the optional locale details into one
    // JSON object, mirroring the js-sdk's {disclosures, ...data} spread.
    private sealed record AgreeBody
    {
        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public string? Disclosures { get; init; }

        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public string? Locale { get; init; }

        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public string? Timezone { get; init; }
    }
}
