[verdocs-js-sdk - v1.0.0](../README.md) / [Exports](../modules.md) / [Profiles](../modules/Profiles.md) / IProfile

# Interface: IProfile

[Profiles](../modules/Profiles.md).IProfile

## Table of contents

### Properties

- [current](Profiles.IProfile.md#current)
- [email](Profiles.IProfile.md#email)
- [first_name](Profiles.IProfile.md#first_name)
- [groups](Profiles.IProfile.md#groups)
- [id](Profiles.IProfile.md#id)
- [last_name](Profiles.IProfile.md#last_name)
- [organization](Profiles.IProfile.md#organization)
- [organization_id](Profiles.IProfile.md#organization_id)
- [permissions](Profiles.IProfile.md#permissions)
- [phone](Profiles.IProfile.md#phone)
- [plans](Profiles.IProfile.md#plans)
- [roles](Profiles.IProfile.md#roles)
- [user_id](Profiles.IProfile.md#user_id)

## Properties

### current

• **current**: `boolean`

If true, this is the caller's "currently selected" profile. All operations will performed "as" this profile.

#### Defined in

[Api/Profiles.ts:71](https://github.com/Verdocs/js-sdk/blob/a85c709/src/Api/Profiles.ts#L71)

___

### email

• **email**: `string`

#### Defined in

[Api/Profiles.ts:68](https://github.com/Verdocs/js-sdk/blob/a85c709/src/Api/Profiles.ts#L68)

___

### first\_name

• **first\_name**: `string`

#### Defined in

[Api/Profiles.ts:66](https://github.com/Verdocs/js-sdk/blob/a85c709/src/Api/Profiles.ts#L66)

___

### groups

• `Optional` **groups**: [`IGroup`](Profiles.IGroup.md)[]

The plans assigned to the profilel _NOTE: Only present in the "current" profile._

#### Defined in

[Api/Profiles.ts:81](https://github.com/Verdocs/js-sdk/blob/a85c709/src/Api/Profiles.ts#L81)

___

### id

• **id**: `string`

The unique ID of the profile

#### Defined in

[Api/Profiles.ts:59](https://github.com/Verdocs/js-sdk/blob/a85c709/src/Api/Profiles.ts#L59)

___

### last\_name

• **last\_name**: `string`

#### Defined in

[Api/Profiles.ts:67](https://github.com/Verdocs/js-sdk/blob/a85c709/src/Api/Profiles.ts#L67)

___

### organization

• **organization**: [`IOrganization`](Profiles.IOrganization.md)

The organization

#### Defined in

[Api/Profiles.ts:73](https://github.com/Verdocs/js-sdk/blob/a85c709/src/Api/Profiles.ts#L73)

___

### organization\_id

• **organization\_id**: `string`

The profile's organization ID, or a global "Realster" organization that all personal profiles are members of.

#### Defined in

[Api/Profiles.ts:65](https://github.com/Verdocs/js-sdk/blob/a85c709/src/Api/Profiles.ts#L65)

___

### permissions

• `Optional` **permissions**: [`TPermission`](../modules/Profiles.md#tpermission)[]

The permissions assigned to the profilel _NOTE: Only present in the "current" profile._

#### Defined in

[Api/Profiles.ts:75](https://github.com/Verdocs/js-sdk/blob/a85c709/src/Api/Profiles.ts#L75)

___

### phone

• **phone**: ``null`` \| `string`

#### Defined in

[Api/Profiles.ts:69](https://github.com/Verdocs/js-sdk/blob/a85c709/src/Api/Profiles.ts#L69)

___

### plans

• `Optional` **plans**: [`TPlan`](../modules/Profiles.md#tplan)[]

The plans assigned to the profilel _NOTE: Only present in the "current" profile._

#### Defined in

[Api/Profiles.ts:79](https://github.com/Verdocs/js-sdk/blob/a85c709/src/Api/Profiles.ts#L79)

___

### roles

• `Optional` **roles**: [`TRole`](../modules/Profiles.md#trole)[]

The roles assigned to the profilel _NOTE: Only present in the "current" profile._

#### Defined in

[Api/Profiles.ts:77](https://github.com/Verdocs/js-sdk/blob/a85c709/src/Api/Profiles.ts#L77)

___

### user\_id

• **user\_id**: `string`

The Verdocs back-end currently uses Auth0 for authentication. This value is a unique ID assigned by Auth0 to the
user. This is typically used to identify multiple profiles owned by a single user, but its implementation may
change in the future and developers should not develop code based on this field at this time.

#### Defined in

[Api/Profiles.ts:63](https://github.com/Verdocs/js-sdk/blob/a85c709/src/Api/Profiles.ts#L63)
