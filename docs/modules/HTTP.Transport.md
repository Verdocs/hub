[@verdocs/js-sdk - v1.0.10](../README.md) / [Exports](../modules.md) / [HTTP](HTTP.md) / Transport

# Namespace: Transport

[HTTP](HTTP.md).Transport

## Table of contents

### Variables

- [Endpoint](HTTP.Transport.md#endpoint)

### Functions

- [setAuthorization](HTTP.Transport.md#setauthorization)
- [setBaseUrl](HTTP.Transport.md#setbaseurl)
- [setClientID](HTTP.Transport.md#setclientid)
- [setTimeout](HTTP.Transport.md#settimeout)

## Variables

### Endpoint

• **Endpoint**: `AxiosInstance`

#### Defined in

[HTTP/Transport.ts:3](https://github.com/Verdocs/js-sdk/blob/main/src/HTTP/Transport.ts#L3)

## Functions

### setAuthorization

▸ `Const` **setAuthorization**(`accessToken`): `void`

Set the auth token that will be used for Verdocs API calls.

```typescript
import {Transport} from '@verdocs/js-sdk/HTTP';

Transport.setAuthorization(accessToken);
```

#### Parameters

| Name | Type |
| :------ | :------ |
| `accessToken` | ``null`` \| `string` |

#### Returns

`void`

#### Defined in

[HTTP/Transport.ts:18](https://github.com/Verdocs/js-sdk/blob/main/src/HTTP/Transport.ts#L18)

___

### setBaseUrl

▸ `Const` **setBaseUrl**(`baseUrl`): `void`

Set the base URL for API calls. Typically this is https://api.verdocs.com/ and is the default. Change this only after consultation
with Verdocs Developer Support.

```typescript
import {Transport} from '@verdocs/js-sdk/HTTP';

Transport.setBaseUrl('https://api.verdiocs.com');
```

#### Parameters

| Name | Type |
| :------ | :------ |
| `baseUrl` | `string` |

#### Returns

`void`

#### Defined in

[HTTP/Transport.ts:45](https://github.com/Verdocs/js-sdk/blob/main/src/HTTP/Transport.ts#L45)

___

### setClientID

▸ `Const` **setClientID**(`clientID`): `void`

Set the Client ID for Verdocs API calls.

```typescript
import {Transport} from '@verdocs/js-sdk/HTTP';

Transport.setClientID('1234);
```

#### Parameters

| Name | Type |
| :------ | :------ |
| `clientID` | `string` |

#### Returns

`void`

#### Defined in

[HTTP/Transport.ts:31](https://github.com/Verdocs/js-sdk/blob/main/src/HTTP/Transport.ts#L31)

___

### setTimeout

▸ `Const` **setTimeout**(`timeout`): `void`

Set the timeout for API calls in milliseconds. 2000-4000ms is recommended for most purposes. 3000ms is the default.

```typescript
import {Transport} from '@verdocs/js-sdk/HTTP';

Transport.setTimeout(3000);
```

#### Parameters

| Name | Type |
| :------ | :------ |
| `timeout` | `number` |

#### Returns

`void`

#### Defined in

[HTTP/Transport.ts:58](https://github.com/Verdocs/js-sdk/blob/main/src/HTTP/Transport.ts#L58)
