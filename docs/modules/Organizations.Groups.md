[@verdocs/js-sdk - v1.0.0](../README.md) / [Exports](../modules.md) / [Organizations](Organizations.md) / Groups

# Namespace: Groups

[Organizations](Organizations.md).Groups

## Table of contents

### Functions

- [addGroupMembers](Organizations.Groups.md#addgroupmembers)
- [addGroupPermission](Organizations.Groups.md#addgrouppermission)
- [deleteGroupMembers](Organizations.Groups.md#deletegroupmembers)
- [deleteGroupPermission](Organizations.Groups.md#deletegrouppermission)
- [getGroup](Organizations.Groups.md#getgroup)
- [getGroupMembers](Organizations.Groups.md#getgroupmembers)
- [getGroups](Organizations.Groups.md#getgroups)

## Functions

### addGroupMembers

▸ `Const` **addGroupMembers**(`organizationId`, `groupId`, `params`): `Promise`<`any`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `organizationId` | `string` |
| `groupId` | `string` |
| `params` | `any` |

#### Returns

`Promise`<`any`\>

#### Defined in

[Organizations/Groups.ts:12](https://github.com/Verdocs/js-sdk/blob/main/src/Organizations/Groups.ts#L12)

___

### addGroupPermission

▸ `Const` **addGroupPermission**(`organizationId`, `groupId`, `permissionId`, `params`): `Promise`<`any`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `organizationId` | `string` |
| `groupId` | `string` |
| `permissionId` | `string` |
| `params` | `any` |

#### Returns

`Promise`<`any`\>

#### Defined in

[Organizations/Groups.ts:18](https://github.com/Verdocs/js-sdk/blob/main/src/Organizations/Groups.ts#L18)

___

### deleteGroupMembers

▸ `Const` **deleteGroupMembers**(`organizationId`, `groupId`, `params`): `Promise`<`any`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `organizationId` | `string` |
| `groupId` | `string` |
| `params` | `any` |

#### Returns

`Promise`<`any`\>

#### Defined in

[Organizations/Groups.ts:15](https://github.com/Verdocs/js-sdk/blob/main/src/Organizations/Groups.ts#L15)

___

### deleteGroupPermission

▸ `Const` **deleteGroupPermission**(`organizationId`, `groupId`, `permissionId`): `Promise`<`any`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `organizationId` | `string` |
| `groupId` | `string` |
| `permissionId` | `string` |

#### Returns

`Promise`<`any`\>

#### Defined in

[Organizations/Groups.ts:23](https://github.com/Verdocs/js-sdk/blob/main/src/Organizations/Groups.ts#L23)

___

### getGroup

▸ `Const` **getGroup**(`organizationId`, `groupId`): `Promise`<`any`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `organizationId` | `string` |
| `groupId` | `string` |

#### Returns

`Promise`<`any`\>

#### Defined in

[Organizations/Groups.ts:6](https://github.com/Verdocs/js-sdk/blob/main/src/Organizations/Groups.ts#L6)

___

### getGroupMembers

▸ `Const` **getGroupMembers**(`organizationId`, `groupId`): `Promise`<`any`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `organizationId` | `string` |
| `groupId` | `string` |

#### Returns

`Promise`<`any`\>

#### Defined in

[Organizations/Groups.ts:9](https://github.com/Verdocs/js-sdk/blob/main/src/Organizations/Groups.ts#L9)

___

### getGroups

▸ `Const` **getGroups**(`organizationId`): `Promise`<`any`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `organizationId` | `string` |

#### Returns

`Promise`<`any`\>

#### Defined in

[Organizations/Groups.ts:3](https://github.com/Verdocs/js-sdk/blob/main/src/Organizations/Groups.ts#L3)
