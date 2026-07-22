namespace Verdocs.Models;

/// <summary>
/// Known values for <see cref="TemplateField.Type"/> and <see cref="EnvelopeField.Type"/>.
/// Properties stay typed as string so an unknown future value never breaks deserialization.
/// </summary>
public static class FieldType
{
    /// <summary>A signature block.</summary>
    public const string Signature = "signature";

    /// <summary>An initials block.</summary>
    public const string Initial = "initial";

    /// <summary>A check box.</summary>
    public const string Checkbox = "checkbox";

    /// <summary>A radio button.</summary>
    public const string Radio = "radio";

    /// <summary>A single or multi line text box.</summary>
    public const string Textbox = "textbox";

    /// <summary>An automatic timestamp applied at signing.</summary>
    public const string Timestamp = "timestamp";

    /// <summary>A date picker.</summary>
    public const string Date = "date";

    /// <summary>A dropdown selector.</summary>
    public const string Dropdown = "dropdown";

    /// <summary>A multi-line text area. Deprecated: use a textbox with multiline enabled.</summary>
    public const string Textarea = "textarea";

    /// <summary>A file attachment upload.</summary>
    public const string Attachment = "attachment";

    /// <summary>A payment collection field.</summary>
    public const string Payment = "payment";
}
