[@verdocs/js-sdk - v1.0.0](../README.md) / [Exports](../modules.md) / [Users](../modules/Users.md) / [Types](../modules/Users.Types.md) / IProfile

# Interface: IProfile

[Users](../modules/Users.md).[Types](../modules/Users.Types.md).IProfile

## Table of contents

### Properties

- [current](Users.Types.IProfile.md#current)
- [email](Users.Types.IProfile.md#email)
- [first_name](Users.Types.IProfile.md#first_name)
- [groups](Users.Types.IProfile.md#groups)
- [id](Users.Types.IProfile.md#id)
- [last_name](Users.Types.IProfile.md#last_name)
- [organization](Users.Types.IProfile.md#organization)
- [organization_id](Users.Types.IProfile.md#organization_id)
- [permissions](Users.Types.IProfile.md#permissions)
- [phone](Users.Types.IProfile.md#phone)
- [plans](Users.Types.IProfile.md#plans)
- [roles](Users.Types.IProfile.md#roles)
- [user_id](Users.Types.IProfile.md#user_id)

## Properties

### current

• **current**: `boolean`

If true, this is the caller's "currently selected" profile. All operations will performed "as" this profile.

#### Defined in

[Users/Types.ts:55](https://github.com/Verdocs/js-sdk/blob/4c3fec6/src/Users/Types.ts#L55)

___

### email

• **email**: `string`

#### Defined in

[Users/Types.ts:52](https://github.com/Verdocs/js-sdk/blob/4c3fec6/src/Users/Types.ts#L52)

___

### first\_name

• **first\_name**: `string`

#### Defined in

[Users/Types.ts:50](https://github.com/Verdocs/js-sdk/blob/4c3fec6/src/Users/Types.ts#L50)

___

### groups

• `Optional` **groups**: [`IGroup`](Users.Types.IGroup.md)[]

The plans assigned to the profilel _NOTE: Only present in the "current" profile._

#### Defined in

[Users/Types.ts:65](https://github.com/Verdocs/js-sdk/blob/4c3fec6/src/Users/Types.ts#L65)

___

### id

• **id**: `string`

The unique ID of the profile

#### Defined in

[Users/Types.ts:43](https://github.com/Verdocs/js-sdk/blob/4c3fec6/src/Users/Types.ts#L43)

___

### last\_name

• **last\_name**: `string`

#### Defined in

[Users/Types.ts:51](https://github.com/Verdocs/js-sdk/blob/4c3fec6/src/Users/Types.ts#L51)

___

### organization

• **organization**: [`IOrganization`](Organizations.Types.IOrganization.md)

The organization

#### Defined in

[Users/Types.ts:57](https://github.com/Verdocs/js-sdk/blob/4c3fec6/src/Users/Types.ts#L57)

___

### organization\_id

• **organization\_id**: `string`

The profile's organization ID, or a global "Realster" organization that all personal profiles are members of.

#### Defined in

[Users/Types.ts:49](https://github.com/Verdocs/js-sdk/blob/4c3fec6/src/Users/Types.ts#L49)

___

### permissions

• `Optional` **permissions**: [`TPermission`](../modules/Users.Types.md#tpermission)[]

The permissions assigned to the profilel _NOTE: Only present in the "current" profile._

#### Defined in

[Users/Types.ts:59](https://github.com/Verdocs/js-sdk/blob/4c3fec6/src/Users/Types.ts#L59)

___

### phone

• **phone**: ``null`` \| `string`

#### Defined in

[Users/Types.ts:53](https://github.com/Verdocs/js-sdk/blob/4c3fec6/src/Users/Types.ts#L53)

___

### plans

• `Optional` **plans**: [`TPlan`](../modules/Users.Types.md#tplan)[]

The plans assigned to the profilel _NOTE: Only present in the "current" profile._

#### Defined in

[Users/Types.ts:63](https://github.com/Verdocs/js-sdk/blob/4c3fec6/src/Users/Types.ts#L63)

___

### roles

• `Optional` **roles**: [`TRole`](../modules/Users.Types.md#trole)[]

The roles assigned to the profilel _NOTE: Only present in the "current" profile._

#### Defined in

[Users/Types.ts:61](https://github.com/Verdocs/js-sdk/blob/4c3fec6/src/Users/Types.ts#L61)

___

### user\_id

• **user\_id**: `string`

The Verdocs back-end currently uses Auth0 for authentication. This value is a unique ID assigned by Auth0 to the
user. This is typically used to identify multiple profiles owned by a single user, but its implementation may
change in the future and developers should not develop code based on this field at this time.

#### Defined in

[Users/Types.ts:47](https://github.com/Verdocs/js-sdk/blob/4c3fec6/src/Users/Types.ts#L47)
