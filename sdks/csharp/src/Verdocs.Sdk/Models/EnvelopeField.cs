using System.Text.Json;
using System.Text.Json.Serialization;

namespace Verdocs.Models;

/// <summary>A signing field placed on an envelope document, assigned to one role.</summary>
public sealed record EnvelopeField
{
    /// <summary>The envelope the field belongs to.</summary>
    public string EnvelopeId { get; init; } = null!;

    /// <summary>The document the field is placed on.</summary>
    public string DocumentId { get; init; } = null!;

    /// <summary>The machine name of the field, for example "Buyer-textbox-1".</summary>
    public string Name { get; init; } = null!;

    /// <summary>The name of the role the field is assigned to.</summary>
    public string RoleName { get; init; } = null!;

    /// <summary>The field type; see <see cref="FieldType"/> for known values.</summary>
    public string Type { get; init; } = null!;

    /// <summary>True when the participant must fill the field before submitting.</summary>
    public bool? Required { get; init; }

    /// <summary>True when the field is not editable by participants. Fields may not be both required and readonly.</summary>
    public bool? Readonly { get; init; }

    /// <summary>Legacy per-field settings blob. Deprecated in favor of the top-level properties.</summary>
    public EnvelopeFieldSettings? Settings { get; init; }

    /// <summary>Validator name applied to the field's value, if any.</summary>
    public string? Validator { get; init; }

    /// <summary>Human-friendly label for the field.</summary>
    public string? Label { get; init; }

    /// <summary>Not sent by the server; UI code uses it to mark prepared fields.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public bool? Prepared { get; init; }

    /// <summary>The 1-based page number the field is displayed on. Self-placed fields the signer must position are on page 0.</summary>
    public int Page { get; init; }

    /// <summary>The X position of the field.</summary>
    public double X { get; init; }

    /// <summary>The Y position of the field.</summary>
    public double Y { get; init; }

    /// <summary>The width of the field.</summary>
    public double Width { get; init; }

    /// <summary>The height of the field.</summary>
    public double Height { get; init; }

    /// <summary>The default value for the field.</summary>
    public string? Default { get; init; }

    /// <summary>Placeholder text shown in the empty field.</summary>
    public string? Placeholder { get; init; }

    /// <summary>For text boxes, allows more than one line of text.</summary>
    public bool Multiline { get; init; }

    /// <summary>For grouped fields (radio buttons, check boxes), the group the value is stored under.</summary>
    public string? Group { get; init; }

    /// <summary>For dropdowns, the selectable options.</summary>
    public IReadOnlyList<DropdownOption>? Options { get; init; }

    /// <summary>The field's current value, once filled in.</summary>
    public string? Value { get; init; }

    /// <summary>True when the current value passes the field's validator.</summary>
    public bool IsValid { get; init; }

    /// <summary>Wire fields the model does not declare, preserved so responses round-trip losslessly.</summary>
    [JsonExtensionData]
    public Dictionary<string, JsonElement>? AdditionalData { get; init; }
}
