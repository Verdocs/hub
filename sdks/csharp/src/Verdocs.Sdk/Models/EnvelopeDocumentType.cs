namespace Verdocs.Models;

/// <summary>
/// Known values for <see cref="EnvelopeDocument.Type"/>. Properties stay typed as string so an
/// unknown future value never breaks deserialization.
/// </summary>
public static class EnvelopeDocumentType
{
    /// <summary>A document supplied when the envelope was created.</summary>
    public const string Attachment = "attachment";

    /// <summary>The Verdocs-generated signing certificate.</summary>
    public const string Certificate = "certificate";
}
