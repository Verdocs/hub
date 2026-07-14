using System.Globalization;
using System.Net;
using System.Net.Http.Headers;
using System.Text.Json;
using Verdocs.Models;

namespace Verdocs.Resources;

/// <summary>
/// Organization calls, reached through the endpoint's Organizations property.
/// </summary>
public sealed class Organizations
{
    private readonly VerdocsEndpoint _endpoint;

    internal Organizations(VerdocsEndpoint endpoint)
    {
        _endpoint = endpoint;
    }

    /// <summary>
    /// Gets one organization by its ID. The caller must be a member of it; the response
    /// includes the organization's entitlements, children, and parent.
    /// </summary>
    /// <param name="organizationId">The organization's unique ID.</param>
    /// <param name="cancellationToken">Token to cancel the operation.</param>
    /// <returns>The requested organization.</returns>
    /// <exception cref="VerdocsApiException">The call failed, for example because the caller is not a member.</exception>
    public Task<Organization> GetAsync(string organizationId, CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrEmpty(organizationId);
        return _endpoint.SendAsync<Organization>(
            HttpMethod.Get, "/v2/organizations/" + Uri.EscapeDataString(organizationId), null, cancellationToken);
    }

    /// <summary>
    /// Gets an organization's child organizations, each with its entitlements. The caller
    /// must be an admin of the parent. The server answers 404 when the organization has no
    /// children, so expect an exception rather than an empty list for a childless parent.
    /// </summary>
    /// <param name="organizationId">The parent organization's unique ID.</param>
    /// <param name="cancellationToken">Token to cancel the operation.</param>
    /// <returns>The child organizations.</returns>
    /// <exception cref="VerdocsApiException">The call failed, for example because there are no children.</exception>
    public Task<IReadOnlyList<Organization>> GetChildrenAsync(string organizationId, CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrEmpty(organizationId);
        return GetChildrenCoreAsync(organizationId, cancellationToken);
    }

    private async Task<IReadOnlyList<Organization>> GetChildrenCoreAsync(string organizationId, CancellationToken cancellationToken)
    {
        return await _endpoint.SendAsync<List<Organization>>(
                HttpMethod.Get, "/v2/organizations/" + Uri.EscapeDataString(organizationId) + "/children", null, cancellationToken)
            .ConfigureAwait(false);
    }

    /// <summary>
    /// Gets an organization's usage counters, including its children's when it is a parent.
    /// The caller must be an admin. The result is keyed by organization ID, and each entry
    /// maps a usage type (see <see cref="UsageType"/>) to its count for the period.
    /// </summary>
    /// <param name="organizationId">The organization's unique ID.</param>
    /// <param name="options">Optional date range and usage-type filters.</param>
    /// <param name="cancellationToken">Token to cancel the operation.</param>
    /// <returns>Usage counts grouped by organization ID, then usage type.</returns>
    /// <exception cref="VerdocsApiException">The call failed, for example because the caller is not an admin.</exception>
    public Task<IReadOnlyDictionary<string, IReadOnlyDictionary<string, long>>> GetUsageAsync(
        string organizationId,
        GetOrganizationUsageOptions? options = null,
        CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrEmpty(organizationId);
        return GetUsageCoreAsync(BuildUsagePath(organizationId, options), cancellationToken);
    }

    private async Task<IReadOnlyDictionary<string, IReadOnlyDictionary<string, long>>> GetUsageCoreAsync(
        string pathAndQuery,
        CancellationToken cancellationToken)
    {
        return await _endpoint.SendAsync<Dictionary<string, IReadOnlyDictionary<string, long>>>(
                HttpMethod.Get, pathAndQuery, null, cancellationToken)
            .ConfigureAwait(false);
    }

