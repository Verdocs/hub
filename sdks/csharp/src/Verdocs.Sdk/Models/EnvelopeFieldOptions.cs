using System.Text.Json;
using System.Text.Json.Serialization;

namespace Verdocs.Models;

/// <summary>One option inside a legacy field settings blob (dropdowns, checkboxes, radio groups).</summary>
public sealed record EnvelopeFieldOptions
{
    /// <summary>The unique ID of the option.</summary>
    public string Id { get; init; } = null!;

    /// <summary>The X position of the option on the page. Self-placed options report 0.</summary>
    public double X { get; init; }

    /// <summary>The Y position of the option on the page. Self-placed options report 0.</summary>
    public double Y { get; init; }

    /// <summary>For checkboxes, whether it is currently checked.</summary>
    public bool? Checked { get; init; }

    /// <summary>For radio buttons, whether it is currently selected.</summary>
    public bool? Selected { get; init; }

    /// <summary>The visible label for the option, for example "Not Applicable".</summary>
    public string Value { get; init; } = null!;

    /// <summary>Wire fields the model does not declare, preserved so responses round-trip losslessly.</summary>
    [JsonExtensionData]
    public Dictionary<string, JsonElement>? AdditionalData { get; init; }
}
