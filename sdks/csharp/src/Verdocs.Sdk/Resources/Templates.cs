using System.Globalization;
using System.Net.Http.Headers;
using Verdocs.Models;

namespace Verdocs.Resources;

/// <summary>
/// Template calls, reached through <see cref="VerdocsEndpoint.Templates"/>.
/// </summary>
public sealed class Templates
{
    private readonly VerdocsEndpoint _endpoint;

    internal Templates(VerdocsEndpoint endpoint)
    {
        _endpoint = endpoint;
    }

    /// <summary>
    /// Gets the templates accessible to the caller, with optional filters.
    ///
    /// <example>
    /// <code>
    /// var page = await endpoint.Templates.ListAsync(new GetTemplatesOptions
    /// {
    ///     Visibility = TemplateVisibilityFilter.PrivateShared,
    ///     Rows = 10,
    ///     Page = 0,
    /// });
    /// </code>
    /// </example>
    /// </summary>
    /// <param name="options">Optional filters, sorting, and paging.</param>
    /// <param name="cancellationToken">Token to cancel the operation.</param>
    /// <returns>One page of templates plus paging counts.</returns>
    /// <exception cref="VerdocsApiException">The call failed, for example because the session is invalid.</exception>
    /// <sdkOperation>template.getTemplates</sdkOperation>
    /// <sdkGroup>Template</sdkGroup>
    /// <sdkPage>Endpoints</sdkPage>
    public Task<TemplateList> ListAsync(GetTemplatesOptions? options = null, CancellationToken cancellationToken = default)
    {
        return _endpoint.SendAsync<TemplateList>(HttpMethod.Get, BuildTemplatesPath(options), null, cancellationToken);
    }

    /// <summary>
    /// Gets one template by its ID. The caller must have at least view access to it. The
    /// detail response includes the template's roles, documents, and fields, which the list
    /// response omits.
    ///
    /// <example>
    /// <code>
    /// var template = await endpoint.Templates.GetAsync("d2338742-f3a1-465b-8592-806587413cc1");
    /// </code>
    /// </example>
    /// </summary>
    /// <param name="templateId">The template's unique ID.</param>
    /// <param name="cancellationToken">Token to cancel the operation.</param>
    /// <returns>The requested template.</returns>
    /// <exception cref="VerdocsApiException">The call failed, for example because the template was not found.</exception>
    /// <sdkOperation>template.getTemplate</sdkOperation>
    /// <sdkGroup>Template</sdkGroup>
    /// <sdkPage>Endpoints</sdkPage>
    public Task<Template> GetAsync(string templateId, CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrEmpty(templateId);
        return _endpoint.SendAsync<Template>(HttpMethod.Get, "/v2/templates/" + Uri.EscapeDataString(templateId), null, cancellationToken);
    }

    /// <summary>
    /// Creates a template, sending the request as JSON. Documents may be attached by URI or
    /// Base64 data via <see cref="CreateTemplateRequest.Documents"/>; to upload local files
    /// directly, use the overload that takes <see cref="TemplateFileUpload"/> parts. Roles
    /// are created inline when supplied. Fields cannot be created here (the server validates
    /// a create-time fields array but discards it); add them afterward through
    /// <see cref="TemplateFields.CreateAsync"/>.
    ///
    /// <example>
    /// <code>
    /// var template = await endpoint.Templates.CreateAsync(new CreateTemplateRequest
    /// {
    ///     Name = "Bill of Sale",
    ///     Visibility = TemplateVisibility.Shared,
    /// });
    /// </code>
    /// </example>
    /// </summary>
    /// <param name="request">The template to create.</param>
    /// <param name="cancellationToken">Token to cancel the operation.</param>
    /// <returns>The new template, including its documents, roles, and fields.</returns>
    /// <exception cref="VerdocsApiException">The call failed, for example because a document was an unsupported type.</exception>
    /// <sdkOperation>template.createTemplate</sdkOperation>
    /// <sdkGroup>Template</sdkGroup>
    /// <sdkPage>Endpoints</sdkPage>
    /// <sdkGettingStarted />
    public Task<Template> CreateAsync(CreateTemplateRequest request, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(request);
        return _endpoint.SendAsync<Template>(HttpMethod.Post, "/v2/templates", request, cancellationToken);
    }

