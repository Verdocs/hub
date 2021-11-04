[@verdocs/js-sdk - v1.0.14](../README.md) / [Exports](../modules.md) / [Templates](Templates.md) / Roles

# Namespace: Roles

[Templates](Templates.md).Roles

## Table of contents

### Functions

- [createRole](Templates.Roles.md#createrole)
- [deleteRole](Templates.Roles.md#deleterole)
- [deleteSequence](Templates.Roles.md#deletesequence)
- [editRole](Templates.Roles.md#editrole)
- [getRole](Templates.Roles.md#getrole)
- [getRoleFields](Templates.Roles.md#getrolefields)
- [getRoles](Templates.Roles.md#getroles)

## Functions

### createRole

▸ `Const` **createRole**(`templateId`, `params`): `Promise`<[`IRole`](../interfaces/Templates.Types.IRole.md)\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `templateId` | `string` |
| `params` | [`IRole`](../interfaces/Templates.Types.IRole.md) |

#### Returns

`Promise`<[`IRole`](../interfaces/Templates.Types.IRole.md)\>

#### Defined in

[Templates/Roles.ts:4](https://github.com/Verdocs/js-sdk/blob/main/src/Templates/Roles.ts#L4)

___

### deleteRole

▸ `Const` **deleteRole**(`templateId`, `roleName`): `Promise`<`any`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `templateId` | `string` |
| `roleName` | `string` |

#### Returns

`Promise`<`any`\>

#### Defined in

[Templates/Roles.ts:24](https://github.com/Verdocs/js-sdk/blob/main/src/Templates/Roles.ts#L24)

___

### deleteSequence

▸ `Const` **deleteSequence**(`templateId`): `Promise`<[`IRole`](../interfaces/Templates.Types.IRole.md)[]\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `templateId` | `string` |

#### Returns

`Promise`<[`IRole`](../interfaces/Templates.Types.IRole.md)[]\>

#### Defined in

[Templates/Roles.ts:34](https://github.com/Verdocs/js-sdk/blob/main/src/Templates/Roles.ts#L34)

___

### editRole

▸ `Const` **editRole**(`templateId`, `roleName`, `params`): `Promise`<[`IRole`](../interfaces/Templates.Types.IRole.md)\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `templateId` | `string` |
| `roleName` | `string` |
| `params` | [`IRole`](../interfaces/Templates.Types.IRole.md) |

#### Returns

`Promise`<[`IRole`](../interfaces/Templates.Types.IRole.md)\>

#### Defined in

[Templates/Roles.ts:19](https://github.com/Verdocs/js-sdk/blob/main/src/Templates/Roles.ts#L19)

___

### getRole

▸ `Const` **getRole**(`templateId`, `roleName`): `Promise`<[`IRole`](../interfaces/Templates.Types.IRole.md)\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `templateId` | `string` |
| `roleName` | `string` |

#### Returns

`Promise`<[`IRole`](../interfaces/Templates.Types.IRole.md)\>

#### Defined in

[Templates/Roles.ts:14](https://github.com/Verdocs/js-sdk/blob/main/src/Templates/Roles.ts#L14)

___

### getRoleFields

▸ `Const` **getRoleFields**(`templateId`, `roleName`): `Promise`<[`IField`](../interfaces/Templates.Types.IField.md)[]\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `templateId` | `string` |
| `roleName` | `string` |

#### Returns

`Promise`<[`IField`](../interfaces/Templates.Types.IField.md)[]\>

#### Defined in

[Templates/Roles.ts:29](https://github.com/Verdocs/js-sdk/blob/main/src/Templates/Roles.ts#L29)

___

### getRoles

▸ `Const` **getRoles**(`templateId`): `Promise`<[`IRole`](../interfaces/Templates.Types.IRole.md)[]\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `templateId` | `string` |

#### Returns

`Promise`<[`IRole`](../interfaces/Templates.Types.IRole.md)[]\>

#### Defined in

[Templates/Roles.ts:9](https://github.com/Verdocs/js-sdk/blob/main/src/Templates/Roles.ts#L9)
