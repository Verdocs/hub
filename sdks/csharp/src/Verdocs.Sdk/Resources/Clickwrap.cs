using System.Globalization;
using System.Text.Json;
using Verdocs.Models;

namespace Verdocs.Resources;

/// <summary>
/// Clickwrap calls, reached through the endpoint's Clickwrap property. Clickwrap agreements are
/// terms people accept with a checkbox. The admin calls (agreements, drafts, publishing,
/// coverage, status, sessions, and records) need an admin profile or API key and the clickwrap
/// entitlement. The session calls (GetSessionAsync, SendEventAsync, AcceptAsync, DeclineAsync)
/// instead take the session token from <see cref="CreateSessionAsync"/>.
/// </summary>
public sealed class Clickwrap
{
    private const string BasePath = "/v2/clickwraps";

    private readonly VerdocsEndpoint _endpoint;

    internal Clickwrap(VerdocsEndpoint endpoint)
    {
        _endpoint = endpoint;
    }

    /// <summary>
    /// Lists the organization's agreements, each with its current (latest published) version
    /// and its open draft.
    ///
    /// <example>
    /// <code>
    /// var agreements = await endpoint.Clickwrap.ListAgreementsAsync();
    /// </code>
    /// </example>
    /// </summary>
    /// <param name="cancellationToken">Token to cancel the operation.</param>
    /// <returns>The agreements, oldest first.</returns>
    /// <exception cref="VerdocsApiException">The call failed.</exception>
    /// <sdkOperation>clickwrap.getClickwrapAgreements</sdkOperation>
    /// <sdkGroup>Clickwrap</sdkGroup>
    /// <sdkPage>Endpoints</sdkPage>
    public async Task<IReadOnlyList<ClickwrapAgreementSummary>> ListAgreementsAsync(CancellationToken cancellationToken = default)
    {
        var response = await _endpoint.SendAsync<AgreementsEnvelope>(HttpMethod.Get, BasePath + "/agreements", null, cancellationToken)
            .ConfigureAwait(false);
        return response.Agreements;
    }

    /// <summary>
    /// Gets one agreement with every version, newest first, including each version's text.
    /// </summary>
    /// <param name="agreementId">The agreement to get.</param>
    /// <param name="cancellationToken">Token to cancel the operation.</param>
    /// <returns>The agreement with its versions.</returns>
    /// <exception cref="VerdocsApiException">The call failed, for example because no such agreement exists.</exception>
    /// <sdkOperation>clickwrap.getClickwrapAgreement</sdkOperation>
    /// <sdkGroup>Clickwrap</sdkGroup>
    /// <sdkPage>Endpoints</sdkPage>
    public async Task<ClickwrapAgreementDetail> GetAgreementAsync(string agreementId, CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(agreementId);
        var response = await _endpoint.SendAsync<AgreementEnvelope<ClickwrapAgreementDetail>>(
            HttpMethod.Get, AgreementPath(agreementId), null, cancellationToken).ConfigureAwait(false);
        return response.Agreement;
    }

    /// <summary>
    /// Creates an agreement. It starts with no versions. The key can never change, because
    /// developers put it in their code.
    ///
    /// <example>
    /// <code>
    /// var agreement = await endpoint.Clickwrap.CreateAgreementAsync(new CreateClickwrapAgreementRequest
    /// {
    ///     Key = "terms-of-service",
    ///     Name = "Terms of Service",
    /// });
    /// </code>
    /// </example>
    /// </summary>
    /// <param name="request">The agreement's key and name.</param>
    /// <param name="cancellationToken">Token to cancel the operation.</param>
    /// <returns>The new agreement.</returns>
    /// <exception cref="VerdocsApiException">The call failed, for example because the key is taken.</exception>
    /// <sdkOperation>clickwrap.createClickwrapAgreement</sdkOperation>
    /// <sdkGroup>Clickwrap</sdkGroup>
    /// <sdkPage>Endpoints</sdkPage>
    public async Task<ClickwrapAgreement> CreateAgreementAsync(CreateClickwrapAgreementRequest request, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(request);
        var response = await _endpoint.SendAsync<AgreementEnvelope<ClickwrapAgreement>>(
            HttpMethod.Post, BasePath + "/agreements", request, cancellationToken).ConfigureAwait(false);
        return response.Agreement;
    }