    /// <summary>
    /// Creates a template and uploads local files in the same call, as multipart form data
    /// with every file part named "documents". Multipart text parts carry strings only, so
    /// this path sends just the name, description, visibility, and sender; a request that
    /// sets roles, document sources, or reminder settings is rejected here because those
    /// cannot ride multipart (the js-sdk tries and the server rejects the result). Create
    /// with roles and reminders via the JSON overload, or add them after this call through
    /// <see cref="TemplateRoles.CreateAsync"/> and <see cref="UpdateAsync"/>.
    /// </summary>
    /// <param name="request">The template to create. Only string settings ride along with files.</param>
    /// <param name="documents">Files to upload; at least one. PDF or DOCX, up to 25 MB each.</param>
    /// <param name="cancellationToken">Token to cancel the operation.</param>
    /// <returns>The new template, including its documents, roles, and fields.</returns>
    /// <exception cref="VerdocsApiException">The call failed, for example because a document was an unsupported type.</exception>
    public Task<Template> CreateAsync(
        CreateTemplateRequest request,
        IReadOnlyCollection<TemplateFileUpload> documents,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(request);
        ArgumentNullException.ThrowIfNull(documents);
        if (documents.Count == 0)
        {
            throw new ArgumentException(
                "At least one document is required on the multipart path; use the JSON overload when there are no files to upload.",
                nameof(documents));
        }

        if (request.Roles is not null || request.Documents is not null
            || request.InitialReminder is not null || request.FollowupReminders is not null || request.MaxReminderDays is not null)
        {
            throw new ArgumentException(
                "Roles, document sources, and reminder settings cannot be sent with file uploads; multipart text parts carry strings only. "
                + "Use the JSON overload, or add roles and reminders after creation.",
                nameof(request));
        }

        var content = new MultipartFormDataContent();
        AddTextPart(content, "name", request.Name);
        AddTextPart(content, "description", request.Description);
        AddTextPart(content, "visibility", request.Visibility);
        AddTextPart(content, "sender", request.Sender);

        foreach (var document in documents)
        {
            content.Add(CreateFilePart(document), "\"documents\"", "\"" + document.FileName + "\"");
        }

        return _endpoint.SendAsync<Template>(HttpMethod.Post, "/v2/templates", content, cancellationToken);
    }

    /// <summary>
    /// Updates a template's settings. Reminder settings are rewritten on every update; see
    /// <see cref="UpdateTemplateRequest"/> for the details.
    ///
    /// <example>
    /// <code>
    /// var template = await endpoint.Templates.UpdateAsync(
    ///     "d2338742-f3a1-465b-8592-806587413cc1",
    ///     new UpdateTemplateRequest { Name = "Bill of Sale (v2)" });
    /// </code>
    /// </example>
    /// </summary>
    /// <param name="templateId">The template's unique ID.</param>
    /// <param name="request">The settings to change.</param>
    /// <param name="cancellationToken">Token to cancel the operation.</param>
    /// <returns>The updated template.</returns>
    /// <exception cref="VerdocsApiException">The call failed, for example because the caller may not edit the template.</exception>
    /// <sdkOperation>template.updateTemplate</sdkOperation>
    /// <sdkGroup>Template</sdkGroup>
    /// <sdkPage>Endpoints</sdkPage>
    public Task<Template> UpdateAsync(string templateId, UpdateTemplateRequest request, CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrEmpty(templateId);
        ArgumentNullException.ThrowIfNull(request);
        return _endpoint.SendAsync<Template>(
            HttpMethod.Patch, "/v2/templates/" + Uri.EscapeDataString(templateId), request, cancellationToken);
    }

