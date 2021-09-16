[verdocs-js-sdk - v1.0.0](../README.md) / [Exports](../modules.md) / [Organizations](Organizations.md) / ApiKeys

# Namespace: ApiKeys

[Organizations](Organizations.md).ApiKeys

## Table of contents

### Functions

- [createApiKey](Organizations.ApiKeys.md#createapikey)
- [deleteApiKey](Organizations.ApiKeys.md#deleteapikey)
- [getApiKeys](Organizations.ApiKeys.md#getapikeys)
- [rotateApiKey](Organizations.ApiKeys.md#rotateapikey)
- [updateApiKey](Organizations.ApiKeys.md#updateapikey)

## Functions

### createApiKey

▸ `Const` **createApiKey**(`organizationId`, `params`): `Promise`<`any`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `organizationId` | `string` |
| `params` | `any` |

#### Returns

`Promise`<`any`\>

#### Defined in

[Organizations/ApiKeys.ts:6](https://github.com/Verdocs/js-sdk/blob/cfc4bfe/src/Organizations/ApiKeys.ts#L6)

___

### deleteApiKey

▸ `Const` **deleteApiKey**(`organizationId`, `clientId`, `params`): `Promise`<`any`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `organizationId` | `string` |
| `clientId` | `string` |
| `params` | `any` |

#### Returns

`Promise`<`any`\>

#### Defined in

[Organizations/ApiKeys.ts:15](https://github.com/Verdocs/js-sdk/blob/cfc4bfe/src/Organizations/ApiKeys.ts#L15)

___

### getApiKeys

▸ `Const` **getApiKeys**(`organizationId`): `Promise`<`any`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `organizationId` | `string` |

#### Returns

`Promise`<`any`\>

#### Defined in

[Organizations/ApiKeys.ts:3](https://github.com/Verdocs/js-sdk/blob/cfc4bfe/src/Organizations/ApiKeys.ts#L3)

___

### rotateApiKey

▸ `Const` **rotateApiKey**(`organizationId`, `clientId`): `Promise`<`any`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `organizationId` | `string` |
| `clientId` | `string` |

#### Returns

`Promise`<`any`\>

#### Defined in

[Organizations/ApiKeys.ts:9](https://github.com/Verdocs/js-sdk/blob/cfc4bfe/src/Organizations/ApiKeys.ts#L9)

___

### updateApiKey

▸ `Const` **updateApiKey**(`organizationId`, `clientId`, `params`): `Promise`<`any`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `organizationId` | `string` |
| `clientId` | `string` |
| `params` | `any` |

#### Returns

`Promise`<`any`\>

#### Defined in

[Organizations/ApiKeys.ts:12](https://github.com/Verdocs/js-sdk/blob/cfc4bfe/src/Organizations/ApiKeys.ts#L12)