    /// <summary>
    /// Renames an agreement. Its key never changes.
    /// </summary>
    /// <param name="agreementId">The agreement to rename.</param>
    /// <param name="name">The new name.</param>
    /// <param name="cancellationToken">Token to cancel the operation.</param>
    /// <returns>The renamed agreement.</returns>
    /// <exception cref="VerdocsApiException">The call failed.</exception>
    /// <sdkOperation>clickwrap.renameClickwrapAgreement</sdkOperation>
    /// <sdkGroup>Clickwrap</sdkGroup>
    /// <sdkPage>Endpoints</sdkPage>
    public async Task<ClickwrapAgreement> RenameAgreementAsync(string agreementId, string name, CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(agreementId);
        ArgumentException.ThrowIfNullOrWhiteSpace(name);
        var response = await _endpoint.SendAsync<AgreementEnvelope<ClickwrapAgreement>>(
            HttpMethod.Patch, AgreementPath(agreementId), new Dictionary<string, string> { ["name"] = name }, cancellationToken)
            .ConfigureAwait(false);
        return response.Agreement;
    }

    /// <summary>
    /// Starts a draft version: empty, with the given text, or copied from the current version.
    /// An agreement has at most one draft, and nobody sees it until it's published.
    ///
    /// <example>
    /// <code>
    /// var draft = await endpoint.Clickwrap.CreateDraftAsync(agreementId, new CreateClickwrapDraftRequest { CopyCurrent = true });
    /// </code>
    /// </example>
    /// </summary>
    /// <param name="agreementId">The agreement to add the draft to.</param>
    /// <param name="request">The text or CopyCurrent. Null for an empty draft.</param>
    /// <param name="cancellationToken">Token to cancel the operation.</param>
    /// <returns>The new draft.</returns>
    /// <exception cref="VerdocsApiException">The call failed, for example because a draft already exists.</exception>
    /// <sdkOperation>clickwrap.createClickwrapDraft</sdkOperation>
    /// <sdkGroup>Clickwrap</sdkGroup>
    /// <sdkPage>Endpoints</sdkPage>
    public async Task<ClickwrapVersion> CreateDraftAsync(string agreementId, CreateClickwrapDraftRequest? request = null, CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(agreementId);
        var response = await _endpoint.SendAsync<VersionEnvelope>(
            HttpMethod.Post, AgreementPath(agreementId) + "/versions", request ?? new CreateClickwrapDraftRequest(), cancellationToken)
            .ConfigureAwait(false);
        return response.Version;
    }

    /// <summary>
    /// Replaces a draft's text. Only drafts can be edited; published versions never change.
    /// </summary>
    /// <param name="versionId">The draft to edit.</param>
    /// <param name="content">The agreement text as HTML, sanitized on save.</param>
    /// <param name="cancellationToken">Token to cancel the operation.</param>
    /// <returns>The updated draft.</returns>
    /// <exception cref="VerdocsApiException">The call failed, for example because the version is published.</exception>
    /// <sdkOperation>clickwrap.updateClickwrapDraft</sdkOperation>
    /// <sdkGroup>Clickwrap</sdkGroup>
    /// <sdkPage>Endpoints</sdkPage>
    public async Task<ClickwrapVersion> UpdateDraftAsync(string versionId, string content, CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(versionId);
        ArgumentNullException.ThrowIfNull(content);
        var response = await _endpoint.SendAsync<VersionEnvelope>(
            HttpMethod.Patch, VersionPath(versionId), new Dictionary<string, string> { ["content"] = content }, cancellationToken)
            .ConfigureAwait(false);
        return response.Version;
    }

    /// <summary>
    /// Deletes a draft version. Published versions can never be deleted.
    /// </summary>
    /// <param name="versionId">The draft to delete.</param>
    /// <param name="cancellationToken">Token to cancel the operation.</param>
    /// <returns>A task that completes when the draft is deleted.</returns>
    /// <exception cref="VerdocsApiException">The call failed, for example because the version is published.</exception>
    /// <sdkOperation>clickwrap.deleteClickwrapDraft</sdkOperation>
    /// <sdkGroup>Clickwrap</sdkGroup>
    /// <sdkPage>Endpoints</sdkPage>
    public Task DeleteDraftAsync(string versionId, CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(versionId);
        return _endpoint.SendVoidAsync(HttpMethod.Delete, VersionPath(versionId), null, cancellationToken);
    }

