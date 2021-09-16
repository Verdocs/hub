[verdocs-js-sdk - v1.0.0](../README.md) / [Exports](../modules.md) / Documents

# Namespace: Documents

## Table of contents

### Interfaces

- [IActivityEntry](../interfaces/Documents.IActivityEntry.md)
- [IDocument](../interfaces/Documents.IDocument.md)
- [IDocumentSearchOptions](../interfaces/Documents.IDocumentSearchOptions.md)
- [IDocumentsSearchResult](../interfaces/Documents.IDocumentsSearchResult.md)
- [IDocumentsSearchResultEntry](../interfaces/Documents.IDocumentsSearchResultEntry.md)
- [IDocumentsSummary](../interfaces/Documents.IDocumentsSummary.md)
- [IHistory](../interfaces/Documents.IHistory.md)
- [IRecipient](../interfaces/Documents.IRecipient.md)

### Type aliases

- [IDocumentStatus](Documents.md#idocumentstatus)
- [IEventDetail](Documents.md#ieventdetail)
- [IHistoryEvent](Documents.md#ihistoryevent)
- [IRecipientStatus](Documents.md#irecipientstatus)
- [IRecipientType](Documents.md#irecipienttype)

### Variables

- [Documents](Documents.md#documents)

### Functions

- [getSummary](Documents.md#getsummary)
- [search](Documents.md#search)

## Type aliases

### IDocumentStatus

Ƭ **IDocumentStatus**: ``"complete"`` \| ``"pending"`` \| ``"progress"``

#### Defined in

[Api/Documents.ts:3](https://github.com/Verdocs/js-sdk/blob/6ec87bd/src/Api/Documents.ts#L3)

___

### IEventDetail

Ƭ **IEventDetail**: ``"in_app"`` \| ``"mail"`` \| ``"signer"`` \| ``""``

#### Defined in

[Api/Documents.ts:137](https://github.com/Verdocs/js-sdk/blob/6ec87bd/src/Api/Documents.ts#L137)

___

### IHistoryEvent

Ƭ **IHistoryEvent**: ``"recipient:invited"`` \| ``"recipient:opened"`` \| ``"recipient:agreed"`` \| ``"recipient:signed"`` \| ``"recipient:submitted"``

#### Defined in

[Api/Documents.ts:130](https://github.com/Verdocs/js-sdk/blob/6ec87bd/src/Api/Documents.ts#L130)

___

### IRecipientStatus

Ƭ **IRecipientStatus**: ``"invited"`` \| ``"opened"`` \| ``"signed"`` \| ``"submitted"``

#### Defined in

[Api/Documents.ts:5](https://github.com/Verdocs/js-sdk/blob/6ec87bd/src/Api/Documents.ts#L5)

___

### IRecipientType

Ƭ **IRecipientType**: ``"signer"`` \| ``"cc"``

#### Defined in

[Api/Documents.ts:7](https://github.com/Verdocs/js-sdk/blob/6ec87bd/src/Api/Documents.ts#L7)

## Variables

### Documents

• **Documents**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `getSummary` | (`page`: `number`) => `Promise`<[`IDocumentsSummary`](../interfaces/Documents.IDocumentsSummary.md)\> |
| `search` | (`params`: `any`) => `Promise`<[`IDocumentsSearchResult`](../interfaces/Documents.IDocumentsSearchResult.md)\> |

#### Defined in

[Api/Documents.ts:145](https://github.com/Verdocs/js-sdk/blob/6ec87bd/src/Api/Documents.ts#L145)

## Functions

### getSummary

▸ `Const` **getSummary**(`page`): `Promise`<[`IDocumentsSummary`](../interfaces/Documents.IDocumentsSummary.md)\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `page` | `number` |

#### Returns

`Promise`<[`IDocumentsSummary`](../interfaces/Documents.IDocumentsSummary.md)\>

#### Defined in

[Api/Documents.ts:139](https://github.com/Verdocs/js-sdk/blob/6ec87bd/src/Api/Documents.ts#L139)

___

### search

▸ `Const` **search**(`params`): `Promise`<[`IDocumentsSearchResult`](../interfaces/Documents.IDocumentsSearchResult.md)\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `params` | `any` |

#### Returns

`Promise`<[`IDocumentsSearchResult`](../interfaces/Documents.IDocumentsSearchResult.md)\>

#### Defined in

[Api/Documents.ts:142](https://github.com/Verdocs/js-sdk/blob/6ec87bd/src/Api/Documents.ts#L142)
