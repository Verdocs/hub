[@verdocs/js-sdk - v1.0.5](../README.md) / [Exports](../modules.md) / [Organizations](Organizations.md) / Groups

# Namespace: Groups

[Organizations](Organizations.md).Groups

Organizations may contain "Groups" of user profiles, called Members. Groups may have permissions assigned that
apply to all Members, making it easy to configure role-based access control (RBAC) within an Organization. Note
that permissions are **additive**. A user may be a member of more than one group, and may also have permissions
assigned directly. In that case, the user will have the combined set of all permissions inherited from all
sources.

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

[Organizations/Groups.ts:41](https://github.com/Verdocs/js-sdk/blob/main/src/Organizations/Groups.ts#L41)

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

[Organizations/Groups.ts:47](https://github.com/Verdocs/js-sdk/blob/main/src/Organizations/Groups.ts#L47)

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

[Organizations/Groups.ts:44](https://github.com/Verdocs/js-sdk/blob/main/src/Organizations/Groups.ts#L44)

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

[Organizations/Groups.ts:52](https://github.com/Verdocs/js-sdk/blob/main/src/Organizations/Groups.ts#L52)

___

### getGroup

▸ `Const` **getGroup**(`organizationId`, `groupId`): `Promise`<[`IGroupDetail`](../interfaces/Organizations.Types.IGroupDetail.md)\>

Get the details for a group.

```typescript
import {Groups} from '@verdocs/js-sdk/Organizations';

const groups = await Groups.getGroups(ORGID);
```

#### Parameters

| Name | Type |
| :------ | :------ |
| `organizationId` | `string` |
| `groupId` | `string` |

#### Returns

`Promise`<[`IGroupDetail`](../interfaces/Organizations.Types.IGroupDetail.md)\>

#### Defined in

[Organizations/Groups.ts:35](https://github.com/Verdocs/js-sdk/blob/main/src/Organizations/Groups.ts#L35)

___

### getGroups

▸ `Const` **getGroups**(`organizationId`): `Promise`<[`IGroup`](../interfaces/Organizations.Types.IGroup.md)[]\>

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

`Promise`<[`IGroup`](../interfaces/Organizations.Types.IGroup.md)[]\>

#### Defined in

[Organizations/Groups.ts:23](https://github.com/Verdocs/js-sdk/blob/main/src/Organizations/Groups.ts#L23)

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

[Organizations/Groups.ts:38](https://github.com/Verdocs/js-sdk/blob/main/src/Organizations/Groups.ts#L38)