    /// <summary>
    /// Publishes a draft. This can't be undone: the text is hashed and frozen, and it becomes
    /// what people are shown. With RequiresReacceptance, everyone who accepted an earlier
    /// version must accept again.
    ///
    /// <example>
    /// <code>
    /// await endpoint.Clickwrap.PublishVersionAsync(versionId, new PublishClickwrapVersionRequest { RequiresReacceptance = true });
    /// </code>
    /// </example>
    /// </summary>
    /// <param name="versionId">The draft to publish.</param>
    /// <param name="request">Whether re-acceptance is required, and an optional change summary.</param>
    /// <param name="cancellationToken">Token to cancel the operation.</param>
    /// <returns>The published version.</returns>
    /// <exception cref="VerdocsApiException">The call failed, for example because the draft is empty.</exception>
    /// <sdkOperation>clickwrap.publishClickwrapVersion</sdkOperation>
    /// <sdkGroup>Clickwrap</sdkGroup>
    /// <sdkPage>Endpoints</sdkPage>
    public async Task<ClickwrapVersion> PublishVersionAsync(string versionId, PublishClickwrapVersionRequest request, CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(versionId);
        ArgumentNullException.ThrowIfNull(request);
        var response = await _endpoint.SendAsync<VersionEnvelope>(
            HttpMethod.Post, VersionPath(versionId) + "/publish", request, cancellationToken).ConfigureAwait(false);
        return response.Version;
    }

    /// <summary>
    /// Counts who has accepted an agreement: everyone who accepted any version, how many are
    /// current, and the count for each published version. Counts distinct people, not clicks.
    /// </summary>
    /// <param name="agreementId">The agreement to count.</param>
    /// <param name="cancellationToken">Token to cancel the operation.</param>
    /// <returns>The counts.</returns>
    /// <exception cref="VerdocsApiException">The call failed.</exception>
    /// <sdkOperation>clickwrap.getClickwrapCoverage</sdkOperation>
    /// <sdkGroup>Clickwrap</sdkGroup>
    /// <sdkPage>Endpoints</sdkPage>
    public Task<ClickwrapCoverage> GetCoverageAsync(string agreementId, CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(agreementId);
        return _endpoint.SendAsync<ClickwrapCoverage>(HttpMethod.Get, AgreementPath(agreementId) + "/coverage", null, cancellationToken);
    }

    /// <summary>
    /// Checks whether one person is current on each named agreement. Current means they
    /// accepted a published version at or after the newest one that requires re-acceptance.
    /// Declines never make anyone current.
    ///
    /// <example>
    /// <code>
    /// var status = await endpoint.Clickwrap.GetStatusAsync("user-123", ["terms-of-service"]);
    /// var needsTerms = status.Any(entry => !entry.Current);
    /// </code>
    /// </example>
    /// </summary>
    /// <param name="userId">The person's ID in your own system.</param>
    /// <param name="agreements">The agreement keys to check, up to 20.</param>
    /// <param name="cancellationToken">Token to cancel the operation.</param>
    /// <returns>One entry per agreement.</returns>
    /// <exception cref="VerdocsApiException">The call failed, for example because a key is unknown.</exception>
    /// <sdkOperation>clickwrap.getClickwrapStatus</sdkOperation>
    /// <sdkGroup>Clickwrap</sdkGroup>
    /// <sdkPage>Endpoints</sdkPage>
    public async Task<IReadOnlyList<ClickwrapStatus>> GetStatusAsync(string userId, IReadOnlyList<string> agreements, CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(userId);
        ArgumentNullException.ThrowIfNull(agreements);
        var path = BasePath + "/status?user_id=" + Uri.EscapeDataString(userId)
            + "&agreements=" + Uri.EscapeDataString(string.Join(",", agreements));
        return await _endpoint.SendAsync<List<ClickwrapStatus>>(HttpMethod.Get, path, null, cancellationToken).ConfigureAwait(false);
    }

