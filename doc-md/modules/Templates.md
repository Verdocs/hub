[verdocs-js-sdk - v1.0.0](../README.md) / [Exports](../modules.md) / Templates

# Namespace: Templates

## Table of contents

### Interfaces

- [ITemplateSummaryEntry](../interfaces/Templates.ITemplateSummaryEntry.md)
- [ITemplatesSummary](../interfaces/Templates.ITemplatesSummary.md)

### Variables

- [Templates](Templates.md#templates)

### Functions

- [getSummary](Templates.md#getsummary)
- [getTemplates](Templates.md#gettemplates)
- [searchTemplates](Templates.md#searchtemplates)
- [toggleStar](Templates.md#togglestar)

## Variables

### Templates

• **Templates**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `getSummary` | (`page`: `number`) => `Promise`<[`ITemplatesSummary`](../interfaces/Templates.ITemplatesSummary.md)\> |
| `getTemplates` | () => `Promise`<`any`\> |
| `searchTemplates` | () => `Promise`<`any`\> |
| `toggleStar` | (`templateId`: `string`) => `Promise`<[`ITemplateSummaryEntry`](../interfaces/Templates.ITemplateSummaryEntry.md)\> |

#### Defined in

[Api/Templates.ts:38](https://github.com/Verdocs/js-sdk/blob/a85c709/src/Api/Templates.ts#L38)

## Functions

### getSummary

▸ `Const` **getSummary**(`page`): `Promise`<[`ITemplatesSummary`](../interfaces/Templates.ITemplatesSummary.md)\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `page` | `number` |

#### Returns

`Promise`<[`ITemplatesSummary`](../interfaces/Templates.ITemplatesSummary.md)\>

#### Defined in

[Api/Templates.ts:32](https://github.com/Verdocs/js-sdk/blob/a85c709/src/Api/Templates.ts#L32)

___

### getTemplates

▸ `Const` **getTemplates**(): `Promise`<`any`\>

#### Returns

`Promise`<`any`\>

#### Defined in

[Api/Templates.ts:28](https://github.com/Verdocs/js-sdk/blob/a85c709/src/Api/Templates.ts#L28)

___

### searchTemplates

▸ `Const` **searchTemplates**(): `Promise`<`any`\>

#### Returns

`Promise`<`any`\>

#### Defined in

[Api/Templates.ts:30](https://github.com/Verdocs/js-sdk/blob/a85c709/src/Api/Templates.ts#L30)

___

### toggleStar

▸ `Const` **toggleStar**(`templateId`): `Promise`<[`ITemplateSummaryEntry`](../interfaces/Templates.ITemplateSummaryEntry.md)\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `templateId` | `string` |

#### Returns

`Promise`<[`ITemplateSummaryEntry`](../interfaces/Templates.ITemplateSummaryEntry.md)\>

#### Defined in

[Api/Templates.ts:35](https://github.com/Verdocs/js-sdk/blob/a85c709/src/Api/Templates.ts#L35)
