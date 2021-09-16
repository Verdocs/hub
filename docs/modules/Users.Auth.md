[@verdocs/js-sdk - v1.0.0](../README.md) / [Exports](../modules.md) / [Users](Users.md) / Auth

# Namespace: Auth

[Users](Users.md).Auth

## Table of contents

### Functions

- [authenticateApp](Users.Auth.md#authenticateapp)
- [authenticateUser](Users.Auth.md#authenticateuser)
- [refreshTokens](Users.Auth.md#refreshtokens)
- [updateEmail](Users.Auth.md#updateemail)
- [updatePassword](Users.Auth.md#updatepassword)
- [validateToken](Users.Auth.md#validatetoken)

## Functions

### authenticateApp

▸ `Const` **authenticateApp**(`params`): `Promise`<[`IAuthenticateResponse`](../interfaces/Users.Types.IAuthenticateResponse.md)\>

Authenticate to Verdocs via client ID / Secret authentication. **NOTE: This is only suitable for
NodeJS server-side applications. Never expose your Client Secret in a Web or Mobile app!** Also note
that access tokens may be cached by server-side apps (and this is recommended) but do expire after 2
hours. This expiration may change based on future security needs. Application developers are encouraged
to check the `exp` expiration field in the response accessToken and renew tokens after they expire.

```typescript
import {Auth} from '@verdocs/js-sdk/Auth';
import {Endpoint} from '@verdocs/js-sdk/HTTP';

const {accessToken} = await Auth.authenticateApp({ client_id: 'CLIENTID', client_secret: 'SECRET' });
Endpoint.setAuthToken(accessToken);
```

#### Parameters

| Name | Type |
| :------ | :------ |
| `params` | [`IAuthenticateAppRequest`](../interfaces/Users.Types.IAuthenticateAppRequest.md) |

#### Returns

`Promise`<[`IAuthenticateResponse`](../interfaces/Users.Types.IAuthenticateResponse.md)\>

#### Defined in

[Users/Auth.ts:43](https://github.com/Verdocs/js-sdk/blob/main/src/Users/Auth.ts#L43)

___

### authenticateUser

▸ `Const` **authenticateUser**(`params`): `Promise`<[`IAuthenticateResponse`](../interfaces/Users.Types.IAuthenticateResponse.md)\>

Authenticate to Verdocs via user/password authentication

```typescript
import {Auth} from '@verdocs/js-sdk/Auth';
import {Endpoint} from '@verdocs/js-sdk/HTTP';

const {accessToken} = await Auth.authenticateUser({ username: 'test@test.com', password: 'PASSWORD' });
Endpoint.setAuthToken(accessToken);
```

#### Parameters

| Name | Type |
| :------ | :------ |
| `params` | [`IAuthenticateUserRequest`](../interfaces/Users.Types.IAuthenticateUserRequest.md) |

#### Returns

`Promise`<[`IAuthenticateResponse`](../interfaces/Users.Types.IAuthenticateResponse.md)\>

#### Defined in

[Users/Auth.ts:25](https://github.com/Verdocs/js-sdk/blob/main/src/Users/Auth.ts#L25)

___

### refreshTokens

▸ `Const` **refreshTokens**(): `Promise`<[`IAuthenticateResponse`](../interfaces/Users.Types.IAuthenticateResponse.md)\>

If called before the session expires, this will refresh the caller's session and tokens.

```typescript
import {Auth} from '@verdocs/js-sdk/Auth';
import {Endpoint} from '@verdocs/js-sdk/HTTP';

const {accessToken} = await Auth.refreshTokens();
Auth.Endpoint.setAuthToken(accessToken);
```

#### Returns

`Promise`<[`IAuthenticateResponse`](../interfaces/Users.Types.IAuthenticateResponse.md)\>

#### Defined in

[Users/Auth.ts:74](https://github.com/Verdocs/js-sdk/blob/main/src/Users/Auth.ts#L74)

___

### updateEmail

▸ `Const` **updateEmail**(`params`): `Promise`<[`UpdateEmailResponse`](../interfaces/Users.Types.UpdateEmailResponse.md)\>

Update the caller's email address.

```typescript
import {Auth} from '@verdocs/js-sdk/Auth';

const {profiles} = await Auth.updateEmail({ email: newEmail });
```

#### Parameters

| Name | Type |
| :------ | :------ |
| `params` | [`UpdateEmailRequest`](../interfaces/Users.Types.UpdateEmailRequest.md) |

#### Returns

`Promise`<[`UpdateEmailResponse`](../interfaces/Users.Types.UpdateEmailResponse.md)\>

#### Defined in

[Users/Auth.ts:100](https://github.com/Verdocs/js-sdk/blob/main/src/Users/Auth.ts#L100)

___

### updatePassword

▸ `Const` **updatePassword**(`params`): `Promise`<[`UpdatePasswordResponse`](../interfaces/Users.Types.UpdatePasswordResponse.md)\>

Update the caller's password. To help prevent CSRF attack vectors, the user's old password and email address are required.

```typescript
import {Auth} from '@verdocs/js-sdk/Auth';

const {status, message} = await Auth.updatePassword({ email, oldPassword, newPassword });
if (status !== 'OK') {
  window.alert(`Password reset error: ${message}`);
}
```

#### Parameters

| Name | Type |
| :------ | :------ |
| `params` | [`UpdatePasswordRequest`](../interfaces/Users.Types.UpdatePasswordRequest.md) |

#### Returns

`Promise`<[`UpdatePasswordResponse`](../interfaces/Users.Types.UpdatePasswordResponse.md)\>

#### Defined in

[Users/Auth.ts:88](https://github.com/Verdocs/js-sdk/blob/main/src/Users/Auth.ts#L88)

___

### validateToken

▸ `Const` **validateToken**(`params`): `Promise`<[`TokenValidationResponse`](../interfaces/Users.Types.TokenValidationResponse.md)\>

Validate a token. Only Verdocs tokens will be accepted. Most applications can decode tokens locally,
because tokens will be validated when API calls are made anyway. However, high-security applications
may use this endpoint to check if a token has been revoked.

```typescript
import {Auth} from '@verdocs/js-sdk/Auth';

const {valid} = await Auth.validateToken({ token });
if (!valid) {
  window.alert('Session invalid or expired. Please re-authenticate.');
}
```

#### Parameters

| Name | Type |
| :------ | :------ |
| `params` | [`TokenValidationRequest`](../interfaces/Users.Types.TokenValidationRequest.md) |

#### Returns

`Promise`<[`TokenValidationResponse`](../interfaces/Users.Types.TokenValidationResponse.md)\>

#### Defined in

[Users/Auth.ts:60](https://github.com/Verdocs/js-sdk/blob/main/src/Users/Auth.ts#L60)
