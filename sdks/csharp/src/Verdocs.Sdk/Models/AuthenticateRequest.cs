using System.Text.Json.Serialization;

namespace Verdocs.Models;

/// <summary>
/// Credentials for <see cref="Resources.Auth.AuthenticateAsync"/>. The seed supports the
/// password grant; other grant types (client_credentials, refresh_token, authorization_code)
/// arrive with type generation.
/// </summary>
[JsonPolymorphic(TypeDiscriminatorPropertyName = "grant_type")]
[JsonDerivedType(typeof(PasswordGrantRequest), "password")]
[JsonDerivedType(typeof(ClientCredentialsRequest), "client_credentials")]
[JsonDerivedType(typeof(RefreshTokenGrantRequest), "refresh_token")]
[JsonDerivedType(typeof(AuthorizationCodeRequest), "authorization_code")]
public abstract record AuthenticateRequest;
