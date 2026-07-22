namespace Verdocs.Models;

/// <summary>
/// One file to send on a multipart template call: the multipart overload of
/// Templates.CreateAsync, or <see cref="Resources.TemplateDocuments.CreateAsync"/>. The server
/// accepts "application/pdf" and DOCX
/// ("application/vnd.openxmlformats-officedocument.wordprocessingml.document", converted to
/// PDF server-side, original retained) and runs its type check against the declared
/// <see cref="ContentType"/>, so set it accurately. Files are capped at 25 MB each.
/// </summary>
public sealed record TemplateFileUpload
{
    /// <summary>
    /// The file bytes. Read once from the current position, and disposed along with the
    /// request when the call completes.
    /// </summary>
    public required Stream Content { get; init; }

    /// <summary>The file name sent with the part. Template documents take their name from it.</summary>
    public required string FileName { get; init; }

    /// <summary>The declared MIME type. The server trusts and validates this declaration.</summary>
    public required string ContentType { get; init; }
}
