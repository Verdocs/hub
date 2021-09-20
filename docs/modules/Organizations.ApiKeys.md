[@verdocs/js-sdk - v1.0.0](../README.md) / [Exports](../modules.md) / [Organizations](Organizations.md) / ApiKeys

# Namespace: ApiKeys

[Organizations](Organizations.md).ApiKeys

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

[Organizations/ApiKeys.ts:25](https://github.com/Verdocs/js-sdk/blob/main/src/Organizations/ApiKeys.ts#L25)

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

[Organizations/ApiKeys.ts:61](https://github.com/Verdocs/js-sdk/blob/main/src/Organizations/ApiKeys.ts#L61)

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

[Organizations/ApiKeys.ts:13](https://github.com/Verdocs/js-sdk/blob/main/src/Organizations/ApiKeys.ts#L13)

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

[Organizations/ApiKeys.ts:37](https://github.com/Verdocs/js-sdk/blob/main/src/Organizations/ApiKeys.ts#L37)

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

[Organizations/ApiKeys.ts:49](https://github.com/Verdocs/js-sdk/blob/main/src/Organizations/ApiKeys.ts#L49)
