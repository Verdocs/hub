[verdocs-js-sdk - v1.0.0](../README.md) / [Exports](../modules.md) / Auth

# Namespace: Auth

## Table of contents

### Interfaces

- [AuthenticateAppRequest](../interfaces/Auth.AuthenticateAppRequest.md)
- [AuthenticateResponse](../interfaces/Auth.AuthenticateResponse.md)
- [AuthenticateUserRequest](../interfaces/Auth.AuthenticateUserRequest.md)
- [TokenValidationRequest](../interfaces/Auth.TokenValidationRequest.md)
- [TokenValidationResponse](../interfaces/Auth.TokenValidationResponse.md)
- [UpdateEmailRequest](../interfaces/Auth.UpdateEmailRequest.md)
- [UpdateEmailResponse](../interfaces/Auth.UpdateEmailResponse.md)
- [UpdatePasswordRequest](../interfaces/Auth.UpdatePasswordRequest.md)
- [UpdatePasswordResponse](../interfaces/Auth.UpdatePasswordResponse.md)

### Functions

- [authenticateApp](Auth.md#authenticateapp)
- [authenticateUser](Auth.md#authenticateuser)
- [refreshTokens](Auth.md#refreshtokens)
- [updateEmail](Auth.md#updateemail)
- [updatePassword](Auth.md#updatepassword)
- [validateToken](Auth.md#validatetoken)

## Functions

### authenticateApp

▸ `Const` **authenticateApp**(`params`): `Promise`<[`AuthenticateResponse`](../interfaces/Auth.AuthenticateResponse.md)\>

Authenticate to Verdocs via client ID / Secret authentication. **NOTE: This is only suitable for
NodeJS server-side applications. Never expose your Client Secret in a Web or Mobile app!** Also note
that access tokens may be cached by server-side apps (and this is recommended) but do expire after 2
hours. This expiration may change based on future security needs. Application developers are encouraged
to check the `exp` expiration field in the response accessToken and renew tokens after they expire.

```typescript
import {Auth, Endpoint} from '@verdocs/js-sdk';

const {accessToken} = await Auth.authenticateApp({ client_id: 'CLIENTID', client_secret: 'SECRET' });
Endpoint.setAuthToken(accessToken);
```

#### Parameters

| Name | Type |
| :------ | :------ |
| `params` | [`AuthenticateAppRequest`](../interfaces/Auth.AuthenticateAppRequest.md) |

#### Returns

`Promise`<[`AuthenticateResponse`](../interfaces/Auth.AuthenticateResponse.md)\>

#### Defined in

[Api/Auth.ts:47](https://github.com/Verdocs/js-sdk/blob/a85c709/src/Api/Auth.ts#L47)

___

### authenticateUser

▸ `Const` **authenticateUser**(`params`): `Promise`<[`AuthenticateResponse`](../interfaces/Auth.AuthenticateResponse.md)\>

Authenticate to Verdocs via user/password authentication

```typescript
import {Auth, Endpoint} from '@verdocs/js-sdk';

const {accessToken} = await Auth.authenticateUser({ username: 'test@test.com', password: 'PASSWORD' });
Endpoint.setAuthToken(accessToken);
```

#### Parameters

| Name | Type |
| :------ | :------ |
| `params` | [`AuthenticateUserRequest`](../interfaces/Auth.AuthenticateUserRequest.md) |

#### Returns

`Promise`<[`AuthenticateResponse`](../interfaces/Auth.AuthenticateResponse.md)\>

#### Defined in

[Api/Auth.ts:30](https://github.com/Verdocs/js-sdk/blob/a85c709/src/Api/Auth.ts#L30)

___

### refreshTokens

▸ `Const` **refreshTokens**(): `Promise`<[`AuthenticateResponse`](../interfaces/Auth.AuthenticateResponse.md)\>

If called before the session expires, this will refresh the caller's session and tokens.

```typescript
import {Auth, Endpoint} from '@verdocs/js-sdk';

const {accessToken} = await Auth.refreshTokens();
Endpoint.setAuthToken(accessToken);
```

#### Returns

`Promise`<[`AuthenticateResponse`](../interfaces/Auth.AuthenticateResponse.md)\>

#### Defined in

[Api/Auth.ts:88](https://github.com/Verdocs/js-sdk/blob/a85c709/src/Api/Auth.ts#L88)

___

### updateEmail

▸ `Const` **updateEmail**(`params`): `Promise`<[`UpdateEmailResponse`](../interfaces/Auth.UpdateEmailResponse.md)\>

Update the caller's email address.

```typescript
import {Auth} from '@verdocs/js-sdk';

const {profiles} = await Auth.updateEmail({ email: newEmail });
```

#### Parameters

| Name | Type |
| :------ | :------ |
| `params` | [`UpdateEmailRequest`](../interfaces/Auth.UpdateEmailRequest.md) |

#### Returns

`Promise`<[`UpdateEmailResponse`](../interfaces/Auth.UpdateEmailResponse.md)\>

#### Defined in

[Api/Auth.ts:134](https://github.com/Verdocs/js-sdk/blob/a85c709/src/Api/Auth.ts#L134)

___

### updatePassword

▸ `Const` **updatePassword**(`params`): `Promise`<[`UpdatePasswordResponse`](../interfaces/Auth.UpdatePasswordResponse.md)\>

Update the caller's password. To help prevent CSRF attack vectors, the user's old password and email address are required.

```typescript
import {Auth} from '@verdocs/js-sdk';

const {status, message} = await Auth.updatePassword({ email, oldPassword, newPassword });
if (status !== 'OK') {
  window.alert(`Password reset error: ${message}`);
}
```

#### Parameters

| Name | Type |
| :------ | :------ |
| `params` | [`UpdatePasswordRequest`](../interfaces/Auth.UpdatePasswordRequest.md) |

#### Returns

`Promise`<[`UpdatePasswordResponse`](../interfaces/Auth.UpdatePasswordResponse.md)\>

#### Defined in

[Api/Auth.ts:114](https://github.com/Verdocs/js-sdk/blob/a85c709/src/Api/Auth.ts#L114)

___

### validateToken

▸ `Const` **validateToken**(`params`): `Promise`<[`TokenValidationResponse`](../interfaces/Auth.TokenValidationResponse.md)\>

Validate a token. Only Verdocs tokens will be accepted. Most applications can decode tokens locally,
because tokens will be validated when API calls are made anyway. However, high-security applications
may use this endpoint to check if a token has been revoked.

```typescript
import {Auth} from '@verdocs/js-sdk';

const {valid} = await Auth.validateToken({ token });
if (!valid) {
  window.alert('Session invalid or expired. Please re-authenticate.');
}
```

#### Parameters

| Name | Type |
| :------ | :------ |
| `params` | [`TokenValidationRequest`](../interfaces/Auth.TokenValidationRequest.md) |

#### Returns

`Promise`<[`TokenValidationResponse`](../interfaces/Auth.TokenValidationResponse.md)\>

#### Defined in

[Api/Auth.ts:75](https://github.com/Verdocs/js-sdk/blob/a85c709/src/Api/Auth.ts#L75)