    /// <summary>
    /// Starts an acceptance session for one person, from your server. When they're already
    /// current, the answer is a <see cref="ClickwrapSessionCurrent"/> with nothing to show.
    /// Otherwise it's a <see cref="ClickwrapSessionCreated"/> carrying a session token for the
    /// component (or a hosted URL) that expires in an hour.
    ///
    /// <example>
    /// <code>
    /// var result = await endpoint.Clickwrap.CreateSessionAsync(new CreateClickwrapSessionRequest
    /// {
    ///     UserId = "user-123",
    ///     Agreements = ["terms-of-service"],
    /// });
    /// if (result is ClickwrapSessionCreated session)
    /// {
    ///     // Hand session.Token to the browser
    /// }
    /// </code>
    /// </example>
    /// </summary>
    /// <param name="request">The person, the agreement keys, and how to show them.</param>
    /// <param name="cancellationToken">Token to cancel the operation.</param>
    /// <returns>The session, or the person's status when there's nothing to accept.</returns>
    /// <exception cref="VerdocsApiException">The call failed, for example because a key is unknown.</exception>
    /// <sdkOperation>clickwrap.createClickwrapSession</sdkOperation>
    /// <sdkGroup>Clickwrap</sdkGroup>
    /// <sdkPage>Endpoints</sdkPage>
    public async Task<ClickwrapSessionResult> CreateSessionAsync(CreateClickwrapSessionRequest request, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(request);
        var element = await _endpoint.SendAsync<JsonElement>(HttpMethod.Post, BasePath + "/session", request, cancellationToken)
            .ConfigureAwait(false);

        // The two answers reuse "agreements" for different shapes, so we read "current" first
        // and parse into the matching record.
        var current = element.TryGetProperty("current", out var flag) && flag.ValueKind == JsonValueKind.True;
        ClickwrapSessionResult? result = current
            ? element.Deserialize<ClickwrapSessionCurrent>(VerdocsJson.Options)
            : element.Deserialize<ClickwrapSessionCreated>(VerdocsJson.Options);
        return result ?? throw new VerdocsApiException(System.Net.HttpStatusCode.OK, element.GetRawText(), "The Verdocs API returned an empty session.");
    }

    /// <summary>
    /// Records an acceptance or decline that happened in your own interface (headless). The IP
    /// address and user agent are kept as your report, and a presentation is stored as sent.
    ///
    /// <example>
    /// <code>
    /// var result = await endpoint.Clickwrap.RecordOutcomeAsync(new RecordClickwrapOutcomeRequest
    /// {
    ///     UserId = "user-123",
    ///     Outcome = ClickwrapOutcome.Accepted,
    ///     Agreements = [new ClickwrapOutcomeAgreement { Key = "terms-of-service", VersionId = versionId }],
    /// });
    /// </code>
    /// </example>
    /// </summary>
    /// <param name="request">Who, what they did, and which versions they saw.</param>
    /// <param name="cancellationToken">Token to cancel the operation.</param>
    /// <returns>The new record.</returns>
    /// <exception cref="VerdocsApiException">The call failed, for example because a version isn't published.</exception>
    /// <sdkOperation>clickwrap.recordClickwrapOutcome</sdkOperation>
    /// <sdkGroup>Clickwrap</sdkGroup>
    /// <sdkPage>Endpoints</sdkPage>
    public Task<ClickwrapOutcomeResult> RecordOutcomeAsync(RecordClickwrapOutcomeRequest request, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(request);
        return _endpoint.SendAsync<ClickwrapOutcomeResult>(HttpMethod.Post, BasePath + "/acceptances", request, cancellationToken);
    }

    /// <summary>
    /// Finds recorded acceptances and declines, newest first. Search by UserId, or by one
    /// metadata key and value.
    /// </summary>
    /// <param name="options">The search and paging.</param>
    /// <param name="cancellationToken">Token to cancel the operation.</param>
    /// <returns>One page of record summaries.</returns>
    /// <exception cref="VerdocsApiException">The call failed, for example because no search was given.</exception>
    /// <sdkOperation>clickwrap.getClickwrapAcceptances</sdkOperation>
    /// <sdkGroup>Clickwrap</sdkGroup>
    /// <sdkPage>Endpoints</sdkPage>
    public Task<ClickwrapAcceptanceList> ListAcceptancesAsync(ListClickwrapAcceptancesOptions options, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(options);
        return _endpoint.SendAsync<ClickwrapAcceptanceList>(HttpMethod.Get, BuildAcceptancesPath(options), null, cancellationToken);
    }

