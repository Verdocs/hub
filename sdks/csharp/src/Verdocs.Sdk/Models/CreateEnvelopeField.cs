using System.Text.Json.Serialization;

namespace Verdocs.Models;

/// <summary>
/// One field entry in a <see cref="CreateEnvelopeRequest"/>. The js-sdk splits this into
/// template and direct variants (ICreateEnvelopeFieldFromTemplate and
/// ICreateEnvelopeFieldDirectly); one record covers both. With a template, entries act as
/// prepared-field overrides matched by <see cref="Name"/>. Without one, they create fields on
/// the document indexed by <see cref="DocumentId"/>, and the server then also requires
/// <see cref="Type"/>, <see cref="Page"/>, <see cref="X"/>, and <see cref="Y"/>.
/// </summary>
public sealed record CreateEnvelopeField
{
    /// <summary>The array index (not ID) of the entry in <see cref="CreateEnvelopeRequest.Documents"/> the field is placed on.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public int? DocumentId { get; init; }

    /// <summary>The machine name of the field, for example "Buyer-textbox-1".</summary>
    public required string Name { get; init; }

    /// <summary>The role name in the recipients list the field is assigned to.</summary>
    public required string RoleName { get; init; }

    /// <summary>The field type; see <see cref="FieldType"/> for known values. Required by the server when <see cref="DocumentId"/> is present.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? Type { get; init; }

    /// <summary>The 1-based page number the field is displayed on. Self-placed fields the signer must position are on page 0.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public int? Page { get; init; }

    /// <summary>The X position of the field.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public double? X { get; init; }

    /// <summary>The Y position of the field.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public double? Y { get; init; }

    /// <summary>The width of the field.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public double? Width { get; init; }

    /// <summary>The height of the field.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public double? Height { get; init; }

    /// <summary>If true, the participant must fill the field before submitting.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public bool? Required { get; init; }

    /// <summary>If true, the field is not editable by participants. Fields may not be both required and readonly.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public bool? Readonly { get; init; }

    /// <summary>Human-friendly label for the field.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? Label { get; init; }

    /// <summary>The default value for the field. When set, the field is marked prepared.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? Default { get; init; }

    /// <summary>Placeholder text shown in the empty field.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? Placeholder { get; init; }

    /// <summary>For text boxes, allows more than one line of text.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public bool? Multiline { get; init; }

    /// <summary>For grouped fields (radio buttons, check boxes), the group the value is stored under.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? Group { get; init; }

    /// <summary>For dropdowns, the selectable options.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public IReadOnlyList<DropdownOption>? Options { get; init; }
}
