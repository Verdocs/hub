using System.Text.Json.Serialization;

namespace Verdocs.Models;

/// <summary>
/// Changes for <see cref="Resources.ApiKeys.UpdateAsync"/>. Only the fields set are sent;
/// fields omitted are left unchanged.
/// </summary>
public sealed record UpdateApiKeyRequest
{
    /// <summary>New name for the key.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? Name { get; init; }

    /// <summary>New profile the key acts as.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? ProfileId { get; init; }

    /// <summary>Grants or revokes organization-wide admin rights for the key.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public bool? GlobalAdmin { get; init; }
}
