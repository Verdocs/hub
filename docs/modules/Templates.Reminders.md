[@verdocs/js-sdk - v1.0.12](../README.md) / [Exports](../modules.md) / [Templates](Templates.md) / Reminders

# Namespace: Reminders

[Templates](Templates.md).Reminders

## Table of contents

### Functions

- [createReminder](Templates.Reminders.md#createreminder)
- [deleteReminder](Templates.Reminders.md#deletereminder)
- [editReminder](Templates.Reminders.md#editreminder)
- [getReminder](Templates.Reminders.md#getreminder)

## Functions

### createReminder

▸ `Const` **createReminder**(`templateId`, `params`): `Promise`<[`ITemplate`](../interfaces/Templates.Types.ITemplate.md)\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `templateId` | `string` |
| `params` | `any` |

#### Returns

`Promise`<[`ITemplate`](../interfaces/Templates.Types.ITemplate.md)\>

#### Defined in

[Templates/Reminders.ts:4](https://github.com/Verdocs/js-sdk/blob/main/src/Templates/Reminders.ts#L4)

___

### deleteReminder

▸ `Const` **deleteReminder**(`templateId`, `reminderId`): `Promise`<`any`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `templateId` | `string` |
| `reminderId` | `string` |

#### Returns

`Promise`<`any`\>

#### Defined in

[Templates/Reminders.ts:19](https://github.com/Verdocs/js-sdk/blob/main/src/Templates/Reminders.ts#L19)

___

### editReminder

▸ `Const` **editReminder**(`templateId`, `reminderId`): `Promise`<[`IReminder`](../interfaces/Templates.Types.IReminder.md)\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `templateId` | `string` |
| `reminderId` | `string` |

#### Returns

`Promise`<[`IReminder`](../interfaces/Templates.Types.IReminder.md)\>

#### Defined in

[Templates/Reminders.ts:14](https://github.com/Verdocs/js-sdk/blob/main/src/Templates/Reminders.ts#L14)

___

### getReminder

▸ `Const` **getReminder**(`templateId`, `reminderId`): `Promise`<[`IReminder`](../interfaces/Templates.Types.IReminder.md)\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `templateId` | `string` |
| `reminderId` | `string` |

#### Returns

`Promise`<[`IReminder`](../interfaces/Templates.Types.IReminder.md)\>

#### Defined in

[Templates/Reminders.ts:9](https://github.com/Verdocs/js-sdk/blob/main/src/Templates/Reminders.ts#L9)
