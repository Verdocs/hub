[verdocs-js-sdk - v1.0.0](../README.md) / [Exports](../modules.md) / OrgGroups

# Namespace: OrgGroups

## Table of contents

### Functions

- [addOrgGroupMembers](OrgGroups.md#addorggroupmembers)
- [addOrgGroupPermission](OrgGroups.md#addorggrouppermission)
- [deleteOrgGroupMembers](OrgGroups.md#deleteorggroupmembers)
- [deleteOrgGroupPermission](OrgGroups.md#deleteorggrouppermission)
- [getOrgGroup](OrgGroups.md#getorggroup)
- [getOrgGroupMembers](OrgGroups.md#getorggroupmembers)
- [getOrgGroups](OrgGroups.md#getorggroups)

## Functions

### addOrgGroupMembers

▸ `Const` **addOrgGroupMembers**(`organizationId`, `groupId`, `params`): `Promise`<`any`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `organizationId` | `string` |
| `groupId` | `string` |
| `params` | `any` |

#### Returns

`Promise`<`any`\>

#### Defined in

[Api/OrgGroups.ts:12](https://github.com/Verdocs/js-sdk/blob/458266e/src/Api/OrgGroups.ts#L12)

___

### addOrgGroupPermission

▸ `Const` **addOrgGroupPermission**(`organizationId`, `groupId`, `permissionId`, `params`): `Promise`<`any`\>

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

[Api/OrgGroups.ts:18](https://github.com/Verdocs/js-sdk/blob/458266e/src/Api/OrgGroups.ts#L18)

___

### deleteOrgGroupMembers

▸ `Const` **deleteOrgGroupMembers**(`organizationId`, `groupId`, `params`): `Promise`<`any`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `organizationId` | `string` |
| `groupId` | `string` |
| `params` | `any` |

#### Returns

`Promise`<`any`\>

#### Defined in

[Api/OrgGroups.ts:15](https://github.com/Verdocs/js-sdk/blob/458266e/src/Api/OrgGroups.ts#L15)

___

### deleteOrgGroupPermission

▸ `Const` **deleteOrgGroupPermission**(`organizationId`, `groupId`, `permissionId`): `Promise`<`any`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `organizationId` | `string` |
| `groupId` | `string` |
| `permissionId` | `string` |

#### Returns

`Promise`<`any`\>

#### Defined in

[Api/OrgGroups.ts:23](https://github.com/Verdocs/js-sdk/blob/458266e/src/Api/OrgGroups.ts#L23)

___

### getOrgGroup

▸ `Const` **getOrgGroup**(`organizationId`, `groupId`): `Promise`<`any`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `organizationId` | `string` |
| `groupId` | `string` |

#### Returns

`Promise`<`any`\>

#### Defined in

[Api/OrgGroups.ts:6](https://github.com/Verdocs/js-sdk/blob/458266e/src/Api/OrgGroups.ts#L6)

___

### getOrgGroupMembers

▸ `Const` **getOrgGroupMembers**(`organizationId`, `groupId`): `Promise`<`any`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `organizationId` | `string` |
| `groupId` | `string` |

#### Returns

`Promise`<`any`\>

#### Defined in

[Api/OrgGroups.ts:9](https://github.com/Verdocs/js-sdk/blob/458266e/src/Api/OrgGroups.ts#L9)

___

### getOrgGroups

▸ `Const` **getOrgGroups**(`organizationId`): `Promise`<`any`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `organizationId` | `string` |

#### Returns

`Promise`<`any`\>

#### Defined in

[Api/OrgGroups.ts:3](https://github.com/Verdocs/js-sdk/blob/458266e/src/Api/OrgGroups.ts#L3)