    /// <summary>
    /// Creates an organization. For a top-level organization the caller becomes its owner,
    /// is switched to the new profile, and receives fresh session tokens; apply them with
    /// <see cref="VerdocsEndpoint.SetToken"/>. When <see cref="CreateOrganizationRequest.ParentId"/>
    /// is set (and matches the caller's current organization), a child organization is created
    /// instead: the caller's session is left alone and the child arrives with an auto-created
    /// default API key.
    ///
    /// <example>
    /// <code>
    /// var created = await endpoint.Organizations.CreateAsync(new CreateOrganizationRequest { Name = "NewOrg" });
    /// endpoint.SetToken(created.AccessToken);
    /// </code>
    /// </example>
    /// </summary>
    /// <param name="request">Details for the new organization.</param>
    /// <param name="cancellationToken">Token to cancel the operation.</param>
    /// <returns>The new organization, plus session tokens for top-level creations.</returns>
    /// <exception cref="VerdocsApiException">The call failed, for example because the parent ID is not the caller's organization.</exception>
    public Task<CreateOrganizationResponse> CreateAsync(CreateOrganizationRequest request, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(request);
        return CreateCoreAsync(request, cancellationToken);
    }

    private async Task<CreateOrganizationResponse> CreateCoreAsync(CreateOrganizationRequest request, CancellationToken cancellationToken)
    {
        // The server answers with two different shapes: top-level organizations get
        // {tokens..., organization, profile}, while child organizations come back as the
        // organization row itself with its api_key inline. We normalize the child shape into
        // the same record so Organization is always populated.
        var element = await _endpoint.SendAsync<JsonElement>(HttpMethod.Post, "/v2/organizations", request, cancellationToken)
            .ConfigureAwait(false);

        try
        {
            if (element.ValueKind == JsonValueKind.Object && element.TryGetProperty("access_token", out _))
            {
                return element.Deserialize<CreateOrganizationResponse>(VerdocsJson.Options)!;
            }

            return new CreateOrganizationResponse
            {
                Organization = element.Deserialize<Organization>(VerdocsJson.Options),
            };
        }
        catch (JsonException exception)
        {
            throw new VerdocsApiException(
                HttpStatusCode.OK, element.GetRawText(), "The Verdocs API response could not be parsed.", exception);
        }
    }

    /// <summary>
    /// Updates an organization. The caller must be an admin. Only the fields set on the
    /// request are sent; fields omitted are left unchanged.
    /// </summary>
    /// <param name="organizationId">The organization's unique ID.</param>
    /// <param name="request">The changes to apply.</param>
    /// <param name="cancellationToken">Token to cancel the operation.</param>
    /// <returns>The updated organization, including its groups and entitlements.</returns>
    /// <exception cref="VerdocsApiException">The call failed, for example because the caller is not an admin.</exception>
    public Task<Organization> UpdateAsync(string organizationId, UpdateOrganizationRequest request, CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrEmpty(organizationId);
        ArgumentNullException.ThrowIfNull(request);
        return _endpoint.SendAsync<Organization>(
            HttpMethod.Patch, "/v2/organizations/" + Uri.EscapeDataString(organizationId), request, cancellationToken);
    }

    /// <summary>
    /// Gets an organization's document-pipeline settings. The caller must be an admin.
    /// </summary>
    /// <param name="organizationId">The organization's unique ID.</param>
    /// <param name="cancellationToken">Token to cancel the operation.</param>
    /// <returns>The pipeline settings, with every flag normalized to a boolean.</returns>
    /// <exception cref="VerdocsApiException">The call failed, for example because the caller is not an admin.</exception>
    public Task<PipelineSettings> GetPipelineSettingsAsync(string organizationId, CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrEmpty(organizationId);
        return _endpoint.SendAsync<PipelineSettings>(
            HttpMethod.Get, "/v2/organizations/" + Uri.EscapeDataString(organizationId) + "/pipeline-settings", null, cancellationToken);
    }

    /// <summary>
    /// Updates an organization's document-pipeline settings. The caller must be an admin.
    /// Only the flags set on the request are sent; flags omitted are left unchanged.
    /// </summary>
    /// <param name="organizationId">The organization's unique ID.</param>
    /// <param name="request">The flags to change.</param>
    /// <param name="cancellationToken">Token to cancel the operation.</param>
    /// <returns>The updated pipeline settings, with every flag normalized to a boolean.</returns>
    /// <exception cref="VerdocsApiException">The call failed, for example because the caller is not an admin.</exception>
    public Task<PipelineSettings> UpdatePipelineSettingsAsync(
        string organizationId,
        UpdatePipelineSettingsRequest request,
        CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrEmpty(organizationId);
        ArgumentNullException.ThrowIfNull(request);
        return _endpoint.SendAsync<PipelineSettings>(
            HttpMethod.Patch, "/v2/organizations/" + Uri.EscapeDataString(organizationId) + "/pipeline-settings", request, cancellationToken);
    }

