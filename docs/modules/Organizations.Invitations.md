[@verdocs/js-sdk - v1.0.12](../README.md) / [Exports](../modules.md) / [Organizations](Organizations.md) / Invitations

# Namespace: Invitations

[Organizations](Organizations.md).Invitations

## Table of contents

### Functions

- [claimInvitation](Organizations.Invitations.md#claiminvitation)
- [claimNewUser](Organizations.Invitations.md#claimnewuser)
- [createInvitation](Organizations.Invitations.md#createinvitation)
- [deleteInvitation](Organizations.Invitations.md#deleteinvitation)
- [getInvitations](Organizations.Invitations.md#getinvitations)
- [resendInvitation](Organizations.Invitations.md#resendinvitation)
- [updateInvitation](Organizations.Invitations.md#updateinvitation)

## Functions

### claimInvitation

▸ `Const` **claimInvitation**(`organizationId`, `email`, `params`): `Promise`<`any`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `organizationId` | `string` |
| `email` | `string` |
| `params` | `any` |

#### Returns

`Promise`<`any`\>

#### Defined in

[Organizations/Invitations.ts:28](https://github.com/Verdocs/js-sdk/blob/main/src/Organizations/Invitations.ts#L28)

___

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

[Organizations/Invitations.ts:33](https://github.com/Verdocs/js-sdk/blob/main/src/Organizations/Invitations.ts#L33)

___

### createInvitation

▸ `Const` **createInvitation**(`organizationId`, `params`): `Promise`<`any`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `organizationId` | `string` |
| `params` | `any` |

#### Returns

`Promise`<`any`\>

#### Defined in

[Organizations/Invitations.ts:8](https://github.com/Verdocs/js-sdk/blob/main/src/Organizations/Invitations.ts#L8)

___

### deleteInvitation

▸ `Const` **deleteInvitation**(`organizationId`, `email`): `Promise`<`any`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `organizationId` | `string` |
| `email` | `string` |

#### Returns

`Promise`<`any`\>

#### Defined in

[Organizations/Invitations.ts:13](https://github.com/Verdocs/js-sdk/blob/main/src/Organizations/Invitations.ts#L13)

___

### getInvitations

▸ `Const` **getInvitations**(`organizationId`): `Promise`<`any`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `organizationId` | `string` |

#### Returns

`Promise`<`any`\>

#### Defined in

[Organizations/Invitations.ts:3](https://github.com/Verdocs/js-sdk/blob/main/src/Organizations/Invitations.ts#L3)

___

### resendInvitation

▸ `Const` **resendInvitation**(`organizationId`, `email`): `Promise`<`any`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `organizationId` | `string` |
| `email` | `string` |

#### Returns

`Promise`<`any`\>

#### Defined in

[Organizations/Invitations.ts:23](https://github.com/Verdocs/js-sdk/blob/main/src/Organizations/Invitations.ts#L23)

___

### updateInvitation

▸ `Const` **updateInvitation**(`organizationId`, `email`, `params`): `Promise`<`any`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `organizationId` | `string` |
| `email` | `string` |
| `params` | `any` |

#### Returns

`Promise`<`any`\>

#### Defined in

[Organizations/Invitations.ts:18](https://github.com/Verdocs/js-sdk/blob/main/src/Organizations/Invitations.ts#L18)