    /// <summary>
    /// Deletes a template.
    ///
    /// <example>
    /// <code>
    /// await endpoint.Templates.DeleteAsync("d2338742-f3a1-465b-8592-806587413cc1");
    /// </code>
    /// </example>
    /// </summary>
    /// <param name="templateId">The template's unique ID.</param>
    /// <param name="cancellationToken">Token to cancel the operation.</param>
    /// <returns>A task that completes when the template has been deleted.</returns>
    /// <exception cref="VerdocsApiException">The call failed, for example because the caller may not edit the template.</exception>
    /// <sdkOperation>template.deleteTemplate</sdkOperation>
    /// <sdkGroup>Template</sdkGroup>
    /// <sdkPage>Endpoints</sdkPage>
    public Task DeleteAsync(string templateId, CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrEmpty(templateId);
        return _endpoint.SendVoidAsync(
            HttpMethod.Delete, "/v2/templates/" + Uri.EscapeDataString(templateId), null, cancellationToken);
    }

    /// <summary>
    /// Duplicates a template as a complete clone: settings (reminders included), documents,
    /// roles, and fields.
    ///
    /// <example>
    /// <code>
    /// var copy = await endpoint.Templates.DuplicateAsync("d2338742-f3a1-465b-8592-806587413cc1", "Bill of Sale (copy)");
    /// </code>
    /// </example>
    /// </summary>
    /// <param name="templateId">The template to copy.</param>
    /// <param name="name">Name for the new copy.</param>
    /// <param name="cancellationToken">Token to cancel the operation.</param>
    /// <returns>The new copy.</returns>
    /// <exception cref="VerdocsApiException">The call failed, for example because the template was not found.</exception>
    /// <sdkOperation>template.duplicateTemplate</sdkOperation>
    /// <sdkGroup>Template</sdkGroup>
    /// <sdkPage>Endpoints</sdkPage>
    public Task<Template> DuplicateAsync(string templateId, string name, CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrEmpty(templateId);
        ArgumentException.ThrowIfNullOrEmpty(name);
        return _endpoint.SendAsync<Template>(
            HttpMethod.Put, "/v2/templates/" + Uri.EscapeDataString(templateId), new { action = "duplicate", name }, cancellationToken);
    }

    /// <summary>
    /// Creates a template from a Sharepoint file. Dead on the deployed API: no handler exists
    /// for this route, so every call fails. Ported to match the js-sdk surface; retirement is
    /// pending.
    ///
    /// <example>
    /// <code>
    /// var template = await endpoint.Templates.CreateFromSharepointAsync(new CreateTemplateFromSharepointRequest
    /// {
    ///     Name = "Bill of Sale",
    ///     SiteId = "site-id",
    ///     ItemId = "item-id",
    ///     OboToken = "obo-token",
    /// });
    /// </code>
    /// </example>
    /// </summary>
    /// <param name="request">The Sharepoint source and template name.</param>
    /// <param name="cancellationToken">Token to cancel the operation.</param>
    /// <returns>The new template, if the API ever serves this route.</returns>
    /// <exception cref="VerdocsApiException">Always thrown today; the deployed API has no handler for this call.</exception>
    /// <sdkOperation>template.createTemplateFromSharepoint</sdkOperation>
    /// <sdkGroup>Template</sdkGroup>
    /// <sdkPage>Endpoints</sdkPage>
    public Task<Template> CreateFromSharepointAsync(CreateTemplateFromSharepointRequest request, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(request);
        return _endpoint.SendAsync<Template>(HttpMethod.Post, "/v2/templates/from-sharepoint", request, cancellationToken);
    }

