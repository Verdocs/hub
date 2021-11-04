[@verdocs/js-sdk - v1.0.10](../README.md) / [Exports](../modules.md) / [Templates](Templates.md) / Fields

# Namespace: Fields

[Templates](Templates.md).Fields

## Table of contents

### Functions

- [createField](Templates.Fields.md#createfield)
- [deleteField](Templates.Fields.md#deletefield)
- [editField](Templates.Fields.md#editfield)

## Functions

### createField

▸ `Const` **createField**(`templateId`, `params`): `Promise`<[`IField`](../interfaces/Templates.Types.IField.md)\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `templateId` | `string` |
| `params` | [`IField`](../interfaces/Templates.Types.IField.md) |

#### Returns

`Promise`<[`IField`](../interfaces/Templates.Types.IField.md)\>

#### Defined in

[Templates/Fields.ts:4](https://github.com/Verdocs/js-sdk/blob/main/src/Templates/Fields.ts#L4)

___

### deleteField

▸ `Const` **deleteField**(`templateId`, `fieldName`): `Promise`<`any`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `templateId` | `string` |
| `fieldName` | `string` |

#### Returns

`Promise`<`any`\>

#### Defined in

[Templates/Fields.ts:10](https://github.com/Verdocs/js-sdk/blob/main/src/Templates/Fields.ts#L10)

___

### editField

▸ `Const` **editField**(`templateId`, `fieldName`, `params`): `Promise`<[`IField`](../interfaces/Templates.Types.IField.md)\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `templateId` | `string` |
| `fieldName` | `string` |
| `params` | [`IField`](../interfaces/Templates.Types.IField.md) |

#### Returns

`Promise`<[`IField`](../interfaces/Templates.Types.IField.md)\>

#### Defined in

[Templates/Fields.ts:7](https://github.com/Verdocs/js-sdk/blob/main/src/Templates/Fields.ts#L7)
