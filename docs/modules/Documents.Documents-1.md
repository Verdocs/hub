[@verdocs/js-sdk - v1.0.5](../README.md) / [Exports](../modules.md) / [Documents](Documents.md) / Documents

# Namespace: Documents

[Documents](Documents.md).Documents

## Table of contents

### Interfaces

- [IActivityEntry](../interfaces/Documents.Documents-1.IActivityEntry.md)
- [IDocument](../interfaces/Documents.Documents-1.IDocument.md)
- [IDocumentSearchOptions](../interfaces/Documents.Documents-1.IDocumentSearchOptions.md)
- [IDocumentsSearchResult](../interfaces/Documents.Documents-1.IDocumentsSearchResult.md)
- [IDocumentsSearchResultEntry](../interfaces/Documents.Documents-1.IDocumentsSearchResultEntry.md)
- [IDocumentsSummary](../interfaces/Documents.Documents-1.IDocumentsSummary.md)
- [IHistory](../interfaces/Documents.Documents-1.IHistory.md)
- [IRecipient](../interfaces/Documents.Documents-1.IRecipient.md)

### Type aliases

- [IDocumentStatus](Documents.Documents-1.md#idocumentstatus)
- [IEventDetail](Documents.Documents-1.md#ieventdetail)
- [IHistoryEvent](Documents.Documents-1.md#ihistoryevent)
- [IRecipientStatus](Documents.Documents-1.md#irecipientstatus)
- [IRecipientType](Documents.Documents-1.md#irecipienttype)

### Functions

- [getSummary](Documents.Documents-1.md#getsummary)
- [search](Documents.Documents-1.md#search)

## Type aliases

### IDocumentStatus

Ƭ **IDocumentStatus**: ``"complete"`` \| ``"pending"`` \| ``"progress"``

#### Defined in

[Documents/Documents.ts:3](https://github.com/Verdocs/js-sdk/blob/main/src/Documents/Documents.ts#L3)

___

### IEventDetail

Ƭ **IEventDetail**: ``"in_app"`` \| ``"mail"`` \| ``"signer"`` \| ``""``

#### Defined in

[Documents/Documents.ts:138](https://github.com/Verdocs/js-sdk/blob/main/src/Documents/Documents.ts#L138)

___

### IHistoryEvent

Ƭ **IHistoryEvent**: ``"recipient:invited"`` \| ``"recipient:opened"`` \| ``"recipient:agreed"`` \| ``"recipient:signed"`` \| ``"recipient:submitted"``

#### Defined in

[Documents/Documents.ts:131](https://github.com/Verdocs/js-sdk/blob/main/src/Documents/Documents.ts#L131)

___

### IRecipientStatus

Ƭ **IRecipientStatus**: ``"invited"`` \| ``"opened"`` \| ``"signed"`` \| ``"submitted"``

#### Defined in

[Documents/Documents.ts:5](https://github.com/Verdocs/js-sdk/blob/main/src/Documents/Documents.ts#L5)

___

### IRecipientType

Ƭ **IRecipientType**: ``"signer"`` \| ``"cc"``

#### Defined in

[Documents/Documents.ts:7](https://github.com/Verdocs/js-sdk/blob/main/src/Documents/Documents.ts#L7)

## Functions

### getSummary

▸ `Const` **getSummary**(`page`): `Promise`<[`IDocumentsSummary`](../interfaces/Documents.Documents-1.IDocumentsSummary.md)\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `page` | `number` |

#### Returns

`Promise`<[`IDocumentsSummary`](../interfaces/Documents.Documents-1.IDocumentsSummary.md)\>

#### Defined in

[Documents/Documents.ts:140](https://github.com/Verdocs/js-sdk/blob/main/src/Documents/Documents.ts#L140)

___

### search

▸ `Const` **search**(`params`): `Promise`<[`IDocumentsSearchResult`](../interfaces/Documents.Documents-1.IDocumentsSearchResult.md)\>

Search for documents matching various criteria.

```typescript
import {Documents} from '@verdocs/js-sdk/Documents';

const {result, page, total} = await Documents.search({ ... });
```

#### Parameters

| Name | Type |
| :------ | :------ |
| `params` | `any` |

#### Returns

`Promise`<[`IDocumentsSearchResult`](../interfaces/Documents.Documents-1.IDocumentsSearchResult.md)\>

#### Defined in

[Documents/Documents.ts:152](https://github.com/Verdocs/js-sdk/blob/main/src/Documents/Documents.ts#L152)
