using System.Net.Http.Headers;
using Verdocs.Models;

namespace Verdocs.Resources;

/// <summary>
/// Profile calls, reached through <see cref="VerdocsEndpoint.Profiles"/>.
/// </summary>
public sealed class Profiles
{
    private readonly VerdocsEndpoint _endpoint;

    internal Profiles(VerdocsEndpoint endpoint)
    {
        _endpoint = endpoint;
    }

    /// <summary>
    /// Gets the caller's profiles. A user has one profile per organization membership;
    /// exactly one is marked <see cref="Profile.Current"/> at a time and operations are
    /// performed as that profile.
    /// </summary>
    /// <param name="cancellationToken">Token to cancel the operation.</param>
    /// <returns>The caller's profiles.</returns>
    /// <exception cref="VerdocsApiException">The call failed, for example because the session is invalid.</exception>
    public Task<IReadOnlyList<Profile>> ListAsync(CancellationToken cancellationToken = default)
    {
        return _endpoint.SendAsync<IReadOnlyList<Profile>>(HttpMethod.Get, "/v2/profiles", null, cancellationToken);
    }

    /// <summary>
    /// Gets the caller's current profile. A user has one profile per organization membership
    /// and exactly one is current at a time; operations are performed as that profile.
    /// </summary>
    /// <param name="cancellationToken">Token to cancel the operation.</param>
    /// <returns>The profile marked current, or null if the caller has none.</returns>
    /// <exception cref="VerdocsApiException">The call failed, for example because the session is invalid.</exception>
    public async Task<Profile?> GetCurrentAsync(CancellationToken cancellationToken = default)
    {
        var profiles = await _endpoint.SendAsync<List<Profile>>(HttpMethod.Get, "/v2/profiles", null, cancellationToken)
            .ConfigureAwait(false);
        return profiles.Find(profile => profile.Current);
    }

    /// <summary>
    /// Registers a new user account plus a new organization the caller will own. Call this
    /// on an unauthenticated endpoint: the deployed API rejects the request when a session
    /// is present (users join existing organizations by invitation instead). The new profile
    /// becomes the user's current profile and session tokens are returned, but the email is
    /// not verified yet, so most other calls will fail until the user submits the emailed
    /// code via <see cref="Auth.VerifyEmailAsync"/>.
    ///
    /// <example>
    /// <code>
    /// var session = await endpoint.Profiles.CreateAsync(new CreateProfileRequest
    /// {
    ///     Email = "you@example.com",
    ///     Password = "PASSWORD",
    ///     FirstName = "First",
    ///     LastName = "Last",
    ///     OrgName = "New Org",
    /// });
    /// endpoint.SetToken(session.AccessToken);
    /// // The user receives a code by email:
    /// await endpoint.Auth.VerifyEmailAsync(new VerifyEmailRequest { Email = "you@example.com", Token = code });
    /// </code>
    /// </example>
    /// </summary>
    /// <param name="request">The account and organization details.</param>
    /// <param name="cancellationToken">Token to cancel the operation.</param>
    /// <returns>Session tokens for the new (not yet verified) profile.</returns>
    /// <exception cref="VerdocsApiException">The email is already registered, the caller was authenticated, or the call failed.</exception>
    public Task<AuthenticateResponse> CreateAsync(CreateProfileRequest request, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(request);
        return _endpoint.SendAsync<AuthenticateResponse>(HttpMethod.Post, "/v2/profiles", request, cancellationToken);
    }

    /// <summary>
    /// Switches the caller's current profile and returns fresh session tokens for it. The
    /// current profile drives permission checks and record ownership for most operations, so
    /// select the appropriate profile before making other calls. The endpoint does not apply
    /// the new tokens automatically; pass the access token to
    /// <see cref="VerdocsEndpoint.SetToken"/>, matching <see cref="Auth.AuthenticateAsync"/>.
    /// </summary>
    /// <param name="profileId">The profile to make current. Must belong to the caller.</param>
    /// <param name="cancellationToken">Token to cancel the operation.</param>
    /// <returns>Fresh session tokens for the newly current profile.</returns>
    /// <exception cref="VerdocsApiException">The profile was not found or the call failed.</exception>
    public Task<AuthenticateResponse> SwitchAsync(string profileId, CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrEmpty(profileId);
        return _endpoint.SendAsync<AuthenticateResponse>(
            HttpMethod.Post,
            "/v2/profiles/" + Uri.EscapeDataString(profileId) + "/switch",
            null,
            cancellationToken);
    }

