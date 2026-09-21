# @verdocs/python-sdk

## 1.1.0

### Minor Changes

- Login sessions (`endpoint.sessions.list()`, `revoke(session_id)`, `revoke_others()`), two-factor authentication (`endpoint.mfa.status()`, `enroll()`, `verify_enrollment(code)`, `regenerate_backup_codes(code)`, `disable(code)`), and sign-in additions: the `mfa-otp`, `mfa-recovery-code`, and `login-code` grants on `authenticate`; `MFARequiredError` raised when the token endpoint answers with an MFA challenge, with `is_mfa_required` and `get_mfa_challenge` helpers; `get_social_providers()` and `get_social_login_url()`; PKCE helpers `create_code_verifier()` and `create_code_challenge()`. `User` gains `has_password`, `password_changed_at`, `sign_in_providers`, and `mfa`; decoded user tokens gain `sid`. `ApiKey` now matches the API (`global_admin`, `profile_id`, `created_at`, `last_used_at`); the `permission` field, which the API never sent, is gone along with `ApiKeyPermission`.
