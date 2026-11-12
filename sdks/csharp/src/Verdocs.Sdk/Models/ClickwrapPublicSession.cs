using System.Text.Json;
using System.Text.Json.Serialization;

namespace Verdocs.Models;

/// <summary>What the component needs to show a session, as <see cref="Resources.Clickwrap.GetSessionAsync"/> returns it.</summary>
public sealed record ClickwrapPublicSession
{
    /// <summary>The session's ID.</summary>
    public string Id { get; init; } = null!;

    /// <summary>When the session token expires.</summary>
    public DateTimeOffset ExpiresAt { get; init; }

    /// <summary>How to show the terms; see <see cref="ClickwrapMode"/>.</summary>
    public string Mode { get; init; } = null!;

    /// <summary>Whether the person must scroll to the end before accepting.</summary>
    public bool RequireScroll { get; init; }

    /// <summary>The agreement versions to show, in order.</summary>
    public IReadOnlyList<ClickwrapSessionAgreement> Agreements { get; init; } = [];

    /// <summary>The brand to theme with, or null for Verdocs defaults.</summary>
    public ClickwrapSessionBrand? Brand { get; init; }

    /// <summary>Wire fields the model does not declare, preserved so responses round-trip losslessly.</summary>
    [JsonExtensionData]
    public Dictionary<string, JsonElement>? AdditionalData { get; init; }
}
