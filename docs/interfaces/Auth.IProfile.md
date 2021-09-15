[verdocs-js-sdk - v1.0.0](../README.md) / [Exports](../modules.md) / [Auth](../modules/Auth.md) / IProfile

# Interface: IProfile

[Auth](../modules/Auth.md).IProfile

## Table of contents

### Properties

- [current](Auth.IProfile.md#current)
- [email](Auth.IProfile.md#email)
- [first_name](Auth.IProfile.md#first_name)
- [id](Auth.IProfile.md#id)
- [last_name](Auth.IProfile.md#last_name)
- [organization](Auth.IProfile.md#organization)
- [organization_id](Auth.IProfile.md#organization_id)
- [permissions](Auth.IProfile.md#permissions)
- [phone](Auth.IProfile.md#phone)
- [plans](Auth.IProfile.md#plans)
- [roles](Auth.IProfile.md#roles)
- [user_id](Auth.IProfile.md#user_id)

## Properties

### current

• **current**: `boolean`

#### Defined in

[Api/Auth.ts:41](https://github.com/Verdocs/js-sdk/blob/368138d/src/Api/Auth.ts#L41)

___

### email

• **email**: `string`

#### Defined in

[Api/Auth.ts:39](https://github.com/Verdocs/js-sdk/blob/368138d/src/Api/Auth.ts#L39)

___

### first\_name

• **first\_name**: `string`

#### Defined in

[Api/Auth.ts:37](https://github.com/Verdocs/js-sdk/blob/368138d/src/Api/Auth.ts#L37)

___

### id

• **id**: `string`

#### Defined in

[Api/Auth.ts:34](https://github.com/Verdocs/js-sdk/blob/368138d/src/Api/Auth.ts#L34)

___

### last\_name

• **last\_name**: `string`

#### Defined in

[Api/Auth.ts:38](https://github.com/Verdocs/js-sdk/blob/368138d/src/Api/Auth.ts#L38)

___

### organization

• **organization**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `address` | ``null`` \| `string` |
| `address2` | ``null`` \| `string` |
| `business_name` | ``null`` \| `string` |
| `contact_email` | ``null`` \| `string` |
| `envelope_responsible` | `boolean` |
| `id` | `string` |
| `is_business` | `boolean` |
| `name` | `string` |
| `phone` | ``null`` \| `string` |
| `timezone` | ``null`` \| `string` |

#### Defined in

[Api/Auth.ts:42](https://github.com/Verdocs/js-sdk/blob/368138d/src/Api/Auth.ts#L42)

___

### organization\_id

• **organization\_id**: `string`

#### Defined in

[Api/Auth.ts:36](https://github.com/Verdocs/js-sdk/blob/368138d/src/Api/Auth.ts#L36)

___

### permissions

• `Optional` **permissions**: [`IPermission`](../modules/Auth.md#ipermission)[]

#### Defined in

[Api/Auth.ts:55](https://github.com/Verdocs/js-sdk/blob/368138d/src/Api/Auth.ts#L55)

___

### phone

• **phone**: ``null`` \| `string`

#### Defined in

[Api/Auth.ts:40](https://github.com/Verdocs/js-sdk/blob/368138d/src/Api/Auth.ts#L40)

___

### plans

• `Optional` **plans**: [`IPlan`](../modules/Auth.md#iplan)[]

#### Defined in

[Api/Auth.ts:57](https://github.com/Verdocs/js-sdk/blob/368138d/src/Api/Auth.ts#L57)

___

### roles

• `Optional` **roles**: [`IRole`](../modules/Auth.md#irole)[]

#### Defined in

[Api/Auth.ts:56](https://github.com/Verdocs/js-sdk/blob/368138d/src/Api/Auth.ts#L56)

___

### user\_id

• **user\_id**: `string`

#### Defined in

[Api/Auth.ts:35](https://github.com/Verdocs/js-sdk/blob/368138d/src/Api/Auth.ts#L35)
