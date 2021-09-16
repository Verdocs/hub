[@verdocs/js-sdk - v1.0.0](../README.md) / [Exports](../modules.md) / [Organizations](Organizations.md) / Invitations

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

[Organizations/Invitations.ts:18](https://github.com/Verdocs/js-sdk/blob/4c3fec6/src/Organizations/Invitations.ts#L18)

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

[Organizations/Invitations.ts:21](https://github.com/Verdocs/js-sdk/blob/4c3fec6/src/Organizations/Invitations.ts#L21)

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

[Organizations/Invitations.ts:6](https://github.com/Verdocs/js-sdk/blob/4c3fec6/src/Organizations/Invitations.ts#L6)

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

[Organizations/Invitations.ts:9](https://github.com/Verdocs/js-sdk/blob/4c3fec6/src/Organizations/Invitations.ts#L9)

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

[Organizations/Invitations.ts:3](https://github.com/Verdocs/js-sdk/blob/4c3fec6/src/Organizations/Invitations.ts#L3)

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

[Organizations/Invitations.ts:15](https://github.com/Verdocs/js-sdk/blob/4c3fec6/src/Organizations/Invitations.ts#L15)

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

[Organizations/Invitations.ts:12](https://github.com/Verdocs/js-sdk/blob/4c3fec6/src/Organizations/Invitations.ts#L12)
