using System.Text.Json.Serialization;

namespace Verdocs.Models;

/// <summary>
/// Base for OAuth2 token requests sent to POST /v2/oauth2/token. Concrete grant types are
/// serialized with a grant_type discriminator matching the wire contract.
/// </summary>
[JsonPolymorphic(TypeDiscriminatorPropertyName = "grant_type")]
[JsonDerivedType(typeof(PasswordGrantRequest), "password")]
[JsonDerivedType(typeof(ClientCredentialsRequest), "client_credentials")]
[JsonDerivedType(typeof(RefreshTokenGrantRequest), "refresh_token")]
[JsonDerivedType(typeof(AuthorizationCodeRequest), "authorization_code")]
public abstract record AuthenticateRequest;
