using System.Diagnostics.CodeAnalysis;
using System.Net;
using System.Net.Http.Headers;
using System.Text.Json;
using System.Text.Json.Serialization;
using Verdocs.Models;

namespace Verdocs.Resources;

/// <summary>
/// Recipient and signing-session calls, reached through the endpoint's Recipients property.
/// </summary>
public sealed class Recipients
{
    private const string IdRetakeCode = "id_retake";

    private static readonly TimeSpan IdVerificationTimeout = TimeSpan.FromSeconds(180);

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
    /// targets legacy /v2/kba routes that were never deployed. ID verification uploads photos,
    /// so it goes through the overload that takes an <see cref="AuthenticateRecipientViaIdRequest"/>.
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
    /// <example>
    /// <code>
    /// try
    /// {
    ///     await endpoint.Recipients.VerifySignerAsync(new AuthenticateRecipientViaIdRequest
    ///     {
    ///         CountryCode = "USA",
    ///         DocumentType = IdDocumentType.DriverLicense,
    ///         FrontImage = new IdImageUpload { Content = File.OpenRead("front.jpg"), FileName = "front.jpg", ContentType = "image/jpeg" },
    ///         BackImage = new IdImageUpload { Content = File.OpenRead("back.jpg"), FileName = "back.jpg", ContentType = "image/jpeg" },
    ///         FaceImage = new IdImageUpload { Content = File.OpenRead("selfie.jpg"), FileName = "selfie.jpg", ContentType = "image/jpeg" },
    ///     });
    /// }
    /// catch (VerdocsApiException e) when (Recipients.IsIdRetakeRequired(e, out var retake))
    /// {
    ///     // e.g. [{ Image = "face_image", Errors = ["Poor Quality Selfie"] }]
    ///     ShowRetakePrompts(retake.Images);
    /// }
    /// </code>
    /// </example>
    /// </summary>
    /// <param name="request">The verification step being completed.</param>
    /// <param name="cancellationToken">Token to cancel the operation.</param>
    /// <returns>The updated signing session.</returns>
    /// <exception cref="ArgumentException"><see cref="AuthenticateRecipientRequest.AuthMethod"/> is "id", which needs the photo-upload overload.</exception>
    /// <exception cref="VerdocsApiException">The call failed, for example because the code was wrong.</exception>
    /// <sdkOperation>recipient.verifySigner</sdkOperation>
    /// <sdkGroup>Recipient</sdkGroup>
    /// <sdkPage>Endpoints</sdkPage>
    public Task<SignerTokenResponse> VerifySignerAsync(AuthenticateRecipientRequest request, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(request);
        if (request.AuthMethod == RecipientAuthMethod.Id)
        {
            throw new ArgumentException(
                "ID verification uploads photos; pass an AuthenticateRecipientViaIdRequest instead.",
                nameof(request));
        }

        return _endpoint.SendAsync<SignerTokenResponse>(HttpMethod.Post, "/v2/sign/verify", request, cancellationToken);
    }

    /// <summary>
    /// Completes the ID verification step for the current signing session by uploading photos
    /// of a government ID and a selfie as multipart form data. GBG checks the photos while the
    /// request waits, which can take a minute or more, so this call allows at least three
    /// minutes regardless of the endpoint's <see cref="VerdocsEndpoint.Timeout"/>. If you
    /// handed the endpoint your own HttpClient, its Timeout (100 seconds by default) still
    /// caps the call, so raise it for this to have room. When a photo can't be used the call
    /// fails with a 400 that <see cref="IsIdRetakeRequired"/> recognizes, listing which photos
    /// to retake and why. Requires a signing session. The other overload's docs carry an
    /// example of this call.
    /// </summary>
    /// <param name="request">The ID photos and the document they show.</param>
    /// <param name="cancellationToken">Token to cancel the operation.</param>
    /// <returns>The updated signing session.</returns>
    /// <exception cref="VerdocsApiException">The call failed, for example because a photo needs retaking.</exception>
    /// <exception cref="TimeoutException">The check did not finish in time.</exception>
    public Task<SignerTokenResponse> VerifySignerAsync(AuthenticateRecipientViaIdRequest request, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(request);
        ArgumentException.ThrowIfNullOrEmpty(request.CountryCode, nameof(request));
        ArgumentException.ThrowIfNullOrEmpty(request.DocumentType, nameof(request));
        var frontType = ParseImageContentType(request.FrontImage, nameof(request.FrontImage));
        var backType = request.BackImage is null ? null : ParseImageContentType(request.BackImage, nameof(request.BackImage));
        var faceType = ParseImageContentType(request.FaceImage, nameof(request.FaceImage));

        var content = new MultipartFormDataContent();
        AddTextPart(content, "auth_method", RecipientAuthMethod.Id);
        AddTextPart(content, "country_code", request.CountryCode);
        AddTextPart(content, "document_type", request.DocumentType);
        AddImagePart(content, IdImageField.FrontImage, request.FrontImage, frontType);
        if (request.BackImage is not null)
        {
            AddImagePart(content, IdImageField.BackImage, request.BackImage, backType!);
        }

        AddImagePart(content, IdImageField.FaceImage, request.FaceImage, faceType);

        // The js-sdk raises this call to 180 seconds because the GBG check regularly runs close
        // to the 60 second default. We take the longer of that and the endpoint's own timeout
        // so a caller who already configured more headroom keeps it.
        var timeout = _endpoint.Timeout > IdVerificationTimeout ? _endpoint.Timeout : IdVerificationTimeout;
        return _endpoint.SendAsync<SignerTokenResponse>(HttpMethod.Post, "/v2/sign/verify", content, timeout, cancellationToken);
    }