    /// <summary>
    /// Gets one recorded acceptance or decline: who, which agreement versions, where and how it
    /// happened, the labels shown, and the event trail. Records never change.
    /// </summary>
    /// <param name="acceptanceId">The record to get.</param>
    /// <param name="cancellationToken">Token to cancel the operation.</param>
    /// <returns>The record.</returns>
    /// <exception cref="VerdocsApiException">The call failed, for example because no such record exists.</exception>
    /// <sdkOperation>clickwrap.getClickwrapAcceptance</sdkOperation>
    /// <sdkGroup>Clickwrap</sdkGroup>
    /// <sdkPage>Endpoints</sdkPage>
    public Task<ClickwrapAcceptance> GetAcceptanceAsync(string acceptanceId, CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(acceptanceId);
        return _endpoint.SendAsync<ClickwrapAcceptance>(HttpMethod.Get, AcceptancePath(acceptanceId), null, cancellationToken);
    }

    /// <summary>
    /// Gets a 15-minute download link for one of a record's files: the signed certificate, the
    /// replay (only when the record has a presentation), or the evidence package. The first
    /// request for a file can take several seconds while it's made.
    ///
    /// <example>
    /// <code>
    /// var link = await endpoint.Clickwrap.GetDownloadLinkAsync(acceptanceId, ClickwrapDownloadType.Evidence);
    /// </code>
    /// </example>
    /// </summary>
    /// <param name="acceptanceId">The record to download from.</param>
    /// <param name="type">Which file to link to; see <see cref="ClickwrapDownloadType"/>.</param>
    /// <param name="cancellationToken">Token to cancel the operation.</param>
    /// <returns>The link and how long it works.</returns>
    /// <exception cref="VerdocsApiException">The call failed, for example because a replay has no presentation.</exception>
    /// <sdkOperation>clickwrap.getClickwrapDownloadLink</sdkOperation>
    /// <sdkGroup>Clickwrap</sdkGroup>
    /// <sdkPage>Endpoints</sdkPage>
    public Task<ClickwrapDownloadLink> GetDownloadLinkAsync(string acceptanceId, string type, CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(acceptanceId);
        ArgumentException.ThrowIfNullOrWhiteSpace(type);
        return _endpoint.SendAsync<ClickwrapDownloadLink>(
            HttpMethod.Get, AcceptancePath(acceptanceId) + "/download?type=" + Uri.EscapeDataString(type), null, cancellationToken);
    }

    /// <summary>
    /// Gets what an acceptance session shows: each agreement version's text, the display mode,
    /// and the brand. Authorized by the session token, not the endpoint's session.
    /// </summary>
    /// <param name="token">The session token from <see cref="CreateSessionAsync"/>.</param>
    /// <param name="cancellationToken">Token to cancel the operation.</param>
    /// <returns>The session's agreements, mode, and brand.</returns>
    /// <exception cref="VerdocsApiException">The call failed, for example because the token expired.</exception>
    /// <sdkOperation>clickwrap.getClickwrapSession</sdkOperation>
    /// <sdkGroup>Clickwrap</sdkGroup>
    /// <sdkPage>Endpoints</sdkPage>
    public Task<ClickwrapPublicSession> GetSessionAsync(string token, CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(token);
        return _endpoint.SendWithTokenAsync<ClickwrapPublicSession>(HttpMethod.Get, BasePath + "/session", null, token, cancellationToken);
    }

    /// <summary>
    /// Reports what the person did while reading: the terms were shown, they scrolled to the
    /// end, or they checked or unchecked a box. The events become the record's trail.
    /// </summary>
    /// <param name="token">The session token from <see cref="CreateSessionAsync"/>.</param>
    /// <param name="request">The event, and the checkbox's version ID for checked and unchecked.</param>
    /// <param name="cancellationToken">Token to cancel the operation.</param>
    /// <returns>A task that completes when the event is recorded.</returns>
    /// <exception cref="VerdocsApiException">The call failed.</exception>
    /// <sdkOperation>clickwrap.sendClickwrapEvent</sdkOperation>
    /// <sdkGroup>Clickwrap</sdkGroup>
    /// <sdkPage>Endpoints</sdkPage>
    public Task SendEventAsync(string token, SendClickwrapEventRequest request, CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(token);
        ArgumentNullException.ThrowIfNull(request);
        return _endpoint.SendVoidWithTokenAsync(HttpMethod.Post, BasePath + "/session/events", request, token, cancellationToken);
    }

