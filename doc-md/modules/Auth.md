[verdocs-js-sdk - v1.0.0](../README.md) / [Exports](../modules.md) / Auth

# Namespace: Auth

## Table of contents

### Interfaces

- [AuthenticateAppRequest](../interfaces/Auth.AuthenticateAppRequest.md)
- [AuthenticateResponse](../interfaces/Auth.AuthenticateResponse.md)
- [AuthenticateUserRequest](../interfaces/Auth.AuthenticateUserRequest.md)
- [TokenValidationRequest](../interfaces/Auth.TokenValidationRequest.md)
- [TokenValidationResponse](../interfaces/Auth.TokenValidationResponse.md)

### Functions

- [authenticateApp](Auth.md#authenticateapp)
- [authenticateUser](Auth.md#authenticateuser)
- [refreshTokens](Auth.md#refreshtokens)
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

[Api/Auth.ts:46](https://github.com/Verdocs/js-sdk/blob/0c335e6/src/Api/Auth.ts#L46)

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

[Api/Auth.ts:29](https://github.com/Verdocs/js-sdk/blob/0c335e6/src/Api/Auth.ts#L29)

___

### refreshTokens

▸ `Const` **refreshTokens**(): `Promise`<[`AuthenticateResponse`](../interfaces/Auth.AuthenticateResponse.md)\>

If called before the session expires, this will refresh the caller's session and tokens.

```typescript
import {Auth} from '@verdocs/js-sdk';

const profiles = await Auth.refreshTokens()
```

#### Returns

`Promise`<[`AuthenticateResponse`](../interfaces/Auth.AuthenticateResponse.md)\>

#### Defined in

[Api/Auth.ts:86](https://github.com/Verdocs/js-sdk/blob/0c335e6/src/Api/Auth.ts#L86)

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

[Api/Auth.ts:74](https://github.com/Verdocs/js-sdk/blob/0c335e6/src/Api/Auth.ts#L74)
