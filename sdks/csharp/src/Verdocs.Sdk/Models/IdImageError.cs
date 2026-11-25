namespace Verdocs.Models;

/// <summary>
/// Known values for <see cref="IdImageErrors.Errors"/> (the js-sdk TIdImageError union): why a
/// photo needs to be retaken. Most come straight from GBG's image checks, which is why they
/// read as display text rather than codes. Properties stay typed as string so a new reason
/// never breaks deserialization.
/// </summary>
public static class IdImageError
{
    /// <summary>The image is too small.</summary>
    public const string ImageTooSmall = "Image Too Small";

    /// <summary>The image is too large.</summary>
    public const string ImageTooLarge = "Image Too Large";

    /// <summary>Not all four corners of the document are in frame.</summary>
    public const string DocumentMissingFourCorners = "Document Missing Four Corners";

    /// <summary>The document is too small in the frame.</summary>
    public const string DocumentTooSmall = "Document Too Small";

    /// <summary>The margin around the document is too small.</summary>
    public const string DocumentBorderTooSmall = "Document Border Too Small";

    /// <summary>The document is skewed in the frame.</summary>
    public const string DocumentIsSkewed = "Document is Skewed";

    /// <summary>No face was detected in the image.</summary>
    public const string FaceImageNotDetected = "Face Image Not Detected";

    /// <summary>No barcode was detected on the ID.</summary>
    public const string BarcodeNotDetected = "Barcode Not Detected";

    /// <summary>The selfie is the same image as the document photo.</summary>
    public const string ImageSameAsDocumentImage = "Image same as Document Image";

    /// <summary>A general problem with the image.</summary>
    public const string ImageError = "Image Error";

    /// <summary>The ID could not be read.</summary>
    public const string IdNotReadable = "ID Not Readable";

    /// <summary>The selfie is not clear enough to compare against the ID.</summary>
    public const string PoorQualitySelfie = "Poor Quality Selfie";
}
