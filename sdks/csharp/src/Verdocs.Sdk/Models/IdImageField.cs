namespace Verdocs.Models;

/// <summary>
/// Known values for <see cref="IdImageErrors.Image"/> (the js-sdk TIdImageField union): the
/// photos sent for ID verification, named as their multipart parts are.
/// </summary>
public static class IdImageField
{
    /// <summary>The front of the ID, or the photo page of a passport.</summary>
    public const string FrontImage = "front_image";

    /// <summary>The back of the ID.</summary>
    public const string BackImage = "back_image";

    /// <summary>The selfie.</summary>
    public const string FaceImage = "face_image";
}
