[verdocs-js-sdk - v1.0.0](../README.md) / [Exports](../modules.md) / Auth

# Namespace: Auth

## Table of contents

### Interfaces

- [AuthenticateRequest](../interfaces/Auth.AuthenticateRequest.md)
- [AuthenticateResponse](../interfaces/Auth.AuthenticateResponse.md)
- [IActiveSession](../interfaces/Auth.IActiveSession.md)
- [IProfile](../interfaces/Auth.IProfile.md)

### Type aliases

- [IPermission](Auth.md#ipermission)
- [IPlan](Auth.md#iplan)
- [IRole](Auth.md#irole)

### Functions

- [authenticate](Auth.md#authenticate)
- [getProfiles](Auth.md#getprofiles)

## Type aliases

### IPermission

Ƭ **IPermission**: ``"org:view"`` \| ``"member:view"`` \| ``"org:update"`` \| ``"member:add"`` \| ``"member:remove"`` \| ``"admin:add"`` \| ``"admin:remove"`` \| ``"org:delete"`` \| ``"org:transfer"`` \| ``"owner:add"`` \| ``"owner:remove"`` \| ``"template:creator:create:personal"`` \| ``"template:creator:visibility"`` \| ``"template:creator:create:org"`` \| ``"template:member:read"`` \| ``"template:member:write"`` \| ``"template:member:visibility"`` \| ``"template:creator:delete"`` \| ``"template:member:delete"`` \| ``"template:creator:create:public"`` \| ``"rform:access"`` \| ``"rcommon:access"`` \| ``"org:list"`` \| ``"org:create"``

#### Defined in

[Api/Auth.ts:3](https://github.com/Verdocs/js-sdk/blob/368138d/src/Api/Auth.ts#L3)

___

### IPlan

Ƭ **IPlan**: ``"env:essential"`` \| ``"org:standard"``

#### Defined in

[Api/Auth.ts:31](https://github.com/Verdocs/js-sdk/blob/368138d/src/Api/Auth.ts#L31)

___

### IRole

Ƭ **IRole**: ``"owner"`` \| ``"basic_user"`` \| ``"member"``

#### Defined in

[Api/Auth.ts:29](https://github.com/Verdocs/js-sdk/blob/368138d/src/Api/Auth.ts#L29)

## Functions

### authenticate

▸ `Const` **authenticate**(`request`): `Promise`<[`AuthenticateResponse`](../interfaces/Auth.AuthenticateResponse.md)\>

Authenticate to Verdocs via user/password authentication

```typescript
import {Auth, Endpoint} from '@verdocs/js-sdk';

const {accessToken} = await Auth.authenticate({ username: 'test@test.com', password: 'PASSWORD' });
Endpoint.setAuthToken(accessToken);
```

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`AuthenticateRequest`](../interfaces/Auth.AuthenticateRequest.md) |

#### Returns

`Promise`<[`AuthenticateResponse`](../interfaces/Auth.AuthenticateResponse.md)\>

#### Defined in

[Api/Auth.ts:95](https://github.com/Verdocs/js-sdk/blob/368138d/src/Api/Auth.ts#L95)

___

### getProfiles

▸ `Const` **getProfiles**(): `Promise`<[`IProfile`](../interfaces/Auth.IProfile.md)[]\>

Get the user's available profiles. The current profile will be marked with `current: true`.

```typescript
import {Auth} from '@verdocs/js-sdk';

const profiles = await Auth.getProfiles()
```

#### Returns

`Promise`<[`IProfile`](../interfaces/Auth.IProfile.md)[]\>

#### Defined in

[Api/Auth.ts:107](https://github.com/Verdocs/js-sdk/blob/368138d/src/Api/Auth.ts#L107)
