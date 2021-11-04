[@verdocs/js-sdk - v1.0.12](../README.md) / [Exports](../modules.md) / [Organizations](Organizations.md) / ApiKeys

# Namespace: ApiKeys

[Organizations](Organizations.md).ApiKeys

API keys are used to authenticate server-to-server calls. (API keys should **never** be used for client-to-server operations!)
To generate a key, either use the Verdocs admin interface and make note of the client_id and client_secret generated, or call
createKey as shown below. Then call [Users.Auth.authenticateApp](Users.Auth.md#authenticateapp) to obtain an access token using the provided ID and
secret. Note that server-to-server authentication requests return shorter-lived tokens, so it is important to check the `exp`
field and re-authenticate as needed for subsequent calls.

API keys may be updated or rotated at any time. Regular rotation is recommended. Rotation will not expire or invalidate
existing server-to-server sessions, so it may be done at any time without disrupting your application.

## Table of contents

### Functions

- [createKey](Organizations.ApiKeys.md#createkey)
- [deleteKey](Organizations.ApiKeys.md#deletekey)
- [getKeys](Organizations.ApiKeys.md#getkeys)
- [rotateKey](Organizations.ApiKeys.md#rotatekey)
- [updateKey](Organizations.ApiKeys.md#updatekey)

## Functions

### createKey

▸ `Const` **createKey**(`organizationId`, `params`): `Promise`<[`IApiKeyWithSecret`](../interfaces/Organizations.Types.IApiKeyWithSecret.md)\>

Create an API key.

```typescript
import {ApiKeys} from '@verdocs/js-sdk/Organizations';

await ApiKeys.createKey(ORGID, {name: NEWNAME});
```

#### Parameters

| Name | Type |
| :------ | :------ |
| `organizationId` | `string` |
| `params` | [`ICreateApiKeyRequest`](../interfaces/Organizations.Types.ICreateApiKeyRequest.md) |

#### Returns

`Promise`<[`IApiKeyWithSecret`](../interfaces/Organizations.Types.IApiKeyWithSecret.md)\>

#### Defined in

[Organizations/ApiKeys.ts:40](https://github.com/Verdocs/js-sdk/blob/main/src/Organizations/ApiKeys.ts#L40)

___

### deleteKey

▸ `Const` **deleteKey**(`organizationId`, `clientId`): `Promise`<`any`\>

Delete an API key.

```typescript
import {ApiKeys} from '@verdocs/js-sdk/Organizations';

await ApiKeys.deleteKey(ORGID, CLIENTID);
```

#### Parameters

| Name | Type |
| :------ | :------ |
| `organizationId` | `string` |
| `clientId` | `string` |

#### Returns

`Promise`<`any`\>

#### Defined in

[Organizations/ApiKeys.ts:82](https://github.com/Verdocs/js-sdk/blob/main/src/Organizations/ApiKeys.ts#L82)

___

### getKeys

▸ `Const` **getKeys**(`organizationId`): `Promise`<[`IApiKey`](../interfaces/Organizations.Types.IApiKey.md)[]\>

Get a list of keys for a given organization. The caller must have admin access to the organization.

```typescript
import {ApiKeys} from '@verdocs/js-sdk/Organizations';

const keys = await ApiKeys.getKeys(ORGID);
```

#### Parameters

| Name | Type |
| :------ | :------ |
| `organizationId` | `string` |

#### Returns

`Promise`<[`IApiKey`](../interfaces/Organizations.Types.IApiKey.md)[]\>

#### Defined in

[Organizations/ApiKeys.ts:26](https://github.com/Verdocs/js-sdk/blob/main/src/Organizations/ApiKeys.ts#L26)

___

### rotateKey

▸ `Const` **rotateKey**(`organizationId`, `clientId`): `Promise`<[`IApiKeyWithSecret`](../interfaces/Organizations.Types.IApiKeyWithSecret.md)\>

Rotate the secret for an API key. The caller must have admin access to the organization.

```typescript
import {ApiKeys} from '@verdocs/js-sdk/Organizations';

const {client_secret: newSecret} = await ApiKeys.rotateKey(ORGID, CLIENTID);
```

#### Parameters

| Name | Type |
| :------ | :------ |
| `organizationId` | `string` |
| `clientId` | `string` |

#### Returns

`Promise`<[`IApiKeyWithSecret`](../interfaces/Organizations.Types.IApiKeyWithSecret.md)\>

#### Defined in

[Organizations/ApiKeys.ts:54](https://github.com/Verdocs/js-sdk/blob/main/src/Organizations/ApiKeys.ts#L54)

___

### updateKey

▸ `Const` **updateKey**(`organizationId`, `clientId`, `params`): `Promise`<[`IApiKey`](../interfaces/Organizations.Types.IApiKey.md)\>

Update an API key to change its assigned Profile ID or Name.

```typescript
import {ApiKeys} from '@verdocs/js-sdk/Organizations';

await ApiKeys.updateKey(ORGID, CLIENTID, {name: NEWNAME});
```

#### Parameters

| Name | Type |
| :------ | :------ |
| `organizationId` | `string` |
| `clientId` | `string` |
| `params` | [`IUpdateApiKeyRequest`](../interfaces/Organizations.Types.IUpdateApiKeyRequest.md) |

#### Returns

`Promise`<[`IApiKey`](../interfaces/Organizations.Types.IApiKey.md)\>

#### Defined in

[Organizations/ApiKeys.ts:68](https://github.com/Verdocs/js-sdk/blob/main/src/Organizations/ApiKeys.ts#L68)
