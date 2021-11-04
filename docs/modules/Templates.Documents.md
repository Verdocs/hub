[@verdocs/js-sdk - v1.0.10](../README.md) / [Exports](../modules.md) / [Templates](Templates.md) / Documents

# Namespace: Documents

[Templates](Templates.md).Documents

## Table of contents

### Functions

- [createDocument](Templates.Documents.md#createdocument)
- [deleteDocument](Templates.Documents.md#deletedocument)
- [getDocument](Templates.Documents.md#getdocument)
- [getDocuments](Templates.Documents.md#getdocuments)

## Functions

### createDocument

▸ `Const` **createDocument**(`templateId`, `params`): `Promise`<[`IDocument`](../interfaces/Templates.Types.IDocument.md)\>

Create a Document for a particular Template.

```typescript
import {Documents} from '@verdocs/js-sdk/Templates';

await Documents.createDocument(templateID, params);
```

#### Parameters

| Name | Type |
| :------ | :------ |
| `templateId` | `string` |
| `params` | `any` |

#### Returns

`Promise`<[`IDocument`](../interfaces/Templates.Types.IDocument.md)\>

#### Defined in

[Templates/Documents.ts:25](https://github.com/Verdocs/js-sdk/blob/main/src/Templates/Documents.ts#L25)

___

### deleteDocument

▸ `Const` **deleteDocument**(`templateId`, `documentId`): `Promise`<`any`\>

Delete a specific Document.

```typescript
import {Documents} from '@verdocs/js-sdk/Templates';

await Documents.deleteDocument(templateID, documentID);
```

#### Parameters

| Name | Type |
| :------ | :------ |
| `templateId` | `string` |
| `documentId` | `string` |

#### Returns

`Promise`<`any`\>

#### Defined in

[Templates/Documents.ts:49](https://github.com/Verdocs/js-sdk/blob/main/src/Templates/Documents.ts#L49)

___

### getDocument

▸ `Const` **getDocument**(`templateId`, `documentId`): `Promise`<[`IDocument`](../interfaces/Templates.Types.IDocument.md)\>

Get a specific Document.

```typescript
import {Documents} from '@verdocs/js-sdk/Templates';

await Documents.getDocument(templateID, documentID);
```

#### Parameters

| Name | Type |
| :------ | :------ |
| `templateId` | `string` |
| `documentId` | `string` |

#### Returns

`Promise`<[`IDocument`](../interfaces/Templates.Types.IDocument.md)\>

#### Defined in

[Templates/Documents.ts:37](https://github.com/Verdocs/js-sdk/blob/main/src/Templates/Documents.ts#L37)

___

### getDocuments

▸ `Const` **getDocuments**(`templateId`): `Promise`<`any`\>

Get all the Documents associated to a particular Template.

```typescript
import {Documents} from '@verdocs/js-sdk/Templates';

await Documents.getDocuments(templateID);
```

#### Parameters

| Name | Type |
| :------ | :------ |
| `templateId` | `string` |

#### Returns

`Promise`<`any`\>

#### Defined in

[Templates/Documents.ts:13](https://github.com/Verdocs/js-sdk/blob/main/src/Templates/Documents.ts#L13)