    /// <summary>
    /// Toggles the caller's star on a template. Broken on both sides today: the js-sdk (and
    /// this port, which mirrors it) POSTs a path that does not exist, and the server's own
    /// star route is a GET whose handler cannot be satisfied, so the deployed API rejects
    /// every client. Retirement is pending an API fix.
    ///
    /// <example>
    /// <code>
    /// var template = await endpoint.Templates.ToggleStarAsync("d2338742-f3a1-465b-8592-806587413cc1");
    /// </code>
    /// </example>
    /// </summary>
    /// <param name="templateId">The template to star or unstar.</param>
    /// <param name="cancellationToken">Token to cancel the operation.</param>
    /// <returns>The template, if the API ever serves this route.</returns>
    /// <exception cref="VerdocsApiException">Always thrown today; the deployed API rejects this call.</exception>
    /// <sdkOperation>template.toggleTemplateStar</sdkOperation>
    /// <sdkGroup>Template</sdkGroup>
    /// <sdkPage>Endpoints</sdkPage>
    public Task<Template> ToggleStarAsync(string templateId, CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrEmpty(templateId);
        return _endpoint.SendAsync<Template>(
            HttpMethod.Post, "/v2/templates/" + Uri.EscapeDataString(templateId) + "/stars/toggle", null, cancellationToken);
    }

    private static void AddTextPart(MultipartFormDataContent content, string name, string? value)
    {
        if (value is null)
        {
            return;
        }

        // Names are pre-quoted because .NET only quotes multipart part names when it must,
        // while browsers (and so the API's usual traffic) always quote them.
        content.Add(new StringContent(value), "\"" + name + "\"");
    }

    private static StreamContent CreateFilePart(TemplateFileUpload document)
    {
        // The server runs its PDF/DOCX check against the declared part content type, so it
        // has to be set per part rather than left for the transport to default.
        var part = new StreamContent(document.Content);
        part.Headers.ContentType = new MediaTypeHeaderValue(document.ContentType);
        return part;
    }

    private static string BuildTemplatesPath(GetTemplatesOptions? options)
    {
        const string path = "/v2/templates";
        if (options is null)
        {
            return path;
        }

        var parameters = new List<string>();

        void Add(string key, string value) => parameters.Add(key + "=" + Uri.EscapeDataString(value));

        if (options.Q is { } q)
        {
            Add("q", q);
        }

        if (options.IsStarred is { } isStarred)
        {
            Add("is_starred", isStarred ? "true" : "false");
        }

        if (options.IsCreator is { } isCreator)
        {
            Add("is_creator", isCreator ? "true" : "false");
        }

        if (options.Visibility is { } visibility)
        {
            Add("visibility", ToWireValue(visibility));
        }

        if (options.SortBy is { } sortBy)
        {
            Add("sort_by", ToWireValue(sortBy));
        }

        if (options.Ascending is { } ascending)
        {
            Add("ascending", ascending ? "true" : "false");
        }

        if (options.Rows is { } rows)
        {
            Add("rows", rows.ToString(CultureInfo.InvariantCulture));
        }

        if (options.Page is { } page)
        {
            Add("page", page.ToString(CultureInfo.InvariantCulture));
        }

        return parameters.Count == 0 ? path : path + "?" + string.Join("&", parameters);
    }

    private static string ToWireValue(TemplateVisibilityFilter visibility) => visibility switch
    {
        TemplateVisibilityFilter.PrivateShared => "private_shared",
        TemplateVisibilityFilter.Private => "private",
        TemplateVisibilityFilter.Shared => "shared",
        TemplateVisibilityFilter.Public => "public",
        _ => throw new ArgumentOutOfRangeException(nameof(visibility)),
    };

    private static string ToWireValue(TemplateSortBy sortBy) => sortBy switch
    {
        TemplateSortBy.CreatedAt => "created_at",
        TemplateSortBy.UpdatedAt => "updated_at",
        TemplateSortBy.Name => "name",
        TemplateSortBy.LastUsedAt => "last_used_at",
        TemplateSortBy.Counter => "counter",
        TemplateSortBy.StarCounter => "star_counter",
        _ => throw new ArgumentOutOfRangeException(nameof(sortBy)),
    };
}
