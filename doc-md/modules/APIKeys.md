[verdocs-js-sdk - v1.0.0](../README.md) / [Exports](../modules.md) / APIKeys

# Namespace: APIKeys

## Table of contents

### Functions

- [createApiKey](APIKeys.md#createapikey)
- [deleteApiKey](APIKeys.md#deleteapikey)
- [getApiKeys](APIKeys.md#getapikeys)
- [rotateApiKey](APIKeys.md#rotateapikey)
- [updateApiKey](APIKeys.md#updateapikey)

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

[Api/ApiKeys.ts:6](https://github.com/Verdocs/js-sdk/blob/458266e/src/Api/ApiKeys.ts#L6)

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

[Api/ApiKeys.ts:15](https://github.com/Verdocs/js-sdk/blob/458266e/src/Api/ApiKeys.ts#L15)

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

[Api/ApiKeys.ts:3](https://github.com/Verdocs/js-sdk/blob/458266e/src/Api/ApiKeys.ts#L3)

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

[Api/ApiKeys.ts:9](https://github.com/Verdocs/js-sdk/blob/458266e/src/Api/ApiKeys.ts#L9)

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

[Api/ApiKeys.ts:12](https://github.com/Verdocs/js-sdk/blob/458266e/src/Api/ApiKeys.ts#L12)
