[@verdocs/js-sdk - v1.0.12](../README.md) / [Exports](../modules.md) / [Organizations](../modules/Organizations.md) / [Types](../modules/Organizations.Types.md) / IGroupDetail

# Interface: IGroupDetail

[Organizations](../modules/Organizations.md).[Types](../modules/Organizations.Types.md).IGroupDetail

## Hierarchy

- [`IGroup`](Organizations.Types.IGroup.md)

  ↳ **`IGroupDetail`**

## Table of contents

### Properties

- [id](Organizations.Types.IGroupDetail.md#id)
- [name](Organizations.Types.IGroupDetail.md#name)
- [organization_id](Organizations.Types.IGroupDetail.md#organization_id)
- [parent_id](Organizations.Types.IGroupDetail.md#parent_id)
- [permissions](Organizations.Types.IGroupDetail.md#permissions)
- [profiles](Organizations.Types.IGroupDetail.md#profiles)
- [roles](Organizations.Types.IGroupDetail.md#roles)

## Properties

### id

• **id**: `string`

#### Inherited from

[IGroup](Organizations.Types.IGroup.md).[id](Organizations.Types.IGroup.md#id)

#### Defined in

[Organizations/Types.ts:46](https://github.com/Verdocs/js-sdk/blob/main/src/Organizations/Types.ts#L46)

___

### name

• **name**: `string`

#### Inherited from

[IGroup](Organizations.Types.IGroup.md).[name](Organizations.Types.IGroup.md#name)

#### Defined in

[Organizations/Types.ts:47](https://github.com/Verdocs/js-sdk/blob/main/src/Organizations/Types.ts#L47)

___

### organization\_id

• **organization\_id**: `string`

#### Inherited from

[IGroup](Organizations.Types.IGroup.md).[organization_id](Organizations.Types.IGroup.md#organization_id)

#### Defined in

[Organizations/Types.ts:48](https://github.com/Verdocs/js-sdk/blob/main/src/Organizations/Types.ts#L48)

___

### parent\_id

• **parent\_id**: ``null`` \| `string`

For future expansion. In the future, Verdocs may support group hierarchies. Until then this field is always null.

#### Inherited from

[IGroup](Organizations.Types.IGroup.md).[parent_id](Organizations.Types.IGroup.md#parent_id)

#### Defined in

[Organizations/Types.ts:50](https://github.com/Verdocs/js-sdk/blob/main/src/Organizations/Types.ts#L50)

___

### permissions

• **permissions**: [`TPermission`](../modules/Users.Types.md#tpermission)[]

Some operations will additionally return a list of permissions.

#### Overrides

[IGroup](Organizations.Types.IGroup.md).[permissions](Organizations.Types.IGroup.md#permissions)

#### Defined in

[Organizations/Types.ts:60](https://github.com/Verdocs/js-sdk/blob/main/src/Organizations/Types.ts#L60)

___

### profiles

• **profiles**: [`IProfile`](Users.Types.IProfile.md)[]

Some operations will additionally return a list of profiles.

#### Overrides

[IGroup](Organizations.Types.IGroup.md).[profiles](Organizations.Types.IGroup.md#profiles)

#### Defined in

[Organizations/Types.ts:62](https://github.com/Verdocs/js-sdk/blob/main/src/Organizations/Types.ts#L62)

___

### roles

• **roles**: [`TRole`](../modules/Users.Types.md#trole)[]

Some operations will additionally return a list of roles.

#### Overrides

[IGroup](Organizations.Types.IGroup.md).[roles](Organizations.Types.IGroup.md#roles)

#### Defined in

[Organizations/Types.ts:61](https://github.com/Verdocs/js-sdk/blob/main/src/Organizations/Types.ts#L61)
