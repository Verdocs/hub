namespace Verdocs.Models;

/// <summary>
/// One photo sent with an <see cref="AuthenticateRecipientViaIdRequest"/>. The js-sdk takes a
/// Blob, which carries its own type; here the type is declared alongside the stream.
/// </summary>
public sealed record IdImageUpload
{
    /// <summary>
    /// The image bytes. Read once from the current position, and disposed along with the
    /// request when the call completes.
    /// </summary>
    public required Stream Content { get; init; }

    /// <summary>The file name sent with the part.</summary>
    public required string FileName { get; init; }

    /// <summary>The image's MIME type, typically "image/jpeg".</summary>
    public required string ContentType { get; init; }
}
