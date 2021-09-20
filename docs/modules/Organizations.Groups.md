[@verdocs/js-sdk - v1.0.1](../README.md) / [Exports](../modules.md) / [Organizations](Organizations.md) / Groups

# Namespace: Groups

[Organizations](Organizations.md).Groups

## Table of contents

### Functions

- [addMembers](Organizations.Groups.md#addmembers)
- [addPermission](Organizations.Groups.md#addpermission)
- [deleteMembers](Organizations.Groups.md#deletemembers)
- [deletePermission](Organizations.Groups.md#deletepermission)
- [getGroup](Organizations.Groups.md#getgroup)
- [getGroups](Organizations.Groups.md#getgroups)
- [getMembers](Organizations.Groups.md#getmembers)

## Functions

### addMembers

▸ `Const` **addMembers**(`organizationId`, `groupId`, `params`): `Promise`<`any`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `organizationId` | `string` |
| `groupId` | `string` |
| `params` | `any` |

#### Returns

`Promise`<`any`\>

#### Defined in

[Organizations/Groups.ts:31](https://github.com/Verdocs/js-sdk/blob/main/src/Organizations/Groups.ts#L31)

___

### addPermission

▸ `Const` **addPermission**(`organizationId`, `groupId`, `permissionId`, `params`): `Promise`<`any`\>

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

[Organizations/Groups.ts:37](https://github.com/Verdocs/js-sdk/blob/main/src/Organizations/Groups.ts#L37)

___

### deleteMembers

▸ `Const` **deleteMembers**(`organizationId`, `groupId`, `params`): `Promise`<`any`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `organizationId` | `string` |
| `groupId` | `string` |
| `params` | `any` |

#### Returns

`Promise`<`any`\>

#### Defined in

[Organizations/Groups.ts:34](https://github.com/Verdocs/js-sdk/blob/main/src/Organizations/Groups.ts#L34)

___

### deletePermission

▸ `Const` **deletePermission**(`organizationId`, `groupId`, `permissionId`): `Promise`<`any`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `organizationId` | `string` |
| `groupId` | `string` |
| `permissionId` | `string` |

#### Returns

`Promise`<`any`\>

#### Defined in

[Organizations/Groups.ts:42](https://github.com/Verdocs/js-sdk/blob/main/src/Organizations/Groups.ts#L42)

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

[Organizations/Groups.ts:25](https://github.com/Verdocs/js-sdk/blob/main/src/Organizations/Groups.ts#L25)

___

### getGroups

▸ `Const` **getGroups**(`organizationId`): `Promise`<`any`\>

Get a list of groups for a given organization. The caller must have admin access to the organization.

```typescript
import {Groups} from '@verdocs/js-sdk/Organizations';

const groups = await Groups.getGroups(ORGID);
```

#### Parameters

| Name | Type |
| :------ | :------ |
| `organizationId` | `string` |

#### Returns

`Promise`<`any`\>

#### Defined in

[Organizations/Groups.ts:22](https://github.com/Verdocs/js-sdk/blob/main/src/Organizations/Groups.ts#L22)

___

### getMembers

▸ `Const` **getMembers**(`organizationId`, `groupId`): `Promise`<`any`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `organizationId` | `string` |
| `groupId` | `string` |

#### Returns

`Promise`<`any`\>

#### Defined in

[Organizations/Groups.ts:28](https://github.com/Verdocs/js-sdk/blob/main/src/Organizations/Groups.ts#L28)