    /// <summary>
    /// Records that the person accepted every agreement in the session. The presentation's text
    /// must contain each version's text and every label, or the call is refused.
    /// </summary>
    /// <param name="token">The session token from <see cref="CreateSessionAsync"/>.</param>
    /// <param name="request">The surface, labels, and rendered presentation.</param>
    /// <param name="cancellationToken">Token to cancel the operation.</param>
    /// <returns>The new record.</returns>
    /// <exception cref="VerdocsApiException">The call failed.</exception>
    /// <sdkOperation>clickwrap.acceptClickwrap</sdkOperation>
    /// <sdkGroup>Clickwrap</sdkGroup>
    /// <sdkPage>Endpoints</sdkPage>
    public Task<ClickwrapOutcomeResult> AcceptAsync(string token, ClickwrapSessionOutcomeRequest request, CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(token);
        ArgumentNullException.ThrowIfNull(request);
        return _endpoint.SendWithTokenAsync<ClickwrapOutcomeResult>(HttpMethod.Post, BasePath + "/session/accept", request, token, cancellationToken);
    }

    /// <summary>
    /// Records that the person declined the session's agreements. Takes the same fields as
    /// <see cref="AcceptAsync"/>.
    /// </summary>
    /// <param name="token">The session token from <see cref="CreateSessionAsync"/>.</param>
    /// <param name="request">The surface, labels, and rendered presentation.</param>
    /// <param name="cancellationToken">Token to cancel the operation.</param>
    /// <returns>The new record.</returns>
    /// <exception cref="VerdocsApiException">The call failed.</exception>
    /// <sdkOperation>clickwrap.declineClickwrap</sdkOperation>
    /// <sdkGroup>Clickwrap</sdkGroup>
    /// <sdkPage>Endpoints</sdkPage>
    public Task<ClickwrapOutcomeResult> DeclineAsync(string token, ClickwrapSessionOutcomeRequest request, CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(token);
        ArgumentNullException.ThrowIfNull(request);
        return _endpoint.SendWithTokenAsync<ClickwrapOutcomeResult>(HttpMethod.Post, BasePath + "/session/decline", request, token, cancellationToken);
    }

    private static string AgreementPath(string agreementId) => BasePath + "/agreements/" + Uri.EscapeDataString(agreementId);

    private static string VersionPath(string versionId) => BasePath + "/versions/" + Uri.EscapeDataString(versionId);

    private static string AcceptancePath(string acceptanceId) => BasePath + "/acceptances/" + Uri.EscapeDataString(acceptanceId);

    private static string BuildAcceptancesPath(ListClickwrapAcceptancesOptions options)
    {
        var parameters = new List<string>();

        void Add(string name, string value) => parameters.Add(name + "=" + Uri.EscapeDataString(value));

        if (options.UserId is { } userId)
        {
            Add("user_id", userId);
        }

        if (options.MetadataKey is { } metadataKey)
        {
            Add("metadata_key", metadataKey);
        }

        if (options.MetadataValue is { } metadataValue)
        {
            Add("metadata_value", metadataValue);
        }

        if (options.Rows is { } rows)
        {
            Add("rows", rows.ToString(CultureInfo.InvariantCulture));
        }

        if (options.Page is { } page)
        {
            Add("page", page.ToString(CultureInfo.InvariantCulture));
        }

        var path = BasePath + "/acceptances";
        return parameters.Count == 0 ? path : path + "?" + string.Join("&", parameters);
    }

    // The api wraps single agreements and versions in an object keyed by type; these unwrap them.
    private sealed record AgreementsEnvelope
    {
        public IReadOnlyList<ClickwrapAgreementSummary> Agreements { get; init; } = [];
    }

    private sealed record AgreementEnvelope<T>
    {
        public T Agreement { get; init; } = default!;
    }

    private sealed record VersionEnvelope
    {
        public ClickwrapVersion Version { get; init; } = null!;
    }
}
