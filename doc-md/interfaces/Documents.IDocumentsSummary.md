[verdocs-js-sdk - v1.0.0](../README.md) / [Exports](../modules.md) / [Documents](../modules/Documents.md) / IDocumentsSummary

# Interface: IDocumentsSummary

[Documents](../modules/Documents.md).IDocumentsSummary

## Table of contents

### Properties

- [action_required](Documents.IDocumentsSummary.md#action_required)
- [completed](Documents.IDocumentsSummary.md#completed)
- [waiting_others](Documents.IDocumentsSummary.md#waiting_others)

## Properties

### action\_required

• **action\_required**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `page` | `number` |
| `result` | [`IActivityEntry`](Documents.IActivityEntry.md)[] |
| `total` | `number` |

#### Defined in

[Api/Documents.ts:36](https://github.com/Verdocs/js-sdk/blob/458266e/src/Api/Documents.ts#L36)

___

### completed

• **completed**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `page` | `number` |
| `result` | [`IActivityEntry`](Documents.IActivityEntry.md)[] |
| `total` | `number` |

#### Defined in

[Api/Documents.ts:41](https://github.com/Verdocs/js-sdk/blob/458266e/src/Api/Documents.ts#L41)

___

### waiting\_others

• **waiting\_others**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `page` | `number` |
| `result` | [`IActivityEntry`](Documents.IActivityEntry.md)[] |
| `total` | `number` |

#### Defined in

[Api/Documents.ts:46](https://github.com/Verdocs/js-sdk/blob/458266e/src/Api/Documents.ts#L46)
