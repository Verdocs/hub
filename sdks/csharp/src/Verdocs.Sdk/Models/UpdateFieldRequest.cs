using System.Text.Json.Serialization;

namespace Verdocs.Models;

/// <summary>
/// Body for <see cref="Resources.TemplateFields.UpdateAsync"/>. Unset properties stay off the
/// wire and leave the stored values unchanged. There is no field-type change here: the js-sdk
/// doc comments claim one, but the server update schema strips it, so add a new field and
/// delete the old one instead.
/// </summary>
public sealed record UpdateFieldRequest
{
    /// <summary>
    /// Renames the field. Field names must be unique within the template, so this fails if
    /// the new name is already in use.
    /// </summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? Name { get; init; }

    /// <summary>Reassigns the field to another role.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? RoleName { get; init; }

    /// <summary>Moves the field to another document.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? DocumentId { get; init; }

    /// <summary>0-based page number to place the field on.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public int? Page { get; init; }

    /// <summary>X position for the field, measured left to right.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public double? X { get; init; }

    /// <summary>Y position for the field, measured bottom to top.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public double? Y { get; init; }

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
