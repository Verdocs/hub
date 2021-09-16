[verdocs-js-sdk - v1.0.0](../README.md) / [Exports](../modules.md) / OrgInvitations

# Namespace: OrgInvitations

## Table of contents

### Functions

- [claimNewUser](OrgInvitations.md#claimnewuser)
- [claimOrgInvitation](OrgInvitations.md#claimorginvitation)
- [createOrgInvitation](OrgInvitations.md#createorginvitation)
- [deleteOrgInvitation](OrgInvitations.md#deleteorginvitation)
- [getOrgInvitations](OrgInvitations.md#getorginvitations)
- [resendOrgInvitation](OrgInvitations.md#resendorginvitation)
- [updateOrgInvitation](OrgInvitations.md#updateorginvitation)

## Functions

### claimNewUser

▸ `Const` **claimNewUser**(`organizationId`, `email`, `token`): `Promise`<`any`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `organizationId` | `string` |
| `email` | `string` |
| `token` | `string` |

#### Returns

`Promise`<`any`\>

#### Defined in

[Api/OrgInvitations.ts:23](https://github.com/Verdocs/js-sdk/blob/458266e/src/Api/OrgInvitations.ts#L23)

___

### claimOrgInvitation

▸ `Const` **claimOrgInvitation**(`organizationId`, `email`, `params`): `Promise`<`any`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `organizationId` | `string` |
| `email` | `string` |
| `params` | `any` |

#### Returns

`Promise`<`any`\>

#### Defined in

[Api/OrgInvitations.ts:20](https://github.com/Verdocs/js-sdk/blob/458266e/src/Api/OrgInvitations.ts#L20)

___

### createOrgInvitation

▸ `Const` **createOrgInvitation**(`organizationId`, `params`): `Promise`<`any`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `organizationId` | `string` |
| `params` | `any` |

#### Returns

`Promise`<`any`\>

#### Defined in

[Api/OrgInvitations.ts:8](https://github.com/Verdocs/js-sdk/blob/458266e/src/Api/OrgInvitations.ts#L8)

___

### deleteOrgInvitation

▸ `Const` **deleteOrgInvitation**(`organizationId`, `email`): `Promise`<`any`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `organizationId` | `string` |
| `email` | `string` |

#### Returns

`Promise`<`any`\>

#### Defined in

[Api/OrgInvitations.ts:11](https://github.com/Verdocs/js-sdk/blob/458266e/src/Api/OrgInvitations.ts#L11)

___

### getOrgInvitations

▸ `Const` **getOrgInvitations**(`organizationId`): `Promise`<`any`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `organizationId` | `string` |

#### Returns

`Promise`<`any`\>

#### Defined in

[Api/OrgInvitations.ts:5](https://github.com/Verdocs/js-sdk/blob/458266e/src/Api/OrgInvitations.ts#L5)

___

### resendOrgInvitation

▸ `Const` **resendOrgInvitation**(`organizationId`, `email`): `Promise`<`any`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `organizationId` | `string` |
| `email` | `string` |

#### Returns

`Promise`<`any`\>

#### Defined in

[Api/OrgInvitations.ts:17](https://github.com/Verdocs/js-sdk/blob/458266e/src/Api/OrgInvitations.ts#L17)

___

### updateOrgInvitation

▸ `Const` **updateOrgInvitation**(`organizationId`, `email`, `params`): `Promise`<`any`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `organizationId` | `string` |
| `email` | `string` |
| `params` | `any` |

#### Returns

`Promise`<`any`\>

#### Defined in

[Api/OrgInvitations.ts:14](https://github.com/Verdocs/js-sdk/blob/458266e/src/Api/OrgInvitations.ts#L14)
