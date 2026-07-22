using System.Text.Json;
using System.Text.Json.Serialization;

namespace Verdocs.Models;

/// <summary>
/// An in-person signing link plus the credentials behind it. The access key is as sensitive as
/// a bearer token; protect it from theft and unauthorized sharing.
/// </summary>
public sealed record InPersonLinkResponse
{
    /// <summary>A Verdocs Web URL hosting the signing experience.</summary>
    public string Link { get; init; } = null!;

    /// <summary>An access token for immediate signing use in embeds or other applications. Signing with it is recorded as "in-person" authentication.</summary>
    public string AccessToken { get; init; } = null!;

    /// <summary>The access key matching the signing session, for later initiation requests such as hand-off to a companion application.</summary>
    public AccessKey AccessKey { get; init; } = null!;

    /// <summary>A copy of the envelope for the signing session.</summary>
    public Envelope Envelope { get; init; } = null!;

    /// <summary>A copy of the recipient record for the signing session.</summary>
    public Recipient Recipient { get; init; } = null!;

    /// <summary>Wire fields the model does not declare, preserved so responses round-trip losslessly.</summary>
    [JsonExtensionData]
    public Dictionary<string, JsonElement>? AdditionalData { get; init; }
}
