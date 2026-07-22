using System.Text.Json.Serialization;

namespace Verdocs.Models;

/// <summary>
/// Body for <see cref="Resources.TemplateFields.CreateAsync"/>. Field names must be unique
/// within the template; special characters must be URL-encoded in later requests, so
/// alphanumerics and hyphens are easiest to work with. Create roles before fields: the role
/// name must match an existing role.
/// </summary>
public sealed record CreateFieldRequest
{
    /// <summary>Name for the new field, unique within the template, for example "Buyer-textbox-1".</summary>
    public required string Name { get; init; }

    /// <summary>The role the field is assigned to.</summary>
    public required string RoleName { get; init; }

    /// <summary>The document to place the field on.</summary>
    public required string DocumentId { get; init; }

    /// <summary>The field type; see <see cref="FieldType"/>.</summary>
    public required string Type { get; init; }

    /// <summary>0-based page number to place the field on.</summary>
    public required int Page { get; init; }

    /// <summary>X position for the field, measured left to right.</summary>
    public required double X { get; init; }

    /// <summary>Y position for the field, measured bottom to top.</summary>
    public required double Y { get; init; }

    /// <summary>Width of the field. Every type has a built-in default; set this mainly on text fields.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public double? Width { get; init; }

    /// <summary>Height of the field. Every type has a built-in default; set this mainly on text fields.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public double? Height { get; init; }

    /// <summary>Whether the participant must fill the field before submitting.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public bool? Required { get; init; }

    /// <summary>Whether the field is read-only. Fields may not be both required and read-only.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public bool? Readonly { get; init; }

    /// <summary>Label displayed above the field.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? Label { get; init; }

    /// <summary>Default value prefilled into envelopes created from the template.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? Default { get; init; }

    /// <summary>Placeholder shown in empty text fields.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? Placeholder { get; init; }

    /// <summary>For text boxes, allows more than one line of text.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public bool? Multiline { get; init; }

    /// <summary>For grouped fields (radio buttons, check boxes), the group the value is stored under.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? Group { get; init; }

    /// <summary>For dropdown fields, the selectable options.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public IReadOnlyList<DropdownOption>? Options { get; init; }

    /// <summary>Validator name applied to the field's value.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? Validator { get; init; }
}
