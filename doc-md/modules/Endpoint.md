[verdocs-js-sdk - v1.0.0](../README.md) / [Exports](../modules.md) / Endpoint

# Namespace: Endpoint

## Table of contents

### Type aliases

- [RequestStatus](Endpoint.md#requeststatus)

### Variables

- [Endpoint](Endpoint.md#endpoint)

### Functions

- [StandardDataReponse](Endpoint.md#standarddatareponse)
- [setAuthToken](Endpoint.md#setauthtoken)

## Type aliases

### RequestStatus

Ƭ **RequestStatus**: ``"OK"`` \| ``"ERROR"``

#### Defined in

[Api/Endpoint.ts:9](https://github.com/Verdocs/js-sdk/blob/6ec87bd/src/Api/Endpoint.ts#L9)

## Variables

### Endpoint

• **Endpoint**: `AxiosInstance`

#### Defined in

[Api/Endpoint.ts:3](https://github.com/Verdocs/js-sdk/blob/6ec87bd/src/Api/Endpoint.ts#L3)

## Functions

### StandardDataReponse

▸ `Const` **StandardDataReponse**(`response`): `any`

Most requests only ever need to access the data from the server's response

#### Parameters

| Name | Type |
| :------ | :------ |
| `response` | `AxiosResponse`<`any`\> |

#### Returns

`any`

#### Defined in

[Api/Endpoint.ts:17](https://github.com/Verdocs/js-sdk/blob/6ec87bd/src/Api/Endpoint.ts#L17)

___

### setAuthToken

▸ `Const` **setAuthToken**(`accessToken`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `accessToken` | ``null`` \| `string` |

#### Returns

`void`

#### Defined in

[Api/Endpoint.ts:12](https://github.com/Verdocs/js-sdk/blob/6ec87bd/src/Api/Endpoint.ts#L12)