    /// <summary>
    /// Checks whether a failed ID verification attempt needs the signer to retake one or more
    /// photos, and if so hands back the body listing each photo and why. True only for a 400
    /// whose body has code "id_retake" and an images array, the same test the js-sdk applies.
    /// Never throws: anything else, including a body that is not JSON, is simply false.
    ///
    /// <example>
    /// <code>
    /// catch (VerdocsApiException e) when (Recipients.IsIdRetakeRequired(e, out var retake))
    /// {
    ///     foreach (var image in retake.Images)
    ///     {
    ///         Console.WriteLine($"{image.Image}: {string.Join(", ", image.Errors)}");
    ///     }
    /// }
    /// </code>
    /// </example>
    /// </summary>
    /// <param name="exception">The exception a verification call threw. Anything other than a <see cref="VerdocsApiException"/> returns false.</param>
    /// <param name="retake">The parsed retake body when this returns true; otherwise null.</param>
    /// <returns>True when the photos need retaking.</returns>
    /// <sdkOperation>recipient.isIdRetakeRequired</sdkOperation>
    /// <sdkGroup>Recipient</sdkGroup>
    /// <sdkPage>Helpers</sdkPage>
    public static bool IsIdRetakeRequired(Exception? exception, [NotNullWhen(true)] out IdRetakeResponse? retake)
    {
        retake = null;
        if (exception is not VerdocsApiException { StatusCode: HttpStatusCode.BadRequest } apiException
            || string.IsNullOrWhiteSpace(apiException.ResponseBody))
        {
            return false;
        }

        try
        {
            using var document = JsonDocument.Parse(apiException.ResponseBody);
            var root = document.RootElement;
            if (root.ValueKind != JsonValueKind.Object
                || !root.TryGetProperty("code", out var code)
                || code.ValueKind != JsonValueKind.String
                || code.GetString() != IdRetakeCode
                || !root.TryGetProperty("images", out var images)
                || images.ValueKind != JsonValueKind.Array)
            {
                return false;
            }

            retake = root.Deserialize<IdRetakeResponse>(VerdocsJson.Options);
            return retake is not null;
        }
        catch (JsonException)
        {
            // A body that parses but doesn't fit the model (an image entry that isn't an
            // object, say) lands here too. Either way it isn't a retake we can act on.
            retake = null;
            return false;
        }
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

    private static void AddTextPart(MultipartFormDataContent content, string name, string value)
    {
        // Names are pre-quoted because .NET only quotes multipart part names when it must,
        // while browsers (and so the API's usual traffic) always quote them.
        content.Add(new StringContent(value), "\"" + name + "\"");
    }

    private static MediaTypeHeaderValue ParseImageContentType(IdImageUpload? image, string property)
    {
        if (image is null)
        {
            throw new ArgumentException($"{property} is required.", "request");
        }

        if (image.Content is null || string.IsNullOrEmpty(image.FileName))
        {
            throw new ArgumentException($"{property} needs both Content and a FileName.", "request");
        }

        if (!MediaTypeHeaderValue.TryParse(image.ContentType, out var mediaType))
        {
            throw new ArgumentException($"{property}.ContentType must be a valid MIME type, for example \"image/jpeg\".", "request");
        }

        return mediaType;
    }

    private static void AddImagePart(MultipartFormDataContent content, string name, IdImageUpload image, MediaTypeHeaderValue contentType)
    {
        var part = new StreamContent(image.Content);
        part.Headers.ContentType = contentType;
        content.Add(part, "\"" + name + "\"", "\"" + image.FileName + "\"");
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
