[@verdocs/js-sdk - v1.0.3](../README.md) / [Exports](../modules.md) / [Organizations](../modules/Organizations.md) / [Types](../modules/Organizations.Types.md) / IGroup

# Interface: IGroup

[Organizations](../modules/Organizations.md).[Types](../modules/Organizations.Types.md).IGroup

## Hierarchy

- **`IGroup`**

  ↳ [`IGroupDetail`](Organizations.Types.IGroupDetail.md)

## Table of contents

### Properties

- [id](Organizations.Types.IGroup.md#id)
- [name](Organizations.Types.IGroup.md#name)
- [organization_id](Organizations.Types.IGroup.md#organization_id)
- [parent_id](Organizations.Types.IGroup.md#parent_id)
- [permissions](Organizations.Types.IGroup.md#permissions)
- [profiles](Organizations.Types.IGroup.md#profiles)
- [roles](Organizations.Types.IGroup.md#roles)

## Properties

### id

• **id**: `string`

#### Defined in

[Organizations/Types.ts:46](https://github.com/Verdocs/js-sdk/blob/main/src/Organizations/Types.ts#L46)

___

### name

• **name**: `string`

#### Defined in

[Organizations/Types.ts:47](https://github.com/Verdocs/js-sdk/blob/main/src/Organizations/Types.ts#L47)

___

### organization\_id

• **organization\_id**: `string`

#### Defined in

[Organizations/Types.ts:48](https://github.com/Verdocs/js-sdk/blob/main/src/Organizations/Types.ts#L48)

___

### parent\_id

• **parent\_id**: ``null`` \| `string`

For future expansion. In the future, Verdocs may support group hierarchies. Until then this field is always null.

#### Defined in

[Organizations/Types.ts:50](https://github.com/Verdocs/js-sdk/blob/main/src/Organizations/Types.ts#L50)

___

### permissions

• `Optional` **permissions**: [`TPermission`](../modules/Users.Types.md#tpermission)[]

Some operations will additionally return a list of permissions.

#### Defined in

[Organizations/Types.ts:52](https://github.com/Verdocs/js-sdk/blob/main/src/Organizations/Types.ts#L52)

___

### profiles

• `Optional` **profiles**: [`IProfile`](Users.Types.IProfile.md)[]

Some operations will additionally return a list of profiles.

#### Defined in

[Organizations/Types.ts:56](https://github.com/Verdocs/js-sdk/blob/main/src/Organizations/Types.ts#L56)

___

### roles

• `Optional` **roles**: [`TRole`](../modules/Users.Types.md#trole)[]

Some operations will additionally return a list of roles.

#### Defined in

[Organizations/Types.ts:54](https://github.com/Verdocs/js-sdk/blob/main/src/Organizations/Types.ts#L54)
