using Verdocs.Models;

namespace Verdocs;

/// <summary>
/// Constant lists shared with the other Verdocs SDKs: the known field types, their default
/// builder dimensions, and the full permission set.
/// </summary>
public static class Lists
{
    /// <summary>
    /// Every known field type, in the js-sdk's order. "textarea" is deprecated (use "textbox"
    /// with multiline enabled) but still appears in stored templates.
    /// </summary>
    public static IReadOnlyList<string> FieldTypes { get; } =
    [
        FieldType.Textbox,
        FieldType.Signature,
        FieldType.Initial,
        FieldType.Date,
        FieldType.Dropdown,
        FieldType.Timestamp,
        FieldType.Textarea,
        FieldType.Checkbox,
        FieldType.Radio,
        FieldType.Attachment,
        FieldType.Payment,
    ];

    /// <summary>Default field widths (in document units) used when placing new fields.</summary>
    public static IReadOnlyDictionary<string, double> DefaultFieldWidths { get; } = new Dictionary<string, double>
    {
        [FieldType.Signature] = 71,
        [FieldType.Initial] = 71,
        [FieldType.Date] = 75,
        [FieldType.Timestamp] = 130,
        [FieldType.Textbox] = 150,
        [FieldType.Textarea] = 150,
        [FieldType.Checkbox] = 14,
        [FieldType.Radio] = 14,
        [FieldType.Dropdown] = 85,
        [FieldType.Attachment] = 24,
        [FieldType.Payment] = 24,
    };

    /// <summary>Default field heights (in document units) used when placing new fields.</summary>
    public static IReadOnlyDictionary<string, double> DefaultFieldHeights { get; } = new Dictionary<string, double>
    {
        [FieldType.Signature] = 36,
        [FieldType.Initial] = 36,
        [FieldType.Date] = 15,
        [FieldType.Timestamp] = 15,
        [FieldType.Textbox] = 15,
        [FieldType.Textarea] = 41,
        [FieldType.Checkbox] = 14,
        [FieldType.Radio] = 14,
        [FieldType.Dropdown] = 20,
        [FieldType.Attachment] = 24,
        [FieldType.Payment] = 24,
    };

    /// <summary>Every permission that can be granted to a profile or group.</summary>
    public static IReadOnlyList<string> AllPermissions { get; } =
    [
        "template:creator:create:public",
        "template:creator:create:org",
        "template:creator:create:personal",
        "template:creator:delete",
        "template:creator:visibility",
        "template:member:read",
        "template:member:write",
        "template:member:delete",
        "template:member:visibility",
        "owner:add",
        "owner:remove",
        "admin:add",
        "admin:remove",
        "member:view",
        "member:add",
        "member:remove",
        "org:create",
        "org:view",
        "org:update",
        "org:delete",
        "org:transfer",
        "org:list",
        "envelope:create",
        "envelope:cancel",
        "envelope:view",
    ];
}
