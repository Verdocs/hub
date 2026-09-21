using System.Text.Json;
using System.Text.Json.Serialization;

namespace Verdocs.Models;

/// <summary>
/// The identity providers enabled in the current environment. Hide sign-in buttons for
/// providers that are off: their start URLs return 404.
/// </summary>
public sealed record SocialProviders
{
    /// <summary>True when Google sign-in is available.</summary>
    public bool Google { get; init; }

    /// <summary>True when Microsoft sign-in is available.</summary>
    public bool Microsoft { get; init; }

    /// <summary>Wire fields the model does not declare, preserved so responses round-trip losslessly.</summary>
    [JsonExtensionData]
    public Dictionary<string, JsonElement>? AdditionalData { get; init; }
}
