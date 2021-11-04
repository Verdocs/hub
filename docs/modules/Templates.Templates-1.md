[@verdocs/js-sdk - v1.0.10](../README.md) / [Exports](../modules.md) / [Templates](Templates.md) / Templates

# Namespace: Templates

[Templates](Templates.md).Templates

## Table of contents

### Functions

- [createTemplate](Templates.Templates-1.md#createtemplate)
- [editTemplate](Templates.Templates-1.md#edittemplate)
- [getSummary](Templates.Templates-1.md#getsummary)
- [getTemplate](Templates.Templates-1.md#gettemplate)
- [getTemplates](Templates.Templates-1.md#gettemplates)
- [searchTemplate](Templates.Templates-1.md#searchtemplate)

## Functions

### createTemplate

▸ `Const` **createTemplate**(`params`): `Promise`<[`ITemplate`](../interfaces/Templates.Types.ITemplate.md)\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `params` | `any` |

#### Returns

`Promise`<[`ITemplate`](../interfaces/Templates.Types.ITemplate.md)\>

#### Defined in

[Templates/Templates.ts:9](https://github.com/Verdocs/js-sdk/blob/main/src/Templates/Templates.ts#L9)

___

### editTemplate

▸ `Const` **editTemplate**(`templateId`, `params`): `Promise`<[`ITemplate`](../interfaces/Templates.Types.ITemplate.md)\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `templateId` | `string` |
| `params` | `any` |

#### Returns

`Promise`<[`ITemplate`](../interfaces/Templates.Types.ITemplate.md)\>

#### Defined in

[Templates/Templates.ts:11](https://github.com/Verdocs/js-sdk/blob/main/src/Templates/Templates.ts#L11)

___

### getSummary

▸ `Const` **getSummary**(`page`): `Promise`<[`ITemplatesSummary`](../interfaces/Templates.Types.ITemplatesSummary.md)\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `page` | `number` |

#### Returns

`Promise`<[`ITemplatesSummary`](../interfaces/Templates.Types.ITemplatesSummary.md)\>

#### Defined in

[Templates/Templates.ts:26](https://github.com/Verdocs/js-sdk/blob/main/src/Templates/Templates.ts#L26)

___

### getTemplate

▸ `Const` **getTemplate**(`templateId`): `Promise`<`any`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `templateId` | `string` |

#### Returns

`Promise`<`any`\>

#### Defined in

[Templates/Templates.ts:7](https://github.com/Verdocs/js-sdk/blob/main/src/Templates/Templates.ts#L7)

___

### getTemplates

▸ `Const` **getTemplates**(): `Promise`<`any`[]\>

#### Returns

`Promise`<`any`[]\>

#### Defined in

[Templates/Templates.ts:5](https://github.com/Verdocs/js-sdk/blob/main/src/Templates/Templates.ts#L5)

___

### searchTemplate

▸ `Const` **searchTemplate**(`params`): `Promise`<[`ITemplatesSearchResult`](../interfaces/Templates.Types.ITemplatesSearchResult.md)\>

Search for templates matching various criteria.

```typescript
import {Templates} from '@verdocs/js-sdk/Templates';

const {result, page, total} = await Templates.search({ ... });
```

#### Parameters

| Name | Type |
| :------ | :------ |
| `params` | `any` |

#### Returns

`Promise`<[`ITemplatesSearchResult`](../interfaces/Templates.Types.ITemplatesSearchResult.md)\>

#### Defined in

[Templates/Templates.ts:23](https://github.com/Verdocs/js-sdk/blob/main/src/Templates/Templates.ts#L23)