    /// <summary>
    /// Deletes the caller's current organization. The caller must be an owner, the ID must
    /// match the caller's current organization, and deletion protection must be off. Document
    /// files are retained in storage even though the database records are removed.
    /// </summary>
    /// <param name="organizationId">The organization's unique ID, as a safety check.</param>
    /// <param name="cancellationToken">Token to cancel the operation.</param>
    /// <returns>
    /// Session tokens for the caller's next remaining profile, or null when no profile
    /// remains and the caller is signed out.
    /// </returns>
    /// <exception cref="VerdocsApiException">The call failed, for example because deletion protection is on.</exception>
    public Task<AuthenticateResponse?> DeleteAsync(string organizationId, CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrEmpty(organizationId);
        return DeleteCoreAsync(organizationId, cancellationToken);
    }

    private async Task<AuthenticateResponse?> DeleteCoreAsync(string organizationId, CancellationToken cancellationToken)
    {
        // When the caller has no other profile to fall back to, the server answers 204 with
        // an empty body; the JSON helper treats an empty body as an error, so this reads the
        // body as text first.
        var body = await _endpoint.SendStringAsync(
                HttpMethod.Delete, "/v2/organizations/" + Uri.EscapeDataString(organizationId), cancellationToken)
            .ConfigureAwait(false);
        if (string.IsNullOrWhiteSpace(body) || body == "null")
        {
            return null;
        }

        try
        {
            return JsonSerializer.Deserialize<AuthenticateResponse>(body, VerdocsJson.Options);
        }
        catch (JsonException exception)
        {
            throw new VerdocsApiException(HttpStatusCode.OK, body, "The Verdocs API response could not be parsed.", exception);
        }
    }

    /// <summary>
    /// Uploads a new full-size logo for the organization. The caller must be an admin. The
    /// stream is read once and disposed with the request. Large uploads may need a longer
    /// endpoint timeout than the 60-second default.
    /// </summary>
    /// <param name="organizationId">The organization's unique ID.</param>
    /// <param name="file">The image content.</param>
    /// <param name="fileName">File name to declare for the upload, for example "logo.png".</param>
    /// <param name="contentType">MIME type to declare for the upload, for example "image/png".</param>
    /// <param name="cancellationToken">Token to cancel the operation.</param>
    /// <returns>The updated organization, including its groups and entitlements.</returns>
    /// <exception cref="VerdocsApiException">The call failed, for example because the caller is not an admin.</exception>
    public Task<Organization> UpdateLogoAsync(
        string organizationId,
        Stream file,
        string fileName,
        string contentType,
        CancellationToken cancellationToken = default)
    {
        return SendFileAsync(organizationId, "logo", file, fileName, contentType, cancellationToken);
    }

    /// <summary>
    /// Uploads a new thumbnail logo for the organization. The caller must be an admin. The
    /// stream is read once and disposed with the request.
    /// </summary>
    /// <param name="organizationId">The organization's unique ID.</param>
    /// <param name="file">The image content. A square image is recommended.</param>
    /// <param name="fileName">File name to declare for the upload, for example "thumbnail.png".</param>
    /// <param name="contentType">MIME type to declare for the upload, for example "image/png".</param>
    /// <param name="cancellationToken">Token to cancel the operation.</param>
    /// <returns>The updated organization, including its groups and entitlements.</returns>
    /// <exception cref="VerdocsApiException">The call failed, for example because the caller is not an admin.</exception>
    public Task<Organization> UpdateThumbnailAsync(
        string organizationId,
        Stream file,
        string fileName,
        string contentType,
        CancellationToken cancellationToken = default)
    {
        return SendFileAsync(organizationId, "thumbnail", file, fileName, contentType, cancellationToken);
    }

    /// <summary>
    /// Gets the entitlements granted to the caller's organization. The list may include
    /// entries that are not yet active or have expired; see
    /// <see cref="GetActiveEntitlementsAsync"/> for the collapsed current view.
    /// </summary>
    /// <param name="cancellationToken">Token to cancel the operation.</param>
    /// <returns>All entitlement grants for the caller's organization.</returns>
    /// <exception cref="VerdocsApiException">The call failed, for example because the session is invalid.</exception>
    public async Task<IReadOnlyList<Entitlement>> GetEntitlementsAsync(CancellationToken cancellationToken = default)
    {
        return await _endpoint.SendAsync<List<Entitlement>>(
                HttpMethod.Get, "/v2/organizations/entitlements", null, cancellationToken)
            .ConfigureAwait(false);
    }

