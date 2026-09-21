# @verdocs/csharp-sdk

## 1.1.0

### Minor Changes

- Login sessions (`endpoint.Sessions.GetSessionsAsync()`, `RevokeSessionAsync(id)`, `RevokeOtherSessionsAsync()`), two-factor authentication (`endpoint.Mfa.GetMfaStatusAsync()`, `EnrollMfaAsync()`, `VerifyMfaEnrollmentAsync(code)`, `RegenerateBackupCodesAsync(code)`, `DisableMfaAsync(code)`), and sign-in additions: `MfaOtpGrantRequest`, `MfaRecoveryCodeGrantRequest`, and `LoginCodeGrantRequest` on `AuthenticateAsync`; `MfaRequiredException` (a `VerdocsApiException`) thrown when the token endpoint answers with an MFA challenge; `GetSocialProvidersAsync()` and `GetSocialLoginUrl()`; PKCE helpers `Pkce.CreateCodeVerifier()` and `Pkce.CreateCodeChallenge()`. `User` gains `HasPassword`, `PasswordChangedAt`, `SignInProviders`, and `Mfa`; `VerdocsSession` gains `Sid`. `ApiKey` now matches the API (`GlobalAdmin`, `ProfileId`, `CreatedAt`, `LastUsedAt`); the `Permission` field, which the API never sent, is gone along with `ApiKeyPermission`.
