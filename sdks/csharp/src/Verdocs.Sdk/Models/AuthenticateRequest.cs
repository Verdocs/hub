using System.Text.Json.Serialization;

namespace Verdocs.Models;

/// <summary>
/// Credentials for <see cref="Resources.Auth.AuthenticateAsync"/>. Use the subtype for the
/// grant in hand: <see cref="PasswordGrantRequest"/> for web and mobile sign-in,
/// <see cref="ClientCredentialsRequest"/> for server-to-server calls,
/// <see cref="RefreshTokenGrantRequest"/> to renew a session,
/// <see cref="AuthorizationCodeRequest"/> for third-party OAuth2 integrations,
/// <see cref="MfaOtpGrantRequest"/> or <see cref="MfaRecoveryCodeGrantRequest"/> to finish a
/// sign-in that raised <see cref="MfaRequiredException"/>, and
/// <see cref="LoginCodeGrantRequest"/> to finish a Google or Microsoft sign-in.
/// </summary>
[JsonPolymorphic(TypeDiscriminatorPropertyName = "grant_type")]
[JsonDerivedType(typeof(PasswordGrantRequest), "password")]
[JsonDerivedType(typeof(ClientCredentialsRequest), "client_credentials")]
[JsonDerivedType(typeof(RefreshTokenGrantRequest), "refresh_token")]
[JsonDerivedType(typeof(AuthorizationCodeRequest), "authorization_code")]
[JsonDerivedType(typeof(MfaOtpGrantRequest), "urn:verdocs:params:oauth:grant-type:mfa-otp")]
[JsonDerivedType(typeof(MfaRecoveryCodeGrantRequest), "urn:verdocs:params:oauth:grant-type:mfa-recovery-code")]
[JsonDerivedType(typeof(LoginCodeGrantRequest), "urn:verdocs:params:oauth:grant-type:login-code")]
public abstract record AuthenticateRequest;