    /// <summary>
    /// Gets the caller's organization entitlements collapsed to the currently active grant
    /// per feature, keyed by feature name (see <see cref="EntitlementFeature"/>). Presence of
    /// a key means the feature is enabled now; the entry carries its limits and dates.
    ///
    /// <example>
    /// <code>
    /// var active = await endpoint.Organizations.GetActiveEntitlementsAsync();
    /// var smsEnabled = active.ContainsKey(EntitlementFeature.SmsAuth);
    /// </code>
    /// </example>
    /// </summary>
    /// <param name="cancellationToken">Token to cancel the operation.</param>
    /// <returns>The active entitlement per feature.</returns>
    /// <exception cref="InvalidOperationException">The endpoint has no active session.</exception>
    /// <exception cref="VerdocsApiException">The call failed, for example because the session is invalid.</exception>
    public Task<IReadOnlyDictionary<string, Entitlement>> GetActiveEntitlementsAsync(CancellationToken cancellationToken = default)
    {
        if (_endpoint.Session is null)
        {
            throw new InvalidOperationException("No active session.");
        }

        return CollapseAsync(cancellationToken);

        async Task<IReadOnlyDictionary<string, Entitlement>> CollapseAsync(CancellationToken token)
        {
            var entitlements = await GetEntitlementsAsync(token).ConfigureAwait(false);

            // Mirrors the js-sdk collapse: grants may overlap, so the first grant whose date
            // window covers now wins for each feature.
            var now = DateTimeOffset.UtcNow;
            var active = new Dictionary<string, Entitlement>();
            foreach (var entitlement in entitlements)
            {
                if (now >= entitlement.StartsAt && now <= entitlement.EndsAt)
                {
                    active.TryAdd(entitlement.Feature, entitlement);
                }
            }

            return active;
        }
    }

    private Task<Organization> SendFileAsync(
        string organizationId,
        string partName,
        Stream file,
        string fileName,
        string contentType,
        CancellationToken cancellationToken)
    {
        ArgumentException.ThrowIfNullOrEmpty(organizationId);
        ArgumentNullException.ThrowIfNull(file);
        ArgumentException.ThrowIfNullOrEmpty(fileName);
        ArgumentException.ThrowIfNullOrEmpty(contentType);

        // Names are pre-quoted because .NET only quotes multipart part names when it must,
        // while browsers (the API's usual traffic) always quote them. The server keys off the
        // part name: "logo" updates full_logo_url and "thumbnail" updates thumbnail_url.
        var content = new MultipartFormDataContent();
        var part = new StreamContent(file);
        part.Headers.ContentType = new MediaTypeHeaderValue(contentType);
        content.Add(part, "\"" + partName + "\"", "\"" + fileName + "\"");

        return _endpoint.SendAsync<Organization>(
            HttpMethod.Patch, "/v2/organizations/" + Uri.EscapeDataString(organizationId), content, cancellationToken);
    }

    private static string BuildUsagePath(string organizationId, GetOrganizationUsageOptions? options)
    {
        var path = "/v2/organizations/" + Uri.EscapeDataString(organizationId) + "/usage";
        if (options is null)
        {
            return path;
        }

        var parameters = new List<string>();

        void Add(string key, string value) => parameters.Add(key + "=" + Uri.EscapeDataString(value));

        if (options.StartDate is { } startDate)
        {
            Add("start_date", FormatUtc(startDate));
        }

        if (options.EndDate is { } endDate)
        {
            Add("end_date", FormatUtc(endDate));
        }

        if (options.UsageType is { } usageType)
        {
            Add("usage_type", usageType);
        }

        return parameters.Count == 0 ? path : path + "?" + string.Join("&", parameters);
    }

    // The server validates these dates with a UTC-only ISO 8601 rule, so offsets are
    // converted rather than passed through.
    private static string FormatUtc(DateTimeOffset value)
    {
        return value.UtcDateTime.ToString("o", CultureInfo.InvariantCulture);
    }
}
