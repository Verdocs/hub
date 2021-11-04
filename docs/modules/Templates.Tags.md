[@verdocs/js-sdk - v1.0.12](../README.md) / [Exports](../modules.md) / [Templates](Templates.md) / Tags

# Namespace: Tags

[Templates](Templates.md).Tags

## Table of contents

### Functions

- [createTag](Templates.Tags.md#createtag)
- [deleteTag](Templates.Tags.md#deletetag)
- [getTags](Templates.Tags.md#gettags)

## Functions

### createTag

▸ `Const` **createTag**(`templateId`, `params`): `Promise`<[`ITag`](../interfaces/Templates.Types.ITag.md)\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `templateId` | `string` |
| `params` | `any` |

#### Returns

`Promise`<[`ITag`](../interfaces/Templates.Types.ITag.md)\>

#### Defined in

[Templates/Tags.ts:4](https://github.com/Verdocs/js-sdk/blob/main/src/Templates/Tags.ts#L4)

___

### deleteTag

▸ `Const` **deleteTag**(`templateId`, `tagName`): `Promise`<`any`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `templateId` | `string` |
| `tagName` | `string` |

#### Returns

`Promise`<`any`\>

#### Defined in

[Templates/Tags.ts:14](https://github.com/Verdocs/js-sdk/blob/main/src/Templates/Tags.ts#L14)

___

### getTags

▸ `Const` **getTags**(`templateId`): `Promise`<[`ITag`](../interfaces/Templates.Types.ITag.md)[]\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `templateId` | `string` |

#### Returns

`Promise`<[`ITag`](../interfaces/Templates.Types.ITag.md)[]\>

#### Defined in

[Templates/Tags.ts:9](https://github.com/Verdocs/js-sdk/blob/main/src/Templates/Tags.ts#L9)
