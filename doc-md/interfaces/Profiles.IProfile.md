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

[Api/Profiles.ts:55](https://github.com/Verdocs/js-sdk/blob/458266e/src/Api/Profiles.ts#L55)

___

### email

• **email**: `string`

#### Defined in

[Api/Profiles.ts:52](https://github.com/Verdocs/js-sdk/blob/458266e/src/Api/Profiles.ts#L52)

___

### first\_name

• **first\_name**: `string`

#### Defined in

[Api/Profiles.ts:50](https://github.com/Verdocs/js-sdk/blob/458266e/src/Api/Profiles.ts#L50)

___

### groups

• `Optional` **groups**: [`IGroup`](Profiles.IGroup.md)[]

The plans assigned to the profilel _NOTE: Only present in the "current" profile._

#### Defined in

[Api/Profiles.ts:65](https://github.com/Verdocs/js-sdk/blob/458266e/src/Api/Profiles.ts#L65)

___

### id

• **id**: `string`

The unique ID of the profile

#### Defined in

[Api/Profiles.ts:43](https://github.com/Verdocs/js-sdk/blob/458266e/src/Api/Profiles.ts#L43)

___

### last\_name

• **last\_name**: `string`

#### Defined in

[Api/Profiles.ts:51](https://github.com/Verdocs/js-sdk/blob/458266e/src/Api/Profiles.ts#L51)

___

### organization

• **organization**: [`IOrganization`](Organizations.IOrganization.md)

The organization

#### Defined in

[Api/Profiles.ts:57](https://github.com/Verdocs/js-sdk/blob/458266e/src/Api/Profiles.ts#L57)

___

### organization\_id

• **organization\_id**: `string`

The profile's organization ID, or a global "Realster" organization that all personal profiles are members of.

#### Defined in

[Api/Profiles.ts:49](https://github.com/Verdocs/js-sdk/blob/458266e/src/Api/Profiles.ts#L49)

___

### permissions

• `Optional` **permissions**: [`TPermission`](../modules/Profiles.md#tpermission)[]

The permissions assigned to the profilel _NOTE: Only present in the "current" profile._

#### Defined in

[Api/Profiles.ts:59](https://github.com/Verdocs/js-sdk/blob/458266e/src/Api/Profiles.ts#L59)

___

### phone

• **phone**: ``null`` \| `string`

#### Defined in

[Api/Profiles.ts:53](https://github.com/Verdocs/js-sdk/blob/458266e/src/Api/Profiles.ts#L53)

___

### plans

• `Optional` **plans**: [`TPlan`](../modules/Profiles.md#tplan)[]

The plans assigned to the profilel _NOTE: Only present in the "current" profile._

#### Defined in

[Api/Profiles.ts:63](https://github.com/Verdocs/js-sdk/blob/458266e/src/Api/Profiles.ts#L63)

___

### roles

• `Optional` **roles**: [`TRole`](../modules/Profiles.md#trole)[]

The roles assigned to the profilel _NOTE: Only present in the "current" profile._

#### Defined in

[Api/Profiles.ts:61](https://github.com/Verdocs/js-sdk/blob/458266e/src/Api/Profiles.ts#L61)

___

### user\_id

• **user\_id**: `string`

The Verdocs back-end currently uses Auth0 for authentication. This value is a unique ID assigned by Auth0 to the
user. This is typically used to identify multiple profiles owned by a single user, but its implementation may
change in the future and developers should not develop code based on this field at this time.

#### Defined in

[Api/Profiles.ts:47](https://github.com/Verdocs/js-sdk/blob/458266e/src/Api/Profiles.ts#L47)