    /// <summary>
    /// Updates a profile: the caller's own current profile, or, for admins, another member
    /// of the same organization. The two paths accept different fields; see
    /// <see cref="UpdateProfileRequest"/>.
    /// </summary>
    /// <param name="profileId">The profile to update.</param>
    /// <param name="request">The fields to change. Unset properties are left as they are.</param>
    /// <param name="cancellationToken">Token to cancel the operation.</param>
    /// <returns>The updated profile.</returns>
    /// <exception cref="VerdocsApiException">The profile was not found, a field was not accepted, or the call failed.</exception>
    public Task<Profile> UpdateAsync(string profileId, UpdateProfileRequest request, CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrEmpty(profileId);
        ArgumentNullException.ThrowIfNull(request);
        return _endpoint.SendAsync<Profile>(
            HttpMethod.Patch,
            "/v2/profiles/" + Uri.EscapeDataString(profileId),
            request,
            cancellationToken);
    }

    /// <summary>
    /// Deletes one of the caller's profiles. Deleting the current profile switches the
    /// caller to the next available one and returns fresh tokens for it; deleting the last
    /// profile logs the caller out and returns a status message instead (see
    /// <see cref="DeleteProfileResponse"/>). Deleting a profile that is NOT current performs
    /// the delete but the deployed API sends no response at all, so the call ends in a
    /// TimeoutException. Until that is fixed server-side, the workaround is to
    /// <see cref="SwitchAsync"/> to the profile first and then delete it.
    /// </summary>
    /// <param name="profileId">The profile to delete. Must belong to the caller.</param>
    /// <param name="cancellationToken">Token to cancel the operation.</param>
    /// <returns>Tokens for the next profile, or a logout notice when it was the last one.</returns>
    /// <exception cref="VerdocsApiException">The profile was not found or the call failed.</exception>
    public Task<DeleteProfileResponse> DeleteAsync(string profileId, CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrEmpty(profileId);
        return _endpoint.SendAsync<DeleteProfileResponse>(
            HttpMethod.Delete,
            "/v2/profiles/" + Uri.EscapeDataString(profileId),
            null,
            cancellationToken);
    }

    /// <summary>
    /// Replaces the profile photo. Only the caller's own current profile accepts a photo.
    /// The stream is read to the end and disposed when the request completes.
    /// </summary>
    /// <param name="profileId">The profile to update. Must be the caller's current profile.</param>
    /// <param name="photo">The image content.</param>
    /// <param name="fileName">Filename to report for the upload, for example "avatar.png".</param>
    /// <param name="contentType">MIME type of the image, for example "image/png". The server stores and serves the declared type without validating it.</param>
    /// <param name="cancellationToken">Token to cancel the operation.</param>
    /// <returns>The updated profile; <see cref="Profile.Picture"/> carries the new photo URL.</returns>
    /// <exception cref="VerdocsApiException">The upload was rejected or the call failed.</exception>
    public Task<Profile> UpdatePhotoAsync(string profileId, Stream photo, string fileName, string contentType, CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrEmpty(profileId);
        ArgumentNullException.ThrowIfNull(photo);
        ArgumentException.ThrowIfNullOrEmpty(fileName);
        ArgumentException.ThrowIfNullOrEmpty(contentType);
        if (!MediaTypeHeaderValue.TryParse(contentType, out var mediaType))
        {
            throw new ArgumentException("The content type must be a valid MIME type, for example \"image/png\".", nameof(contentType));
        }

        // The handler only looks at the file part named "picture" (sdks/WIRE-NOTES.md); parts
        // under any other name are silently ignored. The transport disposes the request and
        // with it this content tree, including the caller's stream.
        var content = new MultipartFormDataContent();
        var picture = new StreamContent(photo);
        picture.Headers.ContentType = mediaType;
        content.Add(picture, "picture", fileName);

        return _endpoint.SendAsync<Profile>(
            HttpMethod.Patch,
            "/v2/profiles/" + Uri.EscapeDataString(profileId),
            content,
            cancellationToken);
    }
}
