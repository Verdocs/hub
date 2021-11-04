[@verdocs/js-sdk - v1.0.12](../README.md) / [Exports](../modules.md) / [HTTP](HTTP.md) / Transport

# Namespace: Transport

[HTTP](HTTP.md).Transport

## Table of contents

### Functions

- [getEndpoint](HTTP.Transport.md#getendpoint)
- [setAuthorization](HTTP.Transport.md#setauthorization)
- [setBaseUrl](HTTP.Transport.md#setbaseurl)
- [setClientID](HTTP.Transport.md#setclientid)
- [setTimeout](HTTP.Transport.md#settimeout)

## Functions

### getEndpoint

▸ `Const` **getEndpoint**(): `AxiosInstance`

Helper to get the endpoint for direct access to HTTP functions.

```typescript
import {Transport} from '@verdocs/js-sdk/HTTP';

console.log('Current timeout', Transport.getEndpoint().defaults.timeout);
```

#### Returns

`AxiosInstance`

#### Defined in

[HTTP/Transport.ts:89](https://github.com/Verdocs/js-sdk/blob/main/src/HTTP/Transport.ts#L89)

___

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

[HTTP/Transport.ts:19](https://github.com/Verdocs/js-sdk/blob/main/src/HTTP/Transport.ts#L19)

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

[HTTP/Transport.ts:57](https://github.com/Verdocs/js-sdk/blob/main/src/HTTP/Transport.ts#L57)

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

[HTTP/Transport.ts:40](https://github.com/Verdocs/js-sdk/blob/main/src/HTTP/Transport.ts#L40)

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

[HTTP/Transport.ts:73](https://github.com/Verdocs/js-sdk/blob/main/src/HTTP/Transport.ts#L73)
