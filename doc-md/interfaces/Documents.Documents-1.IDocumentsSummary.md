[@verdocs/js-sdk - v1.0.0](../README.md) / [Exports](../modules.md) / [Documents](../modules/Documents.md) / [Documents](../modules/Documents.Documents-1.md) / IDocumentsSummary

# Interface: IDocumentsSummary

[Documents](../modules/Documents.md).[Documents](../modules/Documents.Documents-1.md).IDocumentsSummary

## Table of contents

### Properties

- [action_required](Documents.Documents-1.IDocumentsSummary.md#action_required)
- [completed](Documents.Documents-1.IDocumentsSummary.md#completed)
- [waiting_others](Documents.Documents-1.IDocumentsSummary.md#waiting_others)

## Properties

### action\_required

• **action\_required**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `page` | `number` |
| `result` | [`IActivityEntry`](Documents.Documents-1.IActivityEntry.md)[] |
| `total` | `number` |

#### Defined in

[Documents/Documents.ts:36](https://github.com/Verdocs/js-sdk/blob/4c3fec6/src/Documents/Documents.ts#L36)

___

### completed

• **completed**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `page` | `number` |
| `result` | [`IActivityEntry`](Documents.Documents-1.IActivityEntry.md)[] |
| `total` | `number` |

#### Defined in

[Documents/Documents.ts:41](https://github.com/Verdocs/js-sdk/blob/4c3fec6/src/Documents/Documents.ts#L41)

___

### waiting\_others

• **waiting\_others**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `page` | `number` |
| `result` | [`IActivityEntry`](Documents.Documents-1.IActivityEntry.md)[] |
| `total` | `number` |

#### Defined in

[Documents/Documents.ts:46](https://github.com/Verdocs/js-sdk/blob/4c3fec6/src/Documents/Documents.ts#L46)
