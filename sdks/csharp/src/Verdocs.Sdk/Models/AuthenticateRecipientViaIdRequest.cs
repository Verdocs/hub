namespace Verdocs.Models;

/// <summary>
/// The ID verification step for <see cref="Resources.Recipients.VerifySignerAsync(AuthenticateRecipientViaIdRequest, CancellationToken)"/>:
/// photos of a government ID plus a selfie, which GBG checks while the request waits. It is
/// sent as multipart form data with auth_method "id", so unlike the js-sdk's
/// IAuthenticateRecipientViaIdRequest there is no AuthMethod property to set.
/// </summary>
public sealed record AuthenticateRecipientViaIdRequest
{
    /// <summary>ISO 3166-1 alpha-3 code of the country that issued the ID, e.g. "USA".</summary>
    public required string CountryCode { get; init; }

    /// <summary>The kind of ID photographed; see <see cref="IdDocumentType"/> for known values.</summary>
    public required string DocumentType { get; init; }

    /// <summary>Photo of the front of the ID, or the photo page of a passport.</summary>
    public required IdImageUpload FrontImage { get; init; }

    /// <summary>Photo of the back of the ID. Required for driver's licenses; leave null for a passport.</summary>
    public IdImageUpload? BackImage { get; init; }

    /// <summary>A selfie of the signer, compared against the photo on the ID and checked for liveness.</summary>
    public required IdImageUpload FaceImage { get; init; }
}
