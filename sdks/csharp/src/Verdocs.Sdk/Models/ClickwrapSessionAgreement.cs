using System.Text.Json;
using System.Text.Json.Serialization;

namespace Verdocs.Models;

/// <summary>One agreement version a session shows.</summary>
public sealed record ClickwrapSessionAgreement
{
    /// <summary>The agreement's key.</summary>
    public string Key { get; init; } = null!;

    /// <summary>The agreement's name.</summary>
    public string Name { get; init; } = null!;

    /// <summary>The version's ID, sent back with checkbox events and labels.</summary>
    public string VersionId { get; init; } = null!;

    /// <summary>The version number.</summary>
    public int Number { get; init; }

    /// <summary>The agreement text as sanitized HTML.</summary>
    public string Content { get; init; } = null!;

    /// <summary>Wire fields the model does not declare, preserved so responses round-trip losslessly.</summary>
    [JsonExtensionData]
    public Dictionary<string, JsonElement>? AdditionalData { get; init; }
}
