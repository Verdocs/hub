namespace Verdocs.Models;

/// <summary>
/// Known values for <see cref="AuthenticateRecipientViaIdRequest.DocumentType"/> (the js-sdk
/// TIdDocumentType union): the kinds of government ID a signer can photograph.
/// </summary>
public static class IdDocumentType
{
    /// <summary>A driver's license. Needs both a front and a back photo.</summary>
    public const string DriverLicense = "driverLicense";

    /// <summary>A national ID card.</summary>
    public const string IdCard = "idCard";

    /// <summary>A passport. The front photo is the photo page, and there is no back.</summary>
    public const string Passport = "passport";
}
